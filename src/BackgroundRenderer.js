import { useEffect, useRef } from "react";
import * as THREE from "three";

const BackgroundRenderer = () => {
  const mountRef = useRef(null);

  useEffect(() => {

    const mountNode = mountRef.current;
    if (!mountNode) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);

    const screenWidth = window.innerWidth;
    const areaSize = screenWidth > 1600 ? 32 : 25; // Adjusted slightly
    const particleCount = 250;

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * areaSize * 1.3; // Slightly reduced width spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * areaSize; // Y-axis unchanged
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3; // Z-depth slightly reduced

      velocities[i * 3] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
    });

    const points = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(points);

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.2 });
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    const mouse = new THREE.Vector2(0, 0);
    window.addEventListener("mousemove", (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    const animate = () => {
      requestAnimationFrame(animate);

      const posArray = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] += velocities[i];
        posArray[i + 1] += velocities[i + 1];

        if (posArray[i] > areaSize * 0.65 || posArray[i] < -areaSize * 0.65) velocities[i] *= -1;
        if (posArray[i + 1] > areaSize * 0.5 || posArray[i + 1] < -areaSize * 0.5) velocities[i + 1] *= -1;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      const threshold = screenWidth > 1600 ? 4 : 3.2;
      const linePositions = [];

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < threshold) {
            linePositions.push(
              posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2],
              posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]
            );
          }
        }
      }

      lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
      lineGeometry.needsUpdate = true;

      camera.position.x += (mouse.x * 0.15 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.15 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
        window.removeEventListener("resize", handleResize);
        
        if (mountNode.contains(renderer.domElement)) {
          mountNode.removeChild(renderer.domElement);
        }
    
        renderer.dispose();
      };
    }, []);

  return <div ref={mountRef} className="background-renderer"></div>;
};

export default BackgroundRenderer;
