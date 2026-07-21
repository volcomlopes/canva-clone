import "dotenv/config";
import pkg from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const sql = `
CREATE TABLE IF NOT EXISTS "brandSvg" (
  "id" text PRIMARY KEY NOT NULL,
  "brandId" text NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "fileName" text,
  "fileSize" text,
  "uploadedBy" text REFERENCES "user"("id") ON DELETE SET NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log("OK: tabela brandSvg criada (ou ja existia).");
  } catch (err) {
    console.error("ERRO:", err.message);
  } finally {
    await client.end();
  }
}

run();