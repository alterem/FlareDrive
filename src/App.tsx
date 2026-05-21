import { useCallback, useEffect, useState } from "react";
import Header from "./Header";
import FileBrowser from "./FileBrowser";
import ProgressDialog from "./ProgressDialog";
import LoginDialog from "./LoginDialog";
import { TransferQueueProvider } from "./app/transferQueue";
import { Toaster, toast } from "@/components/ui/toaster";
import {
  clearAuth,
  loadStoredAuth,
  verifyCredentials,
  type AuthCredentials,
} from "@/lib/auth";
import { UnauthorizedError } from "./app/transfer";
import type { ViewMode } from "./app/types";
import { DEFAULT_SORT, type SortState } from "./app/sort";

const VIEW_MODE_KEY = "flaredrive.viewMode";
const SORT_KEY = "flaredrive.sort";

function readStoredViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    if (v === "grid" || v === "list") return v;
  } catch {
    // ignore
  }
  return "list";
}

function readStoredSort(): SortState {
  try {
    const raw = localStorage.getItem(SORT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        (parsed.key === "name" ||
          parsed.key === "size" ||
          parsed.key === "modified") &&
        (parsed.direction === "asc" || parsed.direction === "desc")
      ) {
        return parsed as SortState;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SORT;
}

function App() {
  const [search, setSearch] = useState("");
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [sort, setSort] = useState<SortState>(readStoredSort);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const handleSortChange = useCallback((next: SortState) => {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (!stored) {
      setAuthenticated(false);
      return;
    }
    fetch("/webdav/", {
      method: "PROPFIND",
      headers: { Depth: "0", Authorization: stored },
    })
      .then((res) => {
        if (res.ok) {
          try {
            const decoded = atob(stored.replace(/^Basic\s+/i, ""));
            setUsername(decoded.split(":")[0] || null);
          } catch {
            // ignore
          }
          setAuthenticated(true);
        } else {
          clearAuth();
          setAuthenticated(false);
          setLoginMessage("Session expired. Please sign in again.");
        }
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const handleError = useCallback((error: Error) => {
    if (error instanceof UnauthorizedError) {
      clearAuth();
      setAuthenticated(false);
      setLoginMessage("Session expired. Please sign in again.");
      return;
    }
    toast.error(error.message || "Something went wrong");
  }, []);

  const handleAuthenticated = useCallback((creds: AuthCredentials) => {
    setUsername(creds.username);
    setAuthenticated(true);
    setLoginMessage(undefined);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setUsername(null);
    setAuthenticated(false);
    setLoginMessage("Signed out.");
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      <TransferQueueProvider onError={handleError}>
        {authenticated && (
          <>
            <Header
              search={search}
              onSearchChange={(newSearch: string) => setSearch(newSearch)}
              onShowProgress={() => setShowProgressDialog(true)}
              onLogout={handleLogout}
              username={username}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              sort={sort}
              onSortChange={handleSortChange}
            />
            <FileBrowser
              search={search}
              viewMode={viewMode}
              sort={sort}
              onError={handleError}
            />
          </>
        )}
        <ProgressDialog
          open={showProgressDialog}
          onClose={() => setShowProgressDialog(false)}
        />
      </TransferQueueProvider>
      <LoginDialog
        open={authenticated === false}
        onAuthenticated={async (creds) => {
          await verifyCredentials(creds);
          handleAuthenticated(creds);
        }}
        message={loginMessage}
      />
      <Toaster />
    </div>
  );
}

export default App;
