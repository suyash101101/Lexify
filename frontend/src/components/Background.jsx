import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as lucideIcons from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

const Background = () => {
  const containerRef = useRef();
  const cursorRef = useRef();
  const mousePosition = useRef({ x: 0, y: 0 });
  const symbols = useRef([]);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf8fafc, 1);
    containerRef.current.appendChild(renderer.domElement);

    const createIconPath = (icon) => {
      const IconComponent = lucideIcons[icon];
      return ReactDOMServer.renderToString(<IconComponent color="#1e293b" size={48} />);
    };

    const createSymbolTexture = (iconName) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      const iconPath = createIconPath(iconName);
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          ${iconPath}
        </svg>
      `;

      const img = new Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(svg);
      
      const texture = new THREE.Texture(canvas);
      img.onload = () => {
        ctx.drawImage(img, 8, 8, 48, 48);
        texture.needsUpdate = true;
      };

      return texture;
    };

    const createCustomSymbolTexture = (symbol) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(symbol, 32, 32);
      return new THREE.CanvasTexture(canvas);
    };

    const initSymbols = () => {
      const symbolTextures = [
        createSymbolTexture('Scale'),
        createSymbolTexture('Clock'),
        createSymbolTexture('DollarSign'),
        createSymbolTexture('Gavel'),
        createSymbolTexture('FileText'),
        createSymbolTexture('Shield'),
        createSymbolTexture('Users'),
        createSymbolTexture('Scale'),
        createCustomSymbolTexture('₹'),
        createCustomSymbolTexture('⚖'),
      ];

      const symbolCount = 1000;
      for (let i = 0; i < symbolCount; i++) {
        const symbolIndex = Math.floor(Math.random() * symbolTextures.length);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: symbolTextures[symbolIndex],
          color: 0x1e293b,
          transparent: true,
          blending: THREE.NormalBlending,
          opacity: 0.7,
        }));

        const glowMaterial = new THREE.SpriteMaterial({
          map: symbolTextures[symbolIndex],
          color: 0x60a5fa,
          transparent: true,
          blending: THREE.AdditiveBlending,
          opacity: 0.3,
        });

        const glowSprite = new THREE.Sprite(glowMaterial);
        glowSprite.scale.multiplyScalar(1.5);
        sprite.add(glowSprite);

        sprite.position.set(
          (Math.random() * 2000) - 1000,
          (Math.random() * 2000) - 1000,
          (Math.random() * 2000) - 1000
        );

        sprite.scale.set(30, 30, 1);

        scene.add(sprite);
        symbols.current.push({
          sprite,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
          ),
          initialScale: Math.random() * 30 + 15,
        });
      }

      camera.position.z = 1000;
    };

    initSymbols();

    const onMouseMove = (event) => {
      mousePosition.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      };
      
      if (cursorRef.current) {
        cursorRef.current.style.left = `${event.clientX}px`;
        cursorRef.current.style.top = `${event.clientY}px`;
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);

      symbols.current.forEach((symbol, index) => {
        symbol.sprite.position.add(symbol.velocity);

        const mouseX = mousePosition.current.x * 1000;
        const mouseY = mousePosition.current.y * 1000;
        
        const dx = mouseX - symbol.sprite.position.x;
        const dy = mouseY - symbol.sprite.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
          const repelForce = 1 - (distance / 200);
          symbol.sprite.position.x -= (dx / distance) * repelForce * 2;
          symbol.sprite.position.y -= (dy / distance) * repelForce * 2;
          
          symbol.sprite.position.x += (Math.random() - 0.5) * 0.5;
          symbol.sprite.position.y += (Math.random() - 0.5) * 0.5;
        }

        if (symbol.sprite.position.x < -1000) symbol.sprite.position.x = 1000;
        if (symbol.sprite.position.x > 1000) symbol.sprite.position.x = -1000;
        if (symbol.sprite.position.y < -1000) symbol.sprite.position.y = 1000;
        if (symbol.sprite.position.y > 1000) symbol.sprite.position.y = -1000;
        if (symbol.sprite.position.z < -1000) symbol.sprite.position.z = 1000;
        if (symbol.sprite.position.z > 1000) symbol.sprite.position.z = -1000;

        const scale = Math.sin(Date.now() * 0.001 + index) * 5 + symbol.initialScale;
        symbol.sprite.scale.set(scale, scale, 1);
      });

      renderer.render(scene, camera);
    };

    animate();

    const gradientOverlay = document.createElement('div');
    gradientOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, rgba(241, 245, 249, 1) 0%, rgba(186, 230, 253, 0.5) 100%);
      animation: moveGradient 15s ease infinite;
      pointer-events: none;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes moveGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);

    containerRef.current.appendChild(gradientOverlay);

    const cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    cursorGlow.style.cssText = `
      position: fixed;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(186, 230, 253, 0.15) 0%, rgba(186, 230, 253, 0.1) 40%, transparent 70%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      z-index: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(cursorGlow);
    cursorRef.current = cursorGlow;

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      containerRef.current?.removeChild(renderer.domElement);
      containerRef.current?.removeChild(gradientOverlay);
      document.body.removeChild(cursorGlow);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 to-sky-50"
    />
  );
};

export default Background;

