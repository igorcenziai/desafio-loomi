import { getProducts } from "../repositories/produtoRepository.js"

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import "dotenv/config"
import type { ProductFilters } from "../interfaces/ProductFilters.js"

export const description = `
    Filtra e retorna produtos de tinta conforme os critérios informados. Os parâmetros permitem buscas detalhadas:

    - **nome**: Nome do produto (ex: "Suvinil Toque de Seda")
    - **cor**: Cor da tinta (ex: "Branco Neve", "Cinza Urbano")
    - **tipo_parede**: Tipo de superfície (ex: "Alvenaria", "Madeira", "Ferro")
    - **ambiente**: Ambiente de aplicação (ex: "Interno", "Externo", "Interno/Externo")
    - **acabamento**: Tipo de acabamento (ex: "Fosco", "Acetinado", "Brilhante")
    - **features**: Lista de características (ex: ["Lavável", "Sem odor", "Alta cobertura"])
    - **linha**: Linha do produto (ex: "Premium", "Standard")

    Exemplo de uso:
    {{
    "nome": "Suvinil Fosco Completo",
    "cor": "Cinza Urbano",
    "tipo_parede": "Alvenaria",
    "ambiente": "Interno/Externo",
    "acabamento": "Fosco",
    "features": ["Anti-mofo", "Alta cobertura"],
    "linha": "Premium"
    }}

    Retorna todos os produtos que correspondem aos filtros informados, facilitando a busca por tintas específicas para cada necessidade.
`

async function main() {
    try {
        const server = new McpServer({
            name: "Product Filter Tool",
            version: "1.0.0",
        })

        server.tool(
            "getProducts",
            {
                nome: z.string().optional(),
                cor: z.string().optional(),
                tipo_parede: z.string().optional(),
                ambiente: z.string().optional(),
                acabamento: z.string().optional(),
                features: z.array(z.string()).optional(),
                linha: z.string().optional(),
            },
            async ({ nome, cor, tipo_parede, ambiente, acabamento, features, linha }) => {
                const filter = {
                    nome,
                    cor,
                    tipo_parede,
                    ambiente,
                    acabamento,
                    features,
                    linha,
                } as ProductFilters
                const produtos = await getProducts(filter)

                const textoProdutos = produtos.map((p) => `Produto: ${p.nome}\nCor: ${p.cor}\nTipo de parede: ${p.tipo_parede}\nAmbiente: ${p.ambiente}\nAcabamento: ${p.acabamento}\nCaracterísticas: ${p.features?.join(", ")}\nLinha: ${p.linha}\n`).join("\n---\n")

                return {
                    content: [
                        {
                            type: "text",
                            text: textoProdutos || "Nenhum produto encontrado para os filtros informados.",
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
