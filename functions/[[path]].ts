import { dispatchWebdav, WebdavEnv } from "./webdav/dispatch";

interface RootEnv extends WebdavEnv {
  ASSETS: Fetcher;
}

function isBrowserNavigation(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const accept = (request.headers.get("accept") || "").toLowerCase();
  if (!accept.includes("text/html")) return false;
  // Only top-level navigations get Sec-Fetch-Dest: document. SPA fetch() sends
  // "empty" and we don't want to swallow those as page loads. Older browsers
  // omit the header — treat that as navigation too.
  const dest = request.headers.get("sec-fetch-dest");
  return dest === null || dest === "document";
}

export const onRequest: PagesFunction<RootEnv> = async (context) => {
  const { request, env, params } = context;

  if (isBrowserNavigation(request)) {
    const url = new URL(request.url);
    // Fetch "/" rather than "/index.html" — Pages 301-redirects /index.html to
    // / for canonicalization, which loops back through this function.
    const spaRequest = new Request(new URL("/", url).toString(), {
      method: "GET",
      headers: request.headers,
    });
    return env.ASSETS.fetch(spaRequest);
  }

  const segments = (params.path || []) as string[];
  const path = decodeURIComponent(segments.join("/"));
  return dispatchWebdav(request, env, path);
};
