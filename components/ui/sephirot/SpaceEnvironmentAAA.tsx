// @ts-nocheck
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// SHADER ANNEAUX HOLOGRAPHIQUES
// ============================================================================

const HolographicRingMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#00ffff'),
    opacity: 0.6,
    thickness: 0.5,
    speed: 1.0,
  },
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    uniform float thickness;
    uniform float speed;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      float angle = atan(vPosition.z, vPosition.x);
      
      float scanline = sin((angle + time * speed) * 25.0) * 0.5 + 0.5;
      scanline = pow(scanline, 2.0);
      
      float n = noise(vUv * 40.0 + time * 0.4);
      
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
      
      float dataStream = step(0.94, fract((angle + time * speed * 1.5) * 12.0 + n));
      
      vec3 finalColor = color * 1.2;
      finalColor += vec3(scanline) * 0.4;
      finalColor += vec3(dataStream) * color * 2.5;
      
      float alpha = fresnel * opacity;
      alpha += scanline * 0.3;
      alpha += dataStream * 0.4;
      alpha *= thickness;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ HolographicRingMaterial })

// ============================================================================
// STARFIELD OPTIMISÉ - HAUTE QUALITÉ
// ============================================================================

export const HDRStarfield = React.memo(() => {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const count = 18000
  
  const { positions, colors, scales, twinkles } = useMemo(() => {
    const pos = []
    const cols = []
    const scls = []
    const twinks = []
    
    const starTypes = [
      { color: new THREE.Color('#ffffff'), weight: 0.30 },
      { color: new THREE.Color('#fffaf5'), weight: 0.20 },
      { color: new THREE.Color('#fff0e8'), weight: 0.15 },
      { color: new THREE.Color('#e8f5ff'), weight: 0.18 },
      { color: new THREE.Color('#d0e8ff'), weight: 0.17 },
    ]
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 130 + Math.random() * 380
      
      pos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      
      let random = Math.random()
      let selectedColor = starTypes[0].color
      for (const type of starTypes) {
        if (random < type.weight) {
          selectedColor = type.color
          break
        }
        random -= type.weight
      }
      
      const brightness = 0.8 + Math.random() * 0.2
      cols.push(
        selectedColor.r * brightness,
        selectedColor.g * brightness,
        selectedColor.b * brightness
      )
      
      const magnitude = Math.pow(Math.random(), 1.8)
      scls.push(0.15 + magnitude * 0.55)
      twinks.push(0.5 + Math.random() * 1.8)
    }
    
    return { 
      positions: new Float32Array(pos), 
      colors: new Float32Array(cols), 
      scales: new Float32Array(scls),
      twinkles: new Float32Array(twinks)
    }
  }, [])
  
  React.useEffect(() => {
    if (!meshRef.current) return
    
    const dummy = new THREE.Object3D()
    const geometry = meshRef.current.geometry
    
    for (let i = 0; i < count; i++) {
      dummy.position.fromArray(positions, i * 3)
      dummy.scale.setScalar(scales[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3))
    geometry.setAttribute('instanceTwinkle', new THREE.InstancedBufferAttribute(twinkles, 1))
  }, [positions, colors, scales, twinkles, count])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const geometry = meshRef.current.geometry
    const twinkleAttr = geometry.getAttribute('instanceTwinkle')
    
    if (!twinkleAttr || !twinkleAttr.array) return
    
    for (let i = 0; i < count; i += 60) {
      const twinkleSpeed = twinkleAttr.array[i]
      const twinkle = Math.sin(state.clock.elapsedTime * twinkleSpeed + i) * 0.5 + 0.5
      
      const dummy = new THREE.Object3D()
      meshRef.current.getMatrixAt(i, dummy.matrix)
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
      
      const baseScale = scales[i]
      dummy.scale.setScalar(baseScale * (0.65 + twinkle * 0.35))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.07, 5, 5]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.NormalBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
})

// ============================================================================
// ANNEAUX HOLOGRAPHIQUES OPTIMISÉS - SANS IMPACT SUR LA LUMINOSITÉ
// ============================================================================

export const HolographicRings = React.memo(({ position = [0, 0, 0], scale = 1 }: any) => {
  const ring1Ref = useRef<THREE.Group>(null!)
  const ring2Ref = useRef<THREE.Group>(null!)
  const ring3Ref = useRef<THREE.Group>(null!)
  
  const ringConfigs = useMemo(() => [
    { 
      radius: 26 * scale, 
      thickness: 0.09,
      color: '#00ddff', 
      speed: 0.85,
      opacity: 0.35,
      segments: 160,
      rotationSpeed: 0.0035,
      tiltX: 0.2,
      tiltZ: 0.12
    },
    { 
      radius: 34 * scale, 
      thickness: 0.11,
      color: '#ff00dd', 
      speed: 0.65,
      opacity: 0.30,
      segments: 160,
      rotationSpeed: -0.0028,
      tiltX: -0.15,
      tiltZ: 0.3
    },
    { 
      radius: 42 * scale, 
      thickness: 0.13,
      color: '#ddff00', 
      speed: 0.45,
      opacity: 0.25,
      segments: 160,
      rotationSpeed: 0.0018,
      tiltX: 0.25,
      tiltZ: -0.2
    },
  ], [scale])
  
  useFrame((state) => {
    const refs = [ring1Ref, ring2Ref, ring3Ref]
    
    refs.forEach((ref, i) => {
      if (!ref.current) return
      
      const config = ringConfigs[i]
      ref.current.rotation.y += config.rotationSpeed
      
      const wave = Math.sin(state.clock.elapsedTime * 0.35 + i * 0.55) * 0.025
      ref.current.scale.setScalar(1 + wave)
      
      const material = (ref.current.children[0] as THREE.Mesh)?.material as any
      if (material?.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime
      }
    })
  })

  return (
    <group position={position}>
      <group ref={ring1Ref} rotation={[Math.PI / 2 + ringConfigs[0].tiltX, 0, ringConfigs[0].tiltZ]}>
        <mesh>
          <torusGeometry args={[ringConfigs[0].radius, ringConfigs[0].thickness, 8, ringConfigs[0].segments]} />
          <holographicRingMaterial
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.NormalBlending}
            color={ringConfigs[0].color}
            opacity={ringConfigs[0].opacity}
            thickness={0.85}
            speed={ringConfigs[0].speed}
          />
        </mesh>
      </group>
      
      <group ref={ring2Ref} rotation={[Math.PI / 2 + ringConfigs[1].tiltX, 0, ringConfigs[1].tiltZ]}>
        <mesh>
          <torusGeometry args={[ringConfigs[1].radius, ringConfigs[1].thickness, 8, ringConfigs[1].segments]} />
          <holographicRingMaterial
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.NormalBlending}
            color={ringConfigs[1].color}
            opacity={ringConfigs[1].opacity}
            thickness={0.85}
            speed={ringConfigs[1].speed}
          />
        </mesh>
      </group>
      
      <group ref={ring3Ref} rotation={[Math.PI / 2 + ringConfigs[2].tiltX, 0, ringConfigs[2].tiltZ]}>
        <mesh>
          <torusGeometry args={[ringConfigs[2].radius, ringConfigs[2].thickness, 8, ringConfigs[2].segments]} />
          <holographicRingMaterial
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.NormalBlending}
            color={ringConfigs[2].color}
            opacity={ringConfigs[2].opacity}
            thickness={0.85}
            speed={ringConfigs[2].speed}
          />
        </mesh>
      </group>
    </group>
  )
})

// ============================================================================
// COSMIC DUST OPTIMISÉ
// ============================================================================

export const CosmicDustClouds = React.memo(() => {
  const count = 4000
  const pointsRef = useRef<THREE.Points>(null!)
  
  const { positions, colors } = useMemo(() => {
    const pos = []
    const cols = []
    
    const palette = [
      new THREE.Color('#4a2a5a'),
      new THREE.Color('#2a3a5a'),
      new THREE.Color('#3a2a4a'),
      new THREE.Color('#2a4a4a'),
    ]
    
    for (let i = 0; i < count; i++) {
      pos.push(
        (Math.random() - 0.5) * 320,
        (Math.random() - 0.5) * 110,
        (Math.random() - 0.5) * 320
      )
      
      const color = palette[Math.floor(Math.random() * palette.length)]
      cols.push(color.r * 1.2, color.g * 1.2, color.b * 1.2)
    }
    
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(cols)
    }
  }, [])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y += 0.00012
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={1.3}
        vertexColors
        transparent
        opacity={0.4}
        blending={THREE.NormalBlending}
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
})

// ============================================================================
// ENVIRONNEMENT COMPLET - ARBRE, ANNEAUX ET UNIVERS
// ============================================================================

export const SpaceEnvironmentAAA = React.memo(() => {
  return (
    <>
      <HDRStarfield />
      <CosmicDustClouds />
      <HolographicRings position={[0, 0, 0]} scale={1} />
      <fog attach="fog" args={['#020210', 45, 480]} />
    </>
  )
})

export default SpaceEnvironmentAAA