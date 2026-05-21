# FlareDrive

A lightweight Cloudflare R2 storage manager with a built-in WebDAV endpoint.
Runs on Cloudflare Pages + Functions and the R2 free tier (10 GB storage,
100,000 daily worker invocations).
[More about pricing](https://developers.cloudflare.com/r2/platform/pricing/)

---

## Features

- **File browser** — list, search, drag-and-drop upload, multi-select, rename, copy, move, delete
- **Large-file uploads** — multipart upload from the browser, no per-request size limit
- **Thumbnails** — generated on the client for images, MP4 videos, and PDFs; stored as WebP
- **WebDAV endpoint** — exposed at both `/webdav/*` and the root path (configurable)
- **Folder URLs** — every directory has its own URL; share or bookmark any path
- **Public-read mode** — optional anonymous `GET`/`HEAD`/`PROPFIND` access
- **Cookie session** — direct links and `<a href>` downloads work without re-prompting for credentials
- **Mock mode** — develop the UI offline against an in-memory backend

---

## Quick start

### Prerequisites

- A [Cloudflare](https://dash.cloudflare.com/) account with a payment method on file
- R2 activated and at least one R2 bucket created

### Deploy via the Pages dashboard

1. Fork this repo and connect the fork as a Cloudflare Pages project.
2. Build configuration:
   - **Framework preset**: `Docusaurus` (any preset with `build/` output works)
   - **Build command**: `npm run build`
   - **Build output directory**: `build`
3. Environment variables (see [the table](#environment-variables) below) —
   at minimum set `WEBDAV_USERNAME` and `WEBDAV_PASSWORD`.
4. After the first deployment, bind your R2 bucket to the variable name
   `BUCKET` under *Settings → Functions → R2 bucket bindings*.
5. Trigger a redeploy so the binding takes effect.
6. (Optional) Attach a custom domain.

### Deploy via Wrangler

```bash
pnpm install
pnpm build
npx wrangler pages deploy build
```

Bindings and environment variables can be configured via the dashboard or in
`wrangler.toml`.

---

## Environment variables

| Variable               | Required | Default    | Purpose                                                                                   |
| ---------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `WEBDAV_USERNAME`      | yes      | —          | HTTP Basic username for the WebDAV endpoint and the web UI.                               |
| `WEBDAV_PASSWORD`      | yes      | —          | HTTP Basic password.                                                                      |
| `WEBDAV_PUBLIC_READ`   | no       | `0`        | When set to `1`, anonymous `GET`/`HEAD`/`PROPFIND` are allowed without credentials.       |
| `WEBDAV_PREFIX_ONLY`   | no       | `0`        | When set to `1`, WebDAV only responds under `/webdav/*`. By default it also serves at `/`.|
| `BUCKET` (R2 binding)  | yes      | —          | R2 bucket to expose. You can also bind a bucket under a custom name matching a subdomain. |

### Hostname-based bucket routing

When a request arrives, the dispatcher derives a `driveId` from the leftmost
hostname label (e.g. `archive.example.com` → `archive`). If that label matches
an R2 binding name, the bucket is used; otherwise it falls back to `BUCKET`.
This lets a single deployment serve multiple buckets via subdomains.

---

## Endpoints

### Web UI

Visit your deployment root in a browser. The SPA syncs the current folder to
the URL — opening `https://<your-domain>/photos/2025/` directly takes you into
that directory, and the back/forward buttons work as expected. Refreshing any
deep path also works because the catchall function serves `index.html` for
HTML navigations.

### WebDAV

By default WebDAV is reachable at **two equivalent prefixes**:

- `https://<your-domain>/webdav/` — the conventional path used in older docs
  and by the SPA itself.
- `https://<your-domain>/` — the root path, so tools that take a hostname-only
  endpoint (some Obsidian plugins, browser-extension backup tools, etc.) work
  out of the box.

Set `WEBDAV_PREFIX_ONLY=1` to disable the root-path mode and require the
`/webdav/` prefix.

**Authentication**

- HTTP `Authorization: Basic …` header — used by command-line clients,
  Finder, Cyberduck, rclone, etc.
- `flaredrive_auth` cookie — set by the SPA after login so that
  `window.open`/`<a href>` style navigation works without a re-prompt and
  cross-tab sessions persist for 30 days.

**Supported methods**

| Method     | Notes                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `OPTIONS`  | Advertises `DAV: 1, 2` and the full `Allow` list.                                              |
| `GET`/`HEAD` | Range requests supported; thumbnails get a 1-year `Cache-Control`.                           |
| `PROPFIND` | `Depth: 0` and `Depth: 1`; XML response.                                                       |
| `PROPPATCH`| Accept-but-ignore. Responds 207 with all submitted properties marked OK. Lets clients that set mtime succeed without persisting anything.|
| `MKCOL`    | Idempotent: calling on an existing directory returns 201 (clients like Cherry Studio MKCOL before every PUT). |
| `PUT`      | Standard and multipart (`?uploads`, `?uploadId`, `?partNumber`).                               |
| `POST`     | Multipart create/complete (`?uploads`, `?uploadId`).                                           |
| `COPY`/`MOVE` | Recursive directory copy via `?Depth: infinity`.                                            |
| `DELETE`   | Removes both files and directories.                                                            |
| `LOCK`/`UNLOCK` | Pseudo-implementation. Returns a synthetic token so clients that lock before write proceed. State is not persisted — single-writer scenarios only. |

**Large files**

The WebDAV PUT path streams through Cloudflare Workers and is limited to
128 MB per request. Files larger than that must go through the web UI, which
splits them into multipart uploads.

---

## Project layout

```
functions/
  [[path]].ts            Root catchall — serves SPA for browser navigations,
                         dispatches everything else to WebDAV.
  webdav/
    [[path]].ts          /webdav/* entrypoint.
    dispatch.ts          Shared auth + method dispatch.
    {get,head,put,post,delete,copy,move,
     mkcol,propfind,proppatch,lock}.ts   Per-method handlers.
    utils.ts             R2 bucket helpers, path parsing.
public/
  _routes.json           Excludes static assets from the catchall.
src/                     React SPA (Vite + shadcn/ui + Tailwind v4).
```

---

## Local development

```bash
pnpm install
pnpm dev          # Vite dev server on http://localhost:3000
```

By default the dev server proxies `/webdav` to `http://localhost:8788`. Run
the Cloudflare Pages dev server in another terminal:

```bash
npx wrangler pages dev build --port 8788
```

Or, to iterate on the UI without a backend, copy `.env.development.example`
to `.env.development` and uncomment `VITE_MOCK_AUTH=1` — the SPA will use an
in-memory mock store and any non-empty credentials will sign you in.

### Tailing production logs

To stream live logs from a deployed Pages project (useful for debugging
WebDAV clients):

```bash
npx wrangler pages deployment tail
```

You'll be prompted to pick the project; the latest production deployment is
selected by default. Anything the Functions emit via `console.log` —
including the 4xx/5xx WebDAV diagnostics — appears in the terminal in real
time.

---

## Acknowledgments

The WebDAV protocol implementation is based on
[r2-webdav](https://github.com/abersheeran/r2-webdav) by
[abersheeran](https://github.com/abersheeran).
