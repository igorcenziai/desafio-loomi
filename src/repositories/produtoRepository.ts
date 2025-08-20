import { AppDataSource } from "../infra/database/data-source.js";
import { Produto } from "../entities/Produto.js";
import type { ProductFilters } from "../interfaces/ProductFilters.js";

export async function getProducts(
  filters?: ProductFilters,
  limit?: number
) {
    await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Produto);
  const query = repo.createQueryBuilder("produto");

  const matchCases: string[] = [];
  const params: Record<string, any> = {};
  let paramIndex = 0;

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "features" && Array.isArray(value)) {
          const featureConditions: string[] = [];
          value.forEach((feat: string) => {
            const paramName = `feature${paramIndex++}`;
            featureConditions.push(`produto.features ILIKE :${paramName}`);
            params[paramName] = `%${feat}%`;
            matchCases.push(`CASE WHEN produto.features ILIKE :${paramName} THEN 1 ELSE 0 END`);
          });
          if (featureConditions.length > 0) {
            query.orWhere(`(${featureConditions.join(" OR ")})`);
          }
        } else {
          const paramName = `${key}${paramIndex++}`;
          if (typeof value === "string") {
            query.orWhere(`produto.${key} ILIKE :${paramName}`);
            params[paramName] = `%${value}%`;
            matchCases.push(`CASE WHEN produto.${key} ILIKE :${paramName} THEN 1 ELSE 0 END`);
          } else {
            query.orWhere(`produto.${key} = :${paramName}`);
            params[paramName] = value;
            matchCases.push(`CASE WHEN produto.${key} = :${paramName} THEN 1 ELSE 0 END`);
          }
        }
      }
    });

    query.setParameters(params);

    if (matchCases.length > 0) {
      const scoreExpr = matchCases.join(" + ");
      query.addSelect(`(${scoreExpr})`, "match_score");
      query.orderBy("match_score", "DESC");
    }
  }

  if (limit !== undefined) {
    query.limit(limit);
  }

  const produtos = await query.getRawAndEntities();
  await AppDataSource.destroy();
  return produtos.entities;
}

