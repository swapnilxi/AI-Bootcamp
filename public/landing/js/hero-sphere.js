/* hero-sphere.js — Three.js gold-on-black armillary sphere in the hero (port of HeroArmillarySphere.tsx).
   DPR capped at 2, pauses off-screen, mouse parallax + scroll-linked spin, disposes on pagehide. */
(function (MS) {
  "use strict";
  function initHeroSphere(reduceMotion) {
    var container = document.getElementById("hero-canvas-container");
    if (!container || typeof THREE === "undefined") { if (container) container.style.opacity = 1; return; }
    try {
      var test = document.createElement("canvas");
      if (!(window.WebGLRenderingContext && (test.getContext("webgl") || test.getContext("experimental-webgl")))) { container.style.opacity = 1; return; }
    } catch (e) { container.style.opacity = 1; return; }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch (e) { container.style.opacity = 1; return; }

    var fallback = document.getElementById("static-fallback");
    if (fallback) fallback.style.display = "none";

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1000);
    camera.position.z = 86;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    function size() { return Math.max(1, Math.round(container.clientWidth || 340)); }
    var s0 = size();
    renderer.setSize(s0, s0, false);
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    var goldHex = 0xc8a45c, brightHex = 0xffe3a3;
    var group = new THREE.Group();
    var disposables = [];

    var glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 128;
    var gctx = glowCanvas.getContext("2d");
    var grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.15, "rgba(255,238,200,0.85)");
    grad.addColorStop(0.4, "rgba(230,185,100,0.28)");
    grad.addColorStop(1, "rgba(200,164,92,0)");
    gctx.fillStyle = grad; gctx.fillRect(0, 0, 128, 128);
    var glowTex = new THREE.CanvasTexture(glowCanvas);
    disposables.push(glowTex);

    function addMat(m) { disposables.push(m); return m; }
    function makeRing(radius, thickness, opacity, rx, ry, rz) {
      var g = new THREE.Group();
      g.rotation.set(rx, ry, rz || 0);
      [[1, opacity, goldHex], [2.6, opacity * 0.06, brightHex]].forEach(function (l) {
        var geo = new THREE.TorusGeometry(radius, thickness * l[0], 10, 260);
        var mat = addMat(new THREE.MeshBasicMaterial({ color: l[2], opacity: l[1], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        disposables.push(geo);
        g.add(new THREE.Mesh(geo, mat));
      });
      group.add(g);
      return g;
    }
    var ring1 = makeRing(32, 0.16, 0.75, 0, 0);
    makeRing(32, 0.14, 0.6, Math.PI / 2, 0);
    var colure = makeRing(32, 0.11, 0.4, 0, Math.PI / 2);
    var ring3 = makeRing(32, 0.3, 0.85, Math.PI / 2 - 0.41, 0.25);

    // particles travelling along the ecliptic
    var orbitCount = 60;
    var angles = new Float32Array(orbitCount), speeds = new Float32Array(orbitCount), opos = new Float32Array(orbitCount * 3);
    for (var i = 0; i < orbitCount; i++) { angles[i] = Math.random() * Math.PI * 2; speeds[i] = 0.15 + Math.random() * 0.45; }
    var orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute("position", new THREE.BufferAttribute(opos, 3));
    var orbitMat = addMat(new THREE.PointsMaterial({ color: brightHex, size: 1.6, map: glowTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    disposables.push(orbitGeo);
    ring3.add(new THREE.Points(orbitGeo, orbitMat));

    // core
    var centerGeo = new THREE.SphereGeometry(3.6, 20, 20);
    var centerMesh = new THREE.Mesh(centerGeo, addMat(new THREE.MeshBasicMaterial({ color: goldHex, wireframe: true, opacity: 0.8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    var octGeo = new THREE.OctahedronGeometry(6.5, 0);
    var octMesh = new THREE.Mesh(octGeo, addMat(new THREE.MeshBasicMaterial({ color: goldHex, wireframe: true, opacity: 0.9, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    disposables.push(centerGeo, octGeo);
    group.add(centerMesh, octMesh);

    function makeSprite(scale, opacity, color) {
      var sp = new THREE.Sprite(addMat(new THREE.SpriteMaterial({ map: glowTex, color: color, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false })));
      sp.scale.set(scale, scale, 1);
      group.add(sp);
      return sp;
    }
    var coreGlow = makeSprite(14, 0.25, goldHex);
    var coreHot = makeSprite(4, 0.45, 0xf3d9a4);

    function makeStars(count, sz, rMin, rMax, color) {
      var pos = new Float32Array(count * 3);
      for (var k = 0; k < count; k++) {
        var r = 32 * (rMin + Math.random() * (rMax - rMin));
        var th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
        pos[k * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[k * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[k * 3 + 2] = r * Math.cos(ph);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var mat = addMat(new THREE.PointsMaterial({ color: color, size: sz, map: glowTex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
      disposables.push(geo);
      var pts = new THREE.Points(geo, mat);
      group.add(pts);
      return { pts: pts, mat: mat };
    }
    var starsA = makeStars(26, 2.2, 0.3, 0.95, brightHex);
    var starsB = makeStars(30, 1.4, 0.2, 1.0, goldHex);
    var dust = makeStars(110, 0.7, 0.1, 1.15, 0xe9d3a0);

    scene.add(group);
    group.rotation.set(0.25, 0.6, 0.05);

    function updateOrbit() {
      for (var j = 0; j < orbitCount; j++) {
        var a = angles[j];
        opos[j * 3] = Math.cos(a) * 32; opos[j * 3 + 1] = Math.sin(a) * 32; opos[j * 3 + 2] = Math.sin(a * 7 + j) * 0.6;
      }
      orbitGeo.attributes.position.needsUpdate = true;
    }

    function onResize() {
      var s = size();
      renderer.setSize(s, s, false);
      if (reduceMotion) renderer.render(scene, camera);
    }
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(onResize, 120); });

    function dispose() {
      cancelAnimationFrame(animId);
      disposables.forEach(function (d) { d.dispose(); });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    window.addEventListener("pagehide", function (e) { if (!e.persisted) dispose(); });

    var animId = 0;
    if (reduceMotion) {
      updateOrbit();
      renderer.render(scene, camera);
      container.style.opacity = 1;
      return;
    }

    var inView = true, tabVisible = !document.hidden;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.02 }).observe(container);
    }
    document.addEventListener("visibilitychange", function () { tabVisible = !document.hidden; });

    var tx = 0, ty = 0, sx = 0, sy = 0, spin = 0, lastScroll = window.pageYOffset;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = container.getBoundingClientRect();
      if (!r.width) return;
      ty = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5)) * 0.45;
      tx = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5)) * 0.35;
    }, { passive: true });

    var clock = new THREE.Clock();
    function loop() {
      animId = requestAnimationFrame(loop);
      if (!inView || !tabVisible) { clock.getDelta(); return; }
      var delta = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;
      var scrollY = window.pageYOffset;
      var vel = scrollY - lastScroll; lastScroll = scrollY;
      spin += (Math.min(Math.abs(vel), 60) * 0.004 - spin) * 0.08;
      sx += (tx - sx) * 0.04; sy += (ty - sy) * 0.04;

      group.rotation.y += delta * (0.16 + spin);
      group.rotation.x = Math.sin(t * 0.3) * 0.1 + sx * 0.5 + Math.min(scrollY, 800) * 0.0004 + 0.2;
      group.rotation.z = Math.cos(t * 0.25) * 0.05 + sy * 0.35;
      ring3.rotation.z += delta * 0.14;
      ring1.rotation.x += delta * 0.05;
      colure.rotation.x -= delta * 0.06;

      for (var j = 0; j < orbitCount; j++) angles[j] += delta * speeds[j];
      updateOrbit();

      var pulse = 1 + Math.sin(t * 1.6) * 0.12;
      coreGlow.scale.set(16 * pulse, 16 * pulse, 1);
      coreHot.scale.set(5 * pulse, 5 * pulse, 1);
      starsA.mat.opacity = 0.6 + Math.sin(t * 1.9) * 0.25;
      starsB.mat.opacity = 0.55 + Math.sin(t * 1.3 + 2) * 0.25;
      dust.mat.opacity = 0.4 + Math.sin(t * 2.4 + 4) * 0.2;

      var intro = Math.min(t / 2.4, 1);
      group.scale.setScalar(0.84 + 0.16 * (1 - Math.pow(1 - intro, 3)));
      dust.pts.rotation.y -= delta * 0.05;
      octMesh.rotation.y += delta * 0.4; octMesh.rotation.x += delta * 0.2;
      centerMesh.rotation.y -= delta * 0.3;

      renderer.render(scene, camera);
    }
    loop();
    if (typeof window.gsap === "undefined") container.style.opacity = 1;
  }
  MS.initHeroSphere = initHeroSphere;
})(window.AIBootcamp = window.AIBootcamp || {});
