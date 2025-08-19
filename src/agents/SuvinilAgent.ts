import { ChatOpenAI } from "@langchain/openai"
import { initializeAgentExecutorWithOptions } from "langchain/agents"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { DynamicTool } from "langchain/tools"
import dotenv from "dotenv"
import { z } from "zod"
import { description as MCPTintasDescription } from "../tools/Tintas.tool.js"
import { description as MCPImagesDescription } from "../tools/Images.tool.js"
import { 
    conversationMemory, 
    memoryHelpers, 
    createLangChainMemory 
} from "./memory/memory.config.js"

dotenv.config()

const ProductFiltersSchema = z.object({
    nome: z.string().optional(),
    cor: z.string().optional(),
    tipo_parede: z.string().optional(),
    ambiente: z.string().optional(),
    acabamento: z.string().optional(),
    features: z.array(z.string()).optional(),
    linha: z.string().optional(),
})

export async function SuvinilAgent(pergunta: string, sessionId: string = 'default') {

    memoryHelpers.addUserMessage(sessionId, pergunta)

    const TintasTransport = new StdioClientTransport({
        command: "node",
        args: ["dist/tools/Tintas.tool.js"],
    })

    const TintasMcpClient = new Client(
        {
            name: "tintas-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        },
    )

    const imageGeneratorTransport = new StdioClientTransport({
        command: "node",
        args: ["dist/tools/Images.tool.js"],
    })

    const imagesMcpClient = new Client(
        {
            name: "images-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        },
    )

    await TintasMcpClient.connect(TintasTransport)
    await imagesMcpClient.connect(imageGeneratorTransport)

    const toolsList = await TintasMcpClient.listTools()
    const imageToolsList = await imagesMcpClient.listTools()

    const tintasMCPTools = toolsList.tools.map(
        (t: any) =>
            new DynamicTool({
                name: t.name,
                description: MCPTintasDescription,
                func: async (input: string) => {
                    let parsedInput
                    try {
                        parsedInput = JSON.parse(input)
                    } catch {
                        throw new Error('O input da ferramenta deve ser um objeto JSON com os filtros, por exemplo: {"tipo_parede": "Ferro"}')
                    }

                    const validation = ProductFiltersSchema.safeParse(parsedInput)
                    if (!validation.success) {
                        throw new Error("Input inválido: " + JSON.stringify(validation.error.format()))
                    }

                    const toolResult = await TintasMcpClient.callTool({ name: t.name, arguments: validation.data })

                    if (toolResult?.content && Array.isArray(toolResult.content)) {
                        return toolResult.content.map((c: any) => c.text).join("\n")
                    }
                    return ""
                },
            }),
    )

    const imagesMCPTools = imageToolsList.tools.map(
        (t: any) =>
            new DynamicTool({
                name: t.name,
                description: MCPImagesDescription,
                func: async (input: string) => {

                    const toolResult = await imagesMcpClient.callTool({ name: t.name, arguments: { description: input } })

                    if (toolResult?.content) {
                        return toolResult.content
                    }
                    return ""
                },
            }),
    )

    const allTools = [...tintasMCPTools, ...imagesMCPTools]

    const model = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY || "",
    })

    const memory = createLangChainMemory(model)

    const executor = await initializeAgentExecutorWithOptions(allTools, model, {
        agentType: "chat-conversational-react-description",
        returnIntermediateSteps: true,
        verbose: false,
        maxIterations: 3,
    })

    const conversationContext = memoryHelpers.getContext(sessionId)

    const isFirstTime = memoryHelpers.isFirstConversation(sessionId)

    let historyContext = ""
    try {
        const memoryVariables = await memory.loadMemoryVariables({})
        historyContext = memoryVariables.history || ""
    } catch (error) {
        if (error instanceof Error) {
            console.warn("Could not load memory variables:", error.message)
        } else {
            console.warn("Could not load memory variables:", String(error))
        }
    }

    const systemPrompt = `
        ${historyContext ? `<conversation_history>\n${historyContext}\n</conversation_history>\n` : ''}

        <role>
            Você é Maria, consultora Suvinil com 10+ anos de experiência. Ajude clientes a escolher tintas para projetos residenciais. Use português brasileiro conversacional.
        </role>

        <conversation_context>
            ${conversationContext || "Esta é a primeira conversa com este cliente."}
        </conversation_context>

        <memory_instructions>
            - Se o histórico das conversas for vazio OU não houver dados suficientes para recomendar uma tinta, NÃO invente respostas.
            - Nunca dê recomendações sem ter informações completas vindas da tool.
            - Se o cliente pedir imagem sem contexto suficiente, peça antes uma descrição detalhada do ambiente (tipo de cômodo, iluminação, móveis, estilo desejado, cor da tinta etc.).
            ${!isFirstTime ? `
            - SEMPRE consulte o histórico das conversas anteriores acima
            - Mantenha continuidade: use frases como "Como conversamos antes...", "Voltando ao que discutimos..."
            - Se o cliente fez perguntas similares antes, mencione: "Lembro que você perguntou sobre..."
            - Seja consistente com informações já fornecidas anteriormente
            - Se o cliente mencionar algo vago, use o contexto das conversas passadas para entender melhor
            ` : `
            - Esta é a primeira conversa com este cliente
            - Seja acolhedora e apresente-se brevemente
            `}
        </memory_instructions>

        <scope>
            APENAS residências/comércios: casas, apartamentos, escritórios, quartos, cozinhas, fachadas, paredes, tetos, madeiramento, portões, cercas.

            NUNCA: veículos, indústria, arte, outras marcas.

            Rejeição: "Sou especialista apenas em tintas Suvinil residenciais. Para [X], consulte especialista específico. Posso ajudar com sua casa/escritório?"

            Apenas responda com informações sobre tintas Suvinil encontradas e retornadas na tool de Tintas.

            ⚠️ PROIBIDO:
            - Inventar ou mencionar qualquer produto que não esteja no retorno da tool
        </scope>

        <requirements>
            SEMPRE:
            - Nome completo do produto Suvinil + linha (somente se retornado da tool)
            - Explique PORQUÊ esse produto é adequado (2-3 benefícios claros)
            - Pergunte algo específico no final para engajar
            - Demonstre expertise: "Com minha experiência..."
            - Se não houver produto retornado, responda de forma amigável que no momento não há resultados, mas ofereça ajuda para ajustar os filtros
            - Se o usuário pedir imagem e já houver contexto suficiente (ambiente + superfície + cor):
                1. Recomende o produto retornado da tool
                2. Pergunte o que ele acha da sugestão
                3. Informe que pode gerar imagem para simular, mas que precisa de detalhes do ambiente (ex: móveis, estilo, iluminação)
            - Se o usuário pedir imagem sem contexto suficiente, peça descrição detalhada do ambiente antes de gerar
            - A cor da tinta deve ser mencionada SEMPRE que recomendada e deve ser a mesma retornada pela tool
            - Especifique material da superfície na descrição de imagens
            - Recomende um produto, mesmo com poucas informações do usuário
            - Ao gerar imagens, assegure que o prompt seja seguro para DALL·E:
                1. Nunca inclua pessoas, nudez, violência, política, armas, drogas ou marcas não Suvinil.
                2. Foque apenas no ambiente, superfícies, cores, móveis, estilo e iluminação.
                3. Substitua termos que podem ser bloqueados por sinônimos neutros (ex: "nude" → "bege claro").
                4. Sempre mencione que a imagem é para demonstração de tinta em ambiente residencial/comercial.

            NUNCA:
            - Ignorar histórico da conversa
            - Responder com produtos não retornados pela tool
            - Listar genérico ou inventar opções
            - Adicionar informações extras no link da imagem
            - Utilize palavras não recomendadas para a geração de imagem
        </requirements>

        <example>
            Usuário: Estou reformando meu quarto e quero pintar as paredes de azul claro. Qual tinta Suvinil você recomenda?
            Assistente: Para ambientes internos como quartos, uma boa opção é a Tinta Suvinil Acrílica, que possui excelente cobertura, secagem rápida e é lavável. O que acha?
        </example>

        Pergunta do usuário: ${pergunta}
    `



    const result = await executor.call({
        input: systemPrompt,
    })

    try {
        await memory.saveContext(
            { input: pergunta },
            { output: result.output }
        )
    } catch (error) {
        if (error instanceof Error) {
            console.warn("Could not save to memory:", error.message)
        } else {
            console.warn("Could not save to memory:", String(error))
        }
    }

    const modelRevisor = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY || "",
    })

    const agentOutput = result.output

    memoryHelpers.addAssistantMessage(sessionId, agentOutput)

    console.log(agentOutput)

const promptRevisor = `
        <role>
            Você é Maria, consultora Suvinil com 10+ anos de experiência. Ajude clientes a escolher tintas para projetos residenciais. Use português brasileiro conversacional e natural.
        </role>

        <conversation_context>
            ${conversationContext || "Primeira conversa com este cliente."}
        </conversation_context>

        <memory_instructions>
            - Se o histórico for vazio OU não houver informações completas (local, superfície, cor), não invente.
            - Se o cliente pedir imagem sem contexto suficiente, peça descrição detalhada do ambiente antes de gerar.
            - Se houver contexto suficiente e o cliente pedir imagem:
                1. Fale qual o produto utilizado
                2. Justifique com 2-3 benefícios
                3. Pergunte o que o cliente acha da sugestão
                4. Gere a imagem
            ${!isFirstTime ? `
            - SEMPRE consulte o histórico
            - Conecte com tópicos anteriores
            - Seja consistente com informações já fornecidas
            ` : `
            - Esta é a primeira conversa
            `}
        </memory_instructions>

        <behavior>
            - Tom amigável, confiante e acessível
            - NUNCA recomende produtos que não vieram da tool
            - Use justificativa técnica clara, sem jargão difícil
        </behavior>

        <response_structure>
            Estrutura:
            1. Saudação / conexão com cliente
            2. Pergunta ou esclarecimento (se faltar informação)
            3. Recomendação apenas se houver produto válido da tool
            4. Sempre falar qual produto está recomendando
            5. Justificativa técnica (2-3 benefícios)
            6. Pergunta final para engajar
            7. Se usuário pediu imagem e há contexto suficiente → ofereça a possibilidade de gerar, pedindo detalhes adicionais do ambiente
        </response_structure>

        <image_handling_rules>
            - Se resposta contiver link de imagem, coloque APENAS no campo "image"
            - Campo "answer" nunca deve citar links ou imagens
            - Texto deve fazer sentido sozinho sem imagem
            - Não altere o link da imagem
        </image_handling_rules>

        <output_format>
            Revise a seguinte resposta seguindo todas as regras:

            RESPOSTA ORIGINAL: ${agentOutput}

            Retorne JSON válido:
            {
                "answer": "[Resposta revisada - SEM mencionar imagens]",
                "image": "[URL da imagem se existir, ou null]"
            }
        </output_format>

        <quality_checklist>
            ✓ Respondeu apenas se havia produto da tool?
            ✓ Não inventou produtos?
            ✓ Link da imagem fornecido no prompt original consta no JSON revisado?
            ✓ Se recomendou, usou nome completo + linha?
            ✓ Explicou benefícios?
            ✓ Terminou engajando?
            ✓ Ofereceu imagem apenas se havia contexto suficiente?
            ✓ JSON limpo e válido?
        </quality_checklist>
`


    
    const response = await modelRevisor.invoke(promptRevisor)

    const parse = JSON.parse(String(response.content))

    return parse
}