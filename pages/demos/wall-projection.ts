/**
 * The Wall Projection — animated text projection using Pretext layout.
 *
 * Projects fragments of text onto "the wall" element, simulating a slow
 * scroll through film notes, quotes, and commentary — the textual residue
 * of a screening programme at Da Capo Bar.
 */

import { prepare, layout, layoutWithLines } from "../../src/layout.ts";

// ── projection fragments ──
// A slow, cycling anthology of quotes, notes, and stray thoughts
// that might surface during a wall projection session.

const fragments: string[] = [
  `"Cinema is the art of showing nothing." — Robert Bresson`,

  `The projector hums. The wall receives. Between the two: everything that couldn't be said out loud.`,

  `Maya Deren wrote that cinema should make visible what the naked eye cannot see. The wall is patient enough.`,

  `A bar designed by Trix & Robert Haussmann, hidden under the tracks. You find it by accident or not at all.`,

  `UbuWeb taught a generation that distribution is a form of criticism. The wall is our local mirror.`,

  `"I am kino-eye. I create a man more perfect than Adam." — Dziga Vertov, 1923`,

  `The interval between clips is the real content. Someone says something. Someone disagrees. The projector waits.`,

  `Chris Marker's La Jetée: an entire film made of still photographs, except for one moment when she blinks.`,

  `Harun Farocki spent his life watching how images work. We spend a Sunday afternoon doing the same.`,

  `The Kronenhalle is across the river, full. The Da Capo is under the station, empty. We prefer it that way.`,

  `Kenneth Goldsmith: all intellectual work is the same — the way it relates to existing work in the field.`,

  `A 2½-hour scroll. Someone's laptop connected to the projector. The playlist is the argument.`,

  `Jonas Mekas filmed everything. "I have the impression that what I am filming will never happen again."`,

  `Zürich HB: 2,915 trains per day. Below the concourse, a bar where time runs at a different speed.`,

  `The children's cinema runs here on some Sundays. We inherited the wall.`,

  `Chantal Akerman's Jeanne Dielman: 201 minutes of domestic routine as a radical formal act.`,

  `"What is a screen? A wall you can see through." — Hito Steyerl, after a drink or two.`,
];

// ── wall renderer ──

const wall = document.getElementById("wall");
if (!wall) throw new Error("Missing #wall element");

const FONT = '17px/2.0 "EB Garamond", Georgia, serif';
const MEASURE_FONT = '17px "EB Garamond", Georgia, serif';
const LINE_HEIGHT = 34;
const MAX_VISIBLE_LINES = 7;

interface WallState {
  lines: string[];
  currentFragment: number;
  charIndex: number;
  phase: "typing" | "pause" | "fading";
  pauseStart: number;
  lastTick: number;
}

const state: WallState = {
  lines: [],
  currentFragment: 0,
  charIndex: 0,
  phase: "typing",
  pauseStart: 0,
  lastTick: 0,
};

function getWallWidth(): number {
  return wall.clientWidth - 72; // account for padding
}

function reflowFragment(text: string): string[] {
  const width = getWallWidth();
  if (width <= 0) return [text];
  const handle = prepare(text, MEASURE_FONT);
  const result = layoutWithLines(handle, width, LINE_HEIGHT);
  return result.lines.map((l) => l.text);
}

function renderWall() {
  // Build the text up to current charIndex
  const fullText = fragments[state.currentFragment];
  const visibleText = fullText.slice(0, state.charIndex);

  // Lay out the visible portion
  const visibleLines = visibleText ? reflowFragment(visibleText) : [""];

  // Combine with previously completed fragments (keep last few)
  const allLines = [...state.lines, ...visibleLines];

  // Only show the last MAX_VISIBLE_LINES
  const displayLines = allLines.slice(-MAX_VISIBLE_LINES);
  const totalLines = allLines.length;

  wall.innerHTML = "";

  displayLines.forEach((line, i) => {
    const div = document.createElement("div");
    div.className = "wall-line";
    div.textContent = line;

    // Dim older lines
    const globalIndex = totalLines - displayLines.length + i;
    const age = totalLines - 1 - globalIndex;

    if (age > 4) {
      div.classList.add("dim");
    }

    // The last line of the current fragment gets the cursor during typing
    const isLastLine =
      i === displayLines.length - 1 && state.phase === "typing";
    if (isLastLine) {
      const cursor = document.createElement("span");
      cursor.className = "wall-cursor";
      div.appendChild(cursor);
    }

    // Stagger visibility
    requestAnimationFrame(() => {
      div.classList.add("visible");
    });

    wall.appendChild(div);
  });
}

function tick(now: number) {
  if (!state.lastTick) state.lastTick = now;

  const fullText = fragments[state.currentFragment];

  switch (state.phase) {
    case "typing": {
      // Variable typing speed: faster for spaces, slower for punctuation
      const char = fullText[state.charIndex - 1] || "";
      let delay = 38;
      if (char === " ") delay = 20;
      if (char === "." || char === "," || char === "—" || char === ":") delay = 120;
      if (char === '"') delay = 80;

      if (now - state.lastTick > delay) {
        state.charIndex++;
        state.lastTick = now;

        if (state.charIndex > fullText.length) {
          state.phase = "pause";
          state.pauseStart = now;
        }

        renderWall();
      }
      break;
    }

    case "pause": {
      // Hold the completed fragment for a few seconds
      if (now - state.pauseStart > 3500) {
        // Archive this fragment's lines
        const fragmentLines = reflowFragment(fullText);
        state.lines.push(...fragmentLines, ""); // empty line between fragments

        // Move to next fragment
        state.currentFragment =
          (state.currentFragment + 1) % fragments.length;
        state.charIndex = 0;
        state.phase = "typing";
        state.lastTick = now;
      }
      break;
    }
  }

  requestAnimationFrame(tick);
}

// Start the projection
renderWall();
requestAnimationFrame(tick);
