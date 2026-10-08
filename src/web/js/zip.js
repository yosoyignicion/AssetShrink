// Generador ZIP mínimo (método STORE, sin compresión) — sin dependencias.
// Adecuado para empaquetar imágenes ya comprimidas (WebP/PNG/JPEG).

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const u16 = (n) => [n & 0xff, (n >> 8) & 0xff];
const u32 = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];

function dosDateTime() {
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time: time & 0xffff, date: date & 0xffff };
}

/**
 * @param {{name: string, data: Uint8Array}[]} files
 * @returns {Blob}
 */
export function createZip(files) {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime();
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(
      [].concat(
        u32(0x04034b50),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(time),
        u16(date),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0)
      )
    );
    localChunks.push(localHeader, name, data);

    const centralHeader = new Uint8Array(
      [].concat(
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(time),
        u16(date),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset)
      )
    );
    centralChunks.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralSize = centralChunks.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(
    [].concat(
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralSize),
      u32(offset),
      u16(0)
    )
  );

  return new Blob([...localChunks, ...centralChunks, end], { type: "application/zip" });
}
