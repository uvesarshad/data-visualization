// Client-side wrapper around the data Worker.
//
// Lazy-initializes a single worker on first use, sends typed messages, returns
// promises. If worker construction fails (older runtime, bundler issues, SSR),
// falls back to in-thread parsing — slower but functional.

let _worker: Worker | null = null;
let _msgId = 0;
const _pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (_worker) return _worker;
  try {
    _worker = new Worker(new URL('./data-worker.ts', import.meta.url), { type: 'module' });
    _worker.addEventListener('message', (e: MessageEvent) => {
      const { id, ok, result, error } = e.data || {};
      const handlers = _pending.get(id);
      if (!handlers) return;
      _pending.delete(id);
      if (ok) handlers.resolve(result);
      else handlers.reject(new Error(error || 'Worker error'));
    });
    _worker.addEventListener('error', (e) => {
      // Surface the worker's runtime error to all pending promises and reset
      for (const { reject } of _pending.values()) reject(new Error(e.message || 'Worker crashed'));
      _pending.clear();
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[data-worker] failed to spawn worker; falling back to main thread.', err);
    }
    _worker = null;
  }
  return _worker;
}

function send<T>(type: 'parseCSV' | 'parseExcel', payload: any): Promise<T> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error('Worker unavailable'));
  const id = ++_msgId;
  return new Promise<T>((resolve, reject) => {
    _pending.set(id, { resolve, reject });
    w.postMessage({ id, type, ...payload });
  });
}

/**
 * Parse a CSV string. Tries the worker first; on any failure falls back to
 * the main-thread parser so the user still gets their dataset.
 */
export async function parseCSVAsync(text: string): Promise<any[]> {
  try {
    return await send<any[]>('parseCSV', { text });
  } catch {
    const { parseCSV } = await import('@/app/lib/data-processor');
    return parseCSV(text);
  }
}

export async function parseExcelAsync(buffer: ArrayBuffer): Promise<any[]> {
  try {
    return await send<any[]>('parseExcel', { buffer });
  } catch {
    const { parseExcel } = await import('@/app/lib/data-processor');
    return parseExcel(buffer);
  }
}
