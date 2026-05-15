/// <reference lib="webworker" />

// Web Worker for off-main-thread CSV/Excel parsing.
// Reachable from the main thread via `runInDataWorker(...)` in data-worker-client.ts.
//
// Why: parseExcel calls XLSX.read() synchronously, and a 30+ MB CSV builds a
// huge intermediate array. Both block the main thread for several seconds on
// realistic inputs. Moving them off the main thread keeps the UI responsive
// (skeleton animations, button feedback, theme toggle, etc.).

import { parseCSV, parseExcel } from '@/app/lib/data-processor';

type Msg =
  | { id: number; type: 'parseCSV'; text: string }
  | { id: number; type: 'parseExcel'; buffer: ArrayBuffer };

self.addEventListener('message', async (e: MessageEvent<Msg>) => {
  const msg = e.data;
  try {
    let result: unknown;
    if (msg.type === 'parseCSV') {
      result = parseCSV(msg.text);
    } else if (msg.type === 'parseExcel') {
      result = await parseExcel(msg.buffer);
    } else {
      throw new Error(`Unknown message type`);
    }
    (self as unknown as Worker).postMessage({ id: msg.id, ok: true, result });
  } catch (err: any) {
    (self as unknown as Worker).postMessage({ id: msg.id, ok: false, error: err?.message || String(err) });
  }
});
