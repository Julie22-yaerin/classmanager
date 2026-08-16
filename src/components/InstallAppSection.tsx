"use client";

import { useEffect, useState } from "react";

export default function InstallAppSection() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    (async () => {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    })();
  }, []);

  if (isStandalone) return null;

  return (
    <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-medium">Install app</h2>
      {isIOS ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Tap the Share button <span aria-hidden>⎋</span> in Safari, then <strong>Add to Home Screen</strong> <span aria-hidden>➕</span>.
        </p>
      ) : (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          On Chrome/Edge, use the install icon in the address bar (or the browser menu → <strong>Install app</strong>) to add Lyceum to your home
          screen or desktop.
        </p>
      )}
    </section>
  );
}
