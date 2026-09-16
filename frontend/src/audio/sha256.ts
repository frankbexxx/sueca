/** SHA-256 helpers (Web Crypto) — browser, Android WebView, and Node/vitest. */

const HEX = '0123456789abcdef';

export function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (let i = 0; i < view.length; i++) {
    out += HEX[(view[i]! >> 4) & 0xf];
    out += HEX[view[i]! & 0xf];
  }
  return out;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

/**
 * Normalize to a BufferSource accepted by the active SubtleCrypto implementation.
 *
 * Vitest uses jsdom: `new Uint8Array(...).buffer` is a jsdom ArrayBuffer, while
 * `crypto.subtle` is Node's. Node then throws:
 * "Failed to execute 'digest' on 'SubtleCrypto': 2nd argument is not instance of ArrayBuffer..."
 *
 * On Node, `Buffer.from(...)` yields a same-realm BufferSource.
 * In browser / Android WebView, copy into a same-realm Uint8Array view.
 */
function toSubtleBufferSource(data: ArrayBuffer | Uint8Array): BufferSource {
  const src = toUint8Array(data);
  const BufferCtor = (globalThis as { Buffer?: { from(data: Uint8Array): Uint8Array } })
    .Buffer;
  if (typeof BufferCtor !== 'undefined') {
    return BufferCtor.from(src);
  }
  const copy = new Uint8Array(src.byteLength);
  copy.set(src);
  return copy;
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto SubtleCrypto unavailable');
  }
  const digest = await subtle.digest('SHA-256', toSubtleBufferSource(data));
  return bytesToHex(digest);
}

export function isSha256Hex(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}
