const STORAGE_KEY = "flaredrive.auth";

let inMemoryToken: string | null = null;

export type AuthCredentials = {
  username: string;
  password: string;
};

export function loadStoredAuth(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      inMemoryToken = raw;
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
  return token;
}

export function clearAuth() {
  inMemoryToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
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
