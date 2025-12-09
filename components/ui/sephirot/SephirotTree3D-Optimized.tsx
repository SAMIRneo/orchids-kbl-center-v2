// @ts-nocheck
'use client'

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber'
import { 
  OrbitControls, Line, Text, Float, Billboard, 
  MeshTransmissionMaterial, Trail, shaderMaterial, Sphere, Instance, Instances
} from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// ============================================================================
// SHADER MATERIALS OPTIMISÉS
// ============================================================================

const GalaxyMaterial = shaderMaterial(
  { 
    time: 0,
    color1: new THREE.Color('#ff006e'),
    color2: new THREE.Color('#3a86ff'),
    color3: new THREE.Color('#8338ec'),
  },
  /* VERTEX SHADER */
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* FRAGMENT SHADER - OPTIMISÉ */
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec2 vUv;
    
    // Hash optimisé
    float hash(vec2 p) {
      p = fract(p * 0.13);
      p += dot(p, p.yx + 3.333);
      return fract(p.x * p.y);
    }
    
    // Noise simplifié
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
      vec2 uv = vUv;
      float angle = atan(uv.y - 0.5, uv.x - 0.5) + time * 0.05;
      float radius = length(uv - 0.5);
      
      float n1 = noise(uv * 6.0 + time * 0.08);
      float combined = n1 * 0.75 + 0.25;
      
      vec3 color = mix(color1, color2, combined);
      color = mix(color, color3, sin(angle * 3.0 + time * 0.4) * 0.5 + 0.5);
      
      float alpha = (1.0 - smoothstep(0.0, 0.6, radius)) * combined * 0.35;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

// Shader pour particules instancées optimisé
const ParticleMaterial = shaderMaterial(
  {
    time: 0,
    baseColor: new THREE.Color('#ffffff'),
  },
  /* VERTEX SHADER */
  `
    uniform float time;
    attribute float instanceAlpha;
    attribute vec3 instanceColor;
    attribute float instanceScale;
    attribute float instanceSpeed;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      vColor = instanceColor;
      vAlpha = instanceAlpha;
      
      // Animation de rotation
      float angle = time * instanceSpeed;
      vec3 pos = position * instanceScale;
      
      // Transformation instance
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Point size avec atténuation distance
      gl_PointSize = instanceScale * 100.0 / -mvPosition.z;
    }
  `,
  /* FRAGMENT SHADER */
  `
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      // Cercle smooth
      vec2 coord = gl_PointCoord - 0.5;
      float dist = length(coord);
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      
      gl_FragColor = vec4(vColor, alpha * vAlpha);
    }
  `
)

extend({ GalaxyMaterial, ParticleMaterial })

// ============================================================================
// SYSTÈMES DE PARTICULES INSTANCÉES ULTRA-OPTIMISÉS
// ============================================================================

const InstancedStars = React.memo(() => {
  const count = 8000 // Réduit de 10000
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  
  const { positions, colors, scales, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const speeds = new Float32Array(count)
    
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#a5f3fc'),
      new THREE.Color('#c4b5fd'),
      new THREE.Color('#fde68a'),
    ]
    
    for (let i = 0; i < count; i++) {
      // Position sphérique
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 100 + Math.random() * 200
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // Couleur
      const color = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      
      // Scale et vitesse
      scales[i] = 0.3 + Math.random() * 0.4
      speeds[i] = 0.5 + Math.random() * 1.5
    }
    
    return { positions, colors, scales, speeds }
  }, [])
  
  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D()
      
      for (let i = 0; i < count; i++) {
        dummy.position.set(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2]
        )
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true
      
      // Attributs custom
      const geometry = meshRef.current.geometry
      geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3))
      geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1))
      geometry.setAttribute('instanceSpeed', new THREE.InstancedBufferAttribute(speeds, 1))
      geometry.setAttribute('instanceAlpha', new THREE.InstancedBufferAttribute(new Float32Array(count).fill(0.7), 1))
    }
  }, [positions, colors, scales, speeds])
  
  useFrame((state) => {
    if (meshRef.current?.material) {
      meshRef.current.material.uniforms.time.value = state.clock.elapsedTime
    }
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled>
      <sphereGeometry args={[0.15, 8, 8]} />
      <particleMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
})

// Nébula optimisée avec instancing
const OptimizedNebula = React.memo(() => {
  const count = 3000 // Réduit de 5000
  const meshRef = useRef<THREE.Points>(null!)
  
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const cols = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    const scale = 200
    const palette = [
      new THREE.Color('#ff006e'),
      new THREE.Color('#8338ec'),
      new THREE.Color('#3a86ff'),
      new THREE.Color('#06ffa5'),
    ]
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.pow(Math.random(), 0.7) * scale
      const height = (Math.random() - 0.5) * 40
      
      pos[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 12
      pos[i * 3 + 1] = height + (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 12
      
      const color = palette[Math.floor(Math.random() * palette.length)]
      const brightness = 0.65 + Math.random() * 0.35
      cols[i * 3] = color.r * brightness
      cols[i * 3 + 1] = color.g * brightness
      cols[i * 3 + 2] = color.b * brightness
      
      sizes[i] = 0.3 + Math.random() * 0.5
    }
    
    return { positions: pos, colors: cols, sizes }
  }, [])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0002
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.08
    }
  })
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
})

// ============================================================================
// BACKGROUND GALAXY OPTIMISÉ
// ============================================================================

const GalaxyBackgroundOptimized = React.memo(() => {
  const mesh = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (mesh.current?.material) {
      mesh.current.material.uniforms.time.value = state.clock.elapsedTime * 0.5
      mesh.current.rotation.z += 0.0001
    }
  })

  return (
    <mesh ref={mesh} position={[0, 0, -100]} scale={160}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <galaxyMaterial transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
})

// ============================================================================
// OBJETS COSMIQUES OPTIMISÉS AVEC LOD
// ============================================================================

const SupernovaOptimized = React.memo(() => {
  const coreRef = useRef<THREE.Mesh>(null!)
  const ring1Ref = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (coreRef.current) {
      coreRef.current.rotation.z += 0.001
      const scale = 24 + Math.sin(t * 0.25) * 2.5
      coreRef.current.scale.setScalar(scale)
    }
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z -= 0.002
    }
  })

  return (
    <group position={[40, 30, -50]}>
      {/* Noyau simplifié */}
      <Sphere args={[1.2, 24, 24]}>
        <meshStandardMaterial 
          color="#ff2200" 
          emissive="#ff4500"
          emissiveIntensity={2.2}
          roughness={0}
          metalness={1}
        />
      </Sphere>

      {/* Halo réduit */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial 
          color="#ff6b35" 
          emissive="#ff4500"
          emissiveIntensity={1.8}
          transparent 
          opacity={0.65}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ring optimisé */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[7, 0.25, 12, 48]} />
        <meshStandardMaterial 
          color="#ff8800" 
          emissive="#ff6b35"
          emissiveIntensity={1.3}
          transparent 
          opacity={0.55}
        />
      </mesh>
    </group>
  )
})

const BlackHoleOptimized = React.memo(() => {
  const diskRef = useRef<THREE.Mesh>(null!)
  const lensRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (diskRef.current) diskRef.current.rotation.z += 0.025
    if (lensRef.current) {
      const scale = 1.08 + Math.sin(t * 1.8) * 0.06
      lensRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[-45, -22, -60]}>
      {/* Core */}
      <Sphere args={[3.5, 48, 48]}>
        <meshStandardMaterial 
          color="#000000"
          metalness={1}
          roughness={0.05}
        />
      </Sphere>
      
      {/* Lensing effect */}
      <mesh ref={lensRef}>
        <sphereGeometry args={[5.5, 48, 48]} />
        <meshStandardMaterial 
          color="#3730a3" 
          emissive="#4f46e5"
          emissiveIntensity={0.5}
          transparent 
          opacity={0.12}
          side={THREE.BackSide}
          roughness={0}
        />
      </mesh>
      
      {/* Accretion disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8, 1, 24, 96]} />
        <meshStandardMaterial 
          color="#4f46e5" 
          emissive="#6366f1"
          emissiveIntensity={1.3}
          roughness={0.15}
          metalness={0.75}
        />
      </mesh>
    </group>
  )
})

// ============================================================================
// ENERGY RINGS OPTIMISÉS
// ============================================================================

const EnergyRingsOptimized = React.memo(() => {
  const rings = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (rings.current) {
      rings.current.rotation.y += 0.0015
      
      rings.current.children.forEach((ring, i) => {
        const scale = 1 + Math.sin(t * 0.25 + i * 0.4) * 0.12
        ring.scale.setScalar(scale)
      })
    }
  })

  const ringConfigs = [
    { radius: 22, thickness: 0.12, color: '#00ffff', emissive: '#00dddd', intensity: 1.4 },
    { radius: 28, thickness: 0.12, color: '#ff00ff', emissive: '#dd00dd', intensity: 1.2 },
    { radius: 34, thickness: 0.1, color: '#ffff00', emissive: '#dddd00', intensity: 1.0 },
  ]

  return (
    <group ref={rings}>
      {ringConfigs.map((config, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * Math.PI / 6]}>
          <torusGeometry args={[config.radius, config.thickness, 24, 96]} />
          <meshStandardMaterial 
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={config.intensity}
            transparent 
            opacity={0.22}
            roughness={0}
            metalness={0.75}
          />
        </mesh>
      ))}
    </group>
  )
})

// ============================================================================
// CRYSTAL NODE ULTRA-OPTIMISÉ AVEC LOD
// ============================================================================

const CrystalNodeOptimized = React.memo(({ 
  position, color, accent, name, subtitle, route, onClick, energy 
}: any) => {
  const group = useRef<THREE.Group>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const { camera } = useThree()
  const [lod, setLod] = useState<'high' | 'medium' | 'low'>('high')

  useFrame((state, delta) => {
    if(group.current) {
      group.current.rotation.y += delta * 0.08
      
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.3) * 0.04
      const scale = hovered ? 1.4 * breathe : 1 * breathe
      group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.08)
      
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.15
      
      // LOD dynamique
      const distance = camera.position.distanceTo(group.current.position)
      const newLod = distance > 60 ? 'low' : distance > 35 ? 'medium' : 'high'
      if (newLod !== lod) setLod(newLod)
    }
  })

  const handleHover = useCallback((isHovered: boolean) => {
    setHover(isHovered)
    document.body.style.cursor = isHovered ? 'pointer' : 'auto'
  }, [])

  const handleClick = useCallback(() => {
    setActive(true)
    setTimeout(() => onClick(route), 150)
  }, [onClick, route])

  const routeName = route === '/' ? 'HOME' : route.replace('/', '').toUpperCase()
  
  // Géométrie adaptative selon LOD
  const crystalSegments = lod === 'high' ? 0 : lod === 'medium' ? 0 : 0
  const sphereDetail = lod === 'high' ? [24, 24] : lod === 'medium' ? [16, 16] : [12, 12]
  const ringSegments = lod === 'high' ? 96 : lod === 'medium' ? 64 : 48

  return (
    <group ref={group} position={position}>
      <Float speed={0.8} rotationIntensity={0.25} floatIntensity={0.5}>
        
        {/* Cristal central */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); handleHover(true) }}
          onPointerOut={(e) => { e.stopPropagation(); handleHover(false) }}
          onClick={(e) => { e.stopPropagation(); handleClick() }}
        >
          <octahedronGeometry args={[1.4, crystalSegments]} />
          {lod === 'high' ? (
            <MeshTransmissionMaterial
              backside
              samples={6}
              resolution={512}
              thickness={0.8}
              chromaticAberration={0.35}
              anisotropy={0.4}
              distortion={0.25}
              distortionScale={0.4}
              temporalDistortion={0.15}
              color={accent}
              roughness={0}
              transmission={0.96}
              ior={2.4}
              clearcoat={1}
              clearcoatRoughness={0}
              attenuationDistance={0.7}
              attenuationColor={accent}
            />
          ) : (
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={hovered ? 1.5 : 1}
              roughness={0}
              metalness={1}
              transparent
              opacity={0.9}
            />
          )}
        </mesh>

        {/* Noyau wireframe optimisé */}
        {lod !== 'low' && (
          <mesh scale={0.65}>
            <icosahedronGeometry args={[1, lod === 'high' ? 2 : 1]} />
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={hovered ? 1.8 : 0.9}
              wireframe 
              transparent
              opacity={0.75}
              roughness={0}
              metalness={1}
            />
          </mesh>
        )}

        {/* Anneaux optimisés */}
        {lod !== 'low' && [0, 1, 2].map((i) => (
          <group key={i} rotation={[Math.PI / 4 * i, Math.PI / 3 * i, 0]}>
            <mesh>
              <ringGeometry args={[1.8 + i * 0.18, 1.85 + i * 0.18, ringSegments]} />
              <meshStandardMaterial 
                color={color}
                emissive={accent}
                emissiveIntensity={hovered ? 1.3 : 0.5}
                transparent 
                opacity={hovered ? 0.55 : 0.25} 
                side={THREE.DoubleSide}
                roughness={0}
                metalness={0.75}
              />
            </mesh>
          </group>
        ))}

        {/* Aura conditionnelle (seulement si hover ET LOD high/medium) */}
        {hovered && lod !== 'low' && (
          <Sphere args={[2.3, ...sphereDetail]}>
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={1.3}
              transparent 
              opacity={0.12}
              side={THREE.BackSide}
              roughness={0}
            />
          </Sphere>
        )}

        {/* Labels - Affichage conditionnel */}
        {lod !== 'low' && (
          <>
            <Billboard position={[0, 4, 0]}>
              <mesh>
                <planeGeometry args={[4.2, 1.8]} />
                <meshStandardMaterial 
                  color="#000000"
                  transparent
                  opacity={0.75}
                  emissive="#000000"
                  emissiveIntensity={0.3}
                  roughness={0.25}
                  metalness={0.55}
                />
              </mesh>
              
              <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[4.3, 1.9]} />
                <meshStandardMaterial 
                  color={accent}
                  emissive={accent}
                  emissiveIntensity={hovered ? 1.3 : 0.5}
                  transparent
                  opacity={0.22}
                  side={THREE.BackSide}
                />
              </mesh>
            </Billboard>

            <Billboard position={[0, 4, 0]}>
              <Text 
                position={[0, 0.55, 0.1]} 
                fontSize={0.28} 
                color={accent}
                anchorX="center" 
                anchorY="middle" 
                letterSpacing={0.22}
                fontWeight={900}
                outlineWidth={0.035}
                outlineColor="#000000"
                outlineOpacity={1}
              >
                {routeName}
              </Text>
              
              <Text 
                position={[0, 0, 0.1]} 
                fontSize={0.55} 
                fontWeight={900} 
                color="white" 
                anchorX="center" 
                anchorY="middle" 
                outlineWidth={0.09} 
                outlineColor="#000000"
                outlineOpacity={1}
                letterSpacing={0.1}
              >
                {name}
              </Text>
              
              <Text 
                position={[0, -0.45, 0.1]} 
                fontSize={0.22} 
                color={hovered ? '#ffffff' : accent} 
                anchorX="center" 
                anchorY="middle" 
                letterSpacing={0.22}
                fontWeight={700}
                outlineWidth={0.03}
                outlineColor="#000000"
                outlineOpacity={1}
              >
                {`[ ${subtitle} ]`}
              </Text>
            </Billboard>

            {/* Barre d'énergie */}
            <Billboard position={[0, -3.2, 0]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[2.8, 0.14]} />
                <meshStandardMaterial 
                  color="#0a0a0a" 
                  transparent 
                  opacity={0.85}
                  emissive="#000000"
                  emissiveIntensity={0.15}
                  roughness={0.15}
                  metalness={0.65}
                />
              </mesh>
              
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.9, 0.18]} />
                <meshStandardMaterial 
                  color={accent}
                  emissive={accent}
                  emissiveIntensity={0.35}
                  transparent 
                  opacity={0.28}
                  side={THREE.BackSide}
                />
              </mesh>
              
              <mesh position={[-(2.8 * (1 - energy)) / 2, 0, 0.01]}>
                <planeGeometry args={[2.8 * energy, 0.12]} />
                <meshStandardMaterial 
                  color={accent}
                  emissive={accent}
                  emissiveIntensity={1.8}
                  transparent 
                  opacity={0.92}
                  roughness={0}
                  metalness={1}
                />
              </mesh>
              
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[2.8 * energy, 0.06]} />
                <meshStandardMaterial 
                  color="#ffffff"
                  emissive="#ffffff"
                  emissiveIntensity={1}
                  transparent 
                  opacity={0.28}
                />
              </mesh>
              
              <Text 
                position={[0, 0, 0.03]} 
                fontSize={0.18} 
                color="white" 
                anchorX="center" 
                anchorY="middle" 
                fontWeight={900}
                outlineWidth={0.022}
                outlineColor="#000000"
                outlineOpacity={1}
              >
                {`${Math.round(energy * 100)}%`}
              </Text>
            </Billboard>
          </>
        )}

        {/* Trail optimisé */}
        {active && lod === 'high' && (
          <Trail
            width={2.5}
            length={6}
            color={new THREE.Color(accent)}
            attenuation={(t) => t * t}
          >
            <Sphere args={[0.12, 12, 12]}>
              <meshStandardMaterial 
                color={accent}
                emissive={accent}
                emissiveIntensity={2.2}
              />
            </Sphere>
          </Trail>
        )}
      </Float>
    </group>
  )
})

// ============================================================================
// LIENS OPTIMISÉS
// ============================================================================

const EnergyLinksOptimized = React.memo(() => {
  const linesRef = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.LineBasicMaterial
          material.opacity = 0.22 + Math.sin(state.clock.elapsedTime * 1 + i * 0.25) * 0.12
        }
      })
    }
  })

  const lines = useMemo(() => LINKS.map(([s, e]) => ({
    start: new THREE.Vector3(...(NODES[s].position as [number, number, number])),
    end: new THREE.Vector3(...(NODES[e].position as [number, number, number])),
    color: NODES[s].accent
  })), [])

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <Line 
          key={i} 
          points={[line.start, line.end]} 
          color={line.color} 
          lineWidth={1.8} 
          transparent 
          opacity={0.25}
        />
      ))}
    </group>
  )
})

// ============================================================================
// DATA CONFIGURATION
// ============================================================================

const NODES = [
  { name: 'KETHER', subtitle: 'CROWN', position: [0, 10, 0], color: '#ffffff', accent: '#a5f3fc', route: '/home', energy: 1.0 },
  { name: 'TIPHERET', subtitle: 'BEAUTY', position: [0, 0, 0], color: '#fde68a', accent: '#f59e0b', route: '/audiovisuel', energy: 0.9 },
  { name: 'YESOD', subtitle: 'FOUNDATION', position: [0, -7, 0], color: '#d8b4fe', accent: '#9333ea', route: '/communautes', energy: 0.7 },
  { name: 'MALKUTH', subtitle: 'KINGDOM', position: [0, -12, 0], color: '#a8a29e', accent: '#57534e', route: '/communautes', energy: 0.5 },
  { name: 'CHOKHMAH', subtitle: 'WISDOM', position: [6, 7, 0], color: '#e2e8f0', accent: '#38bdf8', route: '/ia', energy: 0.95 },
  { name: 'CHESED', subtitle: 'MERCY', position: [6, 1, 0], color: '#bfdbfe', accent: '#3b82f6', route: '/terminal', energy: 0.85 },
  { name: 'NETZACH', subtitle: 'VICTORY', position: [5, -5, 0], color: '#86efac', accent: '#10b981', route: '/terminal', energy: 0.75 },
  { name: 'BINAH', subtitle: 'INTELLECT', position: [-6, 7, 0], color: '#cbd5e1', accent: '#94a3b8', route: '/politique', energy: 0.9 },
  { name: 'GEVURAH', subtitle: 'STRENGTH', position: [-6, 1, 0], color: '#fca5a5', accent: '#ef4444', route: '/terminal', energy: 0.8 },
  { name: 'HOD', subtitle: 'GLORY', position: [-5, -5, 0], color: '#fdba74', accent: '#f97316', route: '/politique', energy: 0.7 },
]

const LINKS = [
  [0, 4], [4, 7], [7, 5], [5, 8], [8, 1], [1, 6], [6, 9], [9, 2], [2, 3],
  [0, 7], [0, 1], [4, 1], [7, 1], [5, 1], [8, 1], [6, 2], [9, 2], [5, 6], [8, 9]
]

// ============================================================================
// MAIN COMPONENT ULTRA-OPTIMISÉ
// ============================================================================

export default function SephirotTree3DOptimized() {
  const router = useRouter()
  
  const handleNodeClick = useCallback((route: string) => {
    router.push(route)
  }, [router])

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      background: '#000000' 
    }}>
      <Canvas 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 50], fov: 46 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        performance={{ min: 0.5, max: 1 }}
        frameloop="always"
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000510', 65, 180]} />
        
        {/* Éclairages optimisés */}
        <ambientLight intensity={0.18} />
        <directionalLight position={[35, 35, 35]} intensity={1.8} color="#60a5fa" castShadow={false} />
        <directionalLight position={[-35, -35, 35]} intensity={1.3} color="#a855f7" />
        <pointLight position={[0, 0, 28]} intensity={1.8} color="#ffffff" />
        <spotLight 
          position={[0, 40, 22]} 
          intensity={2.2} 
          angle={0.28} 
          penumbra={0.45} 
          color="#3a86ff"
          castShadow={false}
        />

        {/* Environnement spatial optimisé */}
        <GalaxyBackgroundOptimized />
        <InstancedStars />
        <OptimizedNebula />
        <SupernovaOptimized />
        <BlackHoleOptimized />
        <EnergyRingsOptimized />

        {/* Arbre Sephirot */}
        <group position={[0, 2, 0]}>
          <EnergyLinksOptimized />
          {NODES.map((node, i) => (
            <CrystalNodeOptimized key={i} {...node} onClick={handleNodeClick} />
          ))}
        </group>

        {/* Post-processing optimisé */}
        <EffectComposer multisampling={2}>
          <Bloom 
            intensity={0.5} 
            luminanceThreshold={0.35} 
            luminanceSmoothing={0.75}
            mipmapBlur
            radius={0.45}
          />
        </EffectComposer>

        {/* Contrôles optimisés */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.04} 
          autoRotate 
          autoRotateSpeed={0.06} 
          maxDistance={85} 
          minDistance={18}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 3.6}
          rotateSpeed={0.35}
          zoomSpeed={0.55}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
