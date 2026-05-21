import type { FileItem } from "./types";

export function basename(key: string): string {
  return key.replace(/\/$/, "").split("/").pop() ?? "";
}

export function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function isDirectory(file: FileItem): boolean {
  return file.httpMetadata?.contentType === "application/x-directory";
}
