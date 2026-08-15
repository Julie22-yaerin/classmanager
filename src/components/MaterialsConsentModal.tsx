"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LaurelAvatar from "@/components/LaurelAvatar";

const SESSION_KEY = "cm_materials_consent_seen";

export default function MaterialsConsentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      if (!window.sessionStorage.getItem(SESSION_KEY)) setOpen(true);
    })();
  }, []);

  function dismiss() {
    window.sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <LaurelAvatar size={24} />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Before you send anything</h2>
        </div>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li>🎙️ Audio you attach is transcribed by AI to build class notes.</li>
          <li>📎 Files you upload (images, PDFs) are read by AI (OCR) and stored under the class you tag them to.</li>
          <li>🏷️ Always pick the right tag — it&apos;s how this gets filed correctly and never mixed into the wrong class.</li>
        </ul>
        <p className="mt-3 text-xs text-zinc-400">
          You can turn off audio uploads or export/delete everything anytime in{" "}
          <Link href="/settings" className="underline">
            Settings → Privacy &amp; Data
          </Link>
          .
        </p>
        <button
          onClick={dismiss}
          className="mt-4 w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Got it, continue
        </button>
      </div>
    </div>
  );
}
