import { RequestHandlerParams } from "./utils";

function extractPropElements(xml: string): string[] {
  const props: string[] = [];
  const setRe = /<D?:?set\b[^>]*>([\s\S]*?)<\/D?:?set>/gi;
  const removeRe = /<D?:?remove\b[^>]*>([\s\S]*?)<\/D?:?remove>/gi;
  const propRe = /<D?:?prop\b[^>]*>([\s\S]*?)<\/D?:?prop>/gi;
  const childRe = /<([a-zA-Z_][\w:.-]*)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1>)/g;

  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = setRe.exec(xml))) blocks.push(m[1]);
  while ((m = removeRe.exec(xml))) blocks.push(m[1]);

  for (const block of blocks) {
    let p: RegExpExecArray | null;
    while ((p = propRe.exec(block))) {
      const inner = p[1];
      let c: RegExpExecArray | null;
      while ((c = childRe.exec(inner))) {
        props.push(c[0]);
      }
    }
  }
  return props;
}

export async function handleRequestProppatch({
  request,
}: RequestHandlerParams) {
  const url = new URL(request.url);
  let propsXml = "";
  try {
    const body = await request.text();
    const props = extractPropElements(body);
    propsXml = props.join("\n        ");
  } catch {
    // best-effort; treat empty body as no-op
  }

  const responseBody = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${url.pathname}</D:href>
    <D:propstat>
      <D:prop>
        ${propsXml}
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;

  return new Response(responseBody, {
    status: 207,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
