import { Suspense } from "react";
import HasilQuiz from "@/components/HasilQuiz";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF6EA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B387E] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HasilQuiz />
    </Suspense>
  );
}
