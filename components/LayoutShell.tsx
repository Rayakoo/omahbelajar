"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = pathname === "/omah-cerita/buat-cerita" || pathname === "/omah-cerita/semua-cerita" || pathname.startsWith("/omah-belajar/") || pathname === "/tanya-nalar/detail-laporan" || pathname === "/tanya-nalar/sukses" || pathname === "/login" || pathname === "/register" || pathname.startsWith("/admin") || pathname === "/minigames/mitos-atau-fakta" || pathname === "/minigames/tts" || pathname === "/minigames/puzzle";

  if (hide) return <>{children}</>;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
