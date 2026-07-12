import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";

const { Client } = pg;

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DRIZZLE_DATABASE_URL ||
  process.env.NEON_DATABASE_URL;

console.log("Connection string encontrada?", url ? "SIM" : "NAO");

if (!url) {
  console.log("Nenhuma variavel de conexao encontrada em .env.local");
  process.exit(1);
}

const client = new Client({ connectionString: url });

async function run() {
  await client.connect();
  console.log("Conectado ao banco.");

  await client.query(`
    ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "pagesLocked" boolean DEFAULT false;
  `);
  console.log("Coluna pagesLocked OK.");

  await client.end();
  console.log("Pronto. Tudo aplicado com sucesso.");
}

run().catch((err) => {
  console.error("Erro completo:", err);
  process.exit(1);
});