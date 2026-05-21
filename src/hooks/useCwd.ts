import { useCallback, useEffect, useState } from "react";

function cwdToPath(cwd: string): string {
  if (!cwd) return "/";
  return "/" + cwd.split("/").map(encodeURIComponent).join("/");
}

function pathToCwd(pathname: string): string {
  if (!pathname || pathname === "/") return "";
  const trimmed = pathname.replace(/^\/+/, "");
  const withSlash = trimmed.endsWith("/") ? trimmed : trimmed + "/";
  try {
    return decodeURIComponent(withSlash);
  } catch {
    return withSlash;
  }
}

export function useCwd(): [string, (next: string) => void] {
  const [cwd, setCwdState] = useState(() =>
    pathToCwd(window.location.pathname),
  );

  const setCwd = useCallback((next: string) => {
    setCwdState(next);
    const newPath = cwdToPath(next);
    if (newPath !== window.location.pathname) {
      window.history.pushState(null, "", newPath + window.location.search);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCwdState(pathToCwd(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [cwd, setCwd];
}
