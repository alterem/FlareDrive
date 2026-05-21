import { notFound, RequestHandlerParams } from "./utils";
import { handleRequestCopy } from "./copy";
import { handleRequestDelete } from "./delete";
import { handleRequestGet } from "./get";
import { handleRequestHead } from "./head";
import { handleRequestLock, handleRequestUnlock } from "./lock";
import { handleRequestMkcol } from "./mkcol";
import { handleRequestMove } from "./move";
import { handleRequestPropfind } from "./propfind";
import { handleRequestProppatch } from "./proppatch";
import { handleRequestPut } from "./put";
import { handleRequestPost } from "./post";

export interface WebdavEnv {
  WEBDAV_USERNAME: string;
  WEBDAV_PASSWORD: string;
  WEBDAV_PUBLIC_READ?: string;
  BUCKET?: R2Bucket;
  [key: string]: unknown;
}

async function handleRequestOptions() {
  return new Response(null, {
    headers: {
      Allow: Object.keys(HANDLERS).join(", "),
      DAV: "1, 2",
    },
  });
}

async function handleMethodNotAllowed({ request }: RequestHandlerParams) {
  return new Response(`Method Not Allowed: ${request.method}`, {
    status: 405,
    headers: { Allow: Object.keys(HANDLERS).join(", ") },
  });
}

function shortUa(ua: string | null) {
  if (!ua) return "-";
  return ua.length > 60 ? ua.slice(0, 60) + "…" : ua;
}

const HANDLERS: Record<
  string,
  (context: RequestHandlerParams) => Promise<Response>
> = {
  PROPFIND: handleRequestPropfind,
  PROPPATCH: handleRequestProppatch,
  MKCOL: handleRequestMkcol,
  HEAD: handleRequestHead,
  GET: handleRequestGet,
  POST: handleRequestPost,
  PUT: handleRequestPut,
  COPY: handleRequestCopy,
  MOVE: handleRequestMove,
  DELETE: handleRequestDelete,
  LOCK: handleRequestLock,
  UNLOCK: handleRequestUnlock,
};

const COOKIE_NAME = "flaredrive_auth";

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

function unauthorized(request: Request, looksLikeBrowser: boolean) {
  if (looksLikeBrowser && request.method === "GET") {
    const url = new URL(request.url);
    if (url.pathname !== "/") {
      return Response.redirect(new URL("/", url).toString(), 302);
    }
  }
  const headers: Record<string, string> = {};
  if (!looksLikeBrowser) {
    headers["WWW-Authenticate"] = `Basic realm="WebDAV"`;
  }
  return new Response("Unauthorized", { status: 401, headers });
}

function resolveBucket(env: WebdavEnv, request: Request): R2Bucket | null {
  const url = new URL(request.url);
  const driveId = url.hostname.replace(/\..*/, "");
  const candidate =
    (env[driveId] as R2Bucket | undefined) ||
    (env.BUCKET as R2Bucket | undefined);
  return candidate ?? null;
}

export async function dispatchWebdav(
  request: Request,
  env: WebdavEnv,
  path: string,
): Promise<Response> {
  if (request.method === "OPTIONS") return handleRequestOptions();

  const skipAuth =
    env.WEBDAV_PUBLIC_READ === "1" &&
    ["GET", "HEAD", "PROPFIND"].includes(request.method);

  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const accept = (request.headers.get("accept") || "").toLowerCase();
  const looksLikeBrowser =
    accept.includes("text/html") ||
    (/mozilla|chrome|safari|firefox|edg\//.test(userAgent) &&
      !/curl|wget|httpie|webdav|microsoft-webdav|cyberduck|davfs|rclone/.test(
        userAgent,
      ));

  if (!skipAuth) {
    if (!env.WEBDAV_USERNAME || !env.WEBDAV_PASSWORD)
      return new Response("WebDAV protocol is not enabled", { status: 403 });

    const auth =
      request.headers.get("Authorization") ||
      parseCookies(request.headers.get("Cookie"))[COOKIE_NAME];
    if (!auth) return unauthorized(request, looksLikeBrowser);

    const expectedAuth = `Basic ${btoa(
      `${env.WEBDAV_USERNAME}:${env.WEBDAV_PASSWORD}`,
    )}`;
    if (auth !== expectedAuth) return unauthorized(request, looksLikeBrowser);
  }

  const bucket = resolveBucket(env, request);
  if (!bucket) return notFound();

  const handler = HANDLERS[request.method] ?? handleMethodNotAllowed;
  const response = await handler({ bucket, path, request });
  if (response.status >= 400 && response.status !== 404) {
    const url = new URL(request.url);
    console.log(
      `[webdav] ${response.status} ${request.method} ${url.pathname} ua=${shortUa(
        request.headers.get("user-agent"),
      )}`,
    );
  }
  return response;
}
