import { Suspense } from "react";
import { OpravyForm } from "@/components/opravy-form";
export default function Page() {
  return (
    <Suspense fallback={<div className="rp-section">Načítavam…</div>}>
      <OpravyForm />
    </Suspense>
  );
}
