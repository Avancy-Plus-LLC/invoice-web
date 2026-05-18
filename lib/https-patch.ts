import { EventEmitter } from 'events';
import { Readable } from 'stream';

// Cloudflare Workers の unenv polyfill は https.request を実装していないため
// openid-client (next-auth内部) が使う https.request を fetch ベースで置き換える
export function patchHttpsForCloudflare(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const httpsModule = require('https');
  if ((httpsModule as any).__cf_patched) return;
  (httpsModule as any).__cf_patched = true;

  function makeRequest(
    urlArg: string | URL,
    optsArg?: any,
    callbackArg?: (res: any) => void,
  ) {
    const url = typeof urlArg === 'string' ? urlArg : urlArg.href;
    const opts = typeof optsArg === 'function' ? {} : (optsArg ?? {});
    const cb = typeof optsArg === 'function' ? optsArg : callbackArg;

    const bodyParts: Buffer[] = [];
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    const ee = new EventEmitter();

    const req: any = Object.assign(ee, {
      setHeader(key: string, val: string | number) {
        headers[key.toLowerCase()] = String(val);
      },
      removeHeader(key: string) {
        delete headers[key.toLowerCase()];
      },
      write(chunk: string | Buffer | Uint8Array) {
        bodyParts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
      },
      abort() {},
      destroy() {},
      end(chunk?: string | Buffer) {
        if (chunk) {
          bodyParts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
        }

        const method = (opts.method ?? 'GET').toUpperCase();
        const hasBody = bodyParts.length > 0 && method !== 'GET' && method !== 'HEAD';
        const body = hasBody ? Buffer.concat(bodyParts) : undefined;

        // fetch はcontent-lengthを自動計算するので削除
        delete headers['content-length'];

        (globalThis.fetch as typeof fetch)(url, {
          method,
          headers,
          body: body as any,
        })
          .then(async (fetchRes) => {
            const data = Buffer.from(await fetchRes.arrayBuffer());
            const res = new Readable({ read() {} });
            (res as any).statusCode = fetchRes.status;
            (res as any).statusMessage = fetchRes.statusText;
            (res as any).headers = Object.fromEntries(fetchRes.headers.entries());
            res.push(data);
            res.push(null);

            if (cb) cb(res);
            ee.emit('response', res);
          })
          .catch((err: Error) => {
            ee.emit('error', err);
          });

        return req;
      },
    });

    return req;
  }

  httpsModule.request = makeRequest;
  httpsModule.get = function (url: any, opts: any, cb?: any) {
    if (typeof opts === 'function') { cb = opts; opts = {}; }
    const req = makeRequest(url, { ...(opts ?? {}), method: 'GET' }, cb);
    req.end();
    return req;
  };
}
