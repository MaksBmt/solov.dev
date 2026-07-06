const TAU = Math.PI * 2;
const PERSPECTIVE = 900;
const MOUSE_RADIUS = 160;
const MOUSE_FORCE = 26;

function noise3(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.7 + Math.sin(y * 2.3 + z * 1.1))
    + Math.sin(y * 1.3 + Math.sin(z * 1.9 + x * 0.7))
    + Math.sin(z * 2.1 + Math.sin(x * 1.2 + y * 1.7))
  ) / 3;
}

function normalize(v: { x: number, y: number, z: number }) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: { x: number, y: number, z: number }, b: { x: number, y: number, z: number }) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function createBundle(layer: string, hue = 32, saturation = 85) {
  const w = normalize({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random() * 2 - 1,
  });
  const u = normalize(cross(w, Math.abs(w.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }));
  const v = cross(w, u);

  return {
    layer,
    u,
    v,
    w,
    hue,
    saturation,
    speed: Math.random() * 0.35 + 0.15,
    seed: Math.random() * 100,
  };
}

export default class SphereLine {
  bundle: any;
  layer: string;
  height: number;
  ringRadius: number;
  noiseOffset: number;
  hue: number;
  saturation: number;
  isAccent: boolean;
  brightness: number;
  seed: number;
  pointCount: number;
  points: Array<{ x: number, y: number, front: number, glow: number }>;
  viewport: any;
  baseRadius: number = 0;

  constructor(viewport: any, bundle: any, lineIndex: number, linesPerBundle: number) {
    this.bundle = bundle;
    this.layer = bundle.layer;

    const spread = 0.5;
    this.height = ((lineIndex / Math.max(1, linesPerBundle - 1)) - 0.5) * spread
      + (Math.random() - 0.5) * 0.03;
    this.ringRadius = Math.sqrt(Math.max(0.05, 1 - this.height * this.height));

    this.noiseOffset = lineIndex * 0.07 + Math.random() * 0.03;

    this.hue = bundle.hue + (Math.random() - 0.5) * 10;
    this.saturation = Math.max(8, bundle.saturation + (Math.random() - 0.5) * 14);

    this.isAccent = Math.random() < 0.09;
    this.brightness = this.isAccent
      ? 1.45 + Math.random() * 0.45
      : 0.4 + Math.random() * 0.45;
    this.seed = bundle.seed + this.noiseOffset;

    this.pointCount = this.layer === 'smoke' ? 70 : 90;
    this.points = Array.from({ length: this.pointCount }, () => ({ x: 0, y: 0, front: 0, glow: 0 }));

    this.setViewport(viewport);
  }

  setViewport(viewport: any) {
    this.viewport = viewport;
    this.baseRadius = Math.min(viewport.width, viewport.height) * 0.36;
  }

  update(time: number, rotX: number, rotY: number, mouseX: number, mouseY: number) {
    const { width, height } = this.viewport;
    const { u, v, w, speed } = this.bundle;
    const centerX = width * 0.5;
    const centerY = height * 0.45;
    const R = this.baseRadius;

    const cosRotY = Math.cos(rotY);
    const sinRotY = Math.sin(rotY);
    const cosRotX = Math.cos(rotX);
    const sinRotX = Math.sin(rotX);

    const flow = time * speed;

    for (let i = 0; i < this.pointCount; i += 1) {
      const t = (i / this.pointCount) * TAU;
      const ct = Math.cos(t) * this.ringRadius;
      const st = Math.sin(t) * this.ringRadius;

      let px = u.x * ct + v.x * st + w.x * this.height;
      let py = u.y * ct + v.y * st + w.y * this.height;
      let pz = u.z * ct + v.z * st + w.z * this.height;

      const n1 = noise3(
        px * 0.9 + this.bundle.seed,
        py * 0.9 + flow * 0.5 + this.noiseOffset,
        pz * 0.9 - flow * 0.3,
      );
      const n2 = noise3(
        px * 2.4 - flow * 0.4,
        py * 2.4 + this.bundle.seed * 0.6,
        pz * 2.4 + this.noiseOffset,
      );

      const n3 = noise3(
        px * 1.7 + flow * 0.25 + 40,
        py * 1.7 - this.bundle.seed,
        pz * 1.7 + this.noiseOffset,
      );

      const radius = R * (0.66 + n1 * 0.42 + n2 * 0.14);
      const glow = Math.max(0, n2) * Math.max(0, n2);
      const wobble = n3 * R * 0.4;

      px = px * radius + w.x * wobble;
      py = py * radius + w.y * wobble;
      pz = pz * radius + w.z * wobble;

      const rx = px * cosRotY + pz * sinRotY;
      let rz = -px * sinRotY + pz * cosRotY;
      const ry = py * cosRotX - rz * sinRotX;
      rz = py * sinRotX + rz * cosRotX;

      const scale = PERSPECTIVE / (PERSPECTIVE + rz);
      let projX = centerX + rx * scale;
      let projY = centerY + ry * scale;

      const dx = projX - mouseX;
      const dy = projY - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_RADIUS && dist > 0.001) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        projX += (dx / dist) * force * force * MOUSE_FORCE;
        projY += (dy / dist) * force * force * MOUSE_FORCE;
      }

      const point = this.points[i];
      point.x = projX;
      point.y = projY;
      point.front = Math.min(1, Math.max(0, (1 - rz / (R * 1.3)) / 2));
      point.glow = glow;
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    if (this.layer === 'smoke') {
      this.drawSmoke(ctx);
    } else if (this.layer === 'dots') {
      this.drawDots(ctx);
    } else {
      this.drawGlow(ctx, time);
    }
  }

  drawSmoke(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.pointCount; i += 1) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(52, 46, 44, 0.16)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  drawDots(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.pointCount; i += 2) {
      const point = this.points[i];
      const alpha = point.front * point.front * 0.6 * Math.min(1, this.brightness + 0.3);

      ctx.beginPath();
      ctx.arc(point.x, point.y, 0.5 + point.front * 1.2, 0, TAU);
      ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, 68%, ${alpha})`;
      ctx.fill();
    }
  }

  drawGlow(ctx: CanvasRenderingContext2D, time: number) {
    const batch = 5;

    for (let start = 0; start < this.pointCount; start += batch) {
      const end = Math.min(start + batch, this.pointCount - 1);
      const Math_floor = Math.floor;
      const mid = this.points[Math_floor((start + end) / 2)];
      const front = mid.front;
      const flicker = 0.8 + 0.2 * Math.sin(time * this.bundle.speed * 3 + this.seed + start * 0.3);
      const depthAlpha = 0.016 + front * front * front * 0.46;
      const alpha = depthAlpha * (0.5 + mid.glow * 3.2) * flicker * this.brightness;

      ctx.beginPath();
      ctx.moveTo(this.points[start].x, this.points[start].y);
      for (let i = start + 1; i <= end; i += 1) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      const lightness = 46 + front * 12 + mid.glow * (this.isAccent ? 26 : 14);

      ctx.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${lightness}%, ${alpha})`;
      ctx.lineWidth = 0.4 + front * 0.85;
      ctx.stroke();
    }
  }
}
