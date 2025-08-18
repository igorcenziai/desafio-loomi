import "reflect-metadata";
import { DataSource } from "typeorm";
import { Produto } from '../../entities/Produto.js';
import * as dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: isProd ? (process.env.DB_HOST || "localhost") : "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: isProd ? (process.env.DB_USER || "postgres") : "postgres",
  password: isProd ? (process.env.DB_PASS || "postgres") : "postgres",
  database: process.env.DB_NAME || "tintas",
  synchronize: !isProd,
  logging: !isProd,
  entities: [Produto],
  migrations: [],
  subscribers: [],
});