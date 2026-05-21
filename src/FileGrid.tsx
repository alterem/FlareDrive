import React from "react";
import { encodeKey, isDirectory } from "./app/path";
import type { FileItem, ViewMode } from "./app/types";
import { FileGridItem } from "./components/FileGridItem";
import { FileListItem } from "./components/FileListItem";

export type { FileItem, ViewMode } from "./app/types";
export { encodeKey, isDirectory } from "./app/path";

function openFile(file: FileItem) {
  window.open(`/webdav/${encodeKey(file.key)}`, "_blank", "noopener,noreferrer");
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

  const activate = (file: FileItem) => {
    if (multiSelected !== null) onMultiSelect(file.key);
    else if (isDirectory(file)) onCwdChange(file.key + "/");
    else openFile(file);
  };

  const itemProps = (file: FileItem) => ({
    file,
    selected: Boolean(multiSelected?.includes(file.key)),
    onActivate: () => activate(file),
    onLongPress: () => onMultiSelect(file.key),
  });

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2 p-2 pb-24 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {files.map((file) => (
          <FileGridItem key={file.key} {...itemProps(file)} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-1 pb-24">
      {files.map((file) => (
        <FileListItem key={file.key} {...itemProps(file)} />
      ))}
    </div>
  );
}

export default FileGrid;
