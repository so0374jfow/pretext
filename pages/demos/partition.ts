/**
 * Partition — navigable 3D text-space.
 *
 * A dense, self-accreting structure of text planes in CSS 3D space.
 * First-person navigation through corridors, shafts, and stacked
 * chambers made entirely of text laid out by Pretext.
 */

import {
  prepareWithSegments,
  layoutWithLines,
  type PreparedTextWithSegments,
} from "../../src/layout.ts";

// ── text fragments ──
// Architectural observations that undermine their own spatial claims.

const FRAGMENTS: string[] = [
  "The wall that supports also divides. The division that separates also connects.",

  "There is no ground floor. Every foundation rests on a prior occupation.",

  "The corridor promises arrival but delivers only more corridor.",

  "A door is not an opening. A door is the memory of a wall that failed.",

  "What you call structure is the residue of forces that have already left.",

  "The ceiling of one room is the floor of a room that does not acknowledge it.",

  "To inhabit is to be inhabited. The occupant is also occupied.",

  "Light enters not through the window but through the absence the window names.",

  "Every load-bearing wall carries also the weight of its own illegibility.",

  "The staircase connects two levels while belonging to neither.",

  "Density is not a quantity. It is the impossibility of distinguishing one space from the next.",

  "The plan is a promise the building has already broken.",

  "No surface here is original. Every wall is a palimpsest of partitions.",

  "What was removed to make this room was itself a room.",

  "The threshold is not where you cross. The threshold is where crossing becomes impossible.",

  "Concrete does not forget. It remembers in cracks.",

  "The address is a fiction. Inside, there are only more insides.",

  "Ventilation is the building breathing against itself.",

  "The corridor turns. Not because someone designed a turn, but because two walls met without agreeing.",

  "You are not lost. Orientation was never available here.",

  "The trace of the demolished is the structure of what remains.",

  "A room this size should not exist. It exists by not being measured.",

  "The pipes carry water to places the architect never intended.",

  "Habitation precedes architecture. The plan arrives after the fact to explain what was already built.",

  "What you call a wall is two surfaces that have never met.",

  "Occupation is always double: to fill a space and to seize it.",

  "The building does not end. It becomes adjacent to something it cannot distinguish from itself.",

  "Every horizontal is a suppressed vertical.",

  "The interior has no exterior. There is only a more distant interior.",

  "Sound moves through this structure as if the walls were suggestions.",

  "To demolish one room is to create six surfaces.",

  "The city wrote this building in a language it cannot read.",
];

// ── config ──

const FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const PLANE_COUNT = 90;
const FOG_NEAR = 200;
const FOG_FAR = 2800;
const MOVE_SPEED = 4.5;
const LOOK_SENSITIVITY = 0.0018;
const CITY_RADIUS_X = 1600;
const CITY_RADIUS_Z = 2400;
const CITY_HEIGHT = 1800;

// ── DOM ──

const viewport = document.getElementById("viewport")!;
const world = document.getElementById("world")!;
const hud = document.getElementById("hud")!;
const depthEl = document.getElementById("depth-indicator")!;
const titleOverlay = document.getElementById("title-overlay")!;

// ── camera ──

const camera = {
  x: 0,
  y: -200,
  z: 0,
  rotX: 0, // pitch
  rotY: 0, // yaw
};

// ── seeded PRNG for deterministic layout ──

function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0xdeadbeef);

function randRange(lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── plane types for variety ──

type PlaneKind =
  | "wall-x" // perpendicular to X (side walls)
  | "wall-z" // perpendicular to Z (front/back walls)
  | "floor" // horizontal
  | "ceiling" // horizontal overhead
  | "lean"; // tilted, unstable

// ── generate city ──

type TextPlane = {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  text: string;
  kind: PlaneKind;
  color: string;
  bgAlpha: number;
};

function generatePlanes(): TextPlane[] {
  const planes: TextPlane[] = [];

  // ── corridors: pairs of parallel walls ──
  const corridorCount = 6;
  for (let c = 0; c < corridorCount; c++) {
    const cz = randRange(-CITY_RADIUS_Z * 0.8, CITY_RADIUS_Z * 0.8);
    const cx = randRange(-CITY_RADIUS_X * 0.4, CITY_RADIUS_X * 0.4);
    const corridorLen = randRange(600, 1200);
    const corridorWidth = randRange(120, 280);
    const levels = Math.floor(randRange(2, 5));

    for (let level = 0; level < levels; level++) {
      const cy = -(level * randRange(200, 350));

      // Left wall
      planes.push({
        x: cx - corridorWidth / 2,
        y: cy,
        z: cz,
        rotX: 0,
        rotY: 90,
        rotZ: 0,
        width: Math.floor(corridorLen * 0.6),
        height: 200,
        fontSize: randRange(11, 15),
        lineHeight: randRange(18, 24),
        text: pick(FRAGMENTS),
        kind: "wall-x",
        color: `hsl(0, 0%, ${randRange(50, 80)}%)`,
        bgAlpha: randRange(0.03, 0.08),
      });

      // Right wall
      planes.push({
        x: cx + corridorWidth / 2,
        y: cy,
        z: cz + randRange(-100, 100),
        rotX: 0,
        rotY: -90,
        rotZ: 0,
        width: Math.floor(corridorLen * 0.5),
        height: 180,
        fontSize: randRange(10, 14),
        lineHeight: randRange(16, 22),
        text: pick(FRAGMENTS),
        kind: "wall-x",
        color: `hsl(0, 0%, ${randRange(45, 75)}%)`,
        bgAlpha: randRange(0.02, 0.06),
      });

      // Floor between walls
      if (rng() > 0.5) {
        planes.push({
          x: cx,
          y: cy + 100,
          z: cz,
          rotX: -90,
          rotY: 0,
          rotZ: 0,
          width: Math.floor(corridorWidth * 0.8),
          height: Math.floor(corridorLen * 0.3),
          fontSize: randRange(9, 12),
          lineHeight: randRange(14, 18),
          text: pick(FRAGMENTS),
          kind: "floor",
          color: `hsl(0, 0%, ${randRange(30, 50)}%)`,
          bgAlpha: randRange(0.02, 0.05),
        });
      }
    }
  }

  // ── scattered planes filling the volume ──
  const remaining = PLANE_COUNT - planes.length;
  for (let i = 0; i < remaining; i++) {
    const kind = pick<PlaneKind>([
      "wall-x",
      "wall-z",
      "wall-z",
      "floor",
      "ceiling",
      "lean",
    ]);
    const fontSize = randRange(9, 18);
    const lineHeight = Math.round(fontSize * randRange(1.4, 1.9));
    let rotX = 0,
      rotY = 0,
      rotZ = 0;
    let w = 0,
      h = 0;

    switch (kind) {
      case "wall-x":
        rotY = rng() > 0.5 ? 90 : -90;
        w = Math.floor(randRange(180, 500));
        h = Math.floor(randRange(120, 300));
        break;
      case "wall-z":
        rotY = randRange(-15, 15);
        w = Math.floor(randRange(200, 550));
        h = Math.floor(randRange(100, 280));
        break;
      case "floor":
        rotX = -90;
        w = Math.floor(randRange(200, 450));
        h = Math.floor(randRange(150, 350));
        break;
      case "ceiling":
        rotX = 90;
        w = Math.floor(randRange(180, 400));
        h = Math.floor(randRange(120, 300));
        break;
      case "lean":
        rotX = randRange(-35, 35);
        rotY = randRange(-45, 45);
        rotZ = randRange(-12, 12);
        w = Math.floor(randRange(160, 420));
        h = Math.floor(randRange(100, 260));
        break;
    }

    const y =
      kind === "ceiling"
        ? -randRange(300, CITY_HEIGHT)
        : kind === "floor"
          ? randRange(-50, 200)
          : -randRange(-100, CITY_HEIGHT * 0.7);

    planes.push({
      x: randRange(-CITY_RADIUS_X, CITY_RADIUS_X),
      y,
      z: randRange(-CITY_RADIUS_Z, CITY_RADIUS_Z),
      rotX,
      rotY,
      rotZ,
      width: w,
      height: h,
      fontSize,
      lineHeight,
      text: pick(FRAGMENTS),
      kind,
      color: `hsl(0, 0%, ${randRange(40, 85)}%)`,
      bgAlpha: randRange(0.02, 0.1),
    });
  }

  return planes;
}

// ── build DOM planes ──

type LivePlane = {
  el: HTMLElement;
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
};

async function buildScene(): Promise<LivePlane[]> {
  await document.fonts.ready;

  const defs = generatePlanes();
  const live: LivePlane[] = [];

  for (const def of defs) {
    const font = `${Math.round(def.fontSize)}px ${FONT_FAMILY}`;
    const prepared = prepareWithSegments(def.text, font);
    const result = layoutWithLines(prepared, def.width, def.lineHeight);

    const el = document.createElement("div");
    el.className = "plane";
    el.style.width = `${def.width}px`;
    el.style.background = `rgba(8, 8, 8, ${def.bgAlpha})`;

    for (const line of result.lines) {
      const lineEl = document.createElement("div");
      lineEl.className = "plane-text";
      lineEl.style.font = `${Math.round(def.fontSize)}px/${def.lineHeight}px ${FONT_FAMILY}`;
      lineEl.style.color = def.color;
      lineEl.textContent = line.text;
      el.appendChild(lineEl);
    }

    // Position via 3D transform
    el.style.transform = [
      `translate3d(${def.x}px, ${def.y}px, ${def.z}px)`,
      `rotateX(${def.rotX}deg)`,
      `rotateY(${def.rotY}deg)`,
      `rotateZ(${def.rotZ}deg)`,
      `translate(-50%, -50%)`,
    ].join(" ");

    world.appendChild(el);
    live.push({
      el,
      x: def.x,
      y: def.y,
      z: def.z,
      rotX: def.rotX,
      rotY: def.rotY,
      rotZ: def.rotZ,
    });
  }

  return live;
}

// ── input ──

const keys: Record<string, boolean> = {};
let pointerLocked = false;
let hasInteracted = false;

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

viewport.addEventListener("click", () => {
  if (!pointerLocked) {
    viewport.requestPointerLock();
  }
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === viewport;
  if (pointerLocked && !hasInteracted) {
    hasInteracted = true;
    titleOverlay.classList.add("hidden");
    setTimeout(() => hud.classList.add("faded"), 6000);
  }
});

document.addEventListener("mousemove", (e) => {
  if (!pointerLocked) return;
  camera.rotY += e.movementX * LOOK_SENSITIVITY;
  camera.rotX -= e.movementY * LOOK_SENSITIVITY;
  // Clamp pitch
  camera.rotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, camera.rotX));
});

// ── update loop ──

function updateCamera(): void {
  const cosY = Math.cos(camera.rotY);
  const sinY = Math.sin(camera.rotY);

  let dx = 0,
    dz = 0,
    dy = 0;

  if (keys["w"]) {
    dz -= cosY;
    dx += sinY;
  }
  if (keys["s"]) {
    dz += cosY;
    dx -= sinY;
  }
  if (keys["a"]) {
    dx -= cosY;
    dz -= sinY;
  }
  if (keys["d"]) {
    dx += cosY;
    dz += sinY;
  }
  if (keys[" "] || keys["e"]) dy -= 1; // rise
  if (keys["shift"] || keys["q"]) dy += 1; // descend

  const len = Math.sqrt(dx * dx + dz * dz + dy * dy);
  if (len > 0) {
    const inv = MOVE_SPEED / len;
    camera.x += dx * inv;
    camera.y += dy * inv;
    camera.z += dz * inv;
  }
}

function updateFog(planes: LivePlane[]): void {
  const cx = camera.x,
    cy = camera.y,
    cz = camera.z;

  for (const p of planes) {
    const ddx = p.x - cx;
    const ddy = p.y - cy;
    const ddz = p.z - cz;
    const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);

    // Fog: opacity falls from 1 to 0 between FOG_NEAR and FOG_FAR
    let opacity: number;
    if (dist < FOG_NEAR) {
      opacity = 1;
    } else if (dist > FOG_FAR) {
      opacity = 0;
    } else {
      opacity = 1 - (dist - FOG_NEAR) / (FOG_FAR - FOG_NEAR);
    }
    // Cubic falloff for more cinematic fog
    opacity = opacity * opacity * opacity;

    p.el.style.opacity = String(Math.max(0, Math.min(1, opacity)));
  }
}

function applyCamera(): void {
  // Inverse camera transform: rotate then translate
  const transform = [
    `rotateX(${-camera.rotX}rad)`,
    `rotateY(${-camera.rotY}rad)`,
    `translate3d(${-camera.x}px, ${-camera.y}px, ${-camera.z}px)`,
  ].join(" ");

  world.style.transform = transform;
}

// ── depth indicator ──

function updateHUD(): void {
  const depth = Math.round(-camera.y);
  depthEl.textContent = `${depth >= 0 ? "+" : ""}${depth}m`;
}

// ── main loop ──

async function main() {
  const planes = await buildScene();

  // Set perspective dynamically
  viewport.style.perspective = "600px";
  viewport.style.perspectiveOrigin = "50% 50%";

  // Initial camera look
  camera.rotY = 0;
  camera.z = -200;

  function frame() {
    updateCamera();
    applyCamera();
    updateFog(planes);
    updateHUD();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
