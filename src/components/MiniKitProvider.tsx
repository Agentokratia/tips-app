"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface MiniKitContextValue {
  isInMiniApp: boolean;
  isReady: boolean;
  user: MiniAppUser | null;
}

interface MiniAppUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

const MiniKitContext = createContext<MiniKitContextValue>({
  isInMiniApp: false,
  isReady: false,
  user: null,
});

export function useMiniKit() {
  return useContext(MiniKitContext);
}

interface MiniKitProviderProps {
  children: ReactNode;
}

/**
 * MiniKit Provider
 *
 * Detects if the app is running inside Base App / Farcaster frame
 * and provides context about the mini app environment.
 */
export function MiniKitProvider({ children }: MiniKitProviderProps) {
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<MiniAppUser | null>(null);

  useEffect(() => {
    // Check if we're inside a frame/mini app context
    const checkMiniAppContext = async () => {
      try {
        // Check for frame context via window.parent
        const isInFrame = window !== window.parent;

        // Check for Farcaster frame SDK
        const hasFarcasterSDK = typeof window !== "undefined" && "farcaster" in window;

        // Check for Base App context (via URL params or postMessage)
        const urlParams = new URLSearchParams(window.location.search);
        const hasFrameContext = urlParams.has("fid") || urlParams.has("frame");

        setIsInMiniApp(isInFrame || hasFarcasterSDK || hasFrameContext);

        // If we have frame context, try to get user info
        if (hasFrameContext && urlParams.has("fid")) {
          const fid = parseInt(urlParams.get("fid") || "0");
          if (fid > 0) {
            setUser({ fid });
          }
        }

        setIsReady(true);
      } catch {
        setIsReady(true);
      }
    };

    checkMiniAppContext();

    // Listen for frame messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "frame_context") {
        setUser(event.data.user);
        setIsInMiniApp(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <MiniKitContext.Provider value={{ isInMiniApp, isReady, user }}>
      {children}
    </MiniKitContext.Provider>
  );
}
