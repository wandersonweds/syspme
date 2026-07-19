import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Detecta se a requisição vem de localhost ou de um ambiente de desenvolvimento.
 * Nesse caso, as flags de cookie devem ser relaxadas para permitir HTTP sem HTTPS.
 */
function isLocalOrDev(req: Request): boolean {
  const hostname = req.hostname ?? "";
  const isLocalHost =
    LOCAL_HOSTS.has(hostname) ||
    isIpAddress(hostname) ||
    hostname === "127.0.0.1" ||
    hostname === "::1";
  const isDevEnv = process.env.NODE_ENV === "development";
  return isLocalHost || isDevEnv;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Em localhost ou ambiente de desenvolvimento:
  //   - sameSite: "lax"  → aceito em HTTP sem exigir HTTPS
  //   - secure: false    → não exige conexão HTTPS para enviar o cookie
  //
  // Em produção (HTTPS):
  //   - sameSite: "none" → necessário para cross-site (ex: preview em sandbox)
  //   - secure: true     → obrigatório quando sameSite é "none"
  if (isLocalOrDev(req)) {
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    };
  }

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
