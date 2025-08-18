import { getProducts } from "../repositories/produtoRepository";
import type { ProductFilters } from "../interfaces/ProductFilters.js";

export async function buscarProdutos(filters: ProductFilters, limit?: number) {
  return getProducts(filters, limit);
}
