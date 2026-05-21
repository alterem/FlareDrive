import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { saveAuth, verifyCredentials, type AuthCredentials } from "@/lib/auth";
import { MOCK_AUTH } from "./app/mockApi";

interface Props {
  open: boolean;
  onAuthenticated: (creds: AuthCredentials) => void;
  message?: string;
}

function LoginDialog({ open, onAuthenticated, message }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError(null);
    try {
      const ok = await verifyCredentials({ username, password });
      if (!ok) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }
      saveAuth({ username, password });
      onAuthenticated({ username, password });
    } catch (err) {
      setError((err as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        hideClose
        className="sm:max-w-sm"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-brand text-white">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Sign in to Flare Drive</DialogTitle>
          <DialogDescription className="text-center">
            {message ??
              (MOCK_AUTH
                ? "Demo mode — any username & password will work."
                : "Enter your WebDAV credentials to continue.")}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={submit}>
          <div className="grid gap-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-8"
                required
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-8"
                required
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter className="mt-2">
            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
