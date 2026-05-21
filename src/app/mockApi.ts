import type { FileItem } from "./types";

export const MOCK_AUTH =
  import.meta.env.VITE_MOCK_AUTH === "1" ||
  import.meta.env.VITE_MOCK_AUTH === "true";

const now = Date.now();
function daysAgo(n: number) {
  return new Date(now - n * 24 * 3600 * 1000).toISOString();
}

const mockTree: Record<string, FileItem[]> = {
  "": [
    {
      key: "Documents",
      size: 0,
      uploaded: daysAgo(2),
      httpMetadata: { contentType: "application/x-directory" },
    },
    {
      key: "Photos",
      size: 0,
      uploaded: daysAgo(7),
      httpMetadata: { contentType: "application/x-directory" },
    },
    {
      key: "Videos",
      size: 0,
      uploaded: daysAgo(10),
      httpMetadata: { contentType: "application/x-directory" },
    },
    {
      key: "release-notes.pdf",
      size: 2_345_678,
      uploaded: daysAgo(1),
      httpMetadata: { contentType: "application/pdf" },
    },
    {
      key: "song.mp3",
      size: 5_120_000,
      uploaded: daysAgo(3),
      httpMetadata: { contentType: "audio/mpeg" },
    },
    {
      key: "archive.zip",
      size: 18_900_000,
      uploaded: daysAgo(5),
      httpMetadata: { contentType: "application/zip" },
    },
    {
      key: "README.md",
      size: 1_234,
      uploaded: daysAgo(0),
      httpMetadata: { contentType: "text/markdown" },
    },
  ],
  "Documents/": [
    {
      key: "Documents/proposal.pdf",
      size: 980_000,
      uploaded: daysAgo(4),
      httpMetadata: { contentType: "application/pdf" },
    },
    {
      key: "Documents/notes.txt",
      size: 4_500,
      uploaded: daysAgo(6),
      httpMetadata: { contentType: "text/plain" },
    },
  ],
  "Photos/": [
    {
      key: "Photos/sunrise.jpg",
      size: 3_400_000,
      uploaded: daysAgo(8),
      httpMetadata: { contentType: "image/jpeg" },
    },
    {
      key: "Photos/cat.png",
      size: 1_200_000,
      uploaded: daysAgo(9),
      httpMetadata: { contentType: "image/png" },
    },
  ],
  "Videos/": [
    {
      key: "Videos/clip.mp4",
      size: 45_000_000,
      uploaded: daysAgo(11),
      httpMetadata: { contentType: "video/mp4" },
    },
  ],
};

export async function mockFetchPath(path: string): Promise<FileItem[]> {
  await new Promise((r) => setTimeout(r, 200));
  return mockTree[path] ?? [];
}
