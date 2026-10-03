// PNG'lardan favicon.ico yig'adi (ICO ichida PNG saqlanadi — barcha brauzerlar tushunadi)
// node tools/brand/ico.mjs <out.ico> <16.png> <32.png> <48.png> ...
import { readFileSync, writeFileSync } from "node:fs";
const [,, out, ...pngs] = process.argv;
const imgs = pngs.map((f) => readFileSync(f));
const head = Buffer.alloc(6 + 16 * imgs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let offset = head.length;
imgs.forEach((png, i) => {
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20), e = 6 + i * 16;
  head.writeUInt8(w >= 256 ? 0 : w, e); head.writeUInt8(h >= 256 ? 0 : h, e + 1);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(png.length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
writeFileSync(out, Buffer.concat([head, ...imgs]));
