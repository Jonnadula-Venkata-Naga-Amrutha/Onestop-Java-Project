import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Subtle decorative 3D artisan ring / geometric sculpture
    // Group
    const group = new THREE.Group();
    scene.add(group);

    // Torus (representing precision connection / bridge)
    const torusGeo = new THREE.TorusGeometry(2.2, 0.08, 16, 100);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x173D32, // Forest Green
      metalness: 0.7,
      roughness: 0.25,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 3;
    group.add(torus);

    // Inner Ring (Champagne Brass)
    const innerTorusGeo = new THREE.TorusGeometry(1.6, 0.05, 16, 80);
    const innerTorusMat = new THREE.MeshStandardMaterial({
      color: 0xD6B779, // Champagne
      metalness: 0.8,
      roughness: 0.2,
    });
    const innerTorus = new THREE.Mesh(innerTorusGeo, innerTorusMat);
    innerTorus.rotation.y = Math.PI / 4;
    group.add(innerTorus);

    // Floating Nodes (represent skilled professionals across local nodes)
    const nodeCount = 18;
    const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xA7BDA9, // Sage
      metalness: 0.5,
      roughness: 0.3,
    });

    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.5;
      const z = Math.sin(angle) * 1.0;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, z);
      group.add(node);
      nodes.push(node);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xD6B779, 2.0);
    dirLight.position.set(5, 6, 4);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xA7BDA9, 1.5, 15);
    pointLight.position.set(-4, -3, 3);
    scene.add(pointLight);

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseX = (clientX / width - 0.5) * 2;
      mouseY = (clientY / height - 0.5) * 2;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Handle Resize
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getElapsedTime();
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      group.rotation.y = delta * 0.15 + targetX * 0.5;
      group.rotation.x = 0.3 + targetY * 0.3;
      torus.rotation.z = delta * 0.1;
      innerTorus.rotation.z = -delta * 0.15;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden"
      aria-hidden="true"
    />
  );
}
