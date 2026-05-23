"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { loadChangelog } from "@/lib/loaders";

export function LogOprav() {
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChangelog().then((t) => { setMd(t); setLoading(false); });
  }, []);

  return (
    <article className="rp-section rp-prose max-w-3xl mx-auto">
      {loading ? <p>Načítavam…</p> : <ReactMarkdown>{md || "Zatiaľ žiadne záznamy."}</ReactMarkdown>}
    </article>
  );
}
