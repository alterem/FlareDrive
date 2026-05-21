import { basename, isDirectory } from "@/app/path";
import type { FileItem } from "@/app/types";
import { humanReadableSize } from "@/app/utils";
import { cn } from "@/lib/utils";
import { FileThumbnail } from "./FileThumbnail";

export function FileListItem({
  file,
  selected,
  onActivate,
  onLongPress,
}: {
  file: FileItem;
  selected: boolean;
  onActivate: () => void;
  onLongPress: () => void;
}) {
  const uploaded = new Date(file.uploaded).toLocaleString();
  const sizeText = isDirectory(file) ? "—" : humanReadableSize(file.size);

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
        "hover:bg-accent",
        selected && "bg-accent ring-1 ring-ring",
      )}
      onClick={onActivate}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
    >
      <div className="shrink-0">
        <FileThumbnail file={file} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{basename(file.key)}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground sm:hidden">
          <span className="truncate">{uploaded}</span>
          {!isDirectory(file) && (
            <span className="shrink-0">{humanReadableSize(file.size)}</span>
          )}
        </div>
      </div>
      <div className="hidden shrink-0 text-xs text-muted-foreground sm:block sm:w-44 sm:text-right">
        {uploaded}
      </div>
      <div className="hidden shrink-0 text-xs text-muted-foreground sm:block sm:w-20 sm:text-right">
        {sizeText}
      </div>
    </button>
  );
}
