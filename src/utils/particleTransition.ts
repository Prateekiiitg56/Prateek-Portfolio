/**
 * Cinematic Particle Transition
 *
 * On click the card dissolves into pixel-particles that:
 *   Phase 1 — Gather toward viewport centre
 *   Phase 2 — Explode outward in a full-circle scatter with glow
 *   Phase 3 — Stream and converge into the modal shape
 *   Phase 4 — Settle in place, glow border fades in
 *
 * A pulsing radial glow blooms at screen centre during the scatter,
 * and each particle carries a soft luminous trail for smooth blending.
 */

/* ── types ── */
interface Particle {
  sx: number; sy: number;   // source (card position)
  cx: number; cy: number;   // gather point (near viewport centre)
  mx: number; my: number;   // mid scatter point
  tx: number; ty: number;   // target (on the modal rectangle)
  x: number;  y: number;    // current position
  prevX: number; prevY: number; // previous frame position (for trail)
  r: number; g: number; b: number;
  size: number;
  delay: number;
  dist: number;
}

/* ── config ── */
const PIXEL_SIZE     = 5;
const DURATION       = 1800;
const SCATTER_RADIUS = 320;

/* ── easing ── */
const easeOutCubic    = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic  = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutQuint    = (t: number) => 1 - Math.pow(1 - t, 5);
const easeInOutQuart  = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

/**
 * Compute the modal card rectangle that `ProjectModal` will occupy.
 * Mirrors the CSS: max-width 780px, centred, 20px viewport padding.
 */
function getModalRect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 20;
  const cardW = Math.min(780, vw - pad * 2);
  const cardH = 480;
  return {
    x: (vw - cardW) / 2,
    y: (vh - cardH) / 2,
    w: cardW,
    h: cardH,
  };
}

export function runParticleTransition(
  cardRect: DOMRect,
  imageSrc: string,
  onComplete: () => void
) {
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width  = vw * dpr;
  canvas.height = vh * dpr;
  canvas.style.cssText = `
    position: fixed; inset: 0;
    width: 100vw; height: 100vh;
    z-index: 99999; pointer-events: none;
  `;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onerror = () => { canvas.remove(); onComplete(); };

  img.onload = () => {
    /* ── target = the modal card rectangle ── */
    const modal = getModalRect();

    /* Sample pixel colours to fill the modal rectangle */
    const cols = Math.ceil(modal.w / PIXEL_SIZE);
    const rows = Math.ceil(modal.h / PIXEL_SIZE);

    const offCanvas  = document.createElement("canvas");
    offCanvas.width  = cols;
    offCanvas.height = rows;
    const offCtx = offCanvas.getContext("2d")!;

    offCtx.fillStyle = "#110e15";
    offCtx.fillRect(0, 0, cols, rows);

    const imgCols = Math.ceil(cols * 0.5);
    const imgRows = rows;
    offCtx.drawImage(img, 0, 0, imgCols, imgRows);

    let imageData: ImageData;
    try {
      imageData = offCtx.getImageData(0, 0, cols, rows);
    } catch {
      canvas.remove(); onComplete(); return;
    }

    /* ── Build particles ── */
    const screenCX = vw / 2;
    const screenCY = vh / 2;
    const modalCX = modal.x + modal.w / 2;
    const modalCY = modal.y + modal.h / 2;

    const particles: Particle[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = (row * cols + col) * 4;
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        // Source: mapped onto the clicked card
        const sx = cardRect.left + (col / cols) * cardRect.width;
        const sy = cardRect.top  + (row / rows) * cardRect.height;

        // Gather point: slightly jittered around viewport centre
        const cx = screenCX + (Math.random() - 0.5) * 60;
        const cy = screenCY + (Math.random() - 0.5) * 60;

        // Target: mapped onto the modal rectangle
        const tx = modal.x + col * PIXEL_SIZE;
        const ty = modal.y + row * PIXEL_SIZE;

        // Distance from target centre for stagger
        const dtx = tx - modalCX;
        const dty = ty - modalCY;
        const dist = Math.sqrt(dtx * dtx + dty * dty);

        // Scatter mid-point: full-circle random angle from viewport centre
        const angle  = Math.random() * Math.PI * 2;
        const radius = SCATTER_RADIUS * 0.5 + Math.random() * SCATTER_RADIUS;
        const mx = screenCX + Math.cos(angle) * radius;
        const my = screenCY + Math.sin(angle) * radius;

        particles.push({
          sx, sy, cx, cy, mx, my, tx, ty,
          x: sx, y: sy,
          prevX: sx, prevY: sy,
          r, g, b,
          size: PIXEL_SIZE,
          delay: 0, dist,
        });
      }
    }

    // Stagger: outer modal particles move first, centre last
    const maxDist = Math.max(...particles.map(p => p.dist)) || 1;
    particles.forEach(p => { p.delay = (1 - p.dist / maxDist) * 0.06; });

    /* ── Phase boundaries ── */
    const P1_END = 0.15;   // gather to centre
    const P2_END = 0.40;   // scatter outward
    const P3_END = 0.88;   // converge to modal
    // 0.88–1.0 = settle

    /* ── Animation loop ── */
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, vw, vh);

      // Backdrop fade-in
      const bAlpha = Math.min(progress * 2.5, 0.75);
      ctx.fillStyle = `rgba(0, 0, 0, ${bAlpha})`;
      ctx.fillRect(0, 0, vw, vh);

      /* ── Radial glow pulse at screen centre during scatter ── */
      if (progress > P1_END * 0.5 && progress < P3_END) {
        const glowT = progress < P2_END
          ? easeOutCubic((progress - P1_END * 0.5) / (P2_END - P1_END * 0.5))
          : 1 - easeInOutCubic((progress - P2_END) / (P3_END - P2_END));
        const glowRadius = 80 + glowT * 260;
        const grad = ctx.createRadialGradient(
          screenCX, screenCY, 0,
          screenCX, screenCY, glowRadius
        );
        grad.addColorStop(0,   `rgba(99, 230, 255, ${0.25 * glowT})`);
        grad.addColorStop(0.4, `rgba(124, 108, 255, ${0.15 * glowT})`);
        grad.addColorStop(0.7, `rgba(217, 70, 239, ${0.08 * glowT})`);
        grad.addColorStop(1,   `rgba(99, 230, 255, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, vw, vh);
      }

      /* ── Draw particles ── */
      for (const p of particles) {
        const t = Math.max(0, Math.min(1, (progress - p.delay) / (1 - p.delay)));
        if (t <= 0) continue;

        p.prevX = p.x;
        p.prevY = p.y;

        let alpha: number;
        let sz: number;
        let glowSize = 0;

        if (t <= P1_END) {
          /* Phase 1 — Gather toward viewport centre */
          const e = easeOutCubic(t / P1_END);
          p.x = p.sx + (p.cx - p.sx) * e;
          p.y = p.sy + (p.cy - p.sy) * e;
          alpha = 0.3 + e * 0.5;
          sz = p.size * (0.4 + e * 0.4);
          glowSize = sz * 1.5 * e;

        } else if (t <= P2_END) {
          /* Phase 2 — Scatter outward from centre */
          const e = easeOutQuint((t - P1_END) / (P2_END - P1_END));
          p.x = p.cx + (p.mx - p.cx) * e;
          p.y = p.cy + (p.my - p.cy) * e;
          alpha = 0.7 + e * 0.2;
          sz = p.size * (0.8 + e * 0.6);
          glowSize = sz * (2.0 - e * 0.8);

        } else if (t <= P3_END) {
          /* Phase 3 — Stream and converge into modal shape */
          const e = easeInOutQuart((t - P2_END) / (P3_END - P2_END));
          p.x = p.mx + (p.tx - p.mx) * e;
          p.y = p.my + (p.ty - p.my) * e;
          alpha = 0.85 + e * 0.15;
          sz = p.size * (1.4 - e * 0.4);
          glowSize = sz * (1.2 - e * 0.8);

        } else {
          /* Phase 4 — Settle in place on the modal shape */
          const e = easeInOutCubic((t - P3_END) / (1 - P3_END));
          p.x = p.tx;
          p.y = p.ty;
          alpha = 1;
          sz = p.size * (1.0 + (1 - e) * 0.05);
          glowSize = sz * 0.4 * (1 - e);
        }

        /* Soft glow halo behind each particle */
        if (glowSize > 0.5) {
          const gr = ctx.createRadialGradient(
            p.x + sz / 2, p.y + sz / 2, 0,
            p.x + sz / 2, p.y + sz / 2, glowSize
          );
          gr.addColorStop(0,   `rgba(${p.r},${p.g},${p.b},${alpha * 0.35})`);
          gr.addColorStop(0.5, `rgba(${p.r},${p.g},${p.b},${alpha * 0.1})`);
          gr.addColorStop(1,   `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = gr;
          ctx.fillRect(
            p.x + sz / 2 - glowSize,
            p.y + sz / 2 - glowSize,
            glowSize * 2,
            glowSize * 2
          );
        }

        /* Motion trail (subtle) */
        const trailDx = p.x - p.prevX;
        const trailDy = p.y - p.prevY;
        const trailLen = Math.sqrt(trailDx * trailDx + trailDy * trailDy);
        if (trailLen > 2 && t > P1_END && t < P3_END) {
          ctx.globalAlpha = alpha * 0.15;
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          const steps = Math.min(Math.floor(trailLen / 3), 4);
          for (let s = 1; s <= steps; s++) {
            const f = s / (steps + 1);
            ctx.fillRect(
              p.x - trailDx * f,
              p.y - trailDy * f,
              sz * (1 - f * 0.3),
              sz * (1 - f * 0.3)
            );
          }
        }

        /* Core pixel */
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        ctx.fillRect(p.x, p.y, sz, sz);
      }

      ctx.globalAlpha = 1;

      /* ── Glow border around assembled modal shape ── */
      if (progress > P3_END - 0.05) {
        const bt = Math.min((progress - (P3_END - 0.05)) / 0.17, 1);
        const pulseIntensity = 0.3 + Math.sin(progress * 12) * 0.1;

        ctx.strokeStyle = `rgba(99, 230, 255, ${bt * pulseIntensity})`;
        ctx.lineWidth = 1.5 + bt * 0.5;
        ctx.shadowColor = "rgba(99, 230, 255, 0.6)";
        ctx.shadowBlur = 16 * bt;
        roundRect(ctx, modal.x - 1, modal.y - 1, modal.w + 2, modal.h + 2, 20);
        ctx.stroke();

        // Second softer outer glow ring
        ctx.strokeStyle = `rgba(124, 108, 255, ${bt * 0.15})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = "rgba(124, 108, 255, 0.4)";
        ctx.shadowBlur = 28 * bt;
        roundRect(ctx, modal.x - 4, modal.y - 4, modal.w + 8, modal.h + 8, 22);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        /* ── Done: mount the real modal, then cross-fade canvas out ── */
        onComplete();
        requestAnimationFrame(() => {
          canvas.style.transition = "opacity 0.35s ease-out";
          canvas.style.opacity = "0";
          setTimeout(() => canvas.remove(), 380);
        });
      }
    };

    requestAnimationFrame(frame);
  };

  img.src = imageSrc;
}

/* ── rounded-rect helper ── */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
