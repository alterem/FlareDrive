import pLimit from "p-limit";

import { authFetch, xhrFetch } from "./authFetch";
import { encodeKey } from "./path";
import { WEBDAV_ENDPOINT } from "./webdav";
import { canGenerateThumbnail, blobDigest, generateThumbnail } from "./thumbnail";
import { MOCK_AUTH } from "./mockApi";
import type { TransferTask } from "./transferQueue";

export const SIZE_LIMIT = 100 * 1000 * 1000; // 100MB

type ProgressEvent = { loaded: number; total: number };
type UploadOptions = {
  headers?: Record<string, string>;
  onUploadProgress?: (event: ProgressEvent) => void;
};

async function uploadPartWithRetry(
  uploadUrl: string,
  headers: Record<string, string>,
  chunk: Blob,
  onProgress: (loaded: number) => void,
): Promise<Response> {
  const attempt = () =>
    xhrFetch(uploadUrl, {
      method: "PUT",
      headers,
      body: chunk,
      onUploadProgress: (event) => onProgress(event.loaded),
    });

  const MAX_ATTEMPTS = 3;
  let lastResponse: Response | undefined;
  let lastError: unknown;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      lastResponse = await attempt();
      lastError = undefined;
      if (!lastResponse.headers.get("retry-after")) return lastResponse;
    } catch (e) {
      lastError = e;
    }
  }
  if (lastResponse) return lastResponse;
  throw lastError ?? new Error("Upload failed");
}

async function startMultipartUpload(key: string, headers: Record<string, string>) {
  const res = await authFetch(`${WEBDAV_ENDPOINT}${encodeKey(key)}?uploads`, {
    method: "POST",
    headers,
  });
  const { uploadId } = (await res.json()) as { uploadId: string };
  return uploadId;
}

async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>,
) {
  const params = new URLSearchParams({ uploadId });
  const res = await authFetch(`${WEBDAV_ENDPOINT}${encodeKey(key)}?${params}`, {
    method: "POST",
    body: JSON.stringify({ parts }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

export async function multipartUpload(
  key: string,
  file: File,
  options?: UploadOptions,
) {
  const headers = { ...(options?.headers || {}), "content-type": file.type };
  const uploadId = await startMultipartUpload(key, headers);
  const totalChunks = Math.ceil(file.size / SIZE_LIMIT);

  const limit = pLimit(2);
  const partsLoaded = new Array<number>(totalChunks + 1).fill(0);
  const reportProgress = () =>
    options?.onUploadProgress?.({
      loaded: partsLoaded.reduce((a, b) => a + b, 0),
      total: file.size,
    });

  const promises = Array.from({ length: totalChunks }, (_, i) => i + 1).map(
    (partNumber) =>
      limit(async () => {
        const chunk = file.slice(
          (partNumber - 1) * SIZE_LIMIT,
          partNumber * SIZE_LIMIT,
        );
        const params = new URLSearchParams({
          partNumber: partNumber.toString(),
          uploadId,
        });
        const uploadUrl = `${WEBDAV_ENDPOINT}${encodeKey(key)}?${params}`;
        if (partNumber === limit.concurrency)
          await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = await uploadPartWithRetry(
          uploadUrl,
          headers,
          chunk,
          (loaded) => {
            partsLoaded[partNumber] = loaded;
            reportProgress();
          },
        );
        return { partNumber, etag: response.headers.get("etag")! };
      }),
  );

  const parts = await Promise.all(promises);
  return completeMultipartUpload(key, uploadId, parts);
}

async function uploadThumbnailIfApplicable(file: File): Promise<string | null> {
  if (!canGenerateThumbnail(file)) return null;
  try {
    const thumbnailBlob = await generateThumbnail(file);
    const digestHex = await blobDigest(thumbnailBlob);
    try {
      await authFetch(`/webdav/_$flaredrive$/thumbnails/${digestHex}.png`, {
        method: "PUT",
        body: thumbnailBlob,
      });
      return digestHex;
    } catch {
      console.log(`Upload ${digestHex}.png failed`);
      return null;
    }
  } catch {
    console.log(`Generate thumbnail failed`);
    return null;
  }
}

async function mockUploadProgress(
  size: number,
  onTaskProgress?: (event: ProgressEvent) => void,
) {
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, 80));
    onTaskProgress?.({ loaded: (size * i) / steps, total: size });
  }
  return new Response(null, { status: 200 });
}

export async function processTransferTask({
  task,
  onTaskProgress,
}: {
  task: TransferTask;
  onTaskProgress?: (event: ProgressEvent) => void;
}) {
  const { remoteKey, file } = task;
  if (task.type !== "upload" || !file) throw new Error("Invalid task");

  if (MOCK_AUTH) return mockUploadProgress(file.size, onTaskProgress);

  const thumbnailDigest = await uploadThumbnailIfApplicable(file);
  const headers: Record<string, string> = {};
  if (thumbnailDigest) headers["fd-thumbnail"] = thumbnailDigest;

  if (file.size >= SIZE_LIMIT) {
    return multipartUpload(remoteKey, file, {
      headers,
      onUploadProgress: onTaskProgress,
    });
  }
  return xhrFetch(`${WEBDAV_ENDPOINT}${encodeKey(remoteKey)}`, {
    method: "PUT",
    headers,
    body: file,
    onUploadProgress: onTaskProgress,
  });
}
