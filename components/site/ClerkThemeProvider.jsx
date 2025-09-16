"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark, light } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function ClerkThemeProvider({ children }) {
  // resolvedTheme = "light" | "dark" | undefined (until hydrated)
  const { resolvedTheme } = useTheme();
  const baseTheme = resolvedTheme === "dark" ? dark : light;

  return (
    <ClerkProvider
      appearance={{
        baseTheme,
        variables: {
          // Optional brand color; keep or remove
          colorPrimary: "hsl(222.2 47.4% 11.2%)",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
