import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { StoreProvider } from "@/lib/store";
import { AuthGate } from "@/components/AuthGate";
import { StoreStatusBanner } from "@/components/StoreStatusBanner";

export const metadata: Metadata = {
  title: "ContentOS – SQT Content-Dashboard",
  description: "Internes Content-Dashboard für Instagram-Research, Content-Erstellung und Wochenplanung.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full bg-ivory text-charcoal">
        <AuthGate>
          <StoreProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 min-w-0">
                <MobileNav />
                <main className="px-5 py-8 md:px-10 md:py-10 max-w-6xl mx-auto">
                  <StoreStatusBanner />
                  {children}
                </main>
              </div>
            </div>
          </StoreProvider>
        </AuthGate>
      </body>
    </html>
  );
}
