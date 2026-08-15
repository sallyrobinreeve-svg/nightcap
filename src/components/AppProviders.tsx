"use client";

import { OfflineBanner } from "./OfflineBanner";
import { NativeAppShell } from "./NativeAppShell";
import { AppBootScreen } from "./AppBootScreen";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBootScreen />
      <NativeAppShell />
      <OfflineBanner />
      {children}
    </>
  );
}
