import {
  base64ToUint8Array,
  isSha256Hex,
  sha256Hex,
  uint8ArrayToBase64
} from './sha256';

/** NIST / common test vectors (FIPS 180-2). */
const EMPTY =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ABC =
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('sha256Hex (Node / jsdom / browser BufferSource)', () => {
  it('hashes Uint8Array with known digest', async () => {
    const bytes = new TextEncoder().encode('abc');
    expect(await sha256Hex(bytes)).toBe(ABC);
  });

  it('hashes ArrayBuffer with known digest', async () => {
    const bytes = new TextEncoder().encode('abc');
    expect(await sha256Hex(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))).toBe(
      ABC
    );
  });

  it('hashes empty input', async () => {
    expect(await sha256Hex(new Uint8Array(0))).toBe(EMPTY);
  });

  it('hashes base64 → bytes → SHA-256', async () => {
    const original = new TextEncoder().encode('ogg-fixture:cache');
    const b64 = uint8ArrayToBase64(original);
    const roundTrip = base64ToUint8Array(b64);
    expect(Array.from(roundTrip)).toEqual(Array.from(original));
    const hash = await sha256Hex(roundTrip);
    expect(isSha256Hex(hash)).toBe(true);
    expect(hash).toBe(await sha256Hex(original));
  });

  it('accepts a subarray view without including sibling bytes', async () => {
    const buf = new Uint8Array([0, 0, 97, 98, 99, 0]); // "abc" in the middle
    const view = buf.subarray(2, 5);
    expect(await sha256Hex(view)).toBe(ABC);
  });

  it('reports Node test environment (CI parity)', () => {
    expect(typeof process).toBe('object');
    expect(process.versions?.node).toBeTruthy();
    expect(typeof globalThis.crypto?.subtle?.digest).toBe('function');
  });
});
