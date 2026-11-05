import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
export function useAuth() {
  return useSyncExternalStore(api.subscribe, api.getSnapshot);
}
