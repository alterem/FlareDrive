import { FileItem, isDirectory } from "../FileGrid";

export type SortKey = "name" | "size" | "modified";
export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export const DEFAULT_SORT: SortState = { key: "name", direction: "asc" };

function filenameOf(file: FileItem) {
  return file.key.replace(/\/$/, "").split("/").pop()?.toLowerCase() ?? "";
}

export function sortFiles(files: FileItem[], { key, direction }: SortState) {
  const dir = direction === "asc" ? 1 : -1;
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return [...files].sort((a, b) => {
    const dirA = isDirectory(a);
    const dirB = isDirectory(b);
    if (dirA !== dirB) return dirA ? -1 : 1;
    switch (key) {
      case "size":
        return (a.size - b.size) * dir;
      case "modified": {
        const ta = Date.parse(a.uploaded) || 0;
        const tb = Date.parse(b.uploaded) || 0;
        return (ta - tb) * dir;
      }
      case "name":
      default:
        return collator.compare(filenameOf(a), filenameOf(b)) * dir;
    }
  });
}
