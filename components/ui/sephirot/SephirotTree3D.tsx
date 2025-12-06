// @ts-nocheck
'use client'

import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { 
  OrbitControls, Line, Text, Float, Stars, Sparkles, Billboard, 
  MeshTransmissionMaterial, Trail, shaderMaterial, Sphere
} from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { EffectComposer, Bloom, ToneMapping, N8AO } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

// --- SHADER MATERIAL GALAXIE OPTIMISÉ ---
const GalaxyMaterial = shaderMaterial(
  { 
    time: 0,
    color1: new THREE.Color('#ff006e'),
    color2: new THREE.Color('#3a86ff'),
    color3: new THREE.Color('#8338ec'),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec2 vUv;
    
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.13);
      p3 += dot(p3, p3.yzx + 3.333);
      return fract((p3.x + p3.y) * p3.z);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    
    void main() {
      vec2 uv = vUv;
      float angle = atan(uv.y - 0.5, uv.x - 0.5) + time * 0.05;
      float radius = length(uv - 0.5);
      
      float n1 = noise(uv * 8.0 + time * 0.1);
      float n2 = noise(uv * 16.0 - time * 0.15);
      float n3 = noise(vec2(angle * 5.0, radius * 10.0) + time * 0.2);
      
      float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      
      vec3 color = mix(color1, color2, combined);
      color = mix(color, color3, sin(angle * 4.0 + time * 0.5) * 0.5 + 0.5);
      
      float alpha = (1.0 - smoothstep(0.0, 0.6, radius)) * combined;
      
      gl_FragColor = vec4(color, alpha * 0.5);
    }
  `
)

extend({ GalaxyMaterial })

// --- PULSAR SHADER OPTIMISÉ ---
const PulsarMaterial = shaderMaterial(
  { 
    time: 0,
    intensity: 1.0,
    color: new THREE.Color('#00ffff')
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform float intensity;
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv - 0.5;
      float dist = length(uv);
      
      float pulse = sin(time * 3.0 - dist * 15.0) * 0.5 + 0.5;
      float glow = 1.0 / (dist * 8.0 + 1.0);
      
      vec3 finalColor = color * pulse * glow * intensity;
      float alpha = pulse * glow * 0.9;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ PulsarMaterial })

// --- GALAXIE BACKGROUND OPTIMISÉE ---
function GalaxyBackgroundHD() {
  const mesh = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (mesh.current?.material) {
      // @ts-ignore
      mesh.current.material.uniforms.time.value = state.clock.elapsedTime
      mesh.current.rotation.z += 0.0003
    }
  })

  return (
    <mesh ref={mesh} position={[0, 0, -120]} scale={180}>
      <planeGeometry args={[1, 1, 128, 128]} />
      {/* @ts-ignore */}
      <galaxyMaterial transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// --- SUPERNOVA 4K OPTIMISÉE ---
function Supernova4K() {
  const coreRef = useRef<THREE.Mesh>(null!)
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (coreRef.current) {
      coreRef.current.rotation.z += 0.003
      const scale = 32 + Math.sin(t * 0.4) * 4
      coreRef.current.scale.setScalar(scale)
    }
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z -= 0.004
      const scale = 38 + Math.cos(t * 0.6) * 5
      ring1Ref.current.scale.setScalar(scale)
    }
    
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z += 0.005
      const scale = 44 + Math.sin(t * 0.8) * 6
      ring2Ref.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[40, 30, -60]}>
      {/* Core brillant */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial 
          color="#ff2200" 
          emissive="#ff4500"
          emissiveIntensity={3}
          roughness={0}
          metalness={1}
        />
      </Sphere>

      {/* Explosion */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial 
          color="#ff6b35" 
          emissive="#ff4500"
          emissiveIntensity={2.5}
          transparent 
          opacity={0.8}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Anneaux */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[10, 0.4, 32, 128]} />
        <meshStandardMaterial 
          color="#ff8800" 
          emissive="#ff6b35"
          emissiveIntensity={2}
          transparent 
          opacity={0.7}
        />
      </mesh>

      <mesh ref={ring2Ref}>
        <torusGeometry args={[12, 0.3, 32, 128]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ff8800"
          emissiveIntensity={1.8}
          transparent 
          opacity={0.5}
        />
      </mesh>

      <Sparkles 
        count={400} 
        scale={25} 
        size={10} 
        speed={0.6} 
        opacity={0.8} 
        color="#ff6b35" 
      />
    </group>
  )
}

// --- BLACK HOLE 4K OPTIMISÉ ---
function BlackHole4K() {
  const horizonRef = useRef<THREE.Mesh>(null!)
  const diskRef = useRef<THREE.Mesh>(null!)
  const lensRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (horizonRef.current) horizonRef.current.rotation.y += 0.025
    if (diskRef.current) diskRef.current.rotation.z += 0.04
    if (lensRef.current) {
      const scale = 1.15 + Math.sin(t * 2.5) * 0.12
      lensRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[-50, -25, -70]}>
      {/* Event Horizon */}
      <Sphere ref={horizonRef} args={[5, 128, 128]}>
        <meshStandardMaterial 
          color="#000000"
          metalness={1}
          roughness={0.1}
          envMapIntensity={0.3}
        />
      </Sphere>
      
      {/* Lentille gravitationnelle */}
      <mesh ref={lensRef}>
        <sphereGeometry args={[7, 128, 128]} />
        <meshStandardMaterial 
          color="#3730a3" 
          emissive="#4f46e5"
          emissiveIntensity={0.8}
          transparent 
          opacity={0.2}
          side={THREE.BackSide}
          roughness={0}
        />
      </mesh>
      
      {/* Disque d'accrétion */}
      <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10, 1.5, 64, 256]} />
        <meshStandardMaterial 
          color="#4f46e5" 
          emissive="#6366f1"
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Anneaux de particules */}
      {[0.9, 0.95, 1.05, 1.1].map((scale, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} scale={scale}>
          <torusGeometry args={[12, 0.25, 32, 128]} />
          <meshStandardMaterial 
            color="#7c3aed" 
            emissive="#8b5cf6"
            emissiveIntensity={1.5 - i * 0.3}
            transparent 
            opacity={0.4 - i * 0.08}
          />
        </mesh>
      ))}

      <Sparkles 
        count={250} 
        scale={18} 
        size={5} 
        speed={2} 
        opacity={0.85} 
        color="#8b5cf6" 
      />
    </group>
  )
}

// --- PULSAR ÉTOILE ---
function PulsarStar() {
  const mesh = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (mesh.current?.material) {
      // @ts-ignore
      mesh.current.material.uniforms.time.value = state.clock.elapsedTime
      mesh.current.rotation.z += 0.015
    }
  })

  return (
    <mesh ref={mesh} position={[0, 40, -45]}>
      <sphereGeometry args={[3, 64, 64]} />
      {/* @ts-ignore */}
      <pulsarMaterial transparent />
    </mesh>
  )
}

// --- NEBULA ULTRA HD OPTIMISÉE ---
function NebulaUltraHD() {
  const count = 8000
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const scale = 280
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.pow(Math.random(), 0.7) * scale
      const height = (Math.random() - 0.5) * 60
      
      pos[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = height + (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 20
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#ff006e'),
      new THREE.Color('#8338ec'),
      new THREE.Color('#3a86ff'),
      new THREE.Color('#06ffa5'),
      new THREE.Color('#ffd60a'),
      new THREE.Color('#ff5400'),
    ]
    
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)]
      const brightness = 0.7 + Math.random() * 0.3
      cols[i * 3] = color.r * brightness
      cols[i * 3 + 1] = color.g * brightness
      cols[i * 3 + 2] = color.b * brightness
    }
    return cols
  }, [])

  const sizes = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 1.2 + 0.3
    }
    return s
  }, [])

  const pointsRef = useRef<THREE.Points>(null!)

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00035
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.12
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// --- ENERGY RINGS 4K OPTIMISÉS ---
function EnergyRings4K() {
  const rings = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (rings.current) {
      rings.current.rotation.y += 0.0025
      
      rings.current.children.forEach((ring, i) => {
        const scale = 1 + Math.sin(t * 0.4 + i * 0.6) * 0.18
        ring.scale.setScalar(scale)
        ring.rotation.x = Math.sin(t * 0.25 + i * 0.5) * 0.25
      })
    }
  })

  const ringConfigs = [
    { radius: 24, thickness: 0.2, color: '#00ffff', emissive: '#00dddd', intensity: 1.8 },
    { radius: 30, thickness: 0.18, color: '#ff00ff', emissive: '#dd00dd', intensity: 1.6 },
    { radius: 36, thickness: 0.16, color: '#ffff00', emissive: '#dddd00', intensity: 1.4 },
    { radius: 42, thickness: 0.14, color: '#00ff00', emissive: '#00dd00', intensity: 1.2 },
  ]

  return (
    <group ref={rings}>
      {ringConfigs.map((config, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * Math.PI / 7]}>
          <torusGeometry args={[config.radius, config.thickness, 64, 256]} />
          <meshStandardMaterial 
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={config.intensity}
            transparent 
            opacity={0.3}
            roughness={0}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

// --- CRYSTAL NODE ULTRA HD OPTIMISÉ ---
function CrystalNodeHD({ position, color, accent, name, subtitle, route, onClick, energy }: any) {
  const group = useRef<THREE.Group>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  useFrame((state, delta) => {
    if(group.current) {
      group.current.rotation.y += delta * 0.12
      
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.06
      const scale = hovered ? 1.6 * breathe : 1 * breathe
      group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.12)
      
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.25
    }
  })

  const handleHover = (isHovered: boolean) => {
    setHover(isHovered)
    document.body.style.cursor = isHovered ? 'pointer' : 'auto'
  }

  const handleClick = () => {
    setActive(true)
    setTimeout(() => onClick(route), 250)
  }

  return (
    <group ref={group} position={position}>
      <Float speed={1.2} rotationIntensity={0.35} floatIntensity={0.7}>
        
        {/* Cristal central ultra-réaliste */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); handleHover(true) }}
          onPointerOut={(e) => { e.stopPropagation(); handleHover(false) }}
          onClick={(e) => { e.stopPropagation(); handleClick() }}
        >
          <octahedronGeometry args={[1.6, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={16}
            resolution={2048}
            thickness={1.2}
            chromaticAberration={0.5}
            anisotropy={0.6}
            distortion={0.4}
            distortionScale={0.6}
            temporalDistortion={0.3}
            color={accent}
            roughness={0}
            transmission={0.99}
            ior={2.8}
            clearcoat={1}
            clearcoatRoughness={0}
            attenuationDistance={1}
            attenuationColor={accent}
          />
        </mesh>

        {/* Noyau géométrique */}
        <mesh scale={0.75}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial 
            color={accent}
            emissive={accent}
            emissiveIntensity={hovered ? 2.5 : 1.2}
            wireframe 
            transparent
            opacity={0.85}
            roughness={0}
            metalness={1}
          />
        </mesh>

        {/* Anneaux orbitaux */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[Math.PI / 4 * i, Math.PI / 3 * i, 0]}>
            <mesh>
              <ringGeometry args={[2 + i * 0.25, 2.08 + i * 0.25, 256]} />
              <meshStandardMaterial 
                color={color}
                emissive={accent}
                emissiveIntensity={hovered ? 2 : 0.8}
                transparent 
                opacity={hovered ? 0.7 : 0.35} 
                side={THREE.DoubleSide}
                roughness={0}
                metalness={0.9}
              />
            </mesh>
          </group>
        ))}

        {/* Aura au hover */}
        {hovered && (
          <>
            <Sparkles 
              count={120} 
              scale={7} 
              size={8} 
              speed={3.5} 
              opacity={1} 
              color={accent} 
            />
            
            <Sphere args={[2.8, 128, 128]}>
              <meshStandardMaterial 
                color={accent}
                emissive={accent}
                emissiveIntensity={2}
                transparent 
                opacity={0.18}
                side={THREE.BackSide}
                roughness={0}
              />
            </Sphere>

            {[0, 1, 2].map((i) => (
              <mesh key={i} rotation={[0, 0, i * Math.PI / 3]}>
                <torusGeometry args={[2.5, 0.08, 32, 256]} />
                <meshStandardMaterial 
                  color={accent}
                  emissive={accent}
                  emissiveIntensity={2.5}
                  transparent 
                  opacity={0.9}
                  roughness={0}
                />
              </mesh>
            ))}
          </>
        )}

        {/* Labels */}
        <Billboard position={[0, -3.2, 0]}>
          <Text 
            position={[0, 0, 0]} 
            fontSize={0.75} 
            fontWeight={900} 
            color="white" 
            anchorX="center" 
            anchorY="middle" 
            outlineWidth={0.05} 
            outlineColor="#000000"
            letterSpacing={0.1}
          >
            {name}
          </Text>
          <Text 
            position={[0, -0.55, 0]} 
            fontSize={0.28} 
            color={accent} 
            anchorX="center" 
            anchorY="middle" 
            letterSpacing={0.22}
            fontWeight={700}
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {`[ ${subtitle} ]`}
          </Text>
          
          {/* Barre d'énergie */}
          <group position={[0, -1.1, 0]}>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[2.8, 0.12]} />
              <meshStandardMaterial 
                color="#0a0a0a" 
                transparent 
                opacity={0.9}
                emissive="#000000"
                emissiveIntensity={0.2}
              />
            </mesh>
            <mesh position={[-(2.8 * (1 - energy)) / 2, 0, 0]}>
              <planeGeometry args={[2.8 * energy, 0.1]} />
              <meshStandardMaterial 
                color={accent}
                emissive={accent}
                emissiveIntensity={1.5}
                transparent 
                opacity={0.95}
              />
            </mesh>
          </group>
        </Billboard>

        {/* Trail */}
        {active && (
          <Trail
            width={4}
            length={10}
            color={new THREE.Color(accent)}
            attenuation={(t) => t * t}
          >
            <Sphere args={[0.2, 32, 32]}>
              <meshStandardMaterial 
                color={accent}
                emissive={accent}
                emissiveIntensity={3}
              />
            </Sphere>
          </Trail>
        )}
      </Float>
    </group>
  )
}

// --- LIENS ÉNERGÉTIQUES ---
function EnergyLinksHD() {
  const linesRef = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.LineBasicMaterial
          material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 1.5 + i * 0.4) * 0.2
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
          lineWidth={2.5} 
          transparent 
          opacity={0.35}
        />
      ))}
    </group>
  )
}

// --- DATA ---
const NODES = [
  { name: 'KETHER', subtitle: 'CROWN', position: [0, 10, 0], color: '#ffffff', accent: '#a5f3fc', route: '/', energy: 1.0 },
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

// --- MAIN COMPONENT ---
export default function SephirotTree3D() {
  const router = useRouter()

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, background: '#000000' }}>
      <Canvas 
        dpr={[1.5, 2]} 
        camera={{ position: [0, 0, 58], fov: 48 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace
        }}
        style={{ width: '100%', height: '100%' }}
        frameloop="demand"
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000510', 60, 180]} />
        
        {/* Éclairages optimisés */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[50, 50, 50]} intensity={2.5} color="#60a5fa" />
        <directionalLight position={[-50, -50, 50]} intensity={2} color="#a855f7" />
        <pointLight position={[0, 0, 35]} intensity={2.5} color="#ffffff" />
        <pointLight position={[25, 25, 25]} intensity={2} color="#06ffa5" />
        <pointLight position={[-25, -25, 25]} intensity={2} color="#ff006e" />
        <spotLight position={[0, 50, 30]} intensity={3} angle={0.3} penumbra={0.5} color="#3a86ff" />

        {/* Environnement spatial */}
        <GalaxyBackgroundHD />
        <Stars radius={450} depth={120} count={15000} factor={9} saturation={0.9} fade speed={0.6} />
        <NebulaUltraHD />
        <Supernova4K />
        <BlackHole4K />
        <PulsarStar />
        <EnergyRings4K />

        {/* Arbre Sephirot */}
        <group position={[0, 2, 0]}>
          <EnergyLinksHD />
          {NODES.map((node, i) => (
            <CrystalNodeHD key={i} {...node} onClick={(r: string) => router.push(r)} />
          ))}
        </group>

        {/* Post-processing OPTIMISÉ */}
        <EffectComposer multisampling={8}>
          <Bloom 
            intensity={0.75} 
            luminanceThreshold={0.25} 
            luminanceSmoothing={0.85}
            mipmapBlur
            radius={0.65}
          />
          <N8AO 
            aoRadius={0.5}
            intensity={1.2}
            quality="performance"
            halfRes
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>

        {/* Contrôles optimisés */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.02} 
          autoRotate 
          autoRotateSpeed={0.1} 
          maxDistance={95} 
          minDistance={22}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.4}
          minPolarAngle={Math.PI / 3.5}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  )
}
