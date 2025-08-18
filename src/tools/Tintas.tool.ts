import { getProducts } from "../repositories/produtoRepository.js";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import 'dotenv/config';
import type { ProductFilters } from "../interfaces/ProductFilters.js";

async function main() {
    try {
        console.log('Iniciando o servidor MCP...');

        const server = new McpServer({
            name: "Product Filter Service",
            version: "1.0.0",
        });

        server.tool(
            "getProducts",
            {
                nome: z.string().optional(),
                descricao: z.string().optional(),
                preco: z.number().optional(),
                categoria: z.string().optional(),
                features: z.array(z.string()).optional(),
            },
            async ({ nome, descricao, preco, categoria, features }) => {
                const filter = {
                    nome,
                    descricao,
                    preco,
                    categoria,
                    features
                } as ProductFilters
                const produtos = await getProducts(filter);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(produtos)
                        }
                    ]
                };
            }
        );

        const transport = new StdioServerTransport();
        await server.connect(transport);

    } catch (err) {
        console.error('Erro ao iniciar o servidor:', err);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
});
