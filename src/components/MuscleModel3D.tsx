import { Canvas, useFrame } from '@react-three/fiber/native';
import { useRef } from 'react';
import { View } from 'react-native';
import * as THREE from 'three';

function Cube() {
  const cubeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x += 0.01;
      cubeRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={cubeRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
}

export default function MuscleModel3D() {
  return (
    <View style={{ height: 180, width: 130 }}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <Cube />
      </Canvas>
    </View>
  );
}