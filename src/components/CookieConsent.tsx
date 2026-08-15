"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

const CONSENT_KEY = "cm_analytics_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function CookieConsent() {
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored === "accepted" || stored === "declined") setConsent(stored);
      setReady(true);
    })();
  }, []);

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {consent === "accepted" && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });`}
          </Script>
        </>
      )}

      {ready && consent === null && GA_ID && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 bg-white px-4 py-3 text-sm shadow-lg sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-300">
            We use analytics cookies to understand how the app is used.{" "}
            <Link href="/privacy" className="underline">
              Privacy policy
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => choose("declined")}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Decline
            </button>
            <button
              onClick={() => choose("accepted")}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}
