import { forwardRef } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
