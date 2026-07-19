import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";

const LOCAL_COOKIE = "syspme_local_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "syspme-secret-key-change-in-production"
);

export type LocalUserPayload = {
  id: number;
  username: string;
  nome: string;
  role: "admin" | "user";
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: LocalUserPayload | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: LocalUserPayload | null = null;

  try {
    const token = opts.req.cookies?.[LOCAL_COOKIE];
    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as unknown as LocalUserPayload;
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
