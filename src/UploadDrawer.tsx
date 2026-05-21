import React, { forwardRef, useCallback, useMemo, useState } from "react";
import {
  Camera,
  FolderPlus,
  Image as ImageIcon,
  Upload as UploadIcon,
  Plus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createFolder } from "./app/transfer";
import { useUploadEnqueue } from "./app/transferQueue";
import { cn } from "@/lib/utils";

function IconCaptionButton({
  icon,
  caption,
  onClick,
}: {
  icon: React.ReactNode;
  caption: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center gap-2 rounded-xl border bg-card p-4 text-sm transition hover:bg-accent"
    >
      {icon}
      <span className="text-xs">{caption}</span>
    </button>
  );
}

export const UploadFab = forwardRef<
  HTMLButtonElement,
  { onClick: () => void; className?: string }
>(function ({ onClick, className }, ref) {
  return (
    <button
      ref={ref}
      aria-label="Upload"
      onClick={onClick}
      className={cn(
        "fixed right-4 bottom-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:opacity-90",
        className,
      )}
    >
      <Plus className="h-7 w-7" />
    </button>
  );
});

function UploadDrawer({
  open,
  setOpen,
  cwd,
  onUpload,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  cwd: string;
  onUpload: () => void;
}) {
  const uploadEnqueue = useUploadEnqueue();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const handleUpload = useCallback(
    (action: string) => () => {
      const input = document.createElement("input");
      input.type = "file";
      switch (action) {
        case "photo":
          input.accept = "image/*";
          input.capture = "environment";
          break;
        case "image":
          input.accept = "image/*,video/*";
          break;
        case "file":
          input.accept = "*/*";
          break;
      }
      input.multiple = true;
      input.onchange = async () => {
        if (!input.files) return;
        const files = Array.from(input.files);
        uploadEnqueue(...files.map((file) => ({ file, basedir: cwd })));
        setOpen(false);
        onUpload();
      };
      input.click();
    },
    [cwd, onUpload, setOpen, uploadEnqueue],
  );

  const takePhoto = useMemo(() => handleUpload("photo"), [handleUpload]);
  const uploadImage = useMemo(() => handleUpload("image"), [handleUpload]);
  const uploadFile = useMemo(() => handleUpload("file"), [handleUpload]);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Add new</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <IconCaptionButton
              icon={<Camera className="h-6 w-6" />}
              caption="Camera"
              onClick={takePhoto}
            />
            <IconCaptionButton
              icon={<ImageIcon className="h-6 w-6" />}
              caption="Image/Video"
              onClick={uploadImage}
            />
            <IconCaptionButton
              icon={<UploadIcon className="h-6 w-6" />}
              caption="Upload"
              onClick={uploadFile}
            />
            <IconCaptionButton
              icon={<FolderPlus className="h-6 w-6" />}
              caption="New folder"
              onClick={() => {
                setOpen(false);
                setFolderName("");
                setFolderDialogOpen(true);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && folderName) {
                  await createFolder(cwd, folderName);
                  setFolderDialogOpen(false);
                  onUpload();
                }
              }}
              placeholder="New folder"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!folderName.trim()}
              onClick={async () => {
                await createFolder(cwd, folderName.trim());
                setFolderDialogOpen(false);
                onUpload();
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UploadDrawer;
