"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import type { ReferenceObject } from "@/lib/references";

const MAX_INSTANCES = 100_000n;
const BASE_X = 10;
const BASE_Z = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getHeightCmFromValue(value: bigint) {
  if (value === 1n) return 1;
  return Number(value / 100n);
}

function buildInstancedCubeBlock({
  parent,
  cubeSize,
  value,
}: {
  parent: THREE.Object3D;
  cubeSize: number;
  value: bigint;
}) {
  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff5aa5,
    roughness: 0.35,
    metalness: 0.05,
  });

  const count = value === 1n ? 1 : Number(value);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.castShadow = true;
  mesh.receiveShadow = false;

  const halfX = (BASE_X * cubeSize) / 2;
  const halfZ = (BASE_Z * cubeSize) / 2;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;
    let z = 0;

    if (value === 1n) {
      x = 0;
      y = 0;
      z = 0;
    } else {
      const layer = Math.floor(i / (BASE_X * BASE_Z));
      const within = i % (BASE_X * BASE_Z);
      x = within % BASE_X;
      z = Math.floor(within / BASE_X);
      y = layer;
    }

    position.set(
      -halfX + (x + 0.5) * cubeSize,
      (y + 0.5) * cubeSize,
      -halfZ + (z + 0.5) * cubeSize,
    );
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function buildAggregateBlock({
  parent,
  cubeSize,
  heightCm,
}: {
  parent: THREE.Object3D;
  cubeSize: number;
  heightCm: number;
}) {
  const width = BASE_X * cubeSize;
  const depth = BASE_Z * cubeSize;
  const height = heightCm * cubeSize;
  const geometry = new THREE.BoxGeometry(width, 1, depth);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff5aa5,
    roughness: 0.35,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.y = height;
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = false;

  const edges = new THREE.EdgesGeometry(geometry);
  const edgeLines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xff9cc9, transparent: true, opacity: 0.75 }),
  );
  edgeLines.renderOrder = 2;
  mesh.add(edgeLines);

  parent.add(mesh);
  return mesh;
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

  const geometry = new THREE.BoxGeometry(6 * cubeSize, height, 4 * cubeSize);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffc1de,
    roughness: 0.5,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(12 * cubeSize, height / 2, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
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

  const heightCm = useMemo(() => getHeightCmFromValue(value), [value]);
  const targetMaxHeightUnits = 120;
  const sceneScale = useMemo(() => {
    const rawMax = Math.max(heightCm, reference.heightCm);
    return clamp(targetMaxHeightUnits / rawMax, 0.000000000000001, 8);
  }, [heightCm, reference.heightCm]);

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

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000);
    camera.position.set(100, 90, 170);

    const world = new THREE.Group();
    scene.add(world);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(160, 220, 140);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 10;
    key.shadow.camera.far = 600;
    scene.add(key);

    const floorGeo = new THREE.PlaneGeometry(1000, 1000);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = 0;
    world.add(floor);

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
    const maxInstancesAllowed = value === 1n ? 1n : value;

    currentBlock =
      maxInstancesAllowed <= MAX_INSTANCES
        ? buildInstancedCubeBlock({ parent: world, cubeSize, value })
        : buildAggregateBlock({ parent: world, cubeSize, heightCm });

    currentReference = buildReference({ parent: world, cubeSize, reference });

    const maxHeightUnits = Math.max(heightCm, reference.heightCm) * cubeSize;
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
  }, [heightCm, reference, sceneScale, value]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      aria-label="3D 体块对比"
    />
  );
}
