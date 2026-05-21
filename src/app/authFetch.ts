import { authHeader } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function mergeAuthHeaders(headers?: HeadersInit): Record<string, string> {
  const merged: Record<string, string> = { ...authHeader() };
  if (!headers) return merged;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      merged[key] = value;
    });
  } else if (Array.isArray(headers)) {
    for (const [k, v] of headers) merged[k] = v;
  } else {
    Object.assign(merged, headers);
  }
  return merged;
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const res = await fetch(input, {
    ...init,
    headers: mergeAuthHeaders(init.headers),
  });
  if (res.status === 401) throw new UnauthorizedError();
  return res;
}

function parseResponseHeaders(xhr: XMLHttpRequest): Record<string, string> {
  const lines = xhr.getAllResponseHeaders().trim().split("\r\n");
  return lines.reduce<Record<string, string>>((acc, header) => {
    const [key, value] = header.split(": ");
    acc[key] = value;
    return acc;
  }, {});
}

export function xhrFetch(
  url: RequestInfo | URL,
  requestInit: RequestInit & {
    onUploadProgress?: (progressEvent: ProgressEvent) => void;
  },
) {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = requestInit.onUploadProgress ?? null;
    xhr.open(
      requestInit.method ?? "GET",
      url instanceof Request ? url.url : (url as string),
    );
    const headers = new Headers(mergeAuthHeaders(requestInit.headers));
    headers.forEach((value, key) => xhr.setRequestHeader(key, value));
    xhr.onload = () => {
      if (xhr.status === 401) {
        reject(new UnauthorizedError());
        return;
      }
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status,
          headers: parseResponseHeaders(xhr),
        }),
      );
    };
    xhr.onerror = reject;
    const body = requestInit.body;
    if (body instanceof Blob || typeof body === "string") {
      xhr.send(body as XMLHttpRequestBodyInit);
    } else {
      xhr.send();
    }
  });
}
