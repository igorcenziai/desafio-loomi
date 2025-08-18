import { AppDataSource } from '../infra/database/data-source.js';
import { Produto } from '../entities/Produto.js';

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Produto);

  const produtos = [
    {
      nome: "Suvinil Toque de Seda",
      cor: "Branco Neve",
      tipo_parede: "Alvenaria",
      ambiente: "Interno",
      acabamento: "Acetinado",
      features: ["Lavável", "Sem odor", "Alta cobertura", "Fácil limpeza"],
      linha: "Premium",
    },
    {
      nome: "Suvinil Fosco Completo",
      cor: "Cinza Urbano",
      tipo_parede: "Alvenaria",
      ambiente: "Interno/Externo",
      acabamento: "Fosco",
      features: ["Anti-mofo", "Alta cobertura", "Resistente à umidade"],
      linha: "Premium",
    },
    {
      nome: "Suvinil Clássica",
      cor: "Amarelo Canário",
      tipo_parede: "Alvenaria",
      ambiente: "Interno",
      acabamento: "Fosco",
      features: ["Boa cobertura", "Econômica", "Rápida secagem"],
      linha: "Standard",
    },
    {
      nome: "Suvinil Esmalte Sintético",
      cor: "Vermelho Ferrari",
      tipo_parede: "Madeira, Ferro",
      ambiente: "Interno/Externo",
      acabamento: "Brilhante",
      features: ["Alta durabilidade", "Resistente ao calor", "Impermeável"],
      linha: "Premium",
    },
    {
      nome: "Suvinil Criativa",
      cor: "Verde Menta",
      tipo_parede: "Alvenaria",
      ambiente: "Interno",
      acabamento: "Fosco",
      features: ["Sem cheiro", "Fácil aplicação", "Lavável"],
      linha: "Standard",
    },
    {
      nome: "Suvinil Fachada Acrílica",
      cor: "Azul Sereno",
      tipo_parede: "Alvenaria",
      ambiente: "Externo",
      acabamento: "Fosco",
      features: ["Resistente à chuva e sol", "Anti-mofo", "Lavável"],
      linha: "Premium",
    },
  ];

  await repo.save(produtos);
  console.log("✅ Seed executado com sucesso!");
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("❌ Erro ao executar seed:", err);
  process.exit(1);
});
