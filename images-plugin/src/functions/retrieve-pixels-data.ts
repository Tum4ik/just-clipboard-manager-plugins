export function retrievePixelsData(buffer: ArrayBufferLike): { pixels: Uint8ClampedArray, width: number, height: number; } {
  const dataView = new DataView(buffer);
  const bV5Size = dataView.getUint32(0, true);
  const width = dataView.getInt32(4, true);
  const heightRaw = dataView.getInt32(8, true);
  const height = Math.abs(heightRaw);
  const bottomUp = heightRaw > 0;
  const bitCount = dataView.getUint16(14, true);
  const compression = dataView.getUint32(16, true);
  const clrUsed = dataView.getUint32(32, true);

  const redMask = dataView.getUint32(40, true);
  const greenMask = dataView.getUint32(44, true);
  const blueMask = dataView.getUint32(48, true);
  const alphaMask = dataView.getUint32(52, true);

  const profileData = dataView.getUint32(112, true);
  const profileSize = dataView.getUint32(116, true);

  let offset = bV5Size;
  if (compression === 3 || compression === 6) {
    offset += 12;
  }

  let palette: Uint8Array | null = null;
  if (bitCount <= 8) {
    let paletteCount = clrUsed !== 0 ? clrUsed : (1 << bitCount);
    if (paletteCount === 0) paletteCount = 1 << bitCount;
    palette = new Uint8Array(4 * paletteCount);
    for (let i = 0; i < paletteCount; i++) {
      const pos = offset + i * 4;
      const b = dataView.getUint8(pos);
      const g = dataView.getUint8(pos + 1);
      const r = dataView.getUint8(pos + 2);
      palette[i * 4] = r;
      palette[i * 4 + 1] = g;
      palette[i * 4 + 2] = b;
      palette[i * 4 + 3] = 255;
    }
    offset += paletteCount * 4;
  }

  if (profileSize > 0 && profileData > 0) {
    const profileEnd = profileData + profileSize;
    if (profileEnd > offset) offset = profileEnd;
  }

  const rowSize = Math.floor((width * bitCount + 31) / 32) * 4;
  const pixels = new Uint8ClampedArray(width * height * 4);
  const byteArray = new Uint8Array(buffer);

  for (let y = 0; y < height; y++) {
    const row = bottomUp ? height - 1 - y : y;
    const rowOffset = offset + row * rowSize;
    let pixelOffset = y * width * 4;

    if (bitCount === 1 && palette) {
      for (let x = 0; x < width; x++) {
        const byteIndex = Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        const bit = (byteArray[rowOffset + byteIndex] >> bitIndex) & 1;
        const idx = bit * 4;
        pixels[pixelOffset++] = palette[idx];
        pixels[pixelOffset++] = palette[idx + 1];
        pixels[pixelOffset++] = palette[idx + 2];
        pixels[pixelOffset++] = palette[idx + 3];
      }
    } else if (bitCount === 4 && palette) {
      for (let x = 0; x < width; x++) {
        const byteVal = byteArray[rowOffset + Math.floor(x / 2)];
        const nibble = (x % 2 === 0) ? (byteVal >> 4) & 0xF : byteVal & 0xF;
        const idx = nibble * 4;
        pixels[pixelOffset++] = palette[idx];
        pixels[pixelOffset++] = palette[idx + 1];
        pixels[pixelOffset++] = palette[idx + 2];
        pixels[pixelOffset++] = palette[idx + 3];
      }
    } else if (bitCount === 8 && palette) {
      for (let x = 0; x < width; x++) {
        const idxPalette = byteArray[rowOffset + x] * 4;
        pixels[pixelOffset++] = palette[idxPalette];
        pixels[pixelOffset++] = palette[idxPalette + 1];
        pixels[pixelOffset++] = palette[idxPalette + 2];
        pixels[pixelOffset++] = palette[idxPalette + 3];
      }
    } else if (bitCount === 16) {
      for (let x = 0; x < width; x++) {
        const pos = rowOffset + x * 2;
        const pixelVal = dataView.getUint16(pos, true);
        let r = 0, g = 0, b = 0, a = 255;
        if (compression === 0) {
          const r5 = (pixelVal >> 10) & 0x1F;
          const g5 = (pixelVal >> 5) & 0x1F;
          const b5 = pixelVal & 0x1F;
          r = (r5 << 3) | (r5 >> 2);
          g = (g5 << 3) | (g5 >> 2);
          b = (b5 << 3) | (b5 >> 2);
        } else {
          r = extractColor(pixelVal, redMask);
          g = extractColor(pixelVal, greenMask);
          b = extractColor(pixelVal, blueMask);
          a = extractColor(pixelVal, alphaMask) || 255;
        }
        pixels[pixelOffset++] = r;
        pixels[pixelOffset++] = g;
        pixels[pixelOffset++] = b;
        pixels[pixelOffset++] = a;
      }
    } else if (bitCount === 24) {
      for (let x = 0; x < width; x++) {
        const pos = rowOffset + x * 3;
        const b = byteArray[pos];
        const g = byteArray[pos + 1];
        const r = byteArray[pos + 2];
        if (compression === 0) {
          pixels[pixelOffset++] = r;
          pixels[pixelOffset++] = g;
          pixels[pixelOffset++] = b;
          pixels[pixelOffset++] = 255;
        } else {
          const pixelVal = b | (g << 8) | (r << 16);
          const rr = extractColor(pixelVal, redMask);
          const gg = extractColor(pixelVal, greenMask);
          const bb = extractColor(pixelVal, blueMask);
          const aa = extractColor(pixelVal, alphaMask) || 255;
          pixels[pixelOffset++] = rr;
          pixels[pixelOffset++] = gg;
          pixels[pixelOffset++] = bb;
          pixels[pixelOffset++] = aa;
        }
      }
    } else if (bitCount === 32) {
      for (let x = 0; x < width; x++) {
        const pos = rowOffset + x * 4;
        if (compression === 0) {
          const b = byteArray[pos];
          const g = byteArray[pos + 1];
          const r = byteArray[pos + 2];
          pixels[pixelOffset++] = r;
          pixels[pixelOffset++] = g;
          pixels[pixelOffset++] = b;
          pixels[pixelOffset++] = 255;
        } else {
          const pixelVal = dataView.getUint32(pos, true);
          const rr = extractColor(pixelVal, redMask);
          const gg = extractColor(pixelVal, greenMask);
          const bb = extractColor(pixelVal, blueMask);
          const aa = extractColor(pixelVal, alphaMask) || 255;
          pixels[pixelOffset++] = rr;
          pixels[pixelOffset++] = gg;
          pixels[pixelOffset++] = bb;
          pixels[pixelOffset++] = aa;
        }
      }
    } else {
      throw new Error(`Unsupported bitCount: ${bitCount}`);
    }
  }

  return { pixels, width, height };
}


function extractColor(value: number, mask: number): number {
  if (mask === 0) return 0;
  let shift = 0;
  let tempMask = mask;
  while ((tempMask & 1) === 0) {
    tempMask >>>= 1;
    shift++;
  }
  const bits = Math.floor(Math.log2(tempMask)) + 1;
  const comp = (value & mask) >>> shift;
  return bits === 0 ? 0 : Math.round((comp * 255) / ((1 << bits) - 1));
}
