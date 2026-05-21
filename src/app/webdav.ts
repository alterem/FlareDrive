import { authFetch } from "./authFetch";
import { encodeKey } from "./path";
import type { FileItem } from "./types";
import { MOCK_AUTH, mockFetchPath } from "./mockApi";

export const WEBDAV_ENDPOINT = "/webdav/";

function parseFileItem(response: Element): FileItem {
  const href = response.querySelector("href")?.textContent;
  if (!href) throw new Error("Invalid response");
  const contentType = response.querySelector("getcontenttype")?.textContent;
  const size = response.querySelector("getcontentlength")?.textContent;
  const lastModified = response.querySelector("getlastmodified")?.textContent;
  const thumbnail = response.getElementsByTagNameNS(
    "flaredrive",
    "thumbnail",
  )[0]?.textContent;
  return {
    key: decodeURI(href).replace(/^\/webdav\//, ""),
    size: size ? Number(size) : 0,
    uploaded: lastModified!,
    httpMetadata: { contentType: contentType! },
    customMetadata: { thumbnail: thumbnail ?? undefined },
  };
}

export async function fetchPath(path: string) {
  if (MOCK_AUTH) return mockFetchPath(path);
  const res = await authFetch(`${WEBDAV_ENDPOINT}${encodeKey(path)}`, {
    method: "PROPFIND",
    headers: { Depth: "1" },
  });

  if (!res.ok) throw new Error("Failed to fetch");
  if (!res.headers.get("Content-Type")?.includes("application/xml"))
    throw new Error("Invalid response");

  const document = new DOMParser().parseFromString(
    await res.text(),
    "application/xml",
  );
  const stripped = path.replace(/\/$/, "");
  return Array.from(document.querySelectorAll("response"))
    .filter((response) => {
      const href = response.querySelector("href")?.textContent ?? "";
      return decodeURIComponent(href).slice(WEBDAV_ENDPOINT.length) !== stripped;
    })
    .map(parseFileItem);
}

export async function copyPaste(source: string, target: string, move = false) {
  if (MOCK_AUTH) {
    await new Promise((r) => setTimeout(r, 150));
    return;
  }
  const sourceUrl = `${WEBDAV_ENDPOINT}${encodeKey(source)}`;
  const destinationUrl = new URL(
    `${WEBDAV_ENDPOINT}${encodeKey(target)}`,
    window.location.href,
  );
  await authFetch(sourceUrl, {
    method: move ? "MOVE" : "COPY",
    headers: { Destination: destinationUrl.href },
  });
}

export async function createFolder(cwd: string, folderName: string) {
  if (!folderName) return;
  if (folderName.includes("/")) throw new Error("Invalid folder name");
  if (MOCK_AUTH) {
    await new Promise((r) => setTimeout(r, 150));
    return;
  }
  const folderKey = `${cwd}${folderName}`;
  await authFetch(`${WEBDAV_ENDPOINT}${encodeKey(folderKey)}`, {
    method: "MKCOL",
  });
}

export async function deleteKey(key: string) {
  if (MOCK_AUTH) {
    await new Promise((r) => setTimeout(r, 150));
    return;
  }
  await authFetch(`${WEBDAV_ENDPOINT}${encodeKey(key)}`, { method: "DELETE" });
}
