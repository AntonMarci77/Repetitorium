import { Suspense } from "react";
import { Kviz } from "@/components/kviz";

export default function Page() {
  return (
    <Suspense fallback={<div className="rp-section">Načítavam…</div>}>
      <Kviz />
    </Suspense>
  );
}
