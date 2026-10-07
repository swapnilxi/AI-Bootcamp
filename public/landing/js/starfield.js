/* starfield.js — Faint twinkling gold starfield + rare shooting star drawn on the hero canvas.
   Pauses when the hero is off-screen or the tab is hidden; draws one still frame under reduced motion. */
(function (MS) {
  "use strict";
  function initStarfield(reduceMotion) {
    var canvas = document.getElementById("celestial-stars-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var host = canvas.parentElement;
    var width = 0, height = 0, stars = [];
    var inView = true, tabActive = !document.hidden;
    var colors = ["rgba(200, 164, 92,", "rgba(223, 183, 108,", "rgba(235, 226, 210,", "rgba(195, 180, 150,"];

    function build() {
      var count = Math.floor(Math.min(width, 1440) / 14);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width, y: Math.random() * height,
          size: i < 4 ? 1.3 + Math.random() * 0.6 : 0.4 + Math.random() * 0.8,
          base: 0.15 + Math.random() * 0.4,
          speed: 0.4 + Math.random() * 1.2,
          off: Math.random() * Math.PI * 2,
          spikes: i < 4,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = host.clientWidth; height = host.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduceMotion) draw(0);
    }

    var shoot = null, nextShoot = 4000 + Math.random() * 4000;
    function draw(time) {
      var t = time * 0.001;
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = reduceMotion ? s.base : Math.max(0.06, Math.min(0.8, s.base + Math.sin(t * s.speed + s.off) * 0.22));
        ctx.fillStyle = s.color + " " + a + ")";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        if (s.spikes && a > 0.35) {
          var L = s.size * 5;
          ctx.strokeStyle = "rgba(200, 164, 92, " + (a - 0.25) * 0.5 + ")";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
          ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
          ctx.stroke();
        }
      }
      if (reduceMotion) return;
      if (!shoot && time > nextShoot) {
        var ang = (26 + Math.random() * 12) * Math.PI / 180;
        shoot = { x: Math.random() * width * 0.7, y: Math.random() * height * 0.4, len: 80 + Math.random() * 60, speed: 6 + Math.random() * 3, ang: ang, alpha: 0, max: 0.5 + Math.random() * 0.2, p: 0, life: 80 + Math.random() * 40 };
        nextShoot = time + 9000 + Math.random() * 8000;
      }
      if (shoot) {
        shoot.p++;
        var n = shoot.p / shoot.life;
        shoot.alpha = n < 0.2 ? (n / 0.2) * shoot.max : n > 0.7 ? ((1 - n) / 0.3) * shoot.max : shoot.max;
        shoot.x += Math.cos(shoot.ang) * shoot.speed; shoot.y += Math.sin(shoot.ang) * shoot.speed;
        var tx = shoot.x - Math.cos(shoot.ang) * shoot.len, ty = shoot.y - Math.sin(shoot.ang) * shoot.len;
        var g = ctx.createLinearGradient(tx, ty, shoot.x, shoot.y);
        g.addColorStop(0, "rgba(200, 164, 92, 0)");
        g.addColorStop(1, "rgba(245, 230, 185, " + shoot.alpha + ")");
        ctx.strokeStyle = g; ctx.lineWidth = 1.1; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(shoot.x, shoot.y); ctx.stroke();
        if (shoot.p >= shoot.life) shoot = null;
      }
    }

    resize();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (reduceMotion) return;

    document.addEventListener("visibilitychange", function () { tabActive = !document.hidden; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }).observe(host);
    }
    (function loop(time) {
      requestAnimationFrame(loop);
      if (inView && tabActive) draw(time);
    })(0);
  }

  MS.initStarfield = initStarfield;
})(window.AIBootcamp = window.AIBootcamp || {});
