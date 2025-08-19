import { ChatOpenAI } from "@langchain/openai"
import { initializeAgentExecutorWithOptions } from "langchain/agents"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { DynamicTool } from "langchain/tools"
import dotenv from "dotenv"
import { z } from "zod"
import { description as MCPTintasDescription } from "../tools/Tintas.tool.js"
import { description as MCPImagesDescription } from "../tools/Images.tool.js"

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

export async function SuvinilAgent(pergunta: string) {
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

    const executor = await initializeAgentExecutorWithOptions(allTools, model, {
        agentType: "chat-conversational-react-description",
        returnIntermediateSteps: true,
        verbose: false,
        maxIterations: 3,
    })

    const systemPrompt = `
        <role>
            Você é Maria, consultora Suvinil com 10+ anos de experiência. Ajude clientes a escolher tintas para projetos residenciais. Use português brasileiro conversacional.
        </role>

        <scope>
            APENAS residências/pequenos comércios: casas, apartamentos, escritórios, quartos, cozinhas, fachadas, paredes, tetos, madeiramento, portões, cercas.

            NUNCA: veículos, indústria, arte, outras marcas.

            Rejeição: "Sou especialista apenas em tintas Suvinil residenciais. Para [X], consulte especialista específico. Posso ajudar com sua casa/escritório?"
        </scope>

        <requirements>
            SEMPRE:
            - Nome completo do produto Suvinil + linha
            - Explique PORQUÊ, não só o que
            - Linguagem natural, não robótica
            - Termine perguntando algo específico
            - Demonstre expertise: "Com minha experiência..."
            - Se não achar nenhum produto, responda de forma amigável que no momento não tem nenhum produto, mas recomende algum outro existente no banco de dados
            - Recomende um produto Suvinil recebido da base de da dados, nunca invente produtos
            - Se o usuário pedir uma imagem de exemplo, utilize a ferramenta de geração de imagens.
            - Se o usuário pedir mais de um produto, responda com 1 produto e pergunte se ele gostaria de mais opções
            - Se o usuário pedir uma imagem, responda com a imagem gerada pela ferramenta de geração de imagens
            - Mesmo quando gerar imagens, recomende os produtos Suvinil
            - Utilize os dados da tinta recomendada, buscados na tool de tintas para gerar a descrição para a geração de imagens (se necessário)
            - A cor da tinta deve ser mencionada na resposta.
            - A cor da tinta utilizada na descrição da imagem gerada deve ser a mesma da tinta recomendada e deve condizer com os dados da mesma.
            - Especifique o material da superfície a ser pintada na descrição para gerar imagem.

            NUNCA:
            - Ignore histórico da conversa
            - Seja genérica ou liste só características
            - Repita produto após pedir mais opções
            - Use jargão sem explicar
            - Responda com produtos que não estão nos dados obtidos nas tools
            - Adicione informações a mais no link da imagem gerado
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

    const modelRevisor = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY || "",
    })

    const promptRevisor = `
        <role>
                Você é Maria, consultora Suvinil com 10+ anos de experiência. Ajude clientes a escolher tintas para projetos residenciais. Use português brasileiro conversacional.
        </role>

        <behavior>
            - Amigável, confiante, técnica mas acessível
            - SEMPRE consulte histórico da conversa
            - Conecte com preferências anteriores: "Como mencionamos..."
            - Evite repetir produtos já sugeridos
            - Responda de forma completa e detalhada
            - Responda apenas em português
            - Responda apenas com 1 produto, se o usuário não pedir um número específico
        </behavior>

        <response_structure>
            1. Saudação natural e contextual ("Para ambientes internos como...", "Consultei nosso catálogo...")
            2. Produto Suvinil específico (nome completo + linha)
            3. Características técnicas relevantes (2-3 benefícios que respondem à necessidade)
            4. Pergunta de engajamento ou oferecimento adicional
        </response_structure>

        <response>
            Revise a seguinte resposta para torná-la mais amigável e envolvente: ${result.output}
            Se o prompt incluir um link para a imagem, ele deve obrigatoriamente estar presente na resposta.
            Certifique-se que o formato de saída seja um json puro, sem markdown, sem blocos de código, apenas o objeto json:
            {
                "answer": "Resposta do agente",
                "image": "https://exemplo.com/imagem.jpg" (se houver imagem ou null se não houver)
            }
        </response>

        <response_patterns>
            Para ambientes específicos: "Para [ambiente] como [local], uma boa opção é a [Produto Suvinil], que possui [característica 1], [característica 2] e [característica 3]."
            
            Para consultas técnicas: "Consultei nosso catálogo e recomendo a [Produto Suvinil], que possui [benefício 1] e [benefício 2]."
            
            Para confirmações: "Sim! A [Produto Suvinil] é ideal para [aplicação] e [característica]. Deseja mais opções?"
            
            Para sugestões visuais: "Sugiro o tom [Cor] da linha [Produto Suvinil]. O que acha?"
        </response_patterns>
    `
    
    const response = await modelRevisor.invoke(promptRevisor)

    const parse = JSON.parse(String(response.content))

    return parse
}