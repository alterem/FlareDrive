const STORAGE_KEY = "flaredrive.auth";
const COOKIE_NAME = "flaredrive_auth";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

let inMemoryToken: string | null = null;

export type AuthCredentials = {
  username: string;
  password: string;
};

function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(token)}; ` +
    `Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function loadStoredAuth(): string | null {
  if (inMemoryToken) {
    setAuthCookie(inMemoryToken);
    return inMemoryToken;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      inMemoryToken = raw;
      setAuthCookie(raw);
      return raw;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

export function saveAuth({ username, password }: AuthCredentials) {
  const token = `Basic ${btoa(`${username}:${password}`)}`;
  inMemoryToken = token;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
  setAuthCookie(token);
  return token;
}

export function clearAuth() {
  inMemoryToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  clearAuthCookie();
}

export function authHeader(): Record<string, string> {
  const token = loadStoredAuth();
  return token ? { Authorization: token } : {};
}

export async function verifyCredentials(
  credentials: AuthCredentials,
): Promise<boolean> {
  if (
    import.meta.env.VITE_MOCK_AUTH === "1" ||
    import.meta.env.VITE_MOCK_AUTH === "true"
  ) {
    return Boolean(credentials.username && credentials.password);
  }
  const token = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  const res = await fetch("/webdav/", {
    method: "PROPFIND",
    headers: { Depth: "0", Authorization: token },
  });
  return res.ok;
}
