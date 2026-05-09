import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
  Trivista Labs Logo — 3D Penrose triangle (downward-pointing)
  Three interlocking L-shaped ribbon bands:
    • White/silver — turns at top-right vertex
    • Teal (#00D1B2) — turns at top-left vertex
    • Dark gray — turns at bottom vertex
  
  Triangle orientation: flat top edge, point at bottom (V shape)
*/

function buildBand(points, depth, color, zOff) {
  // points = array of [x,y] forming the 2D polygon outline
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 2,
  });

  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0.7,
    clearcoat: 0.35,
    clearcoatRoughness: 0.15,
  });

  if (color === 0x00D1B2) {
    mat.emissive = new THREE.Color(0x00D1B2);
    mat.emissiveIntensity = 0.06;
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = zOff - depth / 2;
  return mesh;
}

export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Logo geometry ──
    // Downward-pointing equilateral triangle
    const s = 1.45;
    const h = s * Math.sqrt(3) / 2;

    // Outer triangle vertices
    const TL = [-s, h * 0.6];       // top-left
    const TR = [s, h * 0.6];        // top-right
    const BT = [0, -h * 1.2];       // bottom point

    // Inner triangle (scaled ~55% inward toward center)
    const cx = 0, cy = (TL[1] + TL[1] + BT[1]) / 3;
    const inr = 0.48;
    const iTL = [cx + (TL[0] - cx) * inr, cy + (TL[1] - cy) * inr];
    const iTR = [cx + (TR[0] - cx) * inr, cy + (TR[1] - cy) * inr];
    const iBT = [cx + (BT[0] - cx) * inr, cy + (BT[1] - cy) * inr];

    // Each band is an L-shaped polygon between outer and inner edges
    // Midpoints on outer edges
    const mTop = [(TL[0] + TR[0]) / 2, (TL[1] + TR[1]) / 2];
    const mRight = [(TR[0] + BT[0]) / 2, (TR[1] + BT[1]) / 2];
    const mLeft = [(TL[0] + BT[0]) / 2, (TL[1] + BT[1]) / 2];

    // Midpoints on inner edges
    const miTop = [(iTL[0] + iTR[0]) / 2, (iTL[1] + iTR[1]) / 2];
    const miRight = [(iTR[0] + iBT[0]) / 2, (iTR[1] + iBT[1]) / 2];
    const miLeft = [(iTL[0] + iBT[0]) / 2, (iTL[1] + iBT[1]) / 2];

    const ribbonD = 0.22;
    const logoGroup = new THREE.Group();

    // ── WHITE BAND (turns at TR — top-right vertex) ──
    // Outer: mTop → TR → mRight
    // Inner: miTop → iTR → miRight
    const white = buildBand([
      mTop, TR, mRight,       // outer path
      miRight, iTR, miTop,    // inner path (reversed)
    ], ribbonD, 0xdcdcdc, 0.12);
    logoGroup.add(white);

    // ── TEAL BAND (turns at TL — top-left vertex) ──
    // Outer: mLeft → TL → mTop
    // Inner: miLeft → iTL → miTop
    const teal = buildBand([
      mLeft, TL, mTop,
      miTop, iTL, miLeft,
    ], ribbonD, 0x00D1B2, -0.12);
    logoGroup.add(teal);

    // ── DARK BAND (turns at BT — bottom vertex) ──
    // Outer: mRight → BT → mLeft
    // Inner: miRight → iBT → miLeft
    const dark = buildBand([
      mRight, BT, mLeft,
      miLeft, iBT, miRight,
    ], ribbonD, 0x444444, 0.0);
    logoGroup.add(dark);

    // Center vertically
    logoGroup.position.y = 0.1;
    scene.add(logoGroup);

    // ── Lighting ──
    const tealPt1 = new THREE.PointLight(0x00D1B2, 3.0, 20);
    tealPt1.position.set(2, 2, 4);
    scene.add(tealPt1);

    const tealPt2 = new THREE.PointLight(0x00D1B2, 1.5, 15);
    tealPt2.position.set(-3, -1, 3);
    scene.add(tealPt2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(3, 5, 4);
    scene.add(dir);

    const rim = new THREE.DirectionalLight(0x00D1B2, 0.2);
    rim.position.set(-2, -3, -3);
    scene.add(rim);

    // ── Mouse parallax ──
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Animation loop ──
    const clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      logoGroup.rotation.y += 0.003;
      logoGroup.rotation.x = Math.sin(t * 0.3) * 0.08;
      logoGroup.position.y = 0.1 + Math.sin(t * 0.5) * 0.12;

      target.x += (mouse.x * 0.6 - target.x) * 0.03;
      target.y += (-mouse.y * 0.6 - target.y) * 0.03;
      logoGroup.position.x = target.x;

      const progress = Math.min(window.scrollY / window.innerHeight, 1);
      logoGroup.scale.setScalar(Math.max(1 - progress * 0.7, 0.3));
      logoGroup.traverse(c => {
        if (c.isMesh && c.material) {
          c.material.opacity = 1 - progress;
          c.material.transparent = progress > 0;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h2 = container.clientHeight;
      camera.aspect = w / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} className="hero-3d-canvas" style={{
      position: 'absolute', inset: 0, zIndex: 0,
      pointerEvents: 'none', willChange: 'transform, opacity',
    }} />
  );
}
