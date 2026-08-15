import { isPublicSupabaseConfigured } from "@/lib/env-public";
import { ConfigError } from "./ConfigError";

export function EnvGate({ children }: { children: React.ReactNode }) {
  if (!isPublicSupabaseConfigured()) {
    return <ConfigError />;
  }
  return <>{children}</>;
}
