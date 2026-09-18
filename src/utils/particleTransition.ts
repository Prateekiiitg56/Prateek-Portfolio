/**
 * Cinematic Particle Transition — Responsive & Performance-optimised
 *
 * Adapts automatically to device capabilities:
 *   Desktop  — 6px particles, full scatter, central glow
 *   Tablet   — 8px particles, scaled scatter, lighter glow
 *   Mobile   — 10px particles, compact scatter, no glow, shorter duration
 */

/* ── types ── */
interface Particle {
  sx: number; sy: number;
  cx: number; cy: number;
  mx: number; my: number;
  tx: number; ty: number;
  x: number;  y: number;
  color: string;
  size: number;
  delay: number;
}

/* ── easing ── */
const easeOutCubic   = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeOutQuint   = (t: number) => 1 - Math.pow(1 - t, 5);
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

/**
 * Device-aware configuration.
 */
function getConfig(vw: number) {
  if (vw <= 480) {
    // Phone
    return { pixelSize: 10, duration: 800, scatterRadius: 120, glow: false, dprCap: 1.5 };
  } else if (vw <= 1024) {
    // Tablet / iPad
    return { pixelSize: 8, duration: 1000, scatterRadius: 180, glow: true, dprCap: 1.5 };
  } else {
    // Desktop
    return { pixelSize: 6, duration: 1200, scatterRadius: 280, glow: true, dprCap: 2 };
  }
}

/**
 * Compute the modal card rectangle that `ProjectModal` will occupy.
 * Matches CSS: max-width 780px, centred, padding 20px (12px on mobile).
 */
function getModalRect(vw: number, vh: number) {
  const isMobile = vw <= 768;
  const pad = isMobile ? 12 : 20;
  const cardW = Math.min(780, vw - pad * 2);
  const cardH = Math.min(vh * (isMobile ? 0.88 : 0.85), isMobile ? vh * 0.88 : 500);
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
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cfg = getConfig(vw);

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
  canvas.width  = vw * dpr;
  canvas.height = vh * dpr;
  canvas.style.cssText = `
    position: fixed; inset: 0;
    width: 100vw; height: 100vh;
    z-index: 99999; pointer-events: none;
  `;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d", { alpha: true })!;
  ctx.scale(dpr, dpr);

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onerror = () => { canvas.remove(); onComplete(); };

  img.onload = () => {
    const modal = getModalRect(vw, vh);
    const PIXEL_SIZE = cfg.pixelSize;

    const cols = Math.ceil(modal.w / PIXEL_SIZE);
    const rows = Math.ceil(modal.h / PIXEL_SIZE);

    const offCanvas  = document.createElement("canvas");
    offCanvas.width  = cols;
    offCanvas.height = rows;
    const offCtx = offCanvas.getContext("2d")!;

    offCtx.fillStyle = "#110e15";
    offCtx.fillRect(0, 0, cols, rows);

    // On mobile (stacked layout) the image is full-width top portion
    // On desktop it was 50% left column — but now modal is stacked everywhere
    const imgCols = cols;
    const imgRows = Math.ceil(rows * 0.44); // image is ~220px of ~500px
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
    const maxModalDim = Math.max(modal.w, modal.h) * 0.7;

    const particles: Particle[] = [];
    const data = imageData.data;
    const gatherJitter = vw <= 480 ? 25 : vw <= 1024 ? 35 : 50;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = (row * cols + col) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const sx = cardRect.left + (col / cols) * cardRect.width;
        const sy = cardRect.top  + (row / rows) * cardRect.height;

        const cx = screenCX + (Math.random() - 0.5) * gatherJitter;
        const cy = screenCY + (Math.random() - 0.5) * gatherJitter;

        const tx = modal.x + col * PIXEL_SIZE;
        const ty = modal.y + row * PIXEL_SIZE;

        const dtx = tx - modalCX;
        const dty = ty - modalCY;
        const dist = Math.sqrt(dtx * dtx + dty * dty);

        const angle  = Math.random() * Math.PI * 2;
        const radius = cfg.scatterRadius * 0.4 + Math.random() * cfg.scatterRadius;
        const mx = screenCX + Math.cos(angle) * radius;
        const my = screenCY + Math.sin(angle) * radius;

        particles.push({
          sx, sy, cx, cy, mx, my, tx, ty,
          x: sx, y: sy,
          color: `rgb(${r},${g},${b})`,
          size: PIXEL_SIZE,
          delay: (1 - dist / maxModalDim) * 0.05,
        });
      }
    }

    /* ── Phase boundaries ── */
    const P1 = 0.12;
    const P2 = 0.35;
    const P3 = 0.85;

    /* ── Pre-create central glow gradient (desktop/tablet only) ── */
    let glowGrad: CanvasGradient | null = null;
    if (cfg.glow) {
      const glowRadius = vw <= 1024 ? 200 : 320;
      glowGrad = ctx.createRadialGradient(
        screenCX, screenCY, 0,
        screenCX, screenCY, glowRadius
      );
      glowGrad.addColorStop(0,   "rgba(99, 230, 255, 0.22)");
      glowGrad.addColorStop(0.5, "rgba(124, 108, 255, 0.10)");
      glowGrad.addColorStop(1,   "rgba(99, 230, 255, 0)");
    }

    /* ── Animation loop ── */
    const DURATION = cfg.duration;
    const start = performance.now();
    let modalMounted = false;

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, vw, vh);

      // Backdrop
      ctx.globalAlpha = Math.min(progress * 3, 0.75);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, vw, vh);

      // Central glow (desktop/tablet only)
      if (glowGrad && progress > P1 * 0.5 && progress < P3) {
        const glowT = progress < P2
          ? easeOutCubic((progress - P1 * 0.5) / (P2 - P1 * 0.5))
          : 1 - (progress - P2) / (P3 - P2);
        ctx.globalAlpha = Math.max(0, glowT * 0.8);
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, vw, vh);
      }

      ctx.globalAlpha = 1;

      // Mount the real modal early — particles dissolve over it
      const MOUNT_AT = 0.70;
      if (!modalMounted && progress >= MOUNT_AT) {
        modalMounted = true;
        onComplete();
      }

      // Fade canvas out to reveal real modal underneath
      if (modalMounted) {
        const fadeProgress = (progress - MOUNT_AT) / (1 - MOUNT_AT);
        canvas.style.opacity = String(Math.max(0, 1 - easeOutCubic(fadeProgress)));
      }

      /* ── Draw particles ── */
      for (let i = 0, len = particles.length; i < len; i++) {
        const p = particles[i];
        const t = (progress - p.delay) / (1 - p.delay);
        if (t <= 0) continue;
        const tc = t > 1 ? 1 : t;

        let sz: number;

        if (tc <= P1) {
          const e = easeOutCubic(tc / P1);
          p.x = p.sx + (p.cx - p.sx) * e;
          p.y = p.sy + (p.cy - p.sy) * e;
          ctx.globalAlpha = 0.4 + e * 0.4;
          sz = p.size * (0.5 + e * 0.3);

        } else if (tc <= P2) {
          const e = easeOutQuint((tc - P1) / (P2 - P1));
          p.x = p.cx + (p.mx - p.cx) * e;
          p.y = p.cy + (p.my - p.cy) * e;
          ctx.globalAlpha = 0.75 + e * 0.15;
          sz = p.size * (0.8 + e * 0.5);

        } else {
          const e = easeInOutQuart((tc - P2) / (P3 - P2));
          p.x = p.mx + (p.tx - p.mx) * e;
          p.y = p.my + (p.ty - p.my) * e;
          ctx.globalAlpha = 0.9 + e * 0.1;
          sz = p.size * (1.2 - e * 0.2);
        }

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, sz, sz);
      }

      ctx.globalAlpha = 1;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        if (!modalMounted) onComplete();
        canvas.remove();
      }
    };

    requestAnimationFrame(frame);
  };

  img.src = imageSrc;
}
