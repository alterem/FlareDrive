import { notFound, parseBucketPath } from "./utils";
import { handleRequestCopy } from "./copy";
import { handleRequestDelete } from "./delete";
import { handleRequestGet } from "./get";
import { handleRequestHead } from "./head";
import { handleRequestMkcol } from "./mkcol";
import { handleRequestMove } from "./move";
import { handleRequestPropfind } from "./propfind";
import { handleRequestPut } from "./put";
import { RequestHandlerParams } from "./utils";
import { handleRequestPost } from "./post";

async function handleRequestOptions() {
  return new Response(null, {
    headers: {
      Allow: Object.keys(HANDLERS).join(", "),
      DAV: "1",
    },
  });
}

async function handleMethodNotAllowed() {
  return new Response(null, { status: 405 });
}

const HANDLERS: Record<
  string,
  (context: RequestHandlerParams) => Promise<Response>
> = {
  PROPFIND: handleRequestPropfind,
  MKCOL: handleRequestMkcol,
  HEAD: handleRequestHead,
  GET: handleRequestGet,
  POST: handleRequestPost,
  PUT: handleRequestPut,
  COPY: handleRequestCopy,
  MOVE: handleRequestMove,
  DELETE: handleRequestDelete,
};

function unauthorized(useWebDavChallenge: boolean) {
  const headers: Record<string, string> = {};
  if (useWebDavChallenge) {
    headers["WWW-Authenticate"] = `Basic realm="WebDAV"`;
  }
  return new Response("Unauthorized", { status: 401, headers });
}

export const onRequest: PagesFunction<{
  WEBDAV_USERNAME: string;
  WEBDAV_PASSWORD: string;
  WEBDAV_PUBLIC_READ?: string;
}> = async function (context) {
  const env = context.env;
  const request: Request = context.request;
  if (request.method === "OPTIONS") return handleRequestOptions();

  const skipAuth =
    env.WEBDAV_PUBLIC_READ === "1" &&
    ["GET", "HEAD", "PROPFIND"].includes(request.method);

  if (!skipAuth) {
    if (!env.WEBDAV_USERNAME || !env.WEBDAV_PASSWORD)
      return new Response("WebDAV protocol is not enabled", { status: 403 });

    // Only emit a `WWW-Authenticate: Basic` challenge for non-browser
    // WebDAV clients (curl, Finder, etc.) so they get the standard popup.
    // Browser requests go through the in-app login UI instead.
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
    const accept = (request.headers.get("accept") || "").toLowerCase();
    const looksLikeBrowser =
      accept.includes("text/html") ||
      (/mozilla|chrome|safari|firefox|edg\//.test(userAgent) &&
        !/curl|wget|httpie|webdav|microsoft-webdav|cyberduck|davfs|rclone/.test(
          userAgent,
        ));

    const auth = request.headers.get("Authorization");
    if (!auth) return unauthorized(!looksLikeBrowser);

    const expectedAuth = `Basic ${btoa(
      `${env.WEBDAV_USERNAME}:${env.WEBDAV_PASSWORD}`,
    )}`;
    if (auth !== expectedAuth) return unauthorized(!looksLikeBrowser);
  }

  const [bucket, path] = parseBucketPath(context);
  if (!bucket) return notFound();

  const method: string = (context.request as Request).method;
  const handler = HANDLERS[method] ?? handleMethodNotAllowed;
  return handler({ bucket, path, request: context.request });
};
