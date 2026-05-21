import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, NotebookPen } from "lucide-react";
import FileGrid from "./FileGrid";
import { basename, encodeKey } from "./app/path";
import type { FileItem, ViewMode } from "./app/types";
import MultiSelectToolbar from "./MultiSelectToolbar";
import UploadDrawer, { UploadFab } from "./UploadDrawer";
import TextPadDrawer from "./TextPadDrawer";
import { copyPaste, deleteKey, fetchPath } from "./app/transfer";
import { useTransferQueue, useUploadEnqueue } from "./app/transferQueue";
import { sortFiles, type SortState } from "./app/sort";
import { useCwd } from "./hooks/useCwd";
import { Centered } from "./components/Centered";
import { PathBreadcrumb } from "./components/PathBreadcrumb";
import { DropZone } from "./components/DropZone";
import { RenameDialog } from "./components/RenameDialog";
import { ConfirmDeleteDialog } from "./components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";

function shareKey(key: string) {
  const url = new URL(`/webdav/${encodeKey(key)}`, window.location.href);
  if (navigator.share) {
    navigator.share({ url: url.toString() }).catch(() => {
      navigator.clipboard?.writeText(url.toString());
    });
  } else {
    navigator.clipboard?.writeText(url.toString());
  }
}

function downloadKey(key: string) {
  const a = document.createElement("a");
  a.href = `/webdav/${encodeKey(key)}`;
  a.download = basename(key);
  a.click();
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

  const performRename = async () => {
    if (multiSelected?.length !== 1) return;
    await copyPaste(multiSelected[0], cwd + renameValue, true);
    setRenameOpen(false);
    fetchFiles();
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    for (const key of confirmDelete) await deleteKey(key);
    setConfirmDelete(null);
    fetchFiles();
  };

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
            onCwdChange={setCwd}
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
          if (multiSelected?.length === 1) downloadKey(multiSelected[0]);
        }}
        onRename={() => {
          if (multiSelected?.length !== 1) return;
          setRenameValue(basename(multiSelected[0]));
          setRenameOpen(true);
        }}
        onDelete={() => {
          if (multiSelected?.length) setConfirmDelete(multiSelected);
        }}
        onShare={() => {
          if (multiSelected?.length === 1) shareKey(multiSelected[0]);
        }}
      />

      <RenameDialog
        open={renameOpen}
        value={renameValue}
        onValueChange={setRenameValue}
        onClose={() => setRenameOpen(false)}
        onSubmit={performRename}
      />

      <ConfirmDeleteDialog
        keys={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={performDelete}
      />
    </>
  );
}

export default FileBrowser;
