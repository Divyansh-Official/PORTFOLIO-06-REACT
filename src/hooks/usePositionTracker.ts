import { useEffect } from 'react';

// ── types ───────────────────────────────────────────
declare global {
  interface Window {
    StringTune: {
      StringTune: {
        getInstance(): StringTuneInstance;
      };
      StringLazy: unknown;
      StringPositionTracker: unknown;
    };
    StringTuneContext: StringTuneInstance;
  }
}

interface StringTuneInstance {
  use(plugin: unknown): void;
  start(delay: number): void;
  PositionTrackerVisible: boolean;
}

// ── hook ───────────────────────────────────────────
export function useStringTunePositionTracker() {
  useEffect(() => {
    const SCRIPT_SRC =
      'https://unpkg.com/@fiddle-digital/string-tune@1.1.55/dist/index.js';

    function initTracker() {
      const ST = window.StringTune;
      if (!ST) return;

      const stringTune = ST.StringTune.getInstance();
      window.StringTuneContext = stringTune;

      stringTune.use(ST.StringLazy);
      stringTune.use(ST.StringPositionTracker);
      stringTune.start(0);

      stringTune.PositionTrackerVisible = true;
    }

    // already loaded
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      initTracker();
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;

    script.onload = initTracker;

    script.onerror = () => {
      console.warn('[StringTune] failed to load');
    };

    document.head.appendChild(script);

  }, []);
}