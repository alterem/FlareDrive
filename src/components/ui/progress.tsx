import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indeterminate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indeterminate, ...props }, ref) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className,
        )}
        {...props}
      >
        {indeterminate ? (
          <div className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-primary" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
