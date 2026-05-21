import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TransferTask, useTransferQueue } from "./app/transferQueue";
import { humanReadableSize } from "./app/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

function ProgressDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"download" | "upload">("upload");
  const transferQueue: TransferTask[] = useTransferQueue();

  const tasks = useMemo(
    () => transferQueue.filter((task) => task.type === tab),
    [tab, transferQueue],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Progress</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "download" | "upload")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Uploads</TabsTrigger>
            <TabsTrigger value="download">Downloads</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4 max-h-[60vh] overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No tasks
              </p>
            ) : (
              <TooltipProvider delayDuration={150}>
                <ul className="divide-y rounded-md border">
                  {tasks.map((task) => (
                    <li
                      key={task.remoteKey}
                      className="flex items-start gap-3 p-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{task.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {humanReadableSize(task.loaded)} /{" "}
                          {humanReadableSize(task.total)}
                        </div>
                        {task.status === "in-progress" && (
                          <Progress
                            className="mt-2 h-1.5"
                            value={(task.loaded / Math.max(1, task.total)) * 100}
                          />
                        )}
                      </div>
                      <div className="pt-0.5">
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : task.status === "failed" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {task.error?.message ?? "Failed"}
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </TooltipProvider>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default ProgressDialog;
