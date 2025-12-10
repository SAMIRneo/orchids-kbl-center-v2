// @ts-nocheck
'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail, Sparkles, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface Spaceship3DProps {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Quaternion
  boosting: boolean
  isMoving: boolean
}

export default function Spaceship3D({ position, velocity, rotation, boosting, isMoving }: Spaceship3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const engineGlowRef = useRef<THREE.Group>(null!)
  
  const { scene } = useGLTF('/spaceship.glb')
  
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    groupRef.current.position.copy(position)
    groupRef.current.quaternion.copy(rotation)

    const speed = velocity.length()

    if (engineGlowRef.current) {
      const engineIntensity = Math.min(speed / 12, 1)
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 18) * 0.25
      const boostScale = boosting ? 2.8 : 1
      engineGlowRef.current.scale.setScalar((0.3 + engineIntensity * 0.7) * pulse * boostScale)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Modèle GLB */}
      <primitive object={clonedScene} scale={[1, 1, 1]} rotation={[0, Math.PI, 0]} />
      
      {/* Effets moteur */}
      <group ref={engineGlowRef} position={[0, 0, -1.5]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial 
            color="#FF6B35" 
            transparent 
            opacity={0.9}
            toneMapped={false} 
          />
        </mesh>
        
        {isMoving && (
          <Sparkles
            count={boosting ? 120 : 60}
            scale={[2, 2, boosting ? 7 : 3.5]}
            position={[0, 0, boosting ? -3.5 : -1.8]}
            speed={boosting ? 7 : 4}
            color="#FF6B35"
            size={boosting ? 10 : 5}
          />
        )}
      </group>

      {/* Trail en mouvement */}
      {isMoving && (
        <group position={[0, 0, -2]}>
          <Trail
            width={boosting ? 3.5 : 1.8}
            length={boosting ? 14 : 7}
            color={new THREE.Color("#FF6B35")}
            attenuation={(t) => t * t}
          >
            <mesh visible={false}>
              <sphereGeometry args={[0.1]} />
            </mesh>
          </Trail>
        </group>
      )}
    </group>
  )
}

useGLTF.preload('/spaceship.glb')