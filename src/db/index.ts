import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as crmSchema from "./crm/schema";
import * as productSchema from "./product/schema";
import * as quotationSchema from "./quotation/schema";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema: { ...schema, ...crmSchema, ...productSchema, ...quotationSchema } });
