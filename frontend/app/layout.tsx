import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Kisan Setu Agri-OS",
  description: "Multilingual Agentic OS for farmers"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

