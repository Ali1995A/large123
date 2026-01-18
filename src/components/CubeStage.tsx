"use client";

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useEffect, useMemo, useRef } from "react";
import type { ReferenceObject } from "@/lib/references";
import { chooseUnitForValue, computeGridForCount, estimateBlockDimensionsCm } from "@/lib/blockLayout";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

let gridTexture10: THREE.CanvasTexture | null = null;
function getFaceGridTexture10() {
  if (typeof window === "undefined") return null;
  if (gridTexture10) return gridTexture10;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(219,46,123,0.55)";
  ctx.lineWidth = 2;

  const inset = 18;
  const span = size - inset * 2;
  for (let i = 1; i < 10; i++) {
    const t = inset + (span * i) / 10;
    ctx.beginPath();
    ctx.moveTo(inset, t);
    ctx.lineTo(size - inset, t);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(t, inset);
    ctx.lineTo(t, size - inset);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  gridTexture10 = tex;
  return tex;
}

function formatLabel(value: bigint) {
  const s = value.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function createLabelTexture(text: string) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  drawRoundedRect(ctx, 18, 86, size - 36, 84, 22);
  ctx.fill();

  ctx.fillStyle = "#9b1c4b";
  ctx.font = "700 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function buildInstancedUnitBlock({
  parent,
  cubeSize,
  value,
}: {
  parent: THREE.Object3D;
  cubeSize: number;
  value: bigint;
}) {
  const group = new THREE.Group();
  parent.add(group);

  const unit = chooseUnitForValue(value);
  const count = Math.max(1, Number(unit.unitCount));

  const unitSide = unit.unitSideCm * cubeSize;
  const bevel = Math.max(unitSide * 0.09, cubeSize * 0.12);
  const geometry = new RoundedBoxGeometry(unitSide, unitSide, unitSide, 4, bevel);

  const fill = new THREE.MeshPhysicalMaterial({
    color: 0xff5aa5,
    roughness: 0.25,
    metalness: 0.02,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
  });
  fill.polygonOffset = true;
  fill.polygonOffsetFactor = 1;
  fill.polygonOffsetUnits = 1;

  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0xdb2e7b,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.9,
  });

  const mesh = new THREE.InstancedMesh(geometry.clone(), fill, count);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;

  const outlineMesh = new THREE.InstancedMesh(geometry.clone(), outlineMat, count);
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;
  outlineMesh.renderOrder = 1;
  outlineMesh.frustumCulled = false;

  let faceGridMesh: THREE.InstancedMesh | null = null;
  if (unit.unitValue === 1000n && count <= 800) {
    const tex = getFaceGridTexture10();
    if (tex) {
      const gridMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      faceGridMesh = new THREE.InstancedMesh(geometry.clone(), gridMat, count);
      faceGridMesh.castShadow = false;
      faceGridMesh.receiveShadow = false;
      faceGridMesh.renderOrder = 2;
      faceGridMesh.frustumCulled = false;
    }
  }

  const { gridX, gridZ } = computeGridForCount(count);
  const halfX = (gridX * unitSide) / 2;
  const halfZ = (gridZ * unitSide) / 2;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const outlineScale = new THREE.Vector3(1.055, 1.055, 1.055);

  for (let i = 0; i < count; i++) {
    const layer = Math.floor(i / (gridX * gridZ));
    const within = i % (gridX * gridZ);
    const x = within % gridX;
    const z = Math.floor(within / gridX);
    const y = layer;

    position.set(
      -halfX + (x + 0.5) * unitSide,
      (y + 0.5) * unitSide,
      -halfZ + (z + 0.5) * unitSide,
    );
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);

    matrix.compose(position, quaternion, outlineScale);
    outlineMesh.setMatrixAt(i, matrix);

    if (faceGridMesh) {
      matrix.compose(position, quaternion, scale);
      faceGridMesh.setMatrixAt(i, matrix);
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  outlineMesh.instanceMatrix.needsUpdate = true;
  if (faceGridMesh) faceGridMesh.instanceMatrix.needsUpdate = true;

  group.add(mesh);
  group.add(outlineMesh);
  if (faceGridMesh) group.add(faceGridMesh);

  let labelMesh: THREE.InstancedMesh | null = null;
  if (unit.unitValue >= 1000n && count <= 40) {
    const texture = createLabelTexture(formatLabel(unit.unitValue));
    if (texture) {
      const labelGeo = new THREE.PlaneGeometry(unitSide * 0.92, unitSide * 0.92);
      const labelMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });

      labelMesh = new THREE.InstancedMesh(labelGeo, labelMat, count);
      labelMesh.castShadow = false;
      labelMesh.receiveShadow = false;
      labelMesh.renderOrder = 3;
      labelMesh.frustumCulled = false;

      const labelPos = new THREE.Vector3();
      const labelQuat = new THREE.Quaternion();
      labelQuat.setFromEuler(new THREE.Euler(0, 0, 0));

      for (let i = 0; i < count; i++) {
        mesh.getMatrixAt(i, matrix);
        matrix.decompose(position, quaternion, scale);
        labelPos.set(position.x, position.y, position.z + unitSide / 2 + cubeSize * 0.03);
        matrix.compose(labelPos, labelQuat, new THREE.Vector3(1, 1, 1));
        labelMesh.setMatrixAt(i, matrix);
      }

      labelMesh.instanceMatrix.needsUpdate = true;
      group.add(labelMesh);
    }
  }

  return group;
}

function buildAggregateBlock({
  parent,
  cubeSize,
  dimensionsCm,
}: {
  parent: THREE.Object3D;
  cubeSize: number;
  dimensionsCm: { widthCm: number; heightCm: number; depthCm: number };
}) {
  const width = dimensionsCm.widthCm * cubeSize;
  const depth = dimensionsCm.depthCm * cubeSize;
  const height = dimensionsCm.heightCm * cubeSize;
  const group = new THREE.Group();

  const bevel = Math.max(Math.min(width, height, depth) * 0.03, cubeSize * 0.12);
  const geometry = new RoundedBoxGeometry(width, height, depth, 3, bevel);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff5aa5,
    roughness: 0.3,
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  group.add(mesh);

  const outline = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xdb2e7b,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9,
    }),
  );
  outline.scale.set(1.02, 1.02, 1.02);
  outline.position.y = height / 2;
  outline.renderOrder = 1;
  outline.castShadow = false;
  outline.receiveShadow = false;
  group.add(outline);

  // Use only the crisp outline; avoid extra line noise on big blocks.

  parent.add(group);
  return group;
}

function buildReference({
  parent,
  cubeSize,
  reference,
}: {
  parent: THREE.Object3D;
  cubeSize: number;
  reference: ReferenceObject;
}) {
  const height = reference.heightCm * cubeSize;
  const group = new THREE.Group();

  const pink = new THREE.MeshStandardMaterial({
    color: 0xffc1de,
    roughness: 0.55,
    metalness: 0,
  });
  const darker = new THREE.MeshStandardMaterial({
    color: 0xff9cc9,
    roughness: 0.55,
    metalness: 0,
  });
  const white = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.75,
    metalness: 0,
  });

  const add = (mesh: THREE.Mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    group.add(mesh);
  };

  const clampWorld = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const sizeFromHeight = (ratio: number, minCubes: number, maxHeightRatio: number) => {
    const min = minCubes * cubeSize;
    const max = Math.max(min, height * maxHeightRatio);
    return clampWorld(height * ratio, min, max);
  };

  const baseY = 0;
  const baseR = sizeFromHeight(0.12, 4.5, 0.22);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR, 0.5 * cubeSize, 32), white);
  base.position.y = baseY + 0.25 * cubeSize;
  add(base);

  const kind = reference.kind;

  if (kind === "dice") {
    const s = Math.max(2 * cubeSize, Math.min(height, 3 * cubeSize));
    const body = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), pink);
    body.position.y = s / 2 + 0.5 * cubeSize;
    add(body);
  } else if (kind === "lego") {
    const w = sizeFromHeight(0.36, 4, 0.72);
    const d = sizeFromHeight(0.26, 3, 0.58);
    const h = Math.max(1.5 * cubeSize, height);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pink);
    body.position.y = h / 2 + 0.5 * cubeSize;
    add(body);
    const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * cubeSize, 0.5 * cubeSize, 0.4 * cubeSize, 16), darker);
    stud.position.set(-w * 0.25, h + 0.7 * cubeSize, 0);
    add(stud);
    const stud2 = stud.clone();
    stud2.position.x = w * 0.25;
    add(stud2);
  } else if (kind === "apple") {
    const r = Math.max(2.2 * cubeSize, height * 0.45);
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), pink);
    body.scale.set(1.05, 1.12, 1.05);
    body.position.y = r * 1.05 + 0.5 * cubeSize;
    add(body);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * cubeSize, 0.25 * cubeSize, 0.9 * cubeSize, 12), darker);
    stem.position.set(0, body.position.y + r * 0.95, 0);
    add(stem);
  } else if (kind === "cup") {
    const r = Math.max(2.2 * cubeSize, height * 0.33);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, height, 28, 1, true), pink);
    cup.position.y = height / 2 + 0.5 * cubeSize;
    add(cup);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(r * 0.6, 0.25 * cubeSize, 10, 40), darker);
    handle.position.set(r * 0.95, height * 0.55 + 0.5 * cubeSize, 0);
    handle.rotation.y = Math.PI / 2;
    add(handle);
  } else if (kind === "cat") {
    const bodyH = height * 0.55;
    const bodyR = sizeFromHeight(0.08, 1.2, 0.16);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(bodyR, bodyH / 2, 6, 12), pink);
    body.position.y = bodyH / 2 + 0.5 * cubeSize;
    body.rotation.z = Math.PI / 2;
    add(body);
    const headR = sizeFromHeight(0.08, 1.2, 0.16);
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 18, 14), darker);
    head.position.set(bodyH * 0.22, body.position.y + bodyR * 0.25, 0);
    add(head);
  } else if (kind === "child") {
    const legH = height * 0.46;
    const torsoH = height * 0.34;
    const headD = height - legH - torsoH;

    const hipY = 0.5 * cubeSize + legH;

    const limbR = sizeFromHeight(0.05, 0.7, 0.1);
    const legGeo = new THREE.CapsuleGeometry(limbR, legH / 2, 8, 16);
    const leftLeg = new THREE.Mesh(legGeo, pink);
    leftLeg.position.set(-1.05 * cubeSize, 0.5 * cubeSize + legH / 2, 0);
    add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 1.05 * cubeSize;
    add(rightLeg);

    const torsoR = sizeFromHeight(0.1, 1.6, 0.2);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(torsoR, torsoH / 2, 10, 18), pink);
    torso.position.y = hipY + torsoH / 2;
    add(torso);

    const headR = Math.max(1.35 * cubeSize, headD * 0.42);
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 22, 18), darker);
    head.position.y = torso.position.y + torsoH / 2 + headR * 1.05;
    add(head);

    const armGeo = new THREE.CapsuleGeometry(limbR * 0.85, torsoH * 0.44, 8, 14);
    const leftArm = new THREE.Mesh(armGeo, darker);
    leftArm.position.set(-(torsoR + limbR), torso.position.y + torsoH * 0.05, 0);
    leftArm.rotation.z = 0.28;
    add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.position.x *= -1;
    rightArm.rotation.z *= -1;
    add(rightArm);
  } else if (kind === "door") {
    const w = sizeFromHeight(0.22, 4.5, 0.36);
    const d = sizeFromHeight(0.04, 0.8, 0.1);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), pink);
    frame.position.y = height / 2 + 0.5 * cubeSize;
    add(frame);
  } else if (kind === "car") {
    const baseW = sizeFromHeight(0.34, 8, 0.62);
    const baseD = sizeFromHeight(0.16, 4.5, 0.36);
    const baseH = height * 0.35;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), pink);
    base.position.y = baseH / 2 + 0.5 * cubeSize;
    add(base);
    const topH = height * 0.35;
    const top = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.6, topH, baseD * 0.75), darker);
    top.position.y = base.position.y + baseH / 2 + topH / 2;
    add(top);
  } else if (kind === "bus") {
    const w = sizeFromHeight(0.38, 10, 0.72);
    const d = sizeFromHeight(0.18, 5.5, 0.42);
    const h = height;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pink);
    body.position.y = h / 2 + 0.5 * cubeSize;
    add(body);
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, h * 0.35, d * 0.92), white);
    win.position.y = body.position.y + h * 0.15;
    add(win);
  } else if (kind === "house") {
    const wallH = height * 0.64;
    const roofH = height - wallH;

    const w = sizeFromHeight(0.42, 10, 0.8);
    const d = sizeFromHeight(0.34, 8, 0.68);

    const base = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), pink);
    base.position.y = wallH / 2 + 0.5 * cubeSize;
    add(base);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, roofH, 4), darker);
    roof.position.y = base.position.y + wallH / 2 + roofH / 2;
    roof.rotation.y = Math.PI / 4;
    add(roof);

    const doorH = wallH * 0.52;
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.18, doorH, d * 0.06),
      white,
    );
    door.position.set(0, 0.5 * cubeSize + doorH / 2, d / 2 + door.geometry.parameters.depth / 2);
    add(door);
  } else if (kind === "tree") {
    const trunkH = height * 0.55;
    const trunkR = sizeFromHeight(0.095, 1.4, 0.14);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkR * 0.82, trunkR, trunkH, 18), darker);
    trunk.position.y = trunkH / 2 + 0.5 * cubeSize;
    add(trunk);
    const crownH = height * 0.65;
    const crownR = sizeFromHeight(0.33, 6.5, 0.55);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(crownR, crownH, 20), pink);
    crown.position.y = trunk.position.y + trunkH / 2 + crownH / 2;
    add(crown);
  } else if (kind === "building") {
    const w = sizeFromHeight(0.26, 14, 0.42);
    const d = sizeFromHeight(0.18, 10, 0.32);

    const podiumH = Math.max(height * 0.08, 1.8 * cubeSize);
    const podium = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, podiumH, d * 1.08), darker);
    podium.position.y = podiumH / 2 + 0.5 * cubeSize;
    add(podium);

    const towerH = height - podiumH;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, towerH, d), pink);
    body.position.y = podium.position.y + podiumH / 2 + towerH / 2;
    add(body);

    const capH = Math.max(towerH * 0.04, 1.2 * cubeSize);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, capH, d * 1.02), white);
    cap.position.y = body.position.y + towerH / 2 + capH / 2;
    add(cap);
  } else if (kind === "mountain") {
    const baseR = sizeFromHeight(0.62, 18, 0.9);
    const baseH = Math.max(height * 0.06, 1.2 * cubeSize);
    const baseDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(baseR * 1.05, baseR * 1.12, baseH, 28),
      darker,
    );
    baseDisk.position.y = baseH / 2 + 0.5 * cubeSize;
    add(baseDisk);

    const mainH = height * 0.88;
    const main = new THREE.Mesh(new THREE.ConeGeometry(baseR * 0.92, mainH, 32), pink);
    main.position.y = baseDisk.position.y + baseH / 2 + mainH / 2;
    add(main);

    const sideH = height * 0.62;
    const side = new THREE.Mesh(new THREE.ConeGeometry(baseR * 0.58, sideH, 28), pink);
    side.position.set(baseR * 0.42, baseDisk.position.y + baseH / 2 + sideH / 2, -baseR * 0.16);
    side.rotation.y = 0.5;
    add(side);

    const snowH = height * 0.24;
    const snow = new THREE.Mesh(new THREE.ConeGeometry(baseR * 0.28, snowH, 28), white);
    snow.position.set(0, main.position.y + mainH / 2 - snowH * 0.52, 0);
    add(snow);
  } else if (kind === "earth") {
    const r = height / 2;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 22), pink);
    globe.position.y = r + 0.5 * cubeSize;
    add(globe);
  } else if (kind === "moonDistance") {
    const p1r = sizeFromHeight(0.06, 2.2, 0.12);
    const p1 = new THREE.Mesh(new THREE.SphereGeometry(p1r, 18, 14), darker);
    p1.position.y = p1r + 0.5 * cubeSize;
    add(p1);
    const rodR = sizeFromHeight(0.01, 0.35, 0.04);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, height, 14), pink);
    rod.position.y = height / 2 + 0.5 * cubeSize;
    add(rod);
    const p2r = sizeFromHeight(0.045, 1.6, 0.1);
    const p2 = new THREE.Mesh(new THREE.SphereGeometry(p2r, 18, 14), white);
    p2.position.y = height + 0.5 * cubeSize;
    add(p2);
  }

  group.position.y = 0;
  parent.add(group);
  return group;
}

export function CubeStage({
  value,
  reference,
}: {
  value: bigint;
  reference: ReferenceObject;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const zoomRef = useRef(1);
  const zoomApiRef = useRef<{
    nudge: (multiplier: number) => void;
    reset: () => void;
  } | null>(null);

  const dims = useMemo(() => estimateBlockDimensionsCm(value), [value]);
  const targetMaxHeightUnits = 120;
  const sceneScale = useMemo(() => {
    const rawMax = Math.max(dims.maxCm, reference.heightCm);
    return clamp(targetMaxHeightUnits / rawMax, 0.000000000000001, 8);
  }, [dims.maxCm, reference.heightCm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000);
    camera.position.set(98, 92, 168);

    const world = new THREE.Group();
    scene.add(world);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xffe4f0, 0.55);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(160, 220, 140);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 10;
    key.shadow.camera.far = 600;
    key.shadow.radius = 4;
    scene.add(key);

    scene.fog = new THREE.Fog(0xfff1f2, 220, 720);

    const floorGeo = new THREE.PlaneGeometry(1200, 1200);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xfff6fb,
      roughness: 0.95,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = 0;
    floor.renderOrder = 0;
    world.add(floor);

    const grid = new THREE.GridHelper(1200, 60, 0xdb2e7b, 0xff9cc9);
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    for (const m of gridMats) {
      m.transparent = true;
      m.opacity = 0.42;
      m.depthWrite = false;
    }
    grid.position.y = 0.02;
    grid.renderOrder = 1;
    world.add(grid);

    const microGrid = new THREE.GridHelper(1200, 240, 0xff6fad, 0xffcfe3);
    const microMats = Array.isArray(microGrid.material) ? microGrid.material : [microGrid.material];
    for (const m of microMats) {
      m.transparent = true;
      m.opacity = 0.22;
      m.depthWrite = false;
    }
    microGrid.position.y = 0.025;
    microGrid.renderOrder = 1;
    world.add(microGrid);

    const rimGeo = new THREE.TorusGeometry(6, 0.35, 10, 60);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xff9cc9,
      roughness: 0.4,
      metalness: 0,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.05, 0);
    world.add(rim);

    let currentBlock: THREE.Object3D | null = null;
    let currentReference: THREE.Object3D | null = null;

    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    setSize();

    let resizeObserver: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => setSize());
      resizeObserver.observe(canvas);
    }
    window.addEventListener("resize", setSize, { passive: true });

    let theta = 0.85;
    let phi = 1.05;
    let baseRadius = 180;
    const minPhi = 0.35;
    const maxPhi = 1.35;

    let lastX = 0;
    let lastY = 0;
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let pinchStartMid: { x: number; y: number } | null = null;
    const baseTarget = new THREE.Vector3(0, 0, 0);

    const clampZoom = (z: number) => clamp(z, 0.55, 3.2);
    const applyZoom = () => {
      const zoom = clampZoom(zoomRef.current);
      zoomRef.current = zoom;

      const radius = baseRadius * zoom;
      const sinPhi = Math.sin(phi);
      const x = radius * sinPhi * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * sinPhi * Math.cos(theta);

      camera.position.set(baseTarget.x + x, baseTarget.y + y, baseTarget.z + z);
      camera.lookAt(baseTarget);
    };
    zoomApiRef.current = {
      nudge: (multiplier: number) => {
        zoomRef.current = clampZoom(zoomRef.current * multiplier);
        applyZoom();
      },
      reset: () => {
        zoomRef.current = 1;
        applyZoom();
      },
    };

    const supportsPointer = "PointerEvent" in window;
    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 1) {
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        pinchStartDist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        pinchStartZoom = zoomRef.current;
        pinchStartMid = { x: (pts[0]!.x + pts[1]!.x) / 2, y: (pts[0]!.y + pts[1]!.y) / 2 };
      }
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1) {
        const delta = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        theta -= delta * 0.006;
        phi = clamp(phi + deltaY * 0.006, minPhi, maxPhi);
        applyZoom();
        return;
      }

      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        if (pinchStartDist > 0) {
          const scale = dist / pinchStartDist;
          zoomRef.current = clampZoom(pinchStartZoom / scale);
        }

        const mid = { x: (pts[0]!.x + pts[1]!.x) / 2, y: (pts[0]!.y + pts[1]!.y) / 2 };
        if (pinchStartMid) {
          const dx = mid.x - pinchStartMid.x;
          const dy = mid.y - pinchStartMid.y;
          pinchStartMid = mid;

          const right = new THREE.Vector3();
          camera.getWorldDirection(right);
          right.cross(camera.up).normalize();
          const up = camera.up.clone().normalize();

          const panScale = (baseRadius * zoomRef.current) / 900;
          baseTarget.addScaledVector(right, -dx * panScale);
          baseTarget.addScaledVector(up, dy * panScale);
        }
        applyZoom();
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 1) {
        const only = Array.from(activePointers.values())[0]!;
        lastX = only.x;
        lastY = only.y;
      } else if (activePointers.size === 0) {
        pinchStartDist = 0;
        pinchStartMid = null;
      }
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const delta = e.touches[0].clientX - lastX;
      const deltaY = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      theta -= delta * 0.006;
      phi = clamp(phi + deltaY * 0.006, minPhi, maxPhi);
      applyZoom();
      e.preventDefault();
    };
    const onTouchEnd = () => {};

    if (supportsPointer) {
      canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerup", onPointerUp, { passive: true });
      canvas.addEventListener("pointercancel", onPointerUp, { passive: true });
    } else {
      canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      canvas.addEventListener("touchmove", onTouchMove, { passive: false });
      canvas.addEventListener("touchend", onTouchEnd, { passive: true });
      canvas.addEventListener("touchcancel", onTouchEnd, { passive: true });
    }

    const onWheel = (e: WheelEvent) => {
      const delta = Math.sign(e.deltaY);
      if (!delta) return;
      zoomRef.current = clampZoom(zoomRef.current * (delta > 0 ? 1.08 : 0.92));
      applyZoom();
    };
    canvas.addEventListener("wheel", onWheel, { passive: true });

    const render = () => {
      renderer.render(scene, camera);
      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    const cubeSize = sceneScale;
    const unit = chooseUnitForValue(value);
    const canInstance = unit.unitCount > 0n && unit.unitCount <= 10_000n;

    if (canInstance) {
      currentBlock = buildInstancedUnitBlock({ parent: world, cubeSize, value });
    } else {
      currentBlock = buildAggregateBlock({ parent: world, cubeSize, dimensionsCm: dims });
    }

    const blockHalfWidth = (dims.widthCm * cubeSize) / 2;
    const offsetX = blockHalfWidth + 14 * cubeSize;
    rim.position.x = offsetX;
    currentReference = buildReference({ parent: world, cubeSize, reference });

    // Place reference to the right of the block using its actual bounds (prevents overlap even when proportions change).
    const refBounds = new THREE.Box3().setFromObject(currentReference);
    const refSize = new THREE.Vector3();
    refBounds.getSize(refSize);
    const margin = 10 * cubeSize;
    const refOffsetX = blockHalfWidth + refSize.x / 2 + margin;
    currentReference.position.x = refOffsetX;
    rim.position.x = refOffsetX;

    // Auto-frame to reduce empty space (especially on iPad).
    const bounds = new THREE.Box3();
    const c = new THREE.Vector3();
    const size = new THREE.Vector3();
    if (currentBlock) bounds.expandByObject(currentBlock);
    if (currentReference) bounds.expandByObject(currentReference);
    bounds.getCenter(c);
    bounds.getSize(size);

    baseTarget.copy(c);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    baseRadius = (maxDim * 0.62) / Math.tan(fov / 2);
    baseRadius = clamp(baseRadius, 70, 520);

    phi = clamp(1.05, minPhi, maxPhi);
    theta = 0.85;
    applyZoom();
    render();

    return () => {
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", setSize);
      resizeObserver?.disconnect();
      canvas.removeEventListener("wheel", onWheel);
      if (supportsPointer) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
      } else {
        canvas.removeEventListener("touchstart", onTouchStart);
        canvas.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchend", onTouchEnd);
        canvas.removeEventListener("touchcancel", onTouchEnd);
      }
      if (currentBlock) {
        world.remove(currentBlock);
        currentBlock.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
            obj.geometry?.dispose?.();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
            else obj.material?.dispose?.();
          }
        });
      }
      if (currentReference) {
        world.remove(currentReference);
        currentReference.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose?.();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
            else obj.material?.dispose?.();
          }
        });
      }
      scene.environment?.dispose?.();
      pmrem.dispose();
      renderer.dispose();
      zoomApiRef.current = null;
    };
  }, [dims, reference, sceneScale, value]);

  const zoomIn = () => zoomApiRef.current?.nudge(0.9);
  const zoomOut = () => zoomApiRef.current?.nudge(1.12);
  const resetZoom = () => zoomApiRef.current?.reset();

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        aria-label="3D 体块对比"
      />

      <div className="pointer-events-auto absolute bottom-3 left-3 flex gap-2">
        <button
          type="button"
          onClick={zoomOut}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-white/55 shadow-lg shadow-rose-200/40 ring-1 ring-rose-200/70 backdrop-blur-md active:scale-[0.98]"
          aria-label="缩小"
        >
          <span className="text-2xl font-bold text-rose-600">−</span>
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-white/55 shadow-lg shadow-rose-200/40 ring-1 ring-rose-200/70 backdrop-blur-md active:scale-[0.98]"
          aria-label="放大"
        >
          <span className="text-2xl font-bold text-rose-600">＋</span>
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-white/55 shadow-lg shadow-rose-200/40 ring-1 ring-rose-200/70 backdrop-blur-md active:scale-[0.98]"
          aria-label="重置缩放"
        >
          <span className="text-sm font-semibold text-rose-600">1×</span>
        </button>
      </div>
    </div>
  );
}
