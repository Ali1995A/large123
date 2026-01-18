"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import type { ReferenceObject } from "@/lib/references";
import { chooseUnitForValue, estimateBlockDimensionsCm } from "@/lib/blockLayout";
import { ReferenceSvg } from "@/components/ReferenceSvg";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function computeGrid(count: number) {
  if (count <= 0) return { gridX: 0, gridZ: 0, layers: 0 };
  const gridX = Math.min(10, count);
  const gridZ = count <= 10 ? 1 : Math.min(10, Math.ceil(count / 10));
  const perLayer = Math.max(1, gridX * gridZ);
  const layers = Math.ceil(count / perLayer);
  return { gridX, gridZ, layers };
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
  const geometry = new THREE.BoxGeometry(unitSide, unitSide, unitSide);

  const fill = new THREE.MeshPhysicalMaterial({
    color: 0xff5aa5,
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.65,
    clearcoatRoughness: 0.26,
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

  const wire = new THREE.MeshBasicMaterial({
    color: 0xffd1e6,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });

  const mesh = new THREE.InstancedMesh(geometry.clone(), fill, count);
  mesh.castShadow = true;
  mesh.receiveShadow = false;

  const outlineMesh = new THREE.InstancedMesh(geometry.clone(), outlineMat, count);
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;
  outlineMesh.renderOrder = 1;

  const wireMesh = new THREE.InstancedMesh(geometry.clone(), wire, count);
  wireMesh.castShadow = false;
  wireMesh.receiveShadow = false;
  wireMesh.renderOrder = 2;

  const { gridX, gridZ } = computeGrid(count);
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
    wireMesh.setMatrixAt(i, matrix);

    matrix.compose(position, quaternion, outlineScale);
    outlineMesh.setMatrixAt(i, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  outlineMesh.instanceMatrix.needsUpdate = true;
  wireMesh.instanceMatrix.needsUpdate = true;

  group.add(mesh);
  group.add(outlineMesh);
  group.add(wireMesh);

  let labelMesh: THREE.InstancedMesh | null = null;
  if (unit.unitValue >= 1000n) {
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

  const geometry = new THREE.BoxGeometry(width, 1, depth);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff5aa5,
    roughness: 0.3,
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.y = height;
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
  outline.scale.set(1.02, height, 1.02);
  outline.position.y = height / 2;
  outline.renderOrder = 1;
  outline.castShadow = false;
  outline.receiveShadow = false;
  group.add(outline);

  const edges = new THREE.EdgesGeometry(geometry);
  const edgeLines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xff9cc9, transparent: true, opacity: 0.75 }),
  );
  edgeLines.scale.y = height;
  edgeLines.position.y = height / 2;
  edgeLines.renderOrder = 2;
  group.add(edgeLines);

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

  const baseY = 0;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(5 * cubeSize, 5 * cubeSize, 0.5 * cubeSize, 24),
    white,
  );
  base.position.y = baseY + 0.25 * cubeSize;
  add(base);

  const x = 16 * cubeSize;
  group.position.set(x, 0, 0);

  const kind = reference.kind;

  if (kind === "dice") {
    const s = Math.max(2 * cubeSize, Math.min(height, 3 * cubeSize));
    const body = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), pink);
    body.position.y = s / 2 + 0.5 * cubeSize;
    add(body);
  } else if (kind === "lego") {
    const w = 4 * cubeSize;
    const d = 3 * cubeSize;
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
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.6 * cubeSize, bodyH / 2, 6, 12), pink);
    body.position.y = bodyH / 2 + 0.5 * cubeSize;
    body.rotation.z = Math.PI / 2;
    add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.5 * cubeSize, 18, 14), darker);
    head.position.set(2.6 * cubeSize, body.position.y + 0.6 * cubeSize, 0);
    add(head);
  } else if (kind === "child") {
    const torsoH = height * 0.62;
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(1.4 * cubeSize, torsoH / 2, 8, 16), pink);
    torso.position.y = torsoH / 2 + 0.5 * cubeSize;
    add(torso);
    const headR = 1.25 * cubeSize;
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 20, 16), darker);
    head.position.y = torso.position.y + torsoH / 2 + headR * 1.2;
    add(head);
  } else if (kind === "door") {
    const w = 6 * cubeSize;
    const d = 1.2 * cubeSize;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), pink);
    frame.position.y = height / 2 + 0.5 * cubeSize;
    add(frame);
  } else if (kind === "car") {
    const baseW = 8 * cubeSize;
    const baseD = 4.5 * cubeSize;
    const baseH = height * 0.35;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), pink);
    base.position.y = baseH / 2 + 0.5 * cubeSize;
    add(base);
    const topH = height * 0.35;
    const top = new THREE.Mesh(new THREE.BoxGeometry(baseW * 0.6, topH, baseD * 0.75), darker);
    top.position.y = base.position.y + baseH / 2 + topH / 2;
    add(top);
  } else if (kind === "bus") {
    const w = 10 * cubeSize;
    const d = 5.5 * cubeSize;
    const h = height;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pink);
    body.position.y = h / 2 + 0.5 * cubeSize;
    add(body);
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, h * 0.35, d * 0.92), white);
    win.position.y = body.position.y + h * 0.15;
    add(win);
  } else if (kind === "house") {
    const w = 10 * cubeSize;
    const d = 8 * cubeSize;
    const h = height * 0.65;
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pink);
    base.position.y = h / 2 + 0.5 * cubeSize;
    add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.65, height * 0.55, 4), darker);
    roof.position.y = base.position.y + h / 2 + height * 0.275;
    roof.rotation.y = Math.PI / 4;
    add(roof);
  } else if (kind === "tree") {
    const trunkH = height * 0.55;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * cubeSize, 1.1 * cubeSize, trunkH, 18), darker);
    trunk.position.y = trunkH / 2 + 0.5 * cubeSize;
    add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(4.2 * cubeSize, height * 0.65, 20), pink);
    crown.position.y = trunk.position.y + trunkH / 2 + (height * 0.65) / 2;
    add(crown);
  } else if (kind === "building") {
    const w = 12 * cubeSize;
    const d = 8 * cubeSize;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), pink);
    body.position.y = height / 2 + 0.5 * cubeSize;
    add(body);
  } else if (kind === "mountain") {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(12 * cubeSize, height, 28), pink);
    cone.position.y = height / 2 + 0.5 * cubeSize;
    add(cone);
  } else if (kind === "earth") {
    const r = height / 2;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 22), pink);
    globe.position.y = r + 0.5 * cubeSize;
    add(globe);
  } else if (kind === "moonDistance") {
    const p1 = new THREE.Mesh(new THREE.SphereGeometry(2.2 * cubeSize, 18, 14), darker);
    p1.position.y = 2.2 * cubeSize + 0.5 * cubeSize;
    add(p1);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * cubeSize, 0.35 * cubeSize, height, 14), pink);
    rod.position.y = height / 2 + 0.5 * cubeSize;
    add(rod);
    const p2 = new THREE.Mesh(new THREE.SphereGeometry(1.6 * cubeSize, 18, 14), white);
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

  const dims = useMemo(() => estimateBlockDimensionsCm(value), [value]);
  const referenceRatio = useMemo(() => {
    const denom = Math.max(dims.maxCm, reference.heightCm);
    return clamp(reference.heightCm / denom, 0.06, 1);
  }, [dims.maxCm, reference.heightCm]);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000);
    camera.position.set(100, 90, 170);

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
    scene.add(key);

    scene.fog = new THREE.Fog(0xfff1f2, 220, 720);

    const floorGeo = new THREE.PlaneGeometry(1200, 1200);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.14 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = 0;
    world.add(floor);

    const grid = new THREE.GridHelper(1200, 60, 0xffb7d5, 0xffd1e6);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.22;
    grid.position.y = 0.01;
    world.add(grid);

    const rimGeo = new THREE.TorusGeometry(6, 0.35, 10, 60);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xff9cc9,
      roughness: 0.4,
      metalness: 0,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(12 * sceneScale, 0.05, 0);
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

    let spin = 0;
    let dragging = false;
    let lastX = 0;

    const onDragStart = (clientX: number) => {
      dragging = true;
      lastX = clientX;
    };
    const onDragMove = (clientX: number) => {
      if (!dragging) return;
      const delta = clientX - lastX;
      lastX = clientX;
      spin += delta * 0.008;
    };
    const onDragEnd = () => {
      dragging = false;
    };

    const supportsPointer = "PointerEvent" in window;
    const onPointerDown = (e: PointerEvent) => {
      onDragStart(e.clientX);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };
    const onPointerMove = (e: PointerEvent) => onDragMove(e.clientX);
    const onPointerUp = (e: PointerEvent) => {
      onDragEnd();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      onDragStart(e.touches[0].clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      onDragMove(e.touches[0].clientX);
      e.preventDefault();
    };
    const onTouchEnd = () => onDragEnd();

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

    const render = () => {
      world.rotation.y = spin;
      spin *= 0.985;
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

    currentReference = buildReference({ parent: world, cubeSize, reference });

    const maxHeightUnits = Math.max(dims.heightCm, reference.heightCm) * cubeSize;
    camera.position.set(95, Math.max(70, maxHeightUnits * 0.75), 170);
    camera.lookAt(new THREE.Vector3(0, maxHeightUnits * 0.35, 0));
    render();

    return () => {
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", setSize);
      resizeObserver?.disconnect();
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
      renderer.dispose();
    };
  }, [dims, reference, sceneScale, value]);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        aria-label="3D 体块对比"
      />

      <div
        className="pointer-events-none absolute bottom-3 right-3 flex items-end"
        style={{ height: `${Math.round(referenceRatio * 86)}%` }}
        aria-hidden="true"
      >
        <div className="h-full rounded-3xl bg-white/45 p-2 shadow-lg shadow-rose-200/50 ring-1 ring-rose-200/80 backdrop-blur-sm">
          <ReferenceSvg reference={reference} />
        </div>
      </div>
    </div>
  );
}
