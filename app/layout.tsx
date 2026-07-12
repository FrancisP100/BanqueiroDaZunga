import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { PresenceAutomation } from "@/components/PresenceAutomation";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Bankeiros da Zunga - BCI",
  description: "MVP modular para gestão de banqueiros, contas, presença GPS e mercados."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen font-sans antialiased">
        <PresenceAutomation />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 3000 }}
        />
      </body>
    </html>
  );
}
