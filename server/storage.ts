// Helpers de armazenamento de arquivos — armazenamento local em disco.
// Arquivos são salvos em <project_root>/uploads/ e servidos via /uploads/*.
// Compatível com instalação local (Windows/Linux) sem dependências externas.

import fs from "fs";
import path from "path";

// Pasta de uploads: <raiz do projeto>/uploads/
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// Garante que a pasta existe ao iniciar
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  // Garante que subpastas existam (ex.: logos/)
  const filePath = path.join(UPLOADS_DIR, key);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);
  fs.writeFileSync(filePath, buffer);

  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/uploads/${key}`;
}
