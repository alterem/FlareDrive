import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Home, Loader2, NotebookPen } from "lucide-react";
import FileGrid, { encodeKey, FileItem, isDirectory, ViewMode } from "./FileGrid";
import MultiSelectToolbar from "./MultiSelectToolbar";
import UploadDrawer, { UploadFab } from "./UploadDrawer";
import TextPadDrawer from "./TextPadDrawer";
import { copyPaste, deleteKey, fetchPath } from "./app/transfer";
import { useTransferQueue, useUploadEnqueue } from "./app/transferQueue";
import { sortFiles, type SortState } from "./app/sort";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full place-items-center">{children}</div>
  );
}

function PathBreadcrumb({
  path,
  onCwdChange,
}: {
  path: string;
  onCwdChange: (newCwd: string) => void;
}) {
  const parts = path.replace(/\/$/, "").split("/");
  return (
    <nav className="flex items-center gap-1 overflow-x-auto p-2 text-sm">
      <button
        type="button"
        onClick={() => onCwdChange("")}
        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </button>
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium">{part}</span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onCwdChange(parts.slice(0, index + 1).join("/") + "/")
                }
                className="rounded px-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {part}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function DropZone({
  children,
  onDrop,
}: {
  children: React.ReactNode;
  onDrop: (files: FileList) => void;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto bg-background transition",
        dragging && "ring-2 ring-inset ring-brand brightness-95",
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e.dataTransfer.files);
        setDragging(false);
      }}
    >
      {children}
    </div>
  );
}

function cwdToPath(cwd: string): string {
  if (!cwd) return "/";
  return "/" + cwd.split("/").map(encodeURIComponent).join("/");
}

function pathToCwd(pathname: string): string {
  if (!pathname || pathname === "/") return "";
  const trimmed = pathname.replace(/^\/+/, "");
  const withSlash = trimmed.endsWith("/") ? trimmed : trimmed + "/";
  try {
    return decodeURIComponent(withSlash);
  } catch {
    return withSlash;
  }
}

function useCwd(): [string, (next: string) => void] {
  const [cwd, setCwdState] = useState(() =>
    pathToCwd(window.location.pathname),
  );

  const setCwd = useCallback((next: string) => {
    setCwdState(next);
    const newPath = cwdToPath(next);
    if (newPath !== window.location.pathname) {
      window.history.pushState(null, "", newPath + window.location.search);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCwdState(pathToCwd(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [cwd, setCwd];
}

function FileBrowser({
  search,
  viewMode,
  sort,
  onError,
}: {
  search: string;
  viewMode: ViewMode;
  sort: SortState;
  onError: (error: Error) => void;
}) {
  const [cwd, setCwd] = useCwd();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [multiSelected, setMultiSelected] = useState<string[] | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showTextPadDrawer, setShowTextPadDrawer] = useState(false);
  const [lastUploadKey, setLastUploadKey] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  const transferQueue = useTransferQueue();
  const uploadEnqueue = useUploadEnqueue();

  const fetchFiles = useCallback(() => {
    setLoading(true);
    fetchPath(cwd)
      .then((files) => {
        setFiles(files);
        setMultiSelected(null);
      })
      .catch(onError)
      .finally(() => setLoading(false));
  }, [cwd, onError]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (!transferQueue.length) return;
    const lastFile = transferQueue[transferQueue.length - 1];
    if (["pending", "in-progress"].includes(lastFile.status)) {
      setLastUploadKey(lastFile.remoteKey);
    } else if (lastUploadKey) {
      fetchFiles();
      setLastUploadKey(null);
    }
  }, [fetchFiles, lastUploadKey, transferQueue]);

  const filteredFiles = useMemo(() => {
    const matched = search
      ? files.filter((file) =>
          file.key.toLowerCase().includes(search.toLowerCase()),
        )
      : files;
    return sortFiles(matched, sort);
  }, [files, search, sort]);

  const handleMultiSelect = useCallback((key: string) => {
    setMultiSelected((prev) => {
      if (prev === null) return [key];
      if (prev.includes(key)) {
        const updated = prev.filter((k) => k !== key);
        return updated.length ? updated : null;
      }
      return [...prev, key];
    });
  }, []);

  return (
    <>
      {cwd && <PathBreadcrumb path={cwd} onCwdChange={setCwd} />}

      {loading ? (
        <Centered>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </Centered>
      ) : (
        <DropZone
          onDrop={(files) => {
            uploadEnqueue(
              ...Array.from(files).map((file) => ({ file, basedir: cwd })),
            );
          }}
        >
          <FileGrid
            files={filteredFiles}
            viewMode={viewMode}
            onCwdChange={(newCwd: string) => setCwd(newCwd)}
            multiSelected={multiSelected}
            onMultiSelect={handleMultiSelect}
            emptyMessage={
              <Centered>
                <p className="text-sm text-muted-foreground">
                  No files or folders
                </p>
              </Centered>
            }
          />
        </DropZone>
      )}

      {multiSelected === null && (
        <>
          <UploadFab onClick={() => setShowUploadDrawer(true)} />
          <Button
            variant="outline"
            size="sm"
            className="fixed right-4 bottom-24 z-40 gap-2 shadow"
            onClick={() => setShowTextPadDrawer(true)}
          >
            <NotebookPen className="h-4 w-4" />
            TextPad
          </Button>
        </>
      )}

      <UploadDrawer
        open={showUploadDrawer}
        setOpen={setShowUploadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
      />

      <TextPadDrawer
        open={showTextPadDrawer}
        setOpen={setShowTextPadDrawer}
        cwd={cwd}
        onUpload={fetchFiles}
      />

      <MultiSelectToolbar
        multiSelected={multiSelected}
        onClose={() => setMultiSelected(null)}
        onDownload={() => {
          if (multiSelected?.length !== 1) return;
          const a = document.createElement("a");
          a.href = `/webdav/${encodeKey(multiSelected[0])}`;
          a.download = multiSelected[0].split("/").pop()!;
          a.click();
        }}
        onRename={() => {
          if (multiSelected?.length !== 1) return;
          const current =
            multiSelected[0].replace(/\/$/, "").split("/").pop() ?? "";
          setRenameValue(current);
          setRenameOpen(true);
        }}
        onDelete={() => {
          if (!multiSelected?.length) return;
          setConfirmDelete(multiSelected);
        }}
        onShare={() => {
          if (multiSelected?.length !== 1) return;
          const url = new URL(
            `/webdav/${encodeKey(multiSelected[0])}`,
            window.location.href,
          );
          if (navigator.share) {
            navigator.share({ url: url.toString() }).catch(() => {
              navigator.clipboard?.writeText(url.toString());
            });
          } else {
            navigator.clipboard?.writeText(url.toString());
          }
        }}
      />

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rename">New name</Label>
            <Input
              id="rename"
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && multiSelected?.length === 1) {
                  await copyPaste(multiSelected[0], cwd + renameValue, true);
                  setRenameOpen(false);
                  fetchFiles();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (multiSelected?.length !== 1) return;
                await copyPaste(multiSelected[0], cwd + renameValue, true);
                setRenameOpen(false);
                fetchFiles();
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete permanently?</DialogTitle>
            <DialogDescription>
              The following item(s) will be removed and cannot be restored.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-40 overflow-y-auto rounded-md bg-muted/40 p-2 text-sm">
            {confirmDelete?.map((key) => (
              <li key={key} className="truncate">
                {key.replace(/\/$/, "").split("/").pop()}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirmDelete) return;
                for (const key of confirmDelete) await deleteKey(key);
                setConfirmDelete(null);
                fetchFiles();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default FileBrowser;
