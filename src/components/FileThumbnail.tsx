import MimeIcon from "@/MimeIcon";
import type { FileItem } from "@/app/types";

export function FileThumbnail({
  file,
  size = "sm",
}: {
  file: FileItem;
  size?: "sm" | "lg";
}) {
  const className =
    size === "lg" ? "h-14 w-14 rounded-md object-cover" : "h-9 w-9 rounded object-cover";

  if (file.customMetadata?.thumbnail) {
    return (
      <img
        src={`/webdav/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png`}
        alt={file.key}
        className={className}
      />
    );
  }
  return (
    <MimeIcon
      contentType={file.httpMetadata.contentType}
      className={size === "lg" ? "h-12 w-12 text-muted-foreground" : undefined}
    />
  );
}
