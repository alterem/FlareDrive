import { RequestHandlerParams } from "./utils";

const FAKE_LOCK_TIMEOUT = "Second-3600";

function makeLockToken() {
  const rand = crypto.randomUUID();
  return `opaquelocktoken:${rand}`;
}

function lockDiscoveryXml(href: string, token: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<D:prop xmlns:D="DAV:">
  <D:lockdiscovery>
    <D:activelock>
      <D:locktype><D:write/></D:locktype>
      <D:lockscope><D:exclusive/></D:lockscope>
      <D:depth>infinity</D:depth>
      <D:owner/>
      <D:timeout>${FAKE_LOCK_TIMEOUT}</D:timeout>
      <D:locktoken><D:href>${token}</D:href></D:locktoken>
      <D:lockroot><D:href>${href}</D:href></D:lockroot>
    </D:activelock>
  </D:lockdiscovery>
</D:prop>`;
}

export async function handleRequestLock({
  request,
}: RequestHandlerParams) {
  const url = new URL(request.url);
  const token = makeLockToken();
  const body = lockDiscoveryXml(url.pathname, token);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Lock-Token": `<${token}>`,
    },
  });
}

export async function handleRequestUnlock() {
  return new Response(null, { status: 204 });
}
