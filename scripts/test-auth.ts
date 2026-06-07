import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { localUsers } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const conn = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(conn);
const result = await db.select().from(localUsers).where(eq(localUsers.username, "admin")).limit(1);
console.log("Drizzle result:", JSON.stringify(result));
if (result[0]) {
  const user = result[0];
  console.log("passwordHash field:", user.passwordHash);
  const ok = await bcrypt.compare("123456", user.passwordHash);
  console.log("bcrypt.compare('123456', hash):", ok);
}
await conn.end();
process.exit(0);
