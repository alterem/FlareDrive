import {
  FileAudio,
  FileCode,
  FileImage,
  FileVideo,
  FileText,
  FileArchive,
  Folder,
  File as FileIcon,
} from "lucide-react";

function MimeIcon({
  contentType,
  className = "h-8 w-8 text-muted-foreground",
}: {
  contentType: string;
  className?: string;
}) {
  if (typeof contentType !== "string")
    return <FileIcon className={className} />;
  if (contentType === "application/x-directory")
    return <Folder className={`${className} text-brand`} />;
  if (contentType.startsWith("image/"))
    return <FileImage className={className} />;
  if (contentType.startsWith("audio/"))
    return <FileAudio className={className} />;
  if (contentType.startsWith("video/"))
    return <FileVideo className={className} />;
  if (contentType === "application/pdf")
    return <FileText className={className} />;
  if (["application/zip", "application/gzip"].includes(contentType))
    return <FileArchive className={className} />;
  if (contentType.startsWith("text/")) return <FileCode className={className} />;
  return <FileIcon className={className} />;
}

export default MimeIcon;
