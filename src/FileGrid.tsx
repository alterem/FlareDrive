import React from "react";
import MimeIcon from "./MimeIcon";
import { humanReadableSize } from "./app/utils";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

export interface FileItem {
  key: string;
  size: number;
  uploaded: string;
  httpMetadata: { contentType: string };
  customMetadata?: { thumbnail?: string };
}

function extractFilename(key: string) {
  return key.replace(/\/$/, "").split("/").pop();
}

export function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function isDirectory(file: FileItem) {
  return file.httpMetadata?.contentType === "application/x-directory";
}

function FileGrid({
  files,
  viewMode = "list",
  onCwdChange,
  multiSelected,
  onMultiSelect,
  emptyMessage,
}: {
  files: FileItem[];
  viewMode?: ViewMode;
  onCwdChange: (newCwd: string) => void;
  multiSelected: string[] | null;
  onMultiSelect: (key: string) => void;
  emptyMessage?: React.ReactNode;
}) {
  if (files.length === 0) return <>{emptyMessage}</>;

  const handleActivate = (file: FileItem) => {
    if (multiSelected !== null) {
      onMultiSelect(file.key);
    } else if (isDirectory(file)) {
      onCwdChange(file.key + "/");
    } else {
      window.open(
        `/webdav/${encodeKey(file.key)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2 p-2 pb-24 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {files.map((file) => {
          const selected = multiSelected?.includes(file.key);
          return (
            <button
              key={file.key}
              type="button"
              onClick={() => handleActivate(file)}
              onContextMenu={(e) => {
                e.preventDefault();
                onMultiSelect(file.key);
              }}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 text-center transition-colors hover:border-border hover:bg-accent",
                selected && "border-ring bg-accent ring-1 ring-ring",
              )}
            >
              <div className="grid h-14 w-14 place-items-center">
                {file.customMetadata?.thumbnail ? (
                  <img
                    src={`/webdav/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png`}
                    alt={file.key}
                    className="h-14 w-14 rounded-md object-cover"
                  />
                ) : (
                  <MimeIcon
                    contentType={file.httpMetadata.contentType}
                    className="h-12 w-12 text-muted-foreground"
                  />
                )}
              </div>
              <div className="min-w-0 max-w-full">
                <div className="truncate text-sm font-medium" title={extractFilename(file.key)}>
                  {extractFilename(file.key)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {isDirectory(file) ? "Folder" : humanReadableSize(file.size)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-1 pb-24">
      {files.map((file) => {
        const selected = multiSelected?.includes(file.key);
        return (
          <button
            key={file.key}
            type="button"
            className={cn(
              "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
              "hover:bg-accent",
              selected && "bg-accent ring-1 ring-ring",
            )}
            onClick={() => handleActivate(file)}
            onContextMenu={(e) => {
              e.preventDefault();
              onMultiSelect(file.key);
            }}
          >
            <div className="shrink-0">
              {file.customMetadata?.thumbnail ? (
                <img
                  src={`/webdav/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png`}
                  alt={file.key}
                  className="h-9 w-9 rounded object-cover"
                />
              ) : (
                <MimeIcon contentType={file.httpMetadata.contentType} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {extractFilename(file.key)}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground sm:hidden">
                <span className="truncate">
                  {new Date(file.uploaded).toLocaleString()}
                </span>
                {!isDirectory(file) && (
                  <span className="shrink-0">
                    {humanReadableSize(file.size)}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden shrink-0 text-xs text-muted-foreground sm:block sm:w-44 sm:text-right">
              {new Date(file.uploaded).toLocaleString()}
            </div>
            <div className="hidden shrink-0 text-xs text-muted-foreground sm:block sm:w-20 sm:text-right">
              {isDirectory(file) ? "—" : humanReadableSize(file.size)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default FileGrid;

