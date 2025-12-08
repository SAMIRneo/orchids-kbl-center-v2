// @ts-nocheck
'use client'

import React, { useRef, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { 
  OrbitControls, Line, Text, Float, Stars, Sparkles, Billboard, 
  MeshTransmissionMaterial, Trail, shaderMaterial, Sphere, useTexture
} from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

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
      float combined = n1 * 0.8 + 0.2;
      
      vec3 color = mix(color1, color2, combined);
      color = mix(color, color3, sin(angle * 4.0 + time * 0.5) * 0.5 + 0.5);
      
      float alpha = (1.0 - smoothstep(0.0, 0.6, radius)) * combined * 0.4;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
)

extend({ GalaxyMaterial })

// --- GALAXIE BACKGROUND OPTIMISÉE ---
const GalaxyBackgroundHD = React.memo(() => {
  const mesh = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (mesh.current?.material) {
      mesh.current.material.uniforms.time.value = state.clock.elapsedTime
      mesh.current.rotation.z += 0.0002
    }
  })

  return (
    <mesh ref={mesh} position={[0, 0, -120]} scale={180}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <galaxyMaterial transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
})

// --- SUPERNOVA OPTIMISÉE ---
const Supernova4K = React.memo(() => {
  const coreRef = useRef<THREE.Mesh>(null!)
  const ring1Ref = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (coreRef.current) {
      coreRef.current.rotation.z += 0.002
      const scale = 28 + Math.sin(t * 0.3) * 3
      coreRef.current.scale.setScalar(scale)
    }
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z -= 0.003
    }
  })

  return (
    <group position={[40, 30, -60]}>
      <Sphere args={[1.5, 32, 32]}>
        <meshStandardMaterial 
          color="#ff2200" 
          emissive="#ff4500"
          emissiveIntensity={2.5}
          roughness={0}
          metalness={1}
        />
      </Sphere>

      <mesh ref={coreRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial 
          color="#ff6b35" 
          emissive="#ff4500"
          emissiveIntensity={2}
          transparent 
          opacity={0.7}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh ref={ring1Ref}>
        <torusGeometry args={[8, 0.3, 16, 64]} />
        <meshStandardMaterial 
          color="#ff8800" 
          emissive="#ff6b35"
          emissiveIntensity={1.5}
          transparent 
          opacity={0.6}
        />
      </mesh>

      <Sparkles 
        count={200} 
        scale={20} 
        size={6} 
        speed={0.4} 
        opacity={0.6} 
        color="#ff6b35" 
      />
    </group>
  )
})

// --- BLACK HOLE OPTIMISÉ ---
const BlackHole4K = React.memo(() => {
  const diskRef = useRef<THREE.Mesh>(null!)
  const lensRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (diskRef.current) diskRef.current.rotation.z += 0.03
    if (lensRef.current) {
      const scale = 1.1 + Math.sin(t * 2) * 0.08
      lensRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={[-50, -25, -70]}>
      <Sphere args={[4, 64, 64]}>
        <meshStandardMaterial 
          color="#000000"
          metalness={1}
          roughness={0.1}
        />
      </Sphere>
      
      <mesh ref={lensRef}>
        <sphereGeometry args={[6, 64, 64]} />
        <meshStandardMaterial 
          color="#3730a3" 
          emissive="#4f46e5"
          emissiveIntensity={0.6}
          transparent 
          opacity={0.15}
          side={THREE.BackSide}
          roughness={0}
        />
      </mesh>
      
      <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[9, 1.2, 32, 128]} />
        <meshStandardMaterial 
          color="#4f46e5" 
          emissive="#6366f1"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      <Sparkles 
        count={150} 
        scale={15} 
        size={4} 
        speed={1.5} 
        opacity={0.7} 
        color="#8b5cf6" 
      />
    </group>
  )
})

// --- NEBULA OPTIMISÉE ---
const NebulaUltraHD = React.memo(() => {
  const count = 5000
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const scale = 250
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.pow(Math.random(), 0.7) * scale
      const height = (Math.random() - 0.5) * 50
      
      pos[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 15
      pos[i * 3 + 1] = height + (Math.random() - 0.5) * 15
      pos[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 15
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
      s[i] = Math.random() * 1 + 0.2
    }
    return s
  }, [])

  const pointsRef = useRef<THREE.Points>(null!)

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0003
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
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
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
})

// --- ENERGY RINGS OPTIMISÉS ---
const EnergyRings4K = React.memo(() => {
  const rings = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    if (rings.current) {
      rings.current.rotation.y += 0.002
      
      rings.current.children.forEach((ring, i) => {
        const scale = 1 + Math.sin(t * 0.3 + i * 0.5) * 0.15
        ring.scale.setScalar(scale)
      })
    }
  })

  const ringConfigs = [
    { radius: 24, thickness: 0.15, color: '#00ffff', emissive: '#00dddd', intensity: 1.5 },
    { radius: 30, thickness: 0.15, color: '#ff00ff', emissive: '#dd00dd', intensity: 1.3 },
    { radius: 36, thickness: 0.12, color: '#ffff00', emissive: '#dddd00', intensity: 1.1 },
  ]

  return (
    <group ref={rings}>
      {ringConfigs.map((config, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * Math.PI / 6]}>
          <torusGeometry args={[config.radius, config.thickness, 32, 128]} />
          <meshStandardMaterial 
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={config.intensity}
            transparent 
            opacity={0.25}
            roughness={0}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  )
})

// --- CRYSTAL NODE ULTRA OPTIMISÉ ---
const CrystalNodeHD = React.memo(({ position, color, accent, name, subtitle, route, onClick, energy }: any) => {
  const group = useRef<THREE.Group>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  useFrame((state, delta) => {
    if(group.current) {
      group.current.rotation.y += delta * 0.1
      
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
      const scale = hovered ? 1.5 * breathe : 1 * breathe
      group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
      
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.2
    }
  })

  const handleHover = useCallback((isHovered: boolean) => {
    setHover(isHovered)
    document.body.style.cursor = isHovered ? 'pointer' : 'auto'
  }, [])

  const handleClick = useCallback(() => {
    setActive(true)
    setTimeout(() => onClick(route), 200)
  }, [onClick, route])

  const routeName = route === '/' ? 'HOME' : route.replace('/', '').toUpperCase()

  return (
    <group ref={group} position={position}>
      <Float speed={1} rotationIntensity={0.3} floatIntensity={0.6}>
        
        {/* Cristal central */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); handleHover(true) }}
          onPointerOut={(e) => { e.stopPropagation(); handleHover(false) }}
          onClick={(e) => { e.stopPropagation(); handleClick() }}
        >
          <octahedronGeometry args={[1.5, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={8}
            resolution={1024}
            thickness={1}
            chromaticAberration={0.4}
            anisotropy={0.5}
            distortion={0.3}
            distortionScale={0.5}
            temporalDistortion={0.2}
            color={accent}
            roughness={0}
            transmission={0.98}
            ior={2.5}
            clearcoat={1}
            clearcoatRoughness={0}
            attenuationDistance={0.8}
            attenuationColor={accent}
          />
        </mesh>

        {/* Noyau */}
        <mesh scale={0.7}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial 
            color={accent}
            emissive={accent}
            emissiveIntensity={hovered ? 2 : 1}
            wireframe 
            transparent
            opacity={0.8}
            roughness={0}
            metalness={1}
          />
        </mesh>

        {/* Anneaux réduits */}
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[Math.PI / 4 * i, Math.PI / 3 * i, 0]}>
            <mesh>
              <ringGeometry args={[2 + i * 0.2, 2.05 + i * 0.2, 128]} />
              <meshStandardMaterial 
                color={color}
                emissive={accent}
                emissiveIntensity={hovered ? 1.5 : 0.6}
                transparent 
                opacity={hovered ? 0.6 : 0.3} 
                side={THREE.DoubleSide}
                roughness={0}
                metalness={0.8}
              />
            </mesh>
          </group>
        ))}

        {/* Aura optimisée */}
        {hovered && (
          <>
            <Sparkles 
              count={80} 
              scale={6} 
              size={6} 
              speed={2.5} 
              opacity={0.8} 
              color={accent} 
            />
            
            <Sphere args={[2.5, 64, 64]}>
              <meshStandardMaterial 
                color={accent}
                emissive={accent}
                emissiveIntensity={1.5}
                transparent 
                opacity={0.15}
                side={THREE.BackSide}
                roughness={0}
              />
            </Sphere>
          </>
        )}

        {/* Panneau labels */}
        <Billboard position={[0, 4.3, 0]}>
          <mesh>
            <planeGeometry args={[4.5, 2]} />
            <meshStandardMaterial 
              color="#000000"
              transparent
              opacity={0.8}
              emissive="#000000"
              emissiveIntensity={0.4}
              roughness={0.3}
              metalness={0.6}
            />
          </mesh>
          
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[4.6, 2.1]} />
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={hovered ? 1.5 : 0.6}
              transparent
              opacity={0.25}
              side={THREE.BackSide}
            />
          </mesh>
        </Billboard>

        {/* Labels 3D */}
        <Billboard position={[0, 4.3, 0]}>
          <Text 
            position={[0, 0.6, 0.1]} 
            fontSize={0.32} 
            color={accent}
            anchorX="center" 
            anchorY="middle" 
            letterSpacing={0.25}
            fontWeight={900}
            outlineWidth={0.04}
            outlineColor="#000000"
            outlineOpacity={1}
          >
            {routeName}
          </Text>
          
          <Text 
            position={[0, 0, 0.1]} 
            fontSize={0.6} 
            fontWeight={900} 
            color="white" 
            anchorX="center" 
            anchorY="middle" 
            outlineWidth={0.1} 
            outlineColor="#000000"
            outlineOpacity={1}
            letterSpacing={0.12}
          >
            {name}
          </Text>
          
          <Text 
            position={[0, -0.5, 0.1]} 
            fontSize={0.25} 
            color={hovered ? '#ffffff' : accent} 
            anchorX="center" 
            anchorY="middle" 
            letterSpacing={0.25}
            fontWeight={700}
            outlineWidth={0.035}
            outlineColor="#000000"
            outlineOpacity={1}
          >
            {`[ ${subtitle} ]`}
          </Text>
        </Billboard>

        {/* Barre d'énergie */}
        <Billboard position={[0, -3.5, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[3, 0.16]} />
            <meshStandardMaterial 
              color="#0a0a0a" 
              transparent 
              opacity={0.9}
              emissive="#000000"
              emissiveIntensity={0.2}
              roughness={0.2}
              metalness={0.7}
            />
          </mesh>
          
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[3.1, 0.2]} />
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={0.4}
              transparent 
              opacity={0.3}
              side={THREE.BackSide}
            />
          </mesh>
          
          <mesh position={[-(3 * (1 - energy)) / 2, 0, 0.01]}>
            <planeGeometry args={[3 * energy, 0.14]} />
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={2}
              transparent 
              opacity={0.95}
              roughness={0}
              metalness={1}
            />
          </mesh>
          
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[3 * energy, 0.07]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={1.2}
              transparent 
              opacity={0.3}
            />
          </mesh>
          
          <Text 
            position={[0, 0, 0.03]} 
            fontSize={0.2} 
            color="white" 
            anchorX="center" 
            anchorY="middle" 
            fontWeight={900}
            outlineWidth={0.025}
            outlineColor="#000000"
            outlineOpacity={1}
          >
            {`${Math.round(energy * 100)}%`}
          </Text>
        </Billboard>

        {/* Trail optimisé */}
        {active && (
          <Trail
            width={3}
            length={8}
            color={new THREE.Color(accent)}
            attenuation={(t) => t * t}
          >
            <Sphere args={[0.15, 16, 16]}>
              <meshStandardMaterial 
                color={accent}
                emissive={accent}
                emissiveIntensity={2.5}
              />
            </Sphere>
          </Trail>
        )}
      </Float>
    </group>
  )
})

// --- LIENS OPTIMISÉS ---
const EnergyLinksHD = React.memo(() => {
  const linesRef = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.LineBasicMaterial
          material.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 1.2 + i * 0.3) * 0.15
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
          lineWidth={2} 
          transparent 
          opacity={0.3}
        />
      ))}
    </group>
  )
})

// --- DATA ---
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

// --- MAIN COMPONENT ULTRA OPTIMISÉ ---
export default function SephirotTree3D() {
  const router = useRouter()
  
  const handleNodeClick = useCallback((route: string) => {
    router.push(route)
  }, [router])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, background: '#000000' }}>
      <Canvas 
        dpr={[1, 1.5]} 
        camera={{ position: [0, 0, 55], fov: 48 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        performance={{ min: 0.5 }}
        frameloop="demand"
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000510', 70, 200]} />
        
        {/* Éclairages optimisés */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[40, 40, 40]} intensity={2} color="#60a5fa" />
        <directionalLight position={[-40, -40, 40]} intensity={1.5} color="#a855f7" />
        <pointLight position={[0, 0, 30]} intensity={2} color="#ffffff" />
        <spotLight position={[0, 45, 25]} intensity={2.5} angle={0.3} penumbra={0.5} color="#3a86ff" />

        {/* Environnement spatial optimisé */}
        <GalaxyBackgroundHD />
        <Stars radius={400} depth={100} count={10000} factor={7} saturation={0.8} fade speed={0.5} />
        <NebulaUltraHD />
        <Supernova4K />
        <BlackHole4K />
        <EnergyRings4K />

        {/* Arbre Sephirot */}
        <group position={[0, 2, 0]}>
          <EnergyLinksHD />
          {NODES.map((node, i) => (
            <CrystalNodeHD key={i} {...node} onClick={handleNodeClick} />
          ))}
        </group>

        {/* Post-processing minimal */}
        <EffectComposer multisampling={4}>
          <Bloom 
            intensity={0.6} 
            luminanceThreshold={0.3} 
            luminanceSmoothing={0.8}
            mipmapBlur
            radius={0.5}
          />
        </EffectComposer>

        {/* Contrôles optimisés */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.03} 
          autoRotate 
          autoRotateSpeed={0.08} 
          maxDistance={90} 
          minDistance={20}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3.5}
          rotateSpeed={0.4}
          zoomSpeed={0.6}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
