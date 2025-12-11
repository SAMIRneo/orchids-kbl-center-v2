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
// TEXTURE NOIR ET VERT (Corps et Ailes)
// ========================================
const createBlackGreenTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  
  // Background noir profond
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, 1024, 1024)
  
  // Grille hexagonale verte néon
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)'
  ctx.lineWidth = 2
  const hexSize = 40
  
  for (let y = 0; y < 1024; y += hexSize * 1.5) {
    for (let x = 0; x < 1024; x += hexSize * Math.sqrt(3)) {
      const offsetX = (y / (hexSize * 1.5)) % 2 === 0 ? 0 : hexSize * Math.sqrt(3) / 2
      drawHexagon(ctx, x + offsetX, y, hexSize)
    }
  }
  
  // Lignes énergétiques vertes
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'
  ctx.lineWidth = 3
  ctx.shadowBlur = 15
  ctx.shadowColor = '#00FF00'
  
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * 128)
    ctx.lineTo(1024, i * 128)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(i * 128, 0)
    ctx.lineTo(i * 128, 1024)
    ctx.stroke()
  }
  
  // Points lumineux verts
  ctx.fillStyle = 'rgba(0, 255, 0, 0.6)'
  ctx.shadowBlur = 10
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const size = Math.random() * 3 + 1
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
}

export default function Spaceship3D({ position, velocity, rotation, boosting, isMoving }: Spaceship3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const engineGlowRef = useRef<THREE.Group>(null!)
  const timeRef = useRef(0)
  
  const { scene } = useGLTF('/spaceship.glb')
  
  // Créer texture noir et vert
  const blackGreenTexture = useMemo(() => createBlackGreenTexture(), [])

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Détection cockpit
        const childName = child.name.toLowerCase()
        const bbox = child.geometry.boundingBox
        
        const isCockpit = childName.includes('cockpit') || 
                         childName.includes('glass') ||
                         childName.includes('canopy') ||
                         (bbox && Math.abs(bbox.max.z - bbox.min.z) < 0.8 && bbox.max.y > 0)
        
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
        } else {
          // ⚫💚 TOUT LE RESTE - Noir et Vert
          child.material = new THREE.MeshStandardMaterial({
            map: blackGreenTexture,
            color: '#0a0a0a',
            metalness: 0.9,
            roughness: 0.2,
            emissive: new THREE.Color('#00FF00'),
            emissiveIntensity: 0.25,
            envMapIntensity: 1.5
          })
        }
      }
    })
    return clone
  }, [scene, blackGreenTexture])

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
    
    // Animation émissive verte
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.emissive && mat.emissive.g > 0) {
          mat.emissiveIntensity = 0.2 + Math.sin(timeRef.current * 3) * 0.1
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