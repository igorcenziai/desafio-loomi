import { AppDataSource } from '../infra/database/data-source.js';
import { Produto } from '../entities/Produto.js';
import pkg from 'pg';
const { Client } = pkg;
import { getEnvironmentData } from '../utils/environment.js';

const vars = getEnvironmentData();

async function ensureDatabaseExists() {
  const DB_HOST = vars.POSTGRES_HOST;
  const DB_PORT = vars.POSTGRES_PORT;
  const DB_USER = vars.POSTGRES_USER;
  const DB_PASSWORD = vars.POSTGRES_PASSWORD;
  const DB_NAME = vars.POSTGRES_DB;

  console.log(`Verificando se o banco de dados '${DB_NAME}' existe...`);

  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
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

  const produtosParaInserir = [];
  for (const produto of produtos) {
    const exists = await repo.findOne({ where: { nome: produto.nome } });
    if (!exists) {
      produtosParaInserir.push(produto);
    } else {
      console.log(`Produto já existe e será ignorado: ${produto.nome}`);
    }
  }

  if (produtosParaInserir.length > 0) {
    await repo.save(produtosParaInserir);
    console.log(`✅ ${produtosParaInserir.length} produto(s) inserido(s) com sucesso!`);
  } else {
    console.log("✅ Nenhum produto novo para inserir.");
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("❌ Erro ao executar seed:", err);
  process.exit(1);
});
