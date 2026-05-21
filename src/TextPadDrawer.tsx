import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUploadEnqueue } from "./app/transferQueue";

interface TextPadDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  cwd: string;
  onUpload: () => void;
}

function TextPadDrawer({
  open,
  setOpen,
  cwd,
  onUpload,
}: TextPadDrawerProps) {
  const [noteText, setNoteText] = useState("");
  const [noteName, setNoteName] = useState("note.txt");
  const uploadEnqueue = useUploadEnqueue();

  const handleSaveNote = () => {
    const fileBlob = new Blob([noteText], { type: "text/plain" });
    const file = new File([fileBlob], noteName, { type: "text/plain" });
    uploadEnqueue({ file, basedir: cwd });
    onUpload();
    setOpen(false);
    setNoteText("");
    setNoteName("note.txt");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>TextPad</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2">
          <Label htmlFor="note-name">File name</Label>
          <Input
            id="note-name"
            value={noteName}
            onChange={(e) => setNoteName(e.target.value)}
          />
        </div>
        <div className="grid flex-1 gap-2">
          <Label htmlFor="note-text">Note</Label>
          <Textarea
            id="note-text"
            placeholder="Write your note…"
            className="flex-1 resize-none"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        </div>
        <Button
          onClick={handleSaveNote}
          disabled={!noteText.trim() || !noteName.trim()}
        >
          Save &amp; upload
        </Button>
      </SheetContent>
    </Sheet>
  );
}

export default TextPadDrawer;
