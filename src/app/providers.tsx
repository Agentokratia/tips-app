"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi";
import { MiniKitProvider, useMiniKit } from "@/components/MiniKitProvider";
import { useState, useEffect, createContext, useContext, type ReactNode } from "react";

export { useMiniKit };

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MiniKitProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={theme === "dark" ? darkTheme({
                accentColor: "#FAFAF8",
                accentColorForeground: "#1A1A1A",
                borderRadius: "medium",
              }) : lightTheme({
                accentColor: "#1A1A1A",
                accentColorForeground: "#FAFAF8",
                borderRadius: "medium",
              })}
            >
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </MiniKitProvider>
    </ThemeContext.Provider>
  );
}
