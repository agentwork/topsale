import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  schema: [
    "./src/db/schema.ts",
    "./src/db/crm/schema.ts",
    "./src/db/product/schema.ts",
    "./src/db/quotation/schema.ts",
  ],
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl as string,
  },
});
