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
// FONCTION TEXTURE PROCÉDURALE PREMIUM
// ========================================
const createQuantumHullTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  
  // Background noir profond
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1024, 1024)
  
  // Grille hexagonale quantum (bleu électrique)
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)' // Bleu primary
  ctx.lineWidth = 1.5
  const hexSize = 35
  
  for (let y = 0; y < 1024; y += hexSize * 1.5) {
    for (let x = 0; x < 1024; x += hexSize * Math.sqrt(3)) {
      const offsetX = (y / (hexSize * 1.5)) % 2 === 0 ? 0 : hexSize * Math.sqrt(3) / 2
      drawHexagon(ctx, x + offsetX, y, hexSize)
    }
  }
  
  // Lignes énergétiques dorées (accent)
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)' // Or
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i++) {
    const y = i * 128
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1024, y)
    ctx.stroke()
    
    // Variation verticale
    const x = i * 128
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 1024)
    ctx.stroke()
  }
  
  // Points lumineux aléatoires (étoiles sur coque)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const size = Math.random() * 2 + 1
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // Gradient radial central (effet profondeur)
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512)
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)')
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 1024)
  
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

// ========================================
// TEXTURE ÉMISSION (zones lumineuses)
// ========================================
const createEmissionTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  
  // Background noir
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 512, 512)
  
  // Lignes énergétiques bleues
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 4
  ctx.shadowBlur = 20
  ctx.shadowColor = '#3b82f6'
  
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * 102.4)
    ctx.lineTo(512, i * 102.4)
    ctx.stroke()
  }
  
  // Accents dorés
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 2
  ctx.shadowColor = '#FFD700'
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(i * 170, 0)
    ctx.lineTo(i * 170, 512)
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
  
  // Créer textures procédurales
  const textures = useMemo(() => ({
    hull: createQuantumHullTexture(),
    emission: createEmissionTexture()
  }), [])

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Détecter le cockpit (généralement plus petit ou nommé)
        const isCockpit = child.name.toLowerCase().includes('cockpit') || 
                         child.name.toLowerCase().includes('glass') ||
                         child.name.toLowerCase().includes('canopy') ||
                         child.geometry.boundingBox && 
                         (child.geometry.boundingBox.max.y - child.geometry.boundingBox.min.y) < 0.5
        
        if (isCockpit) {
          // Matériau cockpit rouge terne
          child.material = new THREE.MeshStandardMaterial({
            color: '#8B0000', // Rouge foncé terne (Dark Red)
            metalness: 0.6,
            roughness: 0.4,
            transparent: true,
            opacity: 0.85,
            emissive: new THREE.Color('#4A0000'),
            emissiveIntensity: 0.2
          })
        } else {
          // Matériau coque normal
          child.material = new THREE.MeshStandardMaterial({
            map: textures.hull,
            emissiveMap: textures.emission,
            emissive: new THREE.Color('#3b82f6'),
            emissiveIntensity: 0.4,
            metalness: 0.95,
            roughness: 0.15,
            envMapIntensity: 1.8,
            side: THREE.FrontSide,
            transparent: false,
            opacity: 1
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
    
    // Animation émissive des textures
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.15
        }
      }
    })
  })

  return (
    <group ref={groupRef}>
      {/* Modèle GLB avec textures */}
      <primitive object={clonedScene} scale={[1, 1, 1]} rotation={[0, Math.PI, 0]} />
      
      {/* ========================================
          🔥 EFFETS MOTEURS - DÉGRADÉ DE ROUGES
          ======================================== */}
      <group ref={engineGlowRef} position={[0, 0, -1.5]}>
        {/* Core rouge vif (#FF0000) */}
        <mesh>
          <sphereGeometry args={[0.35, 20, 20]} />
          <meshBasicMaterial 
            color="#FF0000" 
            transparent 
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
        
        {/* Couche orange-rouge (#FF4500) */}
        <mesh scale={1.3}>
          <sphereGeometry args={[0.35, 18, 18]} />
          <meshBasicMaterial 
            color="#FF4500" 
            transparent 
            opacity={0.6}
            toneMapped={false}
          />
        </mesh>
        
        {/* Halo externe rouge sombre (#8B0000) */}
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
        
        {/* Particules dégradé rouge */}
        {isMoving && (
          <>
            {/* Flammes rouge vif */}
            <Sparkles
              count={boosting ? 150 : 80}
              scale={[2.5, 2.5, boosting ? 9 : 4.5]}
              position={[0, 0, boosting ? -4 : -2]}
              speed={boosting ? 8 : 5}
              color="#FF0000"
              size={boosting ? 12 : 6}
              opacity={0.85}
            />
            
            {/* Flammes orange-rouge (boost) */}
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
            
            {/* Flammes rouge sombre (fond) */}
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

      {/* Trail dégradé rouge */}
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
      
      {/* Aura rouge (anneau en boost) */}
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