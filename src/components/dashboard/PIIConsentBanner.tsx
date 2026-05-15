'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, X } from 'lucide-react';

const STORAGE_KEY = 'datasense:pii-consent-ack-v1';

/**
 * One-time banner reminding the user that uploaded data is sent to Google Gemini
 * for AI analysis. Auto-shows on first visit; dismiss is persistent via localStorage.
 *
 * Bypass the banner with NEXT_PUBLIC_DATASENSE_DISABLE_PII_BANNER=true at build time
 * if you don't want it (e.g. internal deployment with documented data handling).
 */
export function PIIConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DATASENSE_DISABLE_PII_BANNER === 'true') return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch { /* localStorage blocked — show the banner anyway */ }
    setShow(true);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* fine */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/[0.07] backdrop-blur-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground/95 mb-1">Your data leaves your machine</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            DataSense sends a sample of your dataset (first 50–100 rows, column metadata) to Google&apos;s Gemini API for AI analysis.
            Don&apos;t upload data you can&apos;t share with a third party. Review Google&apos;s
            {' '}
            <a
              className="text-primary underline decoration-primary/40 hover:decoration-primary"
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gemini API terms
            </a>.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" className="rounded-xl h-7 text-xs" onClick={dismiss}>
              I understand
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
          onClick={dismiss}
          aria-label="Dismiss data-handling notice"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
