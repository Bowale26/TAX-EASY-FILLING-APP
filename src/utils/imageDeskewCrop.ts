/**
 * Browser-Based Auto-Crop and Deskew Engine for Canadian Tax Slips & Documents
 * 
 * Performs client-side image processing using HTML5 Canvas API:
 * 1. Automatic boundary detection & edge trimming to remove background/margins.
 * 2. Skew angle estimation using horizontal projection profile variance.
 * 3. Rotational alignment (deskew) to ensure horizontal text/box alignment.
 * 4. Adaptive contrast & sharpness enhancement for optimal CRA box OCR accuracy.
 */

export interface DeskewCropOptions {
  autoCrop?: boolean;
  autoDeskew?: boolean;
  enhanceContrast?: boolean;
  manualAngle?: number; // Override or fine-tune skew angle in degrees
  cropMarginPercent?: number; // Safety padding margin in % (default: 2)
  targetMaxDimension?: number;
}

export interface DeskewCropResult {
  processedDataUrl: string;
  originalDataUrl: string;
  detectedAngle: number;
  appliedAngle: number;
  cropBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
  };
  confidence: number;
  wasCropped: boolean;
  wasDeskewed: boolean;
  processingTimeMs: number;
}

/**
 * Loads an image from a data URL or path into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for processing: ' + e));
    img.src = src;
  });
}

/**
 * Detects document boundaries (Auto-Crop) based on luminance gradient transitions
 * from outer border background into the slip document.
 */
function detectDocumentBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  paddingPercent: number = 2
): { x: number; y: number; width: number; height: number } {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Sample corner luminance to estimate background brightness
  const cornerSamples = [
    (0 * width + 0) * 4,
    (0 * width + (width - 1)) * 4,
    ((height - 1) * width + 0) * 4,
    ((height - 1) * width + (width - 1)) * 4,
  ];

  let bgLumaSum = 0;
  for (const idx of cornerSamples) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    bgLumaSum += 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const avgBgLuma = bgLumaSum / cornerSamples.length;
  const isDarkBackground = avgBgLuma < 128;

  // Compute row and column variances/luminances to locate document edges
  const step = Math.max(1, Math.floor(Math.min(width, height) / 200));

  let minX = 0;
  let maxX = width - 1;
  let minY = 0;
  let maxY = height - 1;

  const thresholdDelta = 28; // luminance difference from background

  // Top edge scan
  topLoop: for (let y = 0; y < Math.floor(height * 0.35); y += step) {
    let diffCount = 0;
    let checked = 0;
    for (let x = Math.floor(width * 0.15); x < Math.floor(width * 0.85); x += step * 2) {
      const idx = (y * width + x) * 4;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (isDarkBackground ? luma > avgBgLuma + thresholdDelta : luma < avgBgLuma - thresholdDelta) {
        diffCount++;
      }
      checked++;
    }
    if (checked > 0 && diffCount / checked > 0.3) {
      minY = Math.max(0, y - step);
      break topLoop;
    }
  }

  // Bottom edge scan
  bottomLoop: for (let y = height - 1; y > Math.floor(height * 0.65); y -= step) {
    let diffCount = 0;
    let checked = 0;
    for (let x = Math.floor(width * 0.15); x < Math.floor(width * 0.85); x += step * 2) {
      const idx = (y * width + x) * 4;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (isDarkBackground ? luma > avgBgLuma + thresholdDelta : luma < avgBgLuma - thresholdDelta) {
        diffCount++;
      }
      checked++;
    }
    if (checked > 0 && diffCount / checked > 0.3) {
      maxY = Math.min(height - 1, y + step);
      break bottomLoop;
    }
  }

  // Left edge scan
  leftLoop: for (let x = 0; x < Math.floor(width * 0.35); x += step) {
    let diffCount = 0;
    let checked = 0;
    for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.85); y += step * 2) {
      const idx = (y * width + x) * 4;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (isDarkBackground ? luma > avgBgLuma + thresholdDelta : luma < avgBgLuma - thresholdDelta) {
        diffCount++;
      }
      checked++;
    }
    if (checked > 0 && diffCount / checked > 0.3) {
      minX = Math.max(0, x - step);
      break leftLoop;
    }
  }

  // Right edge scan
  rightLoop: for (let x = width - 1; x > Math.floor(width * 0.65); x -= step) {
    let diffCount = 0;
    let checked = 0;
    for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.85); y += step * 2) {
      const idx = (y * width + x) * 4;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (isDarkBackground ? luma > avgBgLuma + thresholdDelta : luma < avgBgLuma - thresholdDelta) {
        diffCount++;
      }
      checked++;
    }
    if (checked > 0 && diffCount / checked > 0.3) {
      maxX = Math.min(width - 1, x + step);
      break rightLoop;
    }
  }

  // Add safety margin padding
  const padX = Math.floor(width * (paddingPercent / 100));
  const padY = Math.floor(height * (paddingPercent / 100));

  const finalMinX = Math.max(0, minX - padX);
  const finalMinY = Math.max(0, minY - padY);
  const finalMaxX = Math.min(width - 1, maxX + padX);
  const finalMaxY = Math.min(height - 1, maxY + padY);

  const cropW = finalMaxX - finalMinX;
  const cropH = finalMaxY - finalMinY;

  // Sanity check: ensure crop isn't too small (at least 50% of original area)
  if (cropW < width * 0.5 || cropH < height * 0.5) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: finalMinX,
    y: finalMinY,
    width: cropW,
    height: cropH,
  };
}

/**
 * Estimates skew angle using horizontal projection profile variance.
 * Text lines on CRA slips produce sharp alternating peaks when oriented horizontally.
 * Tests angles between -15° and +15° in steps to find max variance.
 */
function estimateSkewAngle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { angle: number; confidence: number } {
  // Use a scaled-down canvas for rapid projection testing
  const scale = Math.min(1, 400 / Math.max(width, height));
  const sw = Math.floor(width * scale);
  const sh = Math.floor(height * scale);

  const testCanvas = document.createElement('canvas');
  testCanvas.width = sw;
  testCanvas.height = sh;
  const tCtx = testCanvas.getContext('2d', { willReadFrequently: true });
  if (!tCtx) return { angle: 0, confidence: 0.5 };

  tCtx.drawImage(ctx.canvas, 0, 0, width, height, 0, 0, sw, sh);

  // Focus on the central 70% region where text lines reside
  const startY = Math.floor(sh * 0.15);
  const endY = Math.floor(sh * 0.85);
  const testHeight = endY - startY;
  const startX = Math.floor(sw * 0.15);
  const testWidth = Math.floor(sw * 0.7);

  // Search range: -10° to +10° with 0.5° increments
  let bestAngle = 0;
  let maxVariance = -1;
  const variances: { angle: number; variance: number }[] = [];

  for (let angle = -10; angle <= 10; angle += 0.5) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Compute projection along rotated horizontal slices
    const rowSums = new Float64Array(testHeight);
    const counts = new Uint16Array(testHeight);

    const stepX = 2;
    const stepY = 2;

    const imgData = tCtx.getImageData(0, 0, sw, sh);
    const d = imgData.data;

    const cx = sw / 2;
    const cy = sh / 2;

    for (let y = startY; y < endY; y += stepY) {
      for (let x = startX; x < startX + testWidth; x += stepX) {
        // Rotate point (x, y) back relative to center
        const dx = x - cx;
        const dy = y - cy;
        const rx = dx * cos - dy * sin + cx;
        const ry = dx * sin + dy * cos + cy;

        const ix = Math.floor(rx);
        const iy = Math.floor(ry);

        if (ix >= 0 && ix < sw && iy >= 0 && iy < sh) {
          const idx = (iy * sw + ix) * 4;
          // Inverted luminance (dark text = higher value)
          const luma = 255 - (0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]);
          const targetRow = y - startY;
          rowSums[targetRow] += luma;
          counts[targetRow]++;
        }
      }
    }

    // Calculate variance of row sums
    let mean = 0;
    let n = 0;
    for (let i = 0; i < testHeight; i++) {
      if (counts[i] > 0) {
        rowSums[i] /= counts[i];
        mean += rowSums[i];
        n++;
      }
    }
    mean = n > 0 ? mean / n : 0;

    let variance = 0;
    for (let i = 0; i < testHeight; i++) {
      if (counts[i] > 0) {
        const diff = rowSums[i] - mean;
        variance += diff * diff;
      }
    }
    variance = n > 0 ? variance / n : 0;

    variances.push({ angle, variance });

    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = angle;
    }
  }

  // Refine around the best angle with 0.1° resolution
  let refinedAngle = bestAngle;
  let refinedMaxVar = maxVariance;

  for (let angle = bestAngle - 0.4; angle <= bestAngle + 0.4; angle += 0.1) {
    if (Math.abs(angle) > 10) continue;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rowSums = new Float64Array(testHeight);
    const counts = new Uint16Array(testHeight);

    const imgData = tCtx.getImageData(0, 0, sw, sh);
    const d = imgData.data;
    const cx = sw / 2;
    const cy = sh / 2;

    for (let y = startY; y < endY; y += 2) {
      for (let x = startX; x < startX + testWidth; x += 2) {
        const dx = x - cx;
        const dy = y - cy;
        const rx = Math.floor(dx * cos - dy * sin + cx);
        const ry = Math.floor(dx * sin + dy * cos + cy);

        if (rx >= 0 && rx < sw && ry >= 0 && ry < sh) {
          const idx = (ry * sw + rx) * 4;
          const luma = 255 - (0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]);
          const targetRow = y - startY;
          rowSums[targetRow] += luma;
          counts[targetRow]++;
        }
      }
    }

    let mean = 0;
    let n = 0;
    for (let i = 0; i < testHeight; i++) {
      if (counts[i] > 0) {
        rowSums[i] /= counts[i];
        mean += rowSums[i];
        n++;
      }
    }
    mean = n > 0 ? mean / n : 0;

    let variance = 0;
    for (let i = 0; i < testHeight; i++) {
      if (counts[i] > 0) {
        const diff = rowSums[i] - mean;
        variance += diff * diff;
      }
    }
    variance = n > 0 ? variance / n : 0;

    if (variance > refinedMaxVar) {
      refinedMaxVar = variance;
      refinedAngle = angle;
    }
  }

  // Calculate confidence score based on peak distinctiveness
  const avgVar = variances.reduce((s, v) => s + v.variance, 0) / (variances.length || 1);
  const peakRatio = avgVar > 0 ? refinedMaxVar / avgVar : 1;
  const confidence = Math.min(0.99, Math.max(0.65, 0.6 + (peakRatio - 1) * 0.15));

  // If the detected angle is negligible (< 0.3°), consider it already straight
  if (Math.abs(refinedAngle) < 0.3) {
    refinedAngle = 0;
  }

  return {
    angle: Math.round(refinedAngle * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Enhances contrast and sharpness on an ImageData object for OCR readability
 */
function enhanceDocumentContrast(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Simple min/max histogram stretching
  let minLuma = 255;
  let maxLuma = 0;

  for (let i = 0; i < data.length; i += 16) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (luma < minLuma) minLuma = luma;
    if (luma > maxLuma) maxLuma = luma;
  }

  const range = maxLuma - minLuma;
  if (range > 20 && range < 230) {
    const factor = 255 / range;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - minLuma) * factor));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - minLuma) * factor));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - minLuma) * factor));
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

/**
 * Primary processing pipeline: takes an image dataUrl and returns
 * deskewed, auto-cropped, and contrast-boosted output.
 */
export async function processAutoCropAndDeskew(
  imageSource: string,
  options: DeskewCropOptions = {}
): Promise<DeskewCropResult> {
  const startTime = performance.now();
  const {
    autoCrop = true,
    autoDeskew = true,
    enhanceContrast = true,
    manualAngle,
    cropMarginPercent = 2,
  } = options;

  const img = await loadImage(imageSource);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Working canvas initialized with original image
  const canvas = document.createElement('canvas');
  canvas.width = origW;
  canvas.height = origH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable in browser.');
  }

  ctx.drawImage(img, 0, 0);

  // 1. Skew Estimation
  let detectedAngle = 0;
  let angleConfidence = 0.85;

  if (autoDeskew) {
    const deskewInfo = estimateSkewAngle(ctx, origW, origH);
    detectedAngle = deskewInfo.angle;
    angleConfidence = deskewInfo.confidence;
  }

  // Determine angle to apply (manual override takes precedence if supplied)
  const appliedAngle = manualAngle !== undefined ? manualAngle : detectedAngle;
  const shouldDeskew = Math.abs(appliedAngle) >= 0.2;

  // 2. Perform Rotation if deskew is active
  let rotatedCanvas = canvas;
  if (shouldDeskew) {
    rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = origW;
    rotatedCanvas.height = origH;
    const rCtx = rotatedCanvas.getContext('2d', { willReadFrequently: true });
    if (rCtx) {
      rCtx.save();
      rCtx.translate(origW / 2, origH / 2);
      rCtx.rotate((-appliedAngle * Math.PI) / 180);
      rCtx.drawImage(canvas, -origW / 2, -origH / 2);
      rCtx.restore();
    }
  }

  const rCtx = rotatedCanvas.getContext('2d', { willReadFrequently: true }) || ctx;

  // 3. Document Boundary Detection (Auto-Crop)
  let cropBounds = {
    x: 0,
    y: 0,
    width: origW,
    height: origH,
  };

  let wasCropped = false;
  if (autoCrop) {
    cropBounds = detectDocumentBounds(rCtx, origW, origH, cropMarginPercent);
    // Check if bounds represent a non-trivial crop (cropped off at least 3% from any edge)
    if (
      cropBounds.x > origW * 0.02 ||
      cropBounds.y > origH * 0.02 ||
      cropBounds.width < origW * 0.96 ||
      cropBounds.height < origH * 0.96
    ) {
      wasCropped = true;
    }
  }

  // 4. Create final cropped & deskewed canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = cropBounds.width;
  finalCanvas.height = cropBounds.height;
  const fCtx = finalCanvas.getContext('2d', { willReadFrequently: true });

  if (fCtx) {
    fCtx.drawImage(
      rotatedCanvas,
      cropBounds.x,
      cropBounds.y,
      cropBounds.width,
      cropBounds.height,
      0,
      0,
      cropBounds.width,
      cropBounds.height
    );

    // 5. Optional Contrast Enhancement
    if (enhanceContrast) {
      enhanceDocumentContrast(fCtx, cropBounds.width, cropBounds.height);
    }
  }

  const processedDataUrl = finalCanvas.toDataURL('image/jpeg', 0.94);
  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    processedDataUrl,
    originalDataUrl: imageSource,
    detectedAngle,
    appliedAngle,
    cropBounds: {
      ...cropBounds,
      originalWidth: origW,
      originalHeight: origH,
    },
    confidence: angleConfidence,
    wasCropped,
    wasDeskewed: shouldDeskew,
    processingTimeMs,
  };
}

/**
 * Fast rotation utility for manual angle tweaks (e.g. from UI slider)
 */
export async function rotateAndCropImage(
  imageSource: string,
  angleDegrees: number,
  cropInsetPercent: number = 0
): Promise<string> {
  const img = await loadImage(imageSource);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSource;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-angleDegrees * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2);
  ctx.restore();

  if (cropInsetPercent > 0) {
    const insetX = (w * cropInsetPercent) / 100;
    const insetY = (h * cropInsetPercent) / 100;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = w - insetX * 2;
    croppedCanvas.height = h - insetY * 2;
    const cCtx = croppedCanvas.getContext('2d');
    if (cCtx) {
      cCtx.drawImage(
        canvas,
        insetX,
        insetY,
        w - insetX * 2,
        h - insetY * 2,
        0,
        0,
        w - insetX * 2,
        h - insetY * 2
      );
      return croppedCanvas.toDataURL('image/jpeg', 0.95);
    }
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}
