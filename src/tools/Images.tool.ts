import { getProducts } from "../repositories/produtoRepository.js"

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import "dotenv/config"
import { generateImage } from "../agents/ImageAgent.js"


export const description = `
    Esta ferramenta gera imagens hiper-realistas de ambientes residenciais utilizando inteligência artificial, baseada em descrições textuais detalhadas fornecidas pelo usuário. Utiliza a API DALL-E da OpenAI para criar visualizações precisas e sofisticadas de espaços internos, permitindo explorar diferentes estilos, cores, móveis e iluminação.
    Sempre mande a cor que gostaria que as paredes fossem pintadas.
    
    **Parâmetro:**
    - **description**: Forneça uma descrição minuciosa do ambiente desejado, incluindo detalhes como tipo de cômodo (ex: sala de estar, quarto, cozinha), estilo de decoração (moderno, clássico, minimalista, industrial), cores predominantes nas paredes, móveis e objetos, materiais utilizados (madeira, metal, vidro), disposição dos móveis, elementos decorativos (quadros, plantas, tapetes), tipo de iluminação (natural, artificial, luminárias específicas), tamanho do espaço, presença de janelas ou portas, e qualquer outra característica relevante.

    **Funcionalidades:**
    - Geração de imagens em alta resolução (1024x1024px)
    - Representação fiel de ambientes residenciais com foco em design de interiores
    - Simulação de diferentes combinações de tintas, móveis e decoração
    - Iluminação realista, incluindo efeitos de luz natural e artificial
    - Visualização de projetos para auxiliar na escolha de cores e estilos
    - Ideal para arquitetos, designers, lojistas e clientes finais

    **Exemplo de uso:**
    "Quarto de casal espaçoso com paredes em tom de verde oliva, piso de madeira clara, cama king-size com roupa de cama branca, dois criados-mudos de madeira escura, luminárias pendentes modernas, cortinas bege, uma poltrona azul ao lado da janela grande com vista para o jardim, tapete felpudo cinza e quadros abstratos na parede principal."

    **Retorno:**
    - URL da imagem gerada (se bem-sucedido)
    - Mensagem de erro detalhada (se houver falha na geração)

    Esta ferramenta é ideal para visualizar como diferentes cores, estilos e elementos decorativos podem transformar ambientes antes da escolha das tintas Suvinil. Recomenda-se utilizar descrições completas para obter resultados mais precisos e personalizados. Só utilize esta ferramenta quando o usuário solicitar uma imagem ou exemplo visual de aplicação.
`

async function main() {
    try {
        const server = new McpServer({
            name: "Image Generator Tool",
            version: "1.0.0",
        })

        server.tool(
            "generateImage",
            {
                description: z.string().describe("Description of the image to generate"),
            },
            async ({ description }) => {
                const result = await generateImage(description)
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: result.success
                                ? (result.content && result.content[0]?.data
                                    ? result.content[0].data
                                    : "Image generated successfully")
                                : (result.error || "Unknown error occurred"),
                        },
                    ],
                }
            },
        )

        const transport = new StdioServerTransport()
        await server.connect(transport)
    } catch (err) {
        console.error("Erro ao iniciar o servidor:", err)
    }
}

main().catch((err) => {
    console.error("Erro ao iniciar o servidor:", err)
})
main().catch((err) => {
    console.error("Erro ao iniciar o servidor:", err)
})
