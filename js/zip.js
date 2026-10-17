/* ছোট ZIP লাইব্রেরি: তৈরি (store) ও পড়া (deflate সহ) — কোনো বাইরের লাইব্রেরি নেই */
const ZIP = (() => {
  const T = new Uint32Array(256).map((_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
  const crc32 = u => { let c = -1; for (let i = 0; i < u.length; i++) c = T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const u16 = n => [n & 255, (n >> 8) & 255];
  const u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  const enc = new TextEncoder();

  function create(files, mime) {
    const parts = [], cd = [];
    let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(data), sz = data.length;
      const common = [...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(name.length), ...u16(0)];
      parts.push(new Uint8Array([0x50, 0x4b, 3, 4, ...common]), name, data);
      cd.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
      off += 30 + name.length + sz;
    }
    const cdSize = cd.reduce((a, b) => a + b.length, 0);
    parts.push(...cd, new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), 0, 0]));
    return new Blob(parts, { type: mime || 'application/zip' });
  }

  async function read(buf, want) {
    const v = new DataView(buf), u = new Uint8Array(buf);
    let e = u.length - 22;
    while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw Error('ZIP ফাইল নয়');
    let n = v.getUint16(e + 10, true), p = v.getUint32(e + 16, true);
    while (n--) {
      const m = v.getUint16(p + 10, true), cs = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true),
        el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u.subarray(p + 46, p + 46 + nl));
      p += 46 + nl + el + cl;
      if (name !== want) continue;
      const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true), data = u.subarray(ds, ds + cs);
      if (m === 0) return new TextDecoder().decode(data);
      const s = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(s).text();
    }
    return null;
  }
  return { create, read };
})();
