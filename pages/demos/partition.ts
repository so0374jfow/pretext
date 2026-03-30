/**
 * Partition — Drahtmodell.
 *
 * Navigable wireframe architecture built from text.
 * Walls, beams, slabs, and columns rendered as CSS 3D wireframe
 * volumes with point-lit edges. Text is inscribed on structural
 * faces, laid out by Pretext at each surface's width.
 */

import {
  prepareWithSegments,
  layoutWithLines,
} from "../../src/layout.ts";

// ── fragments ──

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
  "Habitation precedes architecture. The plan arrives after the fact.",
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
const FOG_NEAR = 300;
const FOG_FAR = 3200;
const MOVE_SPEED = 5;
const LOOK_SENSITIVITY = 0.0018;

// Light sources
const LIGHTS = [
  { x: 200, y: -600, z: -400, intensity: 1.0, radius: 2000, warm: true },
  { x: -500, y: -300, z: 800, intensity: 0.6, radius: 1800, warm: false },
  { x: 100, y: -1200, z: -200, intensity: 0.4, radius: 2200, warm: true },
];

// ── PRNG ──

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0xcafe_babe);
const rand = (lo: number, hi: number) => lo + rng() * (hi - lo);
const pick = <T>(a: T[]): T => a[Math.floor(rng() * a.length)];

// ── architectural element types ──

type ArchKind = "beam" | "wall" | "slab" | "column" | "brace" | "cantilever";

type ArchElement = {
  x: number; y: number; z: number;
  w: number; h: number; d: number; // width, height, depth of the box
  rx: number; ry: number; rz: number;
  kind: ArchKind;
  text: string | null; // null = no text, wireframe only
  textFace: "front" | "back" | "left" | "right" | "top" | "bottom";
  fontSize: number;
  lineHeight: number;
};

// ── generate architecture ──

function generateArchitecture(): ArchElement[] {
  const els: ArchElement[] = [];

  // ── structural columns (vertical) ──
  for (let i = 0; i < 28; i++) {
    const x = rand(-1800, 1800);
    const z = rand(-2400, 2400);
    const h = rand(300, 900);
    const thick = rand(12, 35);
    els.push({
      x, y: -h / 2 - rand(0, 200), z,
      w: thick, h, d: thick,
      rx: rand(-3, 3), ry: rand(-8, 8), rz: rand(-4, 4),
      kind: "column",
      text: rng() > 0.65 ? pick(FRAGMENTS) : null,
      textFace: "front",
      fontSize: rand(8, 11), lineHeight: rand(12, 16),
    });
  }

  // ── horizontal beams ──
  for (let i = 0; i < 35; i++) {
    const x = rand(-1600, 1600);
    const z = rand(-2200, 2200);
    const length = rand(200, 800);
    const thick = rand(8, 22);
    const ry = rand(-90, 90);
    const level = -rand(100, 800);
    els.push({
      x, y: level, z,
      w: length, h: thick, d: thick,
      rx: rand(-6, 6), ry, rz: rand(-4, 4),
      kind: "beam",
      text: rng() > 0.5 ? pick(FRAGMENTS) : null,
      textFace: rng() > 0.5 ? "front" : "top",
      fontSize: rand(8, 12), lineHeight: rand(12, 18),
    });
  }

  // ── wall fragments ──
  for (let i = 0; i < 22; i++) {
    const x = rand(-1500, 1500);
    const z = rand(-2000, 2000);
    const w = rand(180, 600);
    const h = rand(150, 450);
    const d = rand(4, 14);
    const level = -rand(0, 600);
    els.push({
      x, y: level, z,
      w, h, d,
      rx: rand(-8, 8), ry: rand(-30, 30), rz: rand(-5, 5),
      kind: "wall",
      text: pick(FRAGMENTS),
      textFace: rng() > 0.5 ? "front" : "back",
      fontSize: rand(10, 16), lineHeight: rand(15, 24),
    });
  }

  // ── floor/ceiling slabs ──
  for (let i = 0; i < 16; i++) {
    const x = rand(-1400, 1400);
    const z = rand(-1800, 1800);
    const w = rand(200, 500);
    const d = rand(150, 400);
    const thick = rand(4, 12);
    const level = -rand(-50, 900);
    els.push({
      x, y: level, z,
      w, h: thick, d,
      rx: rand(-6, 6), ry: rand(-15, 15), rz: rand(-3, 3),
      kind: "slab",
      text: rng() > 0.4 ? pick(FRAGMENTS) : null,
      textFace: "top",
      fontSize: rand(9, 13), lineHeight: rand(13, 19),
    });
  }

  // ── diagonal braces ──
  for (let i = 0; i < 18; i++) {
    const x = rand(-1600, 1600);
    const z = rand(-2200, 2200);
    const length = rand(250, 700);
    const thick = rand(6, 16);
    els.push({
      x, y: -rand(100, 600), z,
      w: length, h: thick, d: thick,
      rx: rand(-45, 45), ry: rand(-60, 60), rz: rand(-30, 30),
      kind: "brace",
      text: rng() > 0.7 ? pick(FRAGMENTS) : null,
      textFace: "front",
      fontSize: rand(7, 10), lineHeight: rand(10, 14),
    });
  }

  // ── cantilevers (jutting horizontal planes) ──
  for (let i = 0; i < 12; i++) {
    const x = rand(-1200, 1200);
    const z = rand(-1800, 1800);
    const w = rand(300, 600);
    const d = rand(80, 200);
    const thick = rand(4, 10);
    els.push({
      x, y: -rand(200, 700), z,
      w, h: thick, d,
      rx: rand(-12, 12), ry: rand(-20, 20), rz: rand(5, 25) * (rng() > 0.5 ? 1 : -1),
      kind: "cantilever",
      text: rng() > 0.5 ? pick(FRAGMENTS) : null,
      textFace: "top",
      fontSize: rand(9, 13), lineHeight: rand(14, 20),
    });
  }

  return els;
}

// ── compute lighting for a point ──

function computeLight(px: number, py: number, pz: number, nx: number, ny: number, nz: number): { r: number; g: number; b: number; a: number } {
  let totalR = 0, totalG = 0, totalB = 0;
  const ambient = 0.08;

  for (const light of LIGHTS) {
    const dx = light.x - px;
    const dy = light.y - py;
    const dz = light.z - pz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > light.radius) continue;

    // Normalize direction to light
    const inv = 1 / (dist || 1);
    const lx = dx * inv, ly = dy * inv, lz = dz * inv;

    // Lambertian diffuse (abs for double-sided)
    const dot = Math.abs(nx * lx + ny * ly + nz * lz);

    // Distance attenuation
    const atten = 1 - Math.min(1, dist / light.radius);
    const brightness = dot * atten * atten * light.intensity;

    if (light.warm) {
      totalR += brightness * 1.0;
      totalG += brightness * 0.92;
      totalB += brightness * 0.78;
    } else {
      totalR += brightness * 0.8;
      totalG += brightness * 0.88;
      totalB += brightness * 1.0;
    }
  }

  const r = Math.min(1, ambient + totalR);
  const g = Math.min(1, ambient + totalG);
  const b = Math.min(1, ambient + totalB);
  const a = Math.min(0.85, 0.1 + (totalR + totalG + totalB) * 0.6);

  return { r, g, b, a };
}

function lightColor(px: number, py: number, pz: number, nx: number, ny: number, nz: number): string {
  const { r, g, b, a } = computeLight(px, py, pz, nx, ny, nz);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(3)})`;
}

function lightGlow(px: number, py: number, pz: number): string {
  const { r, g, b } = computeLight(px, py, pz, 0, -1, 0);
  const brightness = r + g + b;
  if (brightness < 0.4) return "none";
  const glowA = Math.min(0.08, brightness * 0.03);
  return `0 0 12px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${glowA.toFixed(3)})`;
}

// ── build a wireframe box ──

function buildWireframeBox(el: ArchElement, world: HTMLElement): HTMLElement {
  const { w, h, d } = el;
  const container = document.createElement("div");
  container.className = "wf";
  container.style.transform = [
    `translate3d(${el.x}px, ${el.y}px, ${el.z}px)`,
    `rotateX(${el.rx}deg)`,
    `rotateY(${el.ry}deg)`,
    `rotateZ(${el.rz}deg)`,
  ].join(" ");

  // Face definitions: [transform, width, height, normal (nx, ny, nz), name]
  type FaceDef = { t: string; fw: number; fh: number; nx: number; ny: number; nz: number; name: string };
  const faces: FaceDef[] = [
    { t: `translateZ(${d / 2}px)`, fw: w, fh: h, nx: 0, ny: 0, nz: 1, name: "front" },
    { t: `translateZ(${-d / 2}px) rotateY(180deg)`, fw: w, fh: h, nx: 0, ny: 0, nz: -1, name: "back" },
    { t: `translateX(${-w / 2}px) rotateY(-90deg)`, fw: d, fh: h, nx: -1, ny: 0, nz: 0, name: "left" },
    { t: `translateX(${w / 2}px) rotateY(90deg)`, fw: d, fh: h, nx: 1, ny: 0, nz: 0, name: "right" },
    { t: `translateY(${-h / 2}px) rotateX(90deg)`, fw: w, fh: d, nx: 0, ny: -1, nz: 0, name: "top" },
    { t: `translateY(${h / 2}px) rotateX(-90deg)`, fw: w, fh: d, nx: 0, ny: 1, nz: 0, name: "bottom" },
  ];

  for (const f of faces) {
    const face = document.createElement("div");
    face.className = "face";
    face.style.width = `${f.fw}px`;
    face.style.height = `${f.fh}px`;
    face.style.left = `${-f.fw / 2}px`;
    face.style.top = `${-f.fh / 2}px`;
    face.style.transform = f.t;

    // Compute lighting for this face
    const color = lightColor(el.x, el.y, el.z, f.nx, f.ny, f.nz);
    face.style.borderColor = color;
    const glow = lightGlow(el.x, el.y, el.z);
    if (glow !== "none") face.style.boxShadow = glow;

    // Add text to the designated face
    if (el.text && f.name === el.textFace && f.fw > 60 && f.fh > 30) {
      const textContainer = document.createElement("div");
      textContainer.className = "face-text";
      const font = `${Math.round(el.fontSize)}px ${FONT_FAMILY}`;
      const prepared = prepareWithSegments(el.text, font);
      const textWidth = Math.max(40, f.fw - 20);
      const result = layoutWithLines(prepared, textWidth, el.lineHeight);

      // Compute text color from light
      const { r, g, b } = computeLight(el.x, el.y, el.z, f.nx, f.ny, f.nz);
      const textAlpha = Math.min(0.7, 0.15 + (r + g + b) * 0.3);
      const textColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${textAlpha.toFixed(2)})`;

      for (const line of result.lines) {
        const lineEl = document.createElement("div");
        lineEl.className = "tl";
        lineEl.style.font = `${Math.round(el.fontSize)}px/${el.lineHeight}px ${FONT_FAMILY}`;
        lineEl.style.color = textColor;
        lineEl.textContent = line.text;
        textContainer.appendChild(lineEl);
      }
      face.appendChild(textContainer);
    }

    container.appendChild(face);
  }

  world.appendChild(container);
  return container;
}

// ── ground grid ──

function buildGroundGrid(world: HTMLElement): void {
  const size = 4000;
  const step = 200;
  const y = 100; // ground level

  for (let i = -size; i <= size; i += step) {
    // X-axis lines
    const lineX = document.createElement("div");
    lineX.className = "grid-line";
    lineX.style.width = `${size * 2}px`;
    lineX.style.height = "1px";
    lineX.style.transform = `translate3d(${-size}px, ${y}px, ${i}px) rotateX(0deg)`;
    world.appendChild(lineX);

    // Z-axis lines
    const lineZ = document.createElement("div");
    lineZ.className = "grid-line";
    lineZ.style.width = "1px";
    lineZ.style.height = `${size * 2}px`;
    lineZ.style.transform = `translate3d(${i}px, ${y}px, ${-size}px) rotateX(90deg)`;
    lineZ.style.transformOrigin = "top";
    world.appendChild(lineZ);
  }
}

// ── light markers ──

function buildLightMarkers(world: HTMLElement): void {
  for (const light of LIGHTS) {
    const marker = document.createElement("div");
    marker.className = "light-marker";
    marker.style.transform = `translate3d(${light.x - 2}px, ${light.y - 2}px, ${light.z}px)`;
    const alpha = light.warm ? "255, 240, 210" : "200, 215, 255";
    marker.style.background = `rgba(${alpha}, ${0.6 * light.intensity})`;
    marker.style.boxShadow = [
      `0 0 ${30 * light.intensity}px ${8 * light.intensity}px rgba(${alpha}, ${0.15 * light.intensity})`,
      `0 0 ${80 * light.intensity}px ${25 * light.intensity}px rgba(${alpha}, ${0.05 * light.intensity})`,
    ].join(", ");
    world.appendChild(marker);
  }
}

// ── DOM ──

const viewport = document.getElementById("viewport")!;
const world = document.getElementById("world")!;
const hud = document.getElementById("hud")!;
const depthEl = document.getElementById("depth-indicator")!;
const titleOverlay = document.getElementById("title-overlay")!;

// ── camera ──

const camera = { x: 0, y: -250, z: -100, rotX: 0, rotY: 0 };

// ── input ──

const keys: Record<string, boolean> = {};
let pointerLocked = false;
let hasInteracted = false;

document.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

viewport.addEventListener("click", () => {
  if (!pointerLocked) viewport.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === viewport;
  if (pointerLocked && !hasInteracted) {
    hasInteracted = true;
    titleOverlay.classList.add("hidden");
    setTimeout(() => hud.classList.add("faded"), 5000);
  }
});

document.addEventListener("mousemove", (e) => {
  if (!pointerLocked) return;
  camera.rotY += e.movementX * LOOK_SENSITIVITY;
  camera.rotX -= e.movementY * LOOK_SENSITIVITY;
  camera.rotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, camera.rotX));
});

// ── update ──

function updateCamera(): void {
  const cosY = Math.cos(camera.rotY);
  const sinY = Math.sin(camera.rotY);
  let dx = 0, dz = 0, dy = 0;

  if (keys["w"]) { dz -= cosY; dx += sinY; }
  if (keys["s"]) { dz += cosY; dx -= sinY; }
  if (keys["a"]) { dx -= cosY; dz -= sinY; }
  if (keys["d"]) { dx += cosY; dz += sinY; }
  if (keys[" "] || keys["e"]) dy -= 1;
  if (keys["shift"] || keys["q"]) dy += 1;

  const len = Math.sqrt(dx * dx + dz * dz + dy * dy);
  if (len > 0) {
    const inv = MOVE_SPEED / len;
    camera.x += dx * inv;
    camera.y += dy * inv;
    camera.z += dz * inv;
  }
}

type LiveEl = { el: HTMLElement; x: number; y: number; z: number };

function updateFog(elements: LiveEl[]): void {
  for (const p of elements) {
    const ddx = p.x - camera.x;
    const ddy = p.y - camera.y;
    const ddz = p.z - camera.z;
    const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
    let o = dist < FOG_NEAR ? 1 : dist > FOG_FAR ? 0 : 1 - (dist - FOG_NEAR) / (FOG_FAR - FOG_NEAR);
    o = o * o; // quadratic falloff
    p.el.style.opacity = String(Math.max(0, Math.min(1, o)));
  }
}

function applyCamera(): void {
  world.style.transform = [
    `rotateX(${-camera.rotX}rad)`,
    `rotateY(${-camera.rotY}rad)`,
    `translate3d(${-camera.x}px, ${-camera.y}px, ${-camera.z}px)`,
  ].join(" ");
}

// ── main ──

async function main() {
  await document.fonts.ready;

  viewport.style.perspective = "600px";
  viewport.style.perspectiveOrigin = "50% 50%";

  // Build scene
  buildGroundGrid(world);
  buildLightMarkers(world);

  const archElements = generateArchitecture();
  const liveElements: LiveEl[] = [];

  for (const el of archElements) {
    const domEl = buildWireframeBox(el, world);
    liveElements.push({ el: domEl, x: el.x, y: el.y, z: el.z });
  }

  // Initial position
  camera.z = -200;
  camera.y = -300;

  let fogTimer = 0;

  function frame() {
    updateCamera();
    applyCamera();

    // Update fog every 3 frames for performance
    fogTimer++;
    if (fogTimer % 3 === 0) {
      updateFog(liveElements);
    }

    depthEl.textContent = `${Math.round(-camera.y)}m`;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
