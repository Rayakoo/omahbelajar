import AuthGuard from "@/components/AuthGuard";

export default function OmahBelajarLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
