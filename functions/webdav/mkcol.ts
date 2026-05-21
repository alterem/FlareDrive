import { RequestHandlerParams, ROOT_OBJECT } from "./utils";

export async function handleRequestMkcol({
  bucket,
  path,
  request,
}: RequestHandlerParams) {
  const resource = await bucket.head(path);
  if (resource !== null) {
    // Idempotent: treat MKCOL on an existing directory as a no-op success so
    // clients (cherry-studio, rclone, etc.) that always MKCOL before writing
    // don't choke. A real conflict — existing non-directory — still 405s.
    if (resource.httpMetadata?.contentType === "application/x-directory") {
      return new Response(null, { status: 201 });
    }
    console.log(`[webdav]   reason: MKCOL target exists as a file at "${path}"`);
    return new Response("Method Not Allowed", { status: 405 });
  }

  const parentPath = path.replace(/(\/|^)[^/]*$/, "");
  const parentDir =
    parentPath === "" ? ROOT_OBJECT : await bucket.head(parentPath);
  if (parentDir === null) return new Response("Conflict", { status: 409 });

  await bucket.put(path, "", {
    httpMetadata: { contentType: "application/x-directory" },
  });

  return new Response("Created", { status: 201 });
}
