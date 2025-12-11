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

// ========================================
// TEXTURE BLANC BRILLANT (Corps)
// ========================================
const createWhiteHullTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  
  // Background blanc pur
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 512, 512)
  
  // Lignes tech subtiles grises
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * 64)
    ctx.lineTo(512, i * 64)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(i * 64, 0)
    ctx.lineTo(i * 64, 512)
    ctx.stroke()
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// ========================================
// TEXTURE ROUGE DÉGRADÉ (Ailes)
// ========================================
const createRedGradientTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  
  // Gradient vertical rouge vif → rouge sombre
  const gradient = ctx.createLinearGradient(0, 0, 0, 512)
  gradient.addColorStop(0, '#FF0000')    // Rouge vif
  gradient.addColorStop(0.5, '#DC143C')  // Crimson
  gradient.addColorStop(1, '#8B0000')    // Rouge sombre
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)
  
  // Lignes énergétiques
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)'
  ctx.lineWidth = 2
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * 85)
    ctx.lineTo(512, i * 85)
    ctx.stroke()
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export default function Spaceship3D({ position, velocity, rotation, boosting, isMoving }: Spaceship3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const engineGlowRef = useRef<THREE.Group>(null!)
  const timeRef = useRef(0)
  
  const { scene } = useGLTF('/spaceship.glb')
  
  // Créer textures
  const textures = useMemo(() => ({
    white: createWhiteHullTexture(),
    redGradient: createRedGradientTexture()
  }), [])

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Détection automatique des parties
        const childName = child.name.toLowerCase()
        const bbox = child.geometry.boundingBox
        
        // PARTIE 1: COCKPIT (rouge terne)
        const isCockpit = childName.includes('cockpit') || 
                         childName.includes('glass') ||
                         childName.includes('canopy') ||
                         (bbox && Math.abs(bbox.max.z - bbox.min.z) < 0.8 && bbox.max.y > 0)
        
        // PARTIE 3: AILES/FLAMMES (rouge dégradé)
        // Généralement plus larges en X ou nommées "wing", "engine", "thruster"
        const isWing = childName.includes('wing') ||
                      childName.includes('engine') ||
                      childName.includes('thruster') ||
                      childName.includes('flame') ||
                      (bbox && Math.abs(bbox.max.x - bbox.min.x) > 1.5) ||
                      (bbox && bbox.min.z < -1)
        
        if (isCockpit) {
          // 🔴 COCKPIT - Rouge terne
          child.material = new THREE.MeshStandardMaterial({
            color: '#8B0000',
            metalness: 0.5,
            roughness: 0.4,
            transparent: true,
            opacity: 0.85,
            emissive: new THREE.Color('#4A0000'),
            emissiveIntensity: 0.2
          })
        } else if (isWing) {
          // 🔴 AILES/FLAMMES - Rouge dégradé
          child.material = new THREE.MeshStandardMaterial({
            map: textures.redGradient,
            color: '#FF0000',
            metalness: 0.8,
            roughness: 0.2,
            emissive: new THREE.Color('#FF0000'),
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
          })
        } else {
          // ⚪ CORPS CENTRAL - Blanc brillant
          child.material = new THREE.MeshStandardMaterial({
            map: textures.white,
            color: '#FFFFFF',
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 2,
            emissive: new THREE.Color('#CCCCCC'),
            emissiveIntensity: 0.1
          })
        }
      }
    })
    return clone
  }, [scene, textures])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    timeRef.current += delta

    groupRef.current.position.copy(position)
    groupRef.current.quaternion.copy(rotation)

    const speed = velocity.length()

    // Animation moteurs
    if (engineGlowRef.current) {
      const engineIntensity = Math.min(speed / 12, 1)
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 18) * 0.25
      const boostScale = boosting ? 3.2 : 1.2
      engineGlowRef.current.scale.setScalar((0.3 + engineIntensity * 0.7) * pulse * boostScale)
    }
    
    // Animation émissive
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.emissive && mat.emissive.r > 0) {
          mat.emissiveIntensity = 0.2 + Math.sin(timeRef.current * 2) * 0.1
        }
      }
    })
  })

  return (
    <group ref={groupRef}>
      {/* Modèle GLB */}
      <primitive object={clonedScene} scale={[1, 1, 1]} rotation={[0, Math.PI, 0]} />
      
      {/* 🔥 FLAMMES DÉGRADÉ ROUGE */}
      <group ref={engineGlowRef} position={[0, 0, -1.5]}>
        {/* Core rouge vif */}
        <mesh>
          <sphereGeometry args={[0.35, 20, 20]} />
          <meshBasicMaterial 
            color="#FF0000" 
            transparent 
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
        
        {/* Couche orange-rouge */}
        <mesh scale={1.3}>
          <sphereGeometry args={[0.35, 18, 18]} />
          <meshBasicMaterial 
            color="#FF4500" 
            transparent 
            opacity={0.6}
            toneMapped={false}
          />
        </mesh>
        
        {/* Halo rouge sombre */}
        <mesh scale={1.7}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial 
            color="#8B0000" 
            transparent 
            opacity={0.3}
            toneMapped={false}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Particules rouges */}
        {isMoving && (
          <>
            {/* Rouge vif */}
            <Sparkles
              count={boosting ? 150 : 80}
              scale={[2.5, 2.5, boosting ? 9 : 4.5]}
              position={[0, 0, boosting ? -4 : -2]}
              speed={boosting ? 8 : 5}
              color="#FF0000"
              size={boosting ? 12 : 6}
              opacity={0.85}
            />
            
            {/* Orange-rouge */}
            {boosting && (
              <Sparkles
                count={80}
                scale={[2.2, 2.2, 7]}
                position={[0, 0, -3.5]}
                speed={7}
                color="#FF4500"
                size={10}
                opacity={0.7}
              />
            )}
            
            {/* Rouge sombre */}
            <Sparkles
              count={60}
              scale={[2, 2, boosting ? 6 : 3]}
              position={[0, 0, boosting ? -3 : -1.5]}
              speed={boosting ? 6 : 4}
              color="#8B0000"
              size={8}
              opacity={0.5}
            />
          </>
        )}
      </group>

      {/* Trail rouge */}
      {isMoving && (
        <group position={[0, 0, -2]}>
          <Trail
            width={boosting ? 4 : 2}
            length={boosting ? 16 : 8}
            color={new THREE.Color(boosting ? "#FF4500" : "#FF0000")}
            attenuation={(t) => t * t * t}
          >
            <mesh visible={false}>
              <sphereGeometry args={[0.1]} />
            </mesh>
          </Trail>
        </group>
      )}
      
      {/* Aura rouge (boost) */}
      {boosting && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
          <ringGeometry args={[0.8, 1.2, 32]} />
          <meshBasicMaterial 
            color="#FF0000" 
            transparent 
            opacity={0.5} 
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('/spaceship.glb')