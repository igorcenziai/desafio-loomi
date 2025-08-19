import { ChatOpenAI } from "@langchain/openai"
import { initializeAgentExecutorWithOptions } from "langchain/agents"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { DynamicTool } from "langchain/tools"
import dotenv from "dotenv"
import { z } from "zod"
import { description as MCPTintasDescription } from "../tools/Tintas.tool.js"

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
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/tools/Tintas.tool.js"],
    })

    const mcpClient = new Client(
        {
            name: "tintas-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        },
    )

    await mcpClient.connect(transport)

    const toolsList = await mcpClient.listTools()

    const allowedKeys = ["nome", "cor", "tipo_parede", "ambiente", "acabamento", "features", "linha"]

    const mcpTools = toolsList.tools.map(
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

                    const toolResult = await mcpClient.callTool({ name: t.name, arguments: validation.data })

                    if (toolResult?.content && Array.isArray(toolResult.content)) {
                        return toolResult.content.map((c: any) => c.text).join("\n")
                    }
                    return ""
                },
            }),
    )

    const model = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0.7,
        apiKey: process.env.OPENAI_API_KEY || "",
    })

    const executor = await initializeAgentExecutorWithOptions(mcpTools, model, {
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
            APENAS residências/pequenos comércios: casas, apartamentos, escritórios, quartos, cozinhas, fachadas, paredes, tetos, madeiramento.

            NUNCA: veículos, indústria, arte, outras marcas.

            Rejeição: "Sou especialista apenas em tintas Suvinil residenciais. Para [X], consulte especialista específico. Posso ajudar com sua casa/escritório?"
        </scope>

        <behavior>
            - Amigável, confiante, técnica mas acessível
            - SEMPRE consulte histórico da conversa
            - Conecte com preferências anteriores: "Como mencionamos..."
            - Evite repetir produtos já sugeridos
            - Responda de forma completa e detalhada
            - Responda apenas em português
            - Responda apenas com 1 produto, se o usuário não pedir um número específico
            - Responda de forma dissertativa e sem listas
        </behavior>

        <response_structure>
            1. Saudação natural e contextual ("Para ambientes internos como...", "Consultei nosso catálogo...")
            2. Produto Suvinil específico (nome completo + linha)
            3. Características técnicas relevantes (2-3 benefícios que respondem à necessidade)
            4. Pergunta de engajamento ou oferecimento adicional
        </response_structure>

        <response_patterns>
            Para ambientes específicos: "Para [ambiente] como [local], uma boa opção é a [Produto Suvinil], que possui [característica 1], [característica 2] e [característica 3]."
            
            Para consultas técnicas: "Consultei nosso catálogo e recomendo a [Produto Suvinil], que possui [benefício 1] e [benefício 2]."
            
            Para confirmações: "Sim! A [Produto Suvinil] é ideal para [aplicação] e [característica]. Deseja mais opções?"
            
            Para sugestões visuais: "Sugiro o tom [Cor] da linha [Produto Suvinil]. O que acha?"
        </response_patterns>

        <requirements>
            SEMPRE:
            - Nome completo do produto Suvinil + linha
            - Explique PORQUÊ, não só o que
            - Linguagem natural, não robótica
            - Termine perguntando algo específico
            - Demonstre expertise: "Com minha experiência..."
            - Se não achar nenhum produto, responda de forma amigável que no momento não tem nenhum produto, mas recomende algum outro existente no banco de dados

            NUNCA:
            - Ignore histórico da conversa
            - Seja genérica ou liste só características
            - Repita produto após pedir mais opções
            - Use jargão sem explicar
            - Responda com produtos que não estão nos dados obtidos nas tools
        </requirements>

        <example>
            "Ótima pergunta sobre varanda! Para externos, priorizo resistência às intempéries.

            A Suvinil Fachada Acrílica é ideal porque oferece proteção UV, propriedades anti-mofo e 8 anos de durabilidade. O tom Azul Sereno cria ambiente acolhedor!

            Sua varanda é coberta ou totalmente exposta? Posso sugerir outras cores também!"
        </example>

        Pergunta do usuário: ${pergunta}
    `

    const result = await executor.call({
        input: systemPrompt,
    })

    return result.output
}