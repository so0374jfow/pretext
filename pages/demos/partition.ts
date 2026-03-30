/**
 * Partition — bifurcation diagram of text line-breaking.
 *
 * A spectrogram where each row is a container width and each column is a
 * character position. Alternating luminance bands encode line membership,
 * making line-break phase transitions visible as shifting vertical boundaries
 * that merge and split as width varies by single pixels.
 */

import {
  prepareWithSegments,
  layoutWithLines,
  layout,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from "../../src/layout.ts";

// ── source text ──

const TEXT =
  "The corridor narrows. Walls built from poured concrete and reclaimed timber " +
  "converge toward a threshold that exists only in the plan — never constructed, " +
  "always implied. Light arrives through slots cut at irregular intervals, each " +
  "aperture calibrated to a specific hour. The architect understood that space is " +
  "not contained but produced: by edges, by the absence of material, by the " +
  "pressure of one surface against another. A room is a theory about how bodies " +
  "might arrange themselves. The ceiling drops. Joists exposed. Douglas fir " +
  "spanning fourteen feet without intermediate support, each member sized to " +
  "deflect no more than the thickness of a pencil lead under full occupation. " +
  "Circulation routes cross and separate. What appears as a single volume is " +
  "actually three interlocking spatial events compressed into ninety square " +
  "meters of habitable area.";

const FONT = '14px "Helvetica Neue", Helvetica, Arial, sans-serif';
const LINE_HEIGHT = 22;
const MIN_WIDTH = 80;
const MAX_WIDTH = 700;

// ── DOM refs ──

const canvas = document.getElementById("spectrogram") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const scanLine = document.getElementById("scan-line")!;
const textContent = document.getElementById("text-content")!;
const metaWidth = document.getElementById("meta-width")!;
const metaLines = document.getElementById("meta-lines")!;
const axisTop = document.getElementById("axis-top")!;
const axisBottom = document.getElementById("axis-bottom")!;
const canvasContainer = document.getElementById("canvas-container")!;

// ── phase map types ──

type PhaseMap = {
  minWidth: number;
  maxWidth: number;
  stepCount: number;
  textLength: number;
  data: Uint8Array;
  lineCounts: Uint16Array;
  criticalWidths: number[];
};

// ── cursor → character index mapping ──

function buildSegmentCharOffsets(segments: string[]): number[] {
  const offsets: number[] = new Array(segments.length + 1);
  let pos = 0;
  for (let i = 0; i < segments.length; i++) {
    offsets[i] = pos;
    pos += segments[i].length;
  }
  offsets[segments.length] = pos;
  return offsets;
}

// Cache grapheme offsets per segment for mid-segment cursors
const graphemeOffsetsCache = new Map<number, number[]>();
let segmentsRef: string[] = [];

function getGraphemeOffsets(segmentIndex: number): number[] {
  let offsets = graphemeOffsetsCache.get(segmentIndex);
  if (offsets) return offsets;

  const seg = segmentsRef[segmentIndex];
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  offsets = [];
  for (const { index } of segmenter.segment(seg)) {
    offsets.push(index);
  }
  graphemeOffsetsCache.set(segmentIndex, offsets);
  return offsets;
}

function cursorToCharIndex(
  cursor: LayoutCursor,
  segmentCharOffsets: number[]
): number {
  const base = segmentCharOffsets[cursor.segmentIndex];
  if (cursor.graphemeIndex === 0) return base;
  const graphemeOffsets = getGraphemeOffsets(cursor.segmentIndex);
  if (cursor.graphemeIndex < graphemeOffsets.length) {
    return base + graphemeOffsets[cursor.graphemeIndex];
  }
  // Past end of segment — return segment end
  return segmentCharOffsets[cursor.segmentIndex + 1];
}

// ── compute phase map ──

function computePhaseMap(
  prepared: PreparedTextWithSegments,
  segmentCharOffsets: number[]
): PhaseMap {
  const stepCount = MAX_WIDTH - MIN_WIDTH + 1;
  const textLength = TEXT.length;
  const data = new Uint8Array(stepCount * textLength);
  const lineCounts = new Uint16Array(stepCount);
  const criticalWidths: number[] = [];

  for (let row = 0; row < stepCount; row++) {
    const width = MIN_WIDTH + row;
    const result = layoutWithLines(prepared, width, LINE_HEIGHT);
    lineCounts[row] = result.lineCount;

    for (let lineIdx = 0; lineIdx < result.lines.length; lineIdx++) {
      const line = result.lines[lineIdx];
      const charStart = cursorToCharIndex(line.start, segmentCharOffsets);
      const charEnd = cursorToCharIndex(line.end, segmentCharOffsets);
      const end = Math.min(charEnd, textLength);
      for (let col = charStart; col < end; col++) {
        data[row * textLength + col] = lineIdx;
      }
    }

    if (row > 0 && lineCounts[row] !== lineCounts[row - 1]) {
      criticalWidths.push(width);
    }
  }

  return { minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH, stepCount, textLength, data, lineCounts, criticalWidths };
}

// ── render spectrogram ──

function renderSpectrogram(phaseMap: PhaseMap): void {
  const { stepCount, textLength, data, criticalWidths } = phaseMap;

  canvas.width = textLength;
  canvas.height = stepCount;

  const imageData = ctx.createImageData(textLength, stepCount);
  const pixels = imageData.data;

  const criticalSet = new Set(criticalWidths.map((w) => w - MIN_WIDTH));

  for (let row = 0; row < stepCount; row++) {
    const isCritical = criticalSet.has(row);
    for (let col = 0; col < textLength; col++) {
      const lineIndex = data[row * textLength + col];
      const offset = (row * textLength + col) * 4;

      // Alternating luminance — subtle, not harsh
      let lum: number;
      if (lineIndex % 3 === 0) lum = 32;
      else if (lineIndex % 3 === 1) lum = 58;
      else lum = 45;

      if (isCritical) {
        // Warm tint at phase transitions
        pixels[offset] = lum + 14;
        pixels[offset + 1] = lum + 2;
        pixels[offset + 2] = lum - 6;
      } else {
        pixels[offset] = lum;
        pixels[offset + 1] = lum;
        pixels[offset + 2] = lum;
      }
      pixels[offset + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── critical width marks on margin ──

function renderCriticalMarks(phaseMap: PhaseMap): void {
  // Remove old marks
  for (const el of canvasContainer.querySelectorAll(".critical-mark")) {
    el.remove();
  }

  const containerRect = canvas.getBoundingClientRect();

  for (const w of phaseMap.criticalWidths) {
    const row = w - MIN_WIDTH;
    const yFraction = row / phaseMap.stepCount;
    const yPx = containerRect.top + yFraction * containerRect.height;

    const mark = document.createElement("div");
    mark.className = "critical-mark";
    mark.style.top = `${yPx}px`;
    canvasContainer.appendChild(mark);
  }
}

// ── text panel update ──

function updateTextPanel(
  prepared: PreparedTextWithSegments,
  width: number
): void {
  const result = layoutWithLines(prepared, width, LINE_HEIGHT);

  metaWidth.textContent = `${width}px`;
  metaLines.textContent = `${result.lineCount} line${result.lineCount !== 1 ? "s" : ""}`;

  // Rebuild text lines
  textContent.innerHTML = "";
  for (const line of result.lines) {
    const div = document.createElement("div");
    div.className = "text-line";
    div.textContent = line.text;
    textContent.appendChild(div);
  }
}

// ── scan line positioning ──

function positionScanLine(row: number, stepCount: number): void {
  const rect = canvas.getBoundingClientRect();
  const yFraction = row / stepCount;
  const yPx = rect.top + yFraction * rect.height;
  scanLine.style.top = `${yPx}px`;
}

// ── main ──

async function main() {
  await document.fonts.ready;

  const prepared = prepareWithSegments(TEXT, FONT);
  segmentsRef = prepared.segments;

  const segmentCharOffsets = buildSegmentCharOffsets(prepared.segments);
  const phaseMap = computePhaseMap(prepared, segmentCharOffsets);

  renderSpectrogram(phaseMap);

  // Axis labels
  axisTop.textContent = `${MIN_WIDTH}px`;
  axisBottom.textContent = `${MAX_WIDTH}px`;

  // Initial render of marks and text
  renderCriticalMarks(phaseMap);
  updateTextPanel(prepared, MIN_WIDTH + Math.floor(phaseMap.stepCount / 2));
  positionScanLine(Math.floor(phaseMap.stepCount / 2), phaseMap.stepCount);

  // ── interaction state ──
  let hovering = false;
  let currentRow = Math.floor(phaseMap.stepCount / 2);
  let scanDirection = 1;
  let lastScanTime = 0;
  const SCAN_INTERVAL = 60; // ms per width step when auto-scanning

  // ── hover ──
  canvas.addEventListener("mousemove", (e) => {
    hovering = true;
    const rect = canvas.getBoundingClientRect();
    const yFraction = (e.clientY - rect.top) / rect.height;
    const row = Math.max(0, Math.min(phaseMap.stepCount - 1, Math.round(yFraction * phaseMap.stepCount)));
    currentRow = row;

    const width = MIN_WIDTH + row;
    positionScanLine(row, phaseMap.stepCount);
    updateTextPanel(prepared, width);
  });

  canvas.addEventListener("mouseleave", () => {
    hovering = false;
  });

  // ── auto-scan loop ──
  function tick(now: number) {
    if (!hovering) {
      if (now - lastScanTime > SCAN_INTERVAL) {
        currentRow += scanDirection;
        if (currentRow >= phaseMap.stepCount - 1) {
          currentRow = phaseMap.stepCount - 1;
          scanDirection = -1;
        } else if (currentRow <= 0) {
          currentRow = 0;
          scanDirection = 1;
        }

        const width = MIN_WIDTH + currentRow;
        positionScanLine(currentRow, phaseMap.stepCount);
        updateTextPanel(prepared, width);
        lastScanTime = now;
      }
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // ── resize ──
  window.addEventListener("resize", () => {
    renderCriticalMarks(phaseMap);
    positionScanLine(currentRow, phaseMap.stepCount);
  });
}

main();
