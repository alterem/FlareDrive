import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { basename } from "@/app/path";

export function ConfirmDeleteDialog({
  keys,
  onCancel,
  onConfirm,
}: {
  keys: string[] | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog open={keys !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete permanently?</DialogTitle>
          <DialogDescription>
            The following item(s) will be removed and cannot be restored.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-40 overflow-y-auto rounded-md bg-muted/40 p-2 text-sm">
          {keys?.map((key) => (
            <li key={key} className="truncate">
              {basename(key)}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm()}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
