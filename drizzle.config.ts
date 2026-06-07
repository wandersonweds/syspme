import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Carrega o .env local automaticamente para que o DATABASE_URL esteja disponível
// mesmo quando o terminal não tem a variável injetada (ex: Windows CMD)
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não encontrada. Verifique se o arquivo .env existe na raiz do projeto com a variável DATABASE_URL definida."
  );
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
