export function resize(pixels: Uint8ClampedArray, srcWidth: number, srcHeight: number, maxHeight: number)
  : { pixels: Uint8ClampedArray, width: number, height: number; } {

  if (srcHeight <= maxHeight) {
    return { pixels, width: srcWidth, height: srcHeight };
  }

  const scale = maxHeight / srcHeight;
  const newWidth = Math.round(srcWidth * scale);
  const newHeight = maxHeight;
  const output = new Uint8ClampedArray(newWidth * newHeight * 4); // RGBA

  // Loop over each pixel of the output image
  for (let dy = 0; dy < newHeight; dy++) {
    // Map output Y coordinate to source Y (floating point)
    const srcY = dy / scale;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(y0 + 1, srcHeight - 1);  // clamp to image bounds
    const dyFrac = srcY - y0;
    const invDy = 1 - dyFrac;

    for (let dx = 0; dx < newWidth; dx++) {
      // Map output X coordinate to source X (floating point)
      const srcX = dx / scale;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, srcWidth - 1);
      const dxFrac = srcX - x0;
      const invDx = 1 - dxFrac;

      // Compute indices of the four neighboring source pixels
      const idx00 = (y0 * srcWidth + x0) * 4;
      const idx10 = (y0 * srcWidth + x1) * 4;
      const idx01 = (y1 * srcWidth + x0) * 4;
      const idx11 = (y1 * srcWidth + x1) * 4;

      // Output buffer index for pixel (dx, dy)
      const destIdx = (dy * newWidth + dx) * 4;

      // Perform bilinear interpolation for each of R, G, B, A channels
      for (let channel = 0; channel < 4; channel++) {
        // Read the four neighboring pixel values
        const f00 = pixels[idx00 + channel];
        const f10 = pixels[idx10 + channel];
        const f01 = pixels[idx01 + channel];
        const f11 = pixels[idx11 + channel];

        // Compute the weighted average (bilinear formula)
        const value =
          f00 * (invDx * invDy) +  // top-left weight
          f10 * (dxFrac * invDy) + // top-right weight
          f01 * (invDx * dyFrac) + // bottom-left weight
          f11 * (dxFrac * dyFrac); // bottom-right weight

        // Assign the result (clamp/round to integer in [0..255])
        output[destIdx + channel] = Math.round(value);
      }
    }
  }

  return { pixels: output, width: newWidth, height: newHeight };
}
