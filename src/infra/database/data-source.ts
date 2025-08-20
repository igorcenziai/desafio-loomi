import "reflect-metadata";
import { DataSource } from "typeorm";
import { Produto } from '../../entities/Produto.js';
import { getEnvironmentData } from "../../utils/environment.js";


const vars = getEnvironmentData();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: vars.POSTGRES_HOST ?? "",
  port: vars.POSTGRES_PORT ?? 5432,
  username: vars.POSTGRES_USER ?? "",
  password: vars.POSTGRES_PASSWORD ?? "",
  database: vars.POSTGRES_DB ?? "",
  synchronize: true,
  logging: vars.NODE_ENV !== "production",
  entities: [Produto],
  migrations: [],
  subscribers: [],
});