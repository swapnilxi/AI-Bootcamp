import * as THREE from "three";
import { DisposableBag } from "./disposables";
import { ORANGE, ORANGE_BRIGHT, ORANGE_PALE } from "./palette";

const TAU = Math.PI * 2;
const BASE_TILT = -1.08; // lays the wheel back into perspective

/** Outer radius including degree ticks; used to fit the camera. */
export const ORBIT_WHEEL_EXTENT = 46;

export interface OrbitWheel {
  group: THREE.Group;
  /**
   * @param turn  0..1 scroll progress through the section
   * @param drift whether idle motion (slow spin, orbiting planets) runs
   */
  update: (delta: number, elapsed: number, turn: number, drift: boolean) => void;
}

const polar = (r: number, a: number) => new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);

const circlePoints = (r: number, segments = 256) =>
  Array.from({ length: segments + 1 }, (_, i) => polar(r, (i / segments) * TAU));

/**
 * A tilted orbit field in fine line-work: rings, radial divisions,
 * tick marks, a connecting web (hexagram + square), node markers, seven
 * drifting points and faint orbital dust.
 */
export function createOrbitWheel(glowTex: THREE.Texture, bag: DisposableBag): OrbitWheel {
  const group = new THREE.Group();
  group.rotation.x = BASE_TILT;

  const lineMat = (opacity: number, color = ORANGE) =>
    bag.add(new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));

  const addRing = (r: number, opacity: number) => {
    group.add(new THREE.Line(bag.add(new THREE.BufferGeometry().setFromPoints(circlePoints(r))), lineMat(opacity)));
  };
  const addSegments = (pts: THREE.Vector3[], opacity: number, color?: number) => {
    const seg = new THREE.LineSegments(bag.add(new THREE.BufferGeometry().setFromPoints(pts)), lineMat(opacity, color));
    group.add(seg);
    return seg;
  };

  // Rings
  addRing(41.4, 0.22);
  addRing(40, 0.55);
  addRing(34, 0.45);
  addRing(30, 0.3);
  addRing(9, 0.25);

  // 12 radial divisions
  const divisions: THREE.Vector3[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    divisions.push(polar(30, a), polar(40, a));
  }
  addSegments(divisions, 0.5);

  // Degree ticks: longer every 6° and 10°
  const ticks: THREE.Vector3[] = [];
  for (let d = 0; d < 360; d += 2) {
    const a = (d / 360) * TAU;
    const len = d % 10 === 0 ? 1.6 : d % 6 === 0 ? 1.0 : 0.55;
    ticks.push(polar(40, a), polar(40 + len, a));
  }
  addSegments(ticks, 0.32);

  // Aspect web: two trines (a hexagram) and a faint square
  const web: THREE.Vector3[] = [];
  const polygon = (n: number, offset: number) => {
    for (let i = 0; i < n; i++) web.push(polar(30, offset + (i / n) * TAU), polar(30, offset + ((i + 1) / n) * TAU));
  };
  polygon(3, Math.PI / 2);
  polygon(3, -Math.PI / 2);
  polygon(4, Math.PI / 4);
  const aspectMat = addSegments(web, 0.16, ORANGE_BRIGHT).material as THREE.LineBasicMaterial;

  const pointsLayer = (positions: ArrayLike<number>, size: number, opacity: number, color: number) => {
    const geo = bag.add(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.Float32BufferAttribute(Array.from(positions), 3));
    const mat = bag.add(
      new THREE.PointsMaterial({ size, map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(new THREE.Points(geo, mat));
    return { geo, mat };
  };

  // Node markers at the middle of each band
  const markers: number[] = [];
  for (let k = 0; k < 12; k++) {
    const v = polar(37, ((k + 0.5) / 12) * TAU);
    markers.push(v.x, v.y, 0);
  }
  pointsLayer(markers, 2.2, 0.85, ORANGE);

  // Seven classical planets drifting on their own radii
  const planets = Array.from({ length: 7 }, (_, i) => ({
    r: 13 + i * 2.4,
    a: Math.random() * TAU,
    speed: (0.05 + Math.random() * 0.12) * (i % 2 ? 1 : -1),
  }));
  const planetPos = new Float32Array(planets.length * 3);
  const planetAttr = pointsLayer(planetPos, 3.4, 0.95, ORANGE_BRIGHT).geo.getAttribute("position") as THREE.BufferAttribute;

  // Faint orbital dust
  const dustPos: number[] = [];
  for (let i = 0; i < 220; i++) {
    const r = 10 + Math.random() * 36;
    const a = Math.random() * TAU;
    dustPos.push(Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 3);
  }
  const dustMat = pointsLayer(dustPos, 0.7, 0.5, ORANGE_PALE).mat;

  const update: OrbitWheel["update"] = (delta, elapsed, turn, drift) => {
    group.rotation.z = turn * Math.PI * 0.9 + (drift ? elapsed * 0.015 : 0);
    group.rotation.x = BASE_TILT + turn * 0.22;

    planets.forEach((p, i) => {
      if (drift) p.a += p.speed * delta;
      planetPos[i * 3] = Math.cos(p.a) * p.r;
      planetPos[i * 3 + 1] = Math.sin(p.a) * p.r;
    });
    planetAttr.copyArray(planetPos);
    planetAttr.needsUpdate = true;

    aspectMat.opacity = 0.12 + Math.sin(elapsed * 0.8) * 0.05;
    dustMat.opacity = 0.35 + Math.sin(elapsed * 1.4) * 0.12;
  };

  return { group, update };
}
