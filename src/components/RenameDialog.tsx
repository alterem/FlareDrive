import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RenameDialog({
  open,
  value,
  onValueChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  value: string;
  onValueChange: (next: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="rename">New name</Label>
          <Input
            id="rename"
            autoFocus
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit()}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
