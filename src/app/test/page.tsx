import { Suspense } from "react";
import { TestHub } from "@/components/test-hub";
export default function Page() {
  return (
    <Suspense fallback={<div className="rp-section">Načítavam…</div>}>
      <TestHub />
    </Suspense>
  );
}
