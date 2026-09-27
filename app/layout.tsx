import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import RoleSwitcher from "@/components/RoleSwitcher";

export const metadata: Metadata = {
  title: "Refill Engine — every stuck refill has a state, a reason, and an owner",
  description: "Coordination layer for prescription refills requiring provider intervention.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="brand">
            <Link href="/" style={{ color: "#fff" }}>Refill<span>Engine</span></Link>
          </div>
          <nav>
            <Link href="/dashboard">Work queue</Link>
            <RoleSwitcher />
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
