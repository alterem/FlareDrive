import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFolder } from "@/app/transfer";

export function CreateFolderDialog({
  open,
  setOpen,
  cwd,
  onCreated,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  cwd: string;
  onCreated: () => void;
}) {
  const [folderName, setFolderName] = useState("");

  const submit = async () => {
    const name = folderName.trim();
    if (!name) return;
    await createFolder(cwd, name);
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setFolderName("");
      }}
    >
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
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="New folder"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!folderName.trim()} onClick={submit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
