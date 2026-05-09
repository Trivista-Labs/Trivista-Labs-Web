import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
  Trivista Labs Logo — 3D recreation
  Three interlocking L-shaped ribbon bands forming a triangular knot:
    • White/silver band — turns at top vertex
    • Teal band — turns at bottom-left vertex
    • Dark gray band — turns at bottom-right vertex
*/

function buildRibbonShape(p1, vertex, p2, width) {
  const hw = width / 2;

  function outwardNormal(from, to) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    let nx = -dy / len, ny = dx / len;
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2;
    if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
    return [nx, ny];
  }

  function lineHit(a1, a2, b1, b2) {
    const d1x = a2[0] - a1[0], d1y = a2[1] - a1[1];
    const d2x = b2[0] - b1[0], d2y = b2[1] - b1[1];
    const det = d1x * d2y - d1y * d2x;
    if (Math.abs(det) < 1e-10) return a2;
    const t = ((b1[0] - a1[0]) * d2y - (b1[1] - a1[1]) * d2x) / det;
    return [a1[0] + t * d1x, a1[1] + t * d1y];
  }

  const [n1x, n1y] = outwardNormal(p1, vertex);
  const [n2x, n2y] = outwardNormal(vertex, p2);

  const p1o = [p1[0] + n1x * hw, p1[1] + n1y * hw];
  const p1i = [p1[0] - n1x * hw, p1[1] - n1y * hw];
  const v1o = [vertex[0] + n1x * hw, vertex[1] + n1y * hw];
  const v1i = [vertex[0] - n1x * hw, vertex[1] - n1y * hw];
  const v2o = [vertex[0] + n2x * hw, vertex[1] + n2y * hw];
  const v2i = [vertex[0] - n2x * hw, vertex[1] - n2y * hw];
  const p2o = [p2[0] + n2x * hw, p2[1] + n2y * hw];
  const p2i = [p2[0] - n2x * hw, p2[1] - n2y * hw];

  const vOuter = lineHit(p1o, v1o, v2o, p2o);
  const vInner = lineHit(p1i, v1i, v2i, p2i);

  const shape = new THREE.Shape();
  shape.moveTo(p1o[0], p1o[1]);
  shape.lineTo(vOuter[0], vOuter[1]);
  shape.lineTo(p2o[0], p2o[1]);
  shape.lineTo(p2i[0], p2i[1]);
  shape.lineTo(vInner[0], vInner[1]);
  shape.lineTo(p1i[0], p1i[1]);
  shape.closePath();
  return shape;
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

    // --- Triangle vertices ---
    const s = 1.4;
    const h = s * Math.sqrt(3) / 2;
    const A = [0, s];                // top vertex
    const B = [-h, -s * 0.5];       // bottom-left vertex
    const C = [h, -s * 0.5];        // bottom-right vertex

    // Edge midpoints — each ribbon starts/ends at midpoints
    const midBA = [(B[0] + A[0]) / 2, (B[1] + A[1]) / 2];
    const midAC = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
    const midCB = [(C[0] + B[0]) / 2, (C[1] + B[1]) / 2];

    const ribbonW = 0.34;
    const ribbonD = 0.24;
    const extrudeOpts = {
      depth: ribbonD,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 3,
    };

    const logoGroup = new THREE.Group();

    // --- White band: midBA → A → midAC (top vertex) ---
    const whiteShape = buildRibbonShape(midBA, A, midAC, ribbonW);
    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcdcdc, roughness: 0.2, metalness: 0.65,
      clearcoat: 0.4, clearcoatRoughness: 0.15,
    });
    const whiteMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(whiteShape, extrudeOpts), whiteMat);
    whiteMesh.position.z = 0.13;
    logoGroup.add(whiteMesh);

    // --- Teal band: midCB → B → midBA (bottom-left vertex) ---
    // Correction: teal comes FROM midAC side, turns at B, goes TO midCB
    // Actually in the logo: teal turns at bottom-left (B)
    // It arrives from above (along edge AB) and exits along bottom (edge BC)
    const tealShape = buildRibbonShape(midAC, B, midCB, ribbonW);
    const tealMat = new THREE.MeshPhysicalMaterial({
      color: 0x00D1B2, roughness: 0.15, metalness: 0.6,
      clearcoat: 0.5, clearcoatRoughness: 0.1,
      emissive: 0x00D1B2, emissiveIntensity: 0.08,
    });
    const tealMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(tealShape, extrudeOpts), tealMat);
    tealMesh.position.z = -0.13;
    logoGroup.add(tealMesh);

    // --- Dark band: midBA → C → midAC (bottom-right vertex) ---
    // Dark turns at bottom-right (C)
    // Arrives from bottom (edge BC) and exits going up-right (edge CA)
    const darkShape = buildRibbonShape(midCB, C, midBA, ribbonW);
    const darkMat = new THREE.MeshPhysicalMaterial({
      color: 0x444444, roughness: 0.25, metalness: 0.7,
      clearcoat: 0.3, clearcoatRoughness: 0.2,
    });
    const darkMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(darkShape, extrudeOpts), darkMat);
    darkMesh.position.z = 0.0;
    logoGroup.add(darkMesh);

    // Center offset
    logoGroup.position.y = -0.15;
    // Center the extrusion depth
    logoGroup.children.forEach(child => {
      if (child.isMesh) child.position.z -= ribbonD / 2;
    });
    // Readjust z layering after centering
    whiteMesh.position.z = 0.13;
    tealMesh.position.z = -0.13;
    darkMesh.position.z = 0.0;

    scene.add(logoGroup);

    // --- Lighting ---
    const mainTeal = new THREE.PointLight(0x00D1B2, 3.0, 20);
    mainTeal.position.set(2, 2, 4);
    scene.add(mainTeal);

    const backTeal = new THREE.PointLight(0x00D1B2, 1.5, 15);
    backTeal.position.set(-3, -1, 3);
    scene.add(backTeal);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(3, 5, 4);
    scene.add(dir);

    const rimLight = new THREE.DirectionalLight(0x00D1B2, 0.25);
    rimLight.position.set(-2, -3, -3);
    scene.add(rimLight);

    // --- Mouse parallax ---
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // --- Animate ---
    const clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow Y rotation
      logoGroup.rotation.y += 0.003;
      // Subtle X tilt for depth
      logoGroup.rotation.x = Math.sin(t * 0.3) * 0.08;
      // Idle float
      logoGroup.position.y = -0.15 + Math.sin(t * 0.5) * 0.12;

      // Mouse parallax (lerp)
      target.x += (mouse.x * 0.6 - target.x) * 0.03;
      target.y += (-mouse.y * 0.6 - target.y) * 0.03;
      logoGroup.position.x = target.x;

      // Scroll-driven fade
      const progress = Math.min(window.scrollY / window.innerHeight, 1);
      const sc = 1 - progress * 0.7;
      logoGroup.scale.setScalar(Math.max(sc, 0.3));
      logoGroup.traverse(c => {
        if (c.isMesh && c.material) {
          c.material.opacity = 1 - progress;
          c.material.transparent = progress > 0;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="hero-3d-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    />
  );
}
