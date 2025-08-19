import "reflect-metadata";
import { DataSource } from "typeorm";
import { Produto } from '../../entities/Produto.js';
import * as dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: isProd ? (process.env.DB_HOST || "localhost") : "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: isProd ? (process.env.POSTGRES_USER || "postgres") : "postgres",
  password: isProd ? (process.env.POSTGRES_PASSWORD || "postgres") : "postgres",
  database: process.env.POSTGRES_DB || "tintas",
  synchronize: !isProd,
  logging: !isProd,
  entities: [Produto],
  migrations: [],
  subscribers: [],
});