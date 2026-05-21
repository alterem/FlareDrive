import { ChevronRight, Home } from "lucide-react";

export function PathBreadcrumb({
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
