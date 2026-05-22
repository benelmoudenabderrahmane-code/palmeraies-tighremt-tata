/* ════════════════════════════════════════════════════════════
 *  Particle Background — Luxury floating gold dust
 * ════════════════════════════════════════════════════════════ */

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: -1;
    opacity: 0.5;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height;
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + 10;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(0.2 + Math.random() * 0.6);
      this.radius = 0.5 + Math.random() * 2;
      this.alpha = 0.2 + Math.random() * 0.5;
      this.hue = 35 + Math.random() * 25;   // gold range
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.0008;
      if (this.alpha <= 0 || this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.alpha})`;
      ctx.shadowColor = 'gold';
      ctx.shadowBlur = 4;
      ctx.fill();
    }
  }

  const COUNT = Math.min(60, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(animate);
  }
  animate();
})();
