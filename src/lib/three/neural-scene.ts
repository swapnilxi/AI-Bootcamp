import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { DisposableBag } from "./disposables";
import { CREAM, CREAM_WARM, ORANGE, ORANGE_BRIGHT, ORANGE_HOT, ORANGE_PALE } from "./palette";

/**
 * The hero's neural globe.
 *
 * A wireframe sphere holds a network running inside it: neurons distributed
 * evenly through the volume, edges between the ones close enough to be
 * plausible connections, activation pulses travelling those edges, and a
 * core at the centre that everything orbits.
 *
 * Nodes are placed with a Fibonacci sphere rather than at random so they
 * spread evenly instead of clumping at the poles, and edges are built from a
 * distance threshold so the mesh reads as a network rather than a hairball.
 */

const GLOBE_RADIUS = 46;
/** The bright rings reach past the globe, giving the scene a nebula's disc. */
const DISC_RADIUS = GLOBE_RADIUS * 1.42;
/** Neurons sit on two shells inside the globe, plus a few deeper in. */
const SHELLS = [
  { count: 26, radius: 0.92 },
  { count: 16, radius: 0.58 },
  { count: 7, radius: 0.3 },
];
/** Two nodes connect when they are closer than this share of the diameter. */
const LINK_DISTANCE = 0.52;
const PULSES = 60;

export interface NeuralInput {
  /** Smoothed pointer tilt, roughly -0.5..0.5 on each axis. */
  tiltX: number;
  tiltY: number;
  /** Current page scroll in px (adds a gentle tilt). */
  scrollY: number;
  /** Extra spin from scroll velocity. */
  spinBoost: number;
}

export interface NeuralScene {
  group: THREE.Group;
  /** Advance the animation; call once per frame. */
  update: (delta: number, elapsed: number, input: NeuralInput) => void;
}

/** Evenly distributes `count` points over a sphere of the given radius. */
function fibonacciShell(count: number, radius: number, offset: number): THREE.Vector3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - ((i + 0.5) / count) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i + offset;
    return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius);
  });
}

export function createNeuralScene(glowTex: THREE.Texture, bag: DisposableBag): NeuralScene {
  const group = new THREE.Group();

  /* ---------------------------------------------------------------- */
  /* The globe shell                                                   */
  /*  Latitude and longitude rings rather than a solid mesh, so the     */
  /*  network inside stays fully visible through it.                    */
  /* ---------------------------------------------------------------- */
  const shell = new THREE.Group();
  const ringMat = bag.add(
    new THREE.LineBasicMaterial({
      color: ORANGE,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  const circlePoints = (radius: number, segments = 96) =>
    Array.from({ length: segments + 1 }, (_, i) => {
      const a = (i / segments) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    });

  // Longitudes
  for (let i = 0; i < 6; i++) {
    const geo = bag.add(new THREE.BufferGeometry().setFromPoints(circlePoints(GLOBE_RADIUS)));
    const line = new THREE.Line(geo, ringMat);
    line.rotation.y = (i / 6) * Math.PI;
    shell.add(line);
  }
  // Latitudes
  for (const lat of [-0.62, -0.32, 0, 0.32, 0.62]) {
    const r = GLOBE_RADIUS * Math.cos(lat * Math.PI * 0.5);
    const geo = bag.add(new THREE.BufferGeometry().setFromPoints(circlePoints(r)));
    const line = new THREE.Line(geo, ringMat);
    line.rotation.x = Math.PI / 2;
    line.position.y = GLOBE_RADIUS * Math.sin(lat * Math.PI * 0.5);
    shell.add(line);
  }

  group.add(shell);

  /* ---------------------------------------------------------------- */
  /* Orbit rings                                                       */
  /*  Two bright rings reach well beyond the globe and cross each       */
  /*  other, which is what turns a sphere of dots into something that   */
  /*  reads as a nebula: a wide disc with a ring standing through it.   */
  /*  They live outside `shell` so they can drift at their own rate.    */
  /*  Each ring is a crisp cream core over a softer warm-white rim glow, */
  /*  drawn with true screen-space line widths (Line2) so they read as a */
  /*  deliberate ring rather than a thin wireframe hairline.             */
  /* ---------------------------------------------------------------- */
  const orbits = new THREE.Group();
  const orbitMat = bag.add(
    new LineMaterial({
      color: CREAM,
      transparent: true,
      opacity: 0.55,
      linewidth: 1.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const orbitGlowMat = bag.add(
    new LineMaterial({
      color: CREAM_WARM,
      transparent: true,
      opacity: 0.22,
      linewidth: 4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const orbitFaintMat = bag.add(
    new LineMaterial({
      color: CREAM,
      transparent: true,
      opacity: 0.2,
      linewidth: 1.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const orbitFaintGlowMat = bag.add(
    new LineMaterial({
      color: CREAM_WARM,
      transparent: true,
      opacity: 0.1,
      linewidth: 2.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  const circlePositions = (radius: number, segments = 220) => {
    const pts: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    }
    return pts;
  };

  // One ring = one shared geometry drawn twice: the soft warm-white glow
  // behind, the crisp cream core in front. Grouped so the pair moves as one.
  const ringAt = (radius: number, coreMat: LineMaterial, glowMat: LineMaterial) => {
    const geo = bag.add(new LineGeometry());
    geo.setPositions(circlePositions(radius));
    const ring = new THREE.Group();
    ring.add(new Line2(geo, glowMat), new Line2(geo, coreMat));
    return ring;
  };

  // The disc: a bright ring with a wider, fainter companion outside it.
  const discRing = ringAt(DISC_RADIUS, orbitMat, orbitGlowMat);
  discRing.rotation.x = Math.PI / 2;
  const discOuter = ringAt(DISC_RADIUS * 1.16, orbitFaintMat, orbitFaintGlowMat);
  discOuter.rotation.x = Math.PI / 2;

  // The ring standing through the disc. It is tilted off the view plane as well
  // as leaned, so as it precesses it narrows to a slim ellipse instead of
  // collapsing to a flat line once per half turn.
  const uprightRing = ringAt(DISC_RADIUS * 0.88, orbitMat, orbitGlowMat);
  uprightRing.rotation.z = 0.24;
  uprightRing.rotation.x = 0.38;

  orbits.add(discRing, discOuter, uprightRing);
  group.add(orbits);

  /* ---------------------------------------------------------------- */
  /* The network inside                                                */
  /* ---------------------------------------------------------------- */
  const nodes: THREE.Vector3[] = SHELLS.flatMap((s, i) =>
    fibonacciShell(s.count, GLOBE_RADIUS * s.radius, i * 1.7)
  );

  const edgeVerts: number[] = [];
  const edges: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  const maxLink = GLOBE_RADIUS * 2 * LINK_DISTANCE;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].distanceTo(nodes[j]) > maxLink) continue;
      edgeVerts.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
      edges.push({ from: nodes[i], to: nodes[j] });
    }
  }

  const edgeGeo = bag.add(new THREE.BufferGeometry());
  edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgeVerts, 3));
  const edgeMat = bag.add(
    new THREE.LineBasicMaterial({
      color: ORANGE,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(new THREE.LineSegments(edgeGeo, edgeMat));

  const nodePos = new Float32Array(nodes.length * 3);
  nodes.forEach((v, i) => {
    nodePos[i * 3] = v.x;
    nodePos[i * 3 + 1] = v.y;
    nodePos[i * 3 + 2] = v.z;
  });
  const nodeGeo = bag.add(new THREE.BufferGeometry());
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));

  const nodeMat = bag.add(
    new THREE.PointsMaterial({
      color: ORANGE_BRIGHT,
      size: 3.2,
      map: glowTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  group.add(new THREE.Points(nodeGeo, nodeMat));

  // Haloes: the same points drawn larger and dimmer.
  const haloMat = bag.add(
    new THREE.PointsMaterial({
      color: ORANGE,
      size: 9,
      map: glowTex,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  group.add(new THREE.Points(nodeGeo, haloMat));

  /* ---------------------------------------------------------------- */
  /* Activation pulses                                                 */
  /* ---------------------------------------------------------------- */
  const pulseEdge = new Int32Array(PULSES);
  const pulseT = new Float32Array(PULSES);
  const pulseSpeed = new Float32Array(PULSES);
  const pulseDir = new Int8Array(PULSES);
  const pulsePos = new Float32Array(PULSES * 3);

  const seedPulse = (i: number) => {
    pulseEdge[i] = Math.floor(Math.random() * edges.length);
    pulseT[i] = 0;
    pulseSpeed[i] = 0.4 + Math.random() * 0.9;
    pulseDir[i] = Math.random() < 0.5 ? 1 : -1;
  };
  for (let i = 0; i < PULSES; i++) {
    seedPulse(i);
    pulseT[i] = Math.random();
  }

  const pulseGeo = bag.add(new THREE.BufferGeometry());
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
  const pulseMat = bag.add(
    new THREE.PointsMaterial({
      color: ORANGE_HOT,
      size: 2.4,
      map: glowTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  group.add(new THREE.Points(pulseGeo, pulseMat));

  /* ---------------------------------------------------------------- */
  /* The core at the centre                                            */
  /*  A small counter-rotating icosahedron in a halo — the model the    */
  /*  surrounding network is training.                                  */
  /* ---------------------------------------------------------------- */
  const core = new THREE.Group();

  const coreShape = new THREE.Mesh(
    bag.add(new THREE.IcosahedronGeometry(5.2, 0)),
    bag.add(
      new THREE.MeshBasicMaterial({
        color: ORANGE_BRIGHT,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );
  const coreInner = new THREE.Mesh(
    bag.add(new THREE.IcosahedronGeometry(2.6, 0)),
    bag.add(
      new THREE.MeshBasicMaterial({
        color: ORANGE_HOT,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );
  const coreGlow = new THREE.Sprite(
    bag.add(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: ORANGE,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );
  coreGlow.scale.set(26, 26, 1);
  core.add(coreGlow, coreShape, coreInner);
  group.add(core);

  /* ---------------------------------------------------------------- */
  /* Ambient dust outside the globe                                    */
  /* ---------------------------------------------------------------- */
  // Two thirds of the dust is squashed toward the disc plane and spread out to
  // the ring, so the rings sit in something rather than in empty space; the
  // rest stays spherical as a faint halo.
  const dustCount = 190;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const inDisc = i % 3 !== 0;
    const theta = Math.random() * Math.PI * 2;
    if (inDisc) {
      const r = GLOBE_RADIUS * (0.9 + Math.random() * 0.78);
      dustPos[i * 3] = Math.cos(theta) * r;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * GLOBE_RADIUS * 0.16;
      dustPos[i * 3 + 2] = Math.sin(theta) * r;
    } else {
      const r = GLOBE_RADIUS * (1.1 + Math.random() * 0.55);
      const phi = Math.acos(Math.random() * 2 - 1);
      dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPos[i * 3 + 2] = r * Math.cos(phi);
    }
  }
  const dustGeo = bag.add(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = bag.add(
    new THREE.PointsMaterial({
      color: ORANGE_PALE,
      size: 0.8,
      map: glowTex,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  const dust = new THREE.Points(dustGeo, dustMat);
  group.add(dust);

  // The haze that makes the rings read as sitting in a nebula rather than in
  // empty space. A plane lying in the disc plane, not a sprite: a sprite would
  // always face the camera and so would refuse to tilt with the disc.
  const hazeMat = bag.add(
    new THREE.MeshBasicMaterial({
      map: glowTex,
      color: ORANGE,
      transparent: true,
      opacity: 0.17,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  const haze = new THREE.Mesh(
    bag.add(new THREE.PlaneGeometry(DISC_RADIUS * 2.7, DISC_RADIUS * 2.7)),
    hazeMat
  );
  haze.rotation.x = Math.PI / 2;
  group.add(haze);

  /* ---------------------------------------------------------------- */
  const update = (delta: number, elapsed: number, input: NeuralInput) => {
    group.rotation.y += delta * (0.09 + input.spinBoost);
    group.rotation.x = Math.sin(elapsed * 0.22) * 0.1 + input.tiltY * 0.35 + Math.min(input.scrollY, 800) * 0.0003;
    group.rotation.z = Math.cos(elapsed * 0.18) * 0.04 + input.tiltX * 0.2;

    // The shell drifts against the network so the globe reads as a container
    // the network sits inside, rather than part of the same rigid object.
    shell.rotation.y -= delta * 0.05;

    // The disc and the upright ring turn against each other, so the crossing
    // point travels instead of sitting still.
    discRing.rotation.z += delta * 0.07;
    discOuter.rotation.z -= delta * 0.04;
    uprightRing.rotation.y += delta * 0.07;
    orbits.rotation.x = Math.sin(elapsed * 0.14) * 0.07;

    for (let i = 0; i < PULSES; i++) {
      pulseT[i] += delta * pulseSpeed[i];
      if (pulseT[i] >= 1) seedPulse(i);
      const e = edges[pulseEdge[i]];
      const t = pulseDir[i] === 1 ? pulseT[i] : 1 - pulseT[i];
      pulsePos[i * 3] = e.from.x + (e.to.x - e.from.x) * t;
      pulsePos[i * 3 + 1] = e.from.y + (e.to.y - e.from.y) * t;
      pulsePos[i * 3 + 2] = e.from.z + (e.to.z - e.from.z) * t;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    // The core counter-rotates and breathes.
    core.rotation.y -= delta * 0.5;
    core.rotation.x += delta * 0.28;
    const beat = 1 + Math.sin(elapsed * 1.8) * 0.14;
    coreShape.scale.setScalar(beat);
    coreInner.scale.setScalar(2 - beat);
    coreGlow.scale.set(26 * beat, 26 * beat, 1);

    const pulse = Math.sin(elapsed * 1.5);
    nodeMat.opacity = 0.8 + pulse * 0.18;
    haloMat.opacity = 0.16 + pulse * 0.08;
    edgeMat.opacity = 0.11 + Math.sin(elapsed * 0.9) * 0.04;
    ringMat.opacity = 0.14 + Math.sin(elapsed * 0.7) * 0.04;
    orbitMat.opacity = 0.44 + Math.sin(elapsed * 1.1) * 0.12;
    orbitGlowMat.opacity = 0.2 + Math.sin(elapsed * 1.1) * 0.08;
    orbitFaintMat.opacity = 0.13 + Math.sin(elapsed * 0.8 + 1) * 0.05;
    orbitFaintGlowMat.opacity = 0.09 + Math.sin(elapsed * 0.8 + 1) * 0.04;
    dustMat.opacity = 0.3 + Math.sin(elapsed * 2.1) * 0.14;
    dust.rotation.y -= delta * 0.03;
    hazeMat.opacity = 0.14 + Math.sin(elapsed * 0.6) * 0.05;
    haze.rotation.z += delta * 0.02;
  };

  return { group, update };
}
