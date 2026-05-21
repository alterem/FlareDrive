import { dispatchWebdav, WebdavEnv } from "./dispatch";

export const onRequest: PagesFunction<WebdavEnv> = async (context) => {
  const segments = (context.params.path || []) as string[];
  const path = decodeURIComponent(segments.join("/"));
  return dispatchWebdav(context.request, context.env, path);
};
