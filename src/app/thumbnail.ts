const THUMBNAIL_SIZE = 144;

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
) {
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.max(
    THUMBNAIL_SIZE / sourceWidth,
    THUMBNAIL_SIZE / sourceHeight,
  );
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const dx = (THUMBNAIL_SIZE - drawWidth) / 2;
  const dy = (THUMBNAIL_SIZE - drawHeight) / 2;
  ctx.drawImage(source, dx, dy, drawWidth, drawHeight);
}

async function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = URL.createObjectURL(file);
  });
}

async function loadVideoFirstFrame(file: File) {
  return new Promise<HTMLVideoElement>(async (resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.src = URL.createObjectURL(file);
    setTimeout(() => reject(new Error("Video load timeout")), 2000);
    await video.play();
    video.pause();
    video.currentTime = 0;
    resolve(video);
  });
}

async function renderPdfFirstPage(
  file: File,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const [pdfjsLib, workerUrlModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrlModule.default;
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  const page = await pdf.getPage(1);
  const { width, height } = page.getViewport({ scale: 1 });
  const scale = THUMBNAIL_SIZE / Math.max(width, height);
  const viewport = page.getViewport({ scale });
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
}

export async function generateThumbnail(file: File) {
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const ctx = canvas.getContext("2d")!;

  if (file.type.startsWith("image/")) {
    const image = await loadImage(file);
    drawCover(ctx, image, image.naturalWidth, image.naturalHeight);
  } else if (file.type === "video/mp4") {
    const video = await loadVideoFirstFrame(file);
    drawCover(ctx, video, video.videoWidth, video.videoHeight);
  } else if (file.type === "application/pdf") {
    await renderPdfFirstPage(file, canvas, ctx);
  }

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.85),
  );
}

export async function blobDigest(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-1", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function canGenerateThumbnail(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    file.type === "video/mp4" ||
    file.type === "application/pdf"
  );
}
