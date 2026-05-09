import { useEffect, useRef } from 'react';

const TEAL = '#00D1B2';

// Draws floating diamond shapes in three depth layers
export default function BackgroundLayers() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = canvas.parentElement.clientWidth;
    let h = canvas.parentElement.clientHeight;
    canvas.width = w;
    canvas.height = h;

    const mouse = { x: w / 2, y: h / 2 };
    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Create diamond shapes for each layer
    function createDiamonds(count, minSize, maxSize) {
      const diamonds = [];
      for (let i = 0; i < count; i++) {
        diamonds.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: minSize + Math.random() * (maxSize - minSize),
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.003,
          driftX: (Math.random() - 0.5) * 0.3,
          driftY: (Math.random() - 0.5) * 0.2,
        });
      }
      return diamonds;
    }

    const layer1 = createDiamonds(4, 120, 180); // far
    const layer2 = createDiamonds(6, 60, 100);   // mid
    const layer3 = createDiamonds(8, 30, 50);     // near

    function drawDiamond(x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, 0);
      ctx.lineTo(0, size / 2);
      ctx.lineTo(-size / 2, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    let animId;
    const startTime = performance.now();

    function animate(now) {
      animId = requestAnimationFrame(animate);
      const elapsed = (now - startTime) / 1000;

      ctx.clearRect(0, 0, w, h);

      // Layer 1: far depth (no mouse influence)
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.025;
      layer1.forEach(d => {
        d.x += d.driftX * 0.3;
        d.y += d.driftY * 0.3;
        d.rotation += d.rotSpeed * 0.5;
        if (d.x < -100) d.x = w + 100;
        if (d.x > w + 100) d.x = -100;
        if (d.y < -100) d.y = h + 100;
        if (d.y > h + 100) d.y = -100;
        drawDiamond(d.x, d.y, d.size, d.rotation);
      });

      // Layer 2: mid depth (2px per 100px mouse)
      ctx.globalAlpha = 0.05;
      const mx2 = (mouse.x - w / 2) * 0.02;
      const my2 = (mouse.y - h / 2) * 0.02;
      layer2.forEach(d => {
        d.x += d.driftX * 0.5;
        d.y += d.driftY * 0.5;
        d.rotation += d.rotSpeed * 0.7;
        if (d.x < -80) d.x = w + 80;
        if (d.x > w + 80) d.x = -80;
        if (d.y < -80) d.y = h + 80;
        if (d.y > h + 80) d.y = -80;
        drawDiamond(d.x + mx2, d.y + my2, d.size, d.rotation);
      });

      // Layer 3: near depth (6px per 100px mouse)
      ctx.globalAlpha = 0.09;
      const mx3 = (mouse.x - w / 2) * 0.06;
      const my3 = (mouse.y - h / 2) * 0.06;
      layer3.forEach(d => {
        d.x += d.driftX * 0.8;
        d.y += d.driftY * 0.8;
        d.rotation += d.rotSpeed;
        if (d.x < -50) d.x = w + 50;
        if (d.x > w + 50) d.x = -50;
        if (d.y < -50) d.y = h + 50;
        if (d.y > h + 50) d.y = -50;
        drawDiamond(d.x + mx3, d.y + my3, d.size, d.rotation);
      });

      ctx.globalAlpha = 1;
    }
    animId = requestAnimationFrame(animate);

    const onResize = () => {
      w = canvas.parentElement.clientWidth;
      h = canvas.parentElement.clientHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
