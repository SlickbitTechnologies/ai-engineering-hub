import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function Particles({ count = 50 }) {
  const points = Array.from({ length: count }, () => ({
    position: [
      Math.random() * 20 - 10,
      Math.random() * 20 - 10,
      Math.random() * 20 - 10
    ],
    size: Math.random() * 0.05 + 0.02
  }));

  return points.map((point, i) => (
    <Point key={i} position={point.position} size={point.size} />
  ));
}

function Point({ position, size }) {
  const mesh = useRef();

  useFrame(() => {
    mesh.current.rotation.x += 0.01;
    mesh.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color="#8b8bff" transparent opacity={0.6} />
    </mesh>
  );
}

function Background3D() {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: -1,
      opacity: 0.5,
      pointerEvents: 'none'
    }}>
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{ background: '#1a1a1a' }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}

export default Background3D; 