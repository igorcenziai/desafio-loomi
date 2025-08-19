import { AppDataSource } from '../infra/database/data-source.js';
import { Produto } from '../entities/Produto.js';
import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;

dotenv.config();


async function ensureDatabaseExists() {
  const isProd = process.env.NODE_ENV === "production";

  const DB_HOST = isProd ? (process.env.DB_HOST || "localhost") : "localhost";
  const DB_PORT = Number(process.env.POSTGRES_PORT) || 5432;
  const DB_USER = isProd ? (process.env.POSTGRES_USER || "postgres") : "postgres";
  const DB_PASSWORD = isProd ? (process.env.POSTGRES_PASSWORD || "postgres") : "postgres";
  const DB_NAME = process.env.POSTGRES_DB || "tintas";

  console.log(`Verificando se o banco de dados '${DB_NAME}' existe...`);

  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  await client.connect();

  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'`);

  if (res.rowCount === 0) {
    console.log(`Banco '${DB_NAME}' não existe. Criando...`);
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`Banco '${DB_NAME}' criado com sucesso!`);
  } else {
    console.log(`Banco '${DB_NAME}' já existe.`);
  }

  await client.end();
}

async function seed() {
  await ensureDatabaseExists(); 
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(Produto);

  const produtos = [
    { nome: "Suvinil Toque de Seda", cor: "Branco Neve", tipo_parede: "Alvenaria", ambiente: "Interno", acabamento: "Acetinado", features: ["Lavável", "Sem odor", "Alta cobertura", "Fácil limpeza"], linha: "Premium" },
    { nome: "Suvinil Fosco Completo", cor: "Cinza Urbano", tipo_parede: "Alvenaria", ambiente: "Interno/Externo", acabamento: "Fosco", features: ["Anti-mofo", "Alta cobertura", "Resistente à umidade"], linha: "Premium" },
    { nome: "Suvinil Clássica", cor: "Amarelo Canário", tipo_parede: "Alvenaria", ambiente: "Interno", acabamento: "Fosco", features: ["Boa cobertura", "Econômica", "Rápida secagem"], linha: "Standard" },
    { nome: "Suvinil Esmalte Sintético", cor: "Vermelho Ferrari", tipo_parede: "Madeira, Ferro", ambiente: "Interno/Externo", acabamento: "Brilhante", features: ["Alta durabilidade", "Resistente ao calor", "Impermeável"], linha: "Premium" },
    { nome: "Suvinil Criativa", cor: "Verde Menta", tipo_parede: "Alvenaria", ambiente: "Interno", acabamento: "Fosco", features: ["Sem cheiro", "Fácil aplicação", "Lavável"], linha: "Standard" },
    { nome: "Suvinil Fachada Acrílica", cor: "Azul Sereno", tipo_parede: "Alvenaria", ambiente: "Externo", acabamento: "Fosco", features: ["Resistente à chuva e sol", "Anti-mofo", "Lavável"], linha: "Premium" },
  ];

  await repo.save(produtos);
  console.log("✅ Seed executado com sucesso!");
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("❌ Erro ao executar seed:", err);
  process.exit(1);
});
