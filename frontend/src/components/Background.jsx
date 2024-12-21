import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Background = () => {
  const containerRef = useRef();
  const mousePosition = useRef({ x: 0, y: 0 });
  const meshes = useRef([]);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Create legal symbols and text
    const symbols = ['§', '¶', '⚖', '⚔'];
    const geometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });

    // Create floating elements
    for (let i = 0; i < 15; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (Math.random() - 0.5) * 10;
      mesh.position.y = (Math.random() - 0.5) * 10;
      mesh.position.z = (Math.random() - 0.5) * 10;
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.scale.setScalar(Math.random() * 0.5 + 0.5);
      scene.add(mesh);
      meshes.current.push(mesh);
    }

    camera.position.z = 5;

    // Enhanced mouse effect
    const onMouseMove = (event) => {
      mousePosition.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      };

      // React to mouse movement with more visible effect
      meshes.current.forEach((mesh, i) => {
        const distanceX = mousePosition.current.x * 3;
        const distanceY = mousePosition.current.y * 2;
        
        mesh.rotation.x += 0.01 * (i % 2 ? 1 : -1);
        mesh.rotation.y += 0.01 * (i % 2 ? -1 : 1);
        
        // Add swoosh effect towards mouse
        mesh.position.x += (distanceX - mesh.position.x) * 0.05;
        mesh.position.y += (distanceY - mesh.position.y) * 0.05;
      });
    };

    const animate = () => {
      requestAnimationFrame(animate);

      // Continuous animation
      meshes.current.forEach((mesh, i) => {
        mesh.rotation.x += 0.001 * (i % 2 ? 1 : -1);
        mesh.rotation.y += 0.001 * (i % 2 ? -1 : 1);
        
        // Floating effect
        mesh.position.y += Math.sin(Date.now() * 0.001 + i) * 0.002;
        mesh.position.x += Math.cos(Date.now() * 0.001 + i) * 0.002;
      });

      renderer.render(scene, camera);
    };

    window.addEventListener('mousemove', onMouseMove);
    animate();

    // Gradient background
    const gradientOverlay = document.createElement('div');
    gradientOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, 
        rgba(30, 58, 138, 0.8) 0%, 
        rgba(30, 64, 175, 0.85) 50%, 
        rgba(12, 74, 110, 0.95) 100%);
      pointer-events: none;
    `;
    containerRef.current.appendChild(gradientOverlay);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      containerRef.current?.removeChild(gradientOverlay);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 -z-10"
    />
  );
};

export default Background;
