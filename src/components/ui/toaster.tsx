import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className:
          "rounded-md border border-border bg-popover text-popover-foreground shadow",
      }}
    />
  );
}

export { toast } from "sonner";
