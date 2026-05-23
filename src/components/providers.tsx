"use client";
import { FormspreeProvider } from "@formspree/react";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const project = process.env.NEXT_PUBLIC_FORMSPREE_PROJECT ?? "";
  return (
    <ThemeProvider>
      <FormspreeProvider project={project}>
        {children}
      </FormspreeProvider>
    </ThemeProvider>
  );
}
