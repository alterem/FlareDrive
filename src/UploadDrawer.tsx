import React, { useCallback, useMemo, useState } from "react";
import {
  Camera,
  FolderPlus,
  Image as ImageIcon,
  Upload as UploadIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUploadEnqueue } from "./app/transferQueue";
import { UploadFab } from "./components/UploadFab";
import { CreateFolderDialog } from "./components/CreateFolderDialog";

export { UploadFab };

type UploadKind = "photo" | "image" | "file";

const ACCEPT_BY_KIND: Record<UploadKind, string> = {
  photo: "image/*",
  image: "image/*,video/*",
  file: "*/*",
};

function pickFiles(kind: UploadKind): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPT_BY_KIND[kind];
    if (kind === "photo") input.capture = "environment";
    input.multiple = true;
    input.onchange = () => resolve(input.files ? Array.from(input.files) : []);
    input.click();
  });
}

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

  const handleUpload = useCallback(
    (kind: UploadKind) => async () => {
      const files = await pickFiles(kind);
      if (files.length === 0) return;
      uploadEnqueue(...files.map((file) => ({ file, basedir: cwd })));
      setOpen(false);
      onUpload();
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
                setFolderDialogOpen(true);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <CreateFolderDialog
        open={folderDialogOpen}
        setOpen={setFolderDialogOpen}
        cwd={cwd}
        onCreated={onUpload}
      />
    </>
  );
}

export default UploadDrawer;
