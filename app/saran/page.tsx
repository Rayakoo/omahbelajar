import type { Metadata } from "next";
import SaranSection from "@/components/SaranSection";

export const metadata: Metadata = {
  title: "Saran",
  description:
    "Sampaikan saran, masukan, kritik, atau ide untuk Omah Belajar. Saran dapat dikirim secara anonim.",
};

export default function SaranPage() {
  return <SaranSection />;
}
