"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Capacitor: splash/status bar, deep links, iOS back navigation.
 */
export function NativeAppShell() {
  const router = useRouter();

  useEffect(() => {
    let removeOpen: (() => void) | undefined;
    let removeBack: (() => void) | undefined;

    void (async () => {
      try {
        const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
          .Capacitor;
        if (!cap?.isNativePlatform?.()) return;

        document.documentElement.classList.add("native-app");

        const hideSplash = async () => {
          try {
            const { SplashScreen } = await import(/* webpackIgnore: true */ "@capacitor/splash-screen");
            await SplashScreen.hide();
          } catch {
            // optional on web
          }
        };

        try {
          const { StatusBar, Style } = await import(/* webpackIgnore: true */ "@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#1e1b24" });
        } catch {
          // optional on web
        }

        if (document.readyState === "complete") {
          void hideSplash();
        } else {
          window.addEventListener("load", () => void hideSplash(), { once: true });
        }

        const { App } = await import(/* webpackIgnore: true */ "@capacitor/app");

        const openHandle = await App.addListener("appUrlOpen", ({ url }: { url: string }) => {
          try {
            const parsed = new URL(url);
            const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
            if (path && path !== "/") {
              if (path.startsWith("/auth/callback")) {
                router.replace(path);
              } else {
                router.push(path);
              }
            }
          } catch {
            // ignore malformed URLs
          }
        });
        removeOpen = () => openHandle.remove();

        const backHandle = await App.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.exitApp();
          }
        });
        removeBack = () => backHandle.remove();
      } catch {
        // @capacitor/* not available in browser
      }
    })();

    return () => {
      removeOpen?.();
      removeBack?.();
    };
  }, [router]);

  return null;
}
