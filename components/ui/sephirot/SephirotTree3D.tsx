// @ts-nocheck
'use client'

import React, { useRef, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { 
  OrbitControls, Line, Text, Float, Sparkles, Billboard, 
  MeshTransmissionMaterial, Trail, Sphere
} from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { SpaceEnvironmentAAA } from './SpaceEnvironmentAAA'

// --- CRYSTAL NODE ULTRA OPTIMISÉ AMD ---
const CrystalNodeHD = React.memo(({ position, color, accent, name, subtitle, route, onClick, energy }: any) => {
  const group = useRef<THREE.Group>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  useFrame((state, delta) => {
    if(group.current) {
      group.current.rotation.y += delta * 0.08
      
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.3) * 0.04
      const scale = hovered ? 1.45 * breathe : 1 * breathe
      group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.08)
      
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.18
    }
  })

  const handleHover = useCallback((isHovered: boolean) => {
    setHover(isHovered)
    document.body.style.cursor = isHovered ? 'pointer' : 'auto'
  }, [])

  const handleClick = useCallback(() => {
    setActive(true)
    setTimeout(() => onClick(route), 180)
  }, [onClick, route])

  const routeName = route === '/' ? 'HOME' : route.replace('/', '').toUpperCase()

  return (
    <group ref={group} position={position}>
      <Float speed={0.9} rotationIntensity={0.25} floatIntensity={0.5}>
        
        {/* Cristal central */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); handleHover(true) }}
          onPointerOut={(e) => { e.stopPropagation(); handleHover(false) }}
          onClick={(e) => { e.stopPropagation(); handleClick() }}
        >
          <octahedronGeometry args={[1.4, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            resolution={256}
            thickness={0.9}
            chromaticAberration={0.3}
            anisotropy={0.35}
            distortion={0.2}
            distortionScale={0.35}
            temporalDistortion={0.12}
            color={accent}
            roughness={0}
            transmission={0.96}
            ior={2.4}
            clearcoat={1}
            clearcoatRoughness={0}
            attenuationDistance={0.7}
            attenuationColor={accent}
          />
        </mesh>

        {/* Noyau wireframe */}
        <mesh scale={0.65}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial 
            color={accent}
            emissive={accent}
            emissiveIntensity={hovered ? 1.9 : 1}
            wireframe 
            transparent
            opacity={0.75}
            roughness={0}
            metalness={1}
          />
        </mesh>

        {/* Anneaux orbitaux */}
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[Math.PI / 4 * i, Math.PI / 3 * i, 0]}>
            <mesh>
              <ringGeometry args={[1.9 + i * 0.18, 1.95 + i * 0.18, 64]} />
              <meshStandardMaterial 
                color={color}
                emissive={accent}
                emissiveIntensity={hovered ? 1.4 : 0.55}
                transparent 
                opacity={hovered ? 0.58 : 0.28} 
                side={THREE.DoubleSide}
                roughness={0}
                metalness={0.75}
              />
            </mesh>
          </group>
        ))}

        {/* Aura hover optimisée */}
        {hovered && (
          <>
            <Sparkles 
              count={40} 
              scale={5} 
              size={4} 
              speed={2} 
              opacity={0.7} 
              color={accent} 
            />
            
            <Sphere args={[2.4, 32, 32]}>
              <meshStandardMaterial 
                color={accent}
                emissive={accent}
                emissiveIntensity={1.2}
                transparent 
                opacity={0.12}
                side={THREE.BackSide}
                roughness={0}
              />
            </Sphere>
          </>
        )}

        {/* Panneau labels */}
        <Billboard position={[0, 4.1, 0]}>
          <mesh>
            <planeGeometry args={[4.3, 1.9]} />
            <meshStandardMaterial 
              color="#000000"
              transparent
              opacity={0.78}
              emissive="#000000"
              emissiveIntensity={0.35}
              roughness={0.25}
              metalness={0.6}
            />
          </mesh>
          
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[4.4, 2]} />
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={hovered ? 1.4 : 0.5}
              transparent
              opacity={0.23}
              side={THREE.BackSide}
            />
          </mesh>
        </Billboard>

        {/* Labels 3D */}
        <Billboard position={[0, 4.1, 0]}>
          <Text 
            position={[0, 0.56, 0.1]} 
            fontSize={0.29} 
            color={accent}
            anchorX="center" 
            anchorY="middle" 
            letterSpacing={0.23}
            fontWeight={900}
            outlineWidth={0.037}
            outlineColor="#000000"
            outlineOpacity={1}
          >
            {routeName}
          </Text>
          
          <Text 
            position={[0, 0, 0.1]} 
            fontSize={0.57} 
            fontWeight={900} 
            color="white" 
            anchorX="center" 
            anchorY="middle" 
            outlineWidth={0.095} 
            outlineColor="#000000"
            outlineOpacity={1}
            letterSpacing={0.11}
          >
            {name}
          </Text>
          
          <Text 
            position={[0, -0.48, 0.1]} 
            fontSize={0.23} 
            color={hovered ? '#ffffff' : accent} 
            anchorX="center" 
            anchorY="middle" 
            letterSpacing={0.23}
            fontWeight={700}
            outlineWidth={0.032}
            outlineColor="#000000"
            outlineOpacity={1}
          >
            {`[ ${subtitle} ]`}
          </Text>
        </Billboard>

        {/* Barre d'énergie */}
        <Billboard position={[0, -3.3, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.9, 0.15]} />
            <meshStandardMaterial 
              color="#0a0a0a" 
              transparent 
              opacity={0.87}
              emissive="#000000"
              emissiveIntensity={0.18}
              roughness={0.18}
              metalness={0.68}
            />
          </mesh>
          
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[3, 0.19]} />
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={0.38}
              transparent 
              opacity={0.29}
              side={THREE.BackSide}
            />
          </mesh>
          
          <mesh position={[-(2.9 * (1 - energy)) / 2, 0, 0.01]}>
            <planeGeometry args={[2.9 * energy, 0.13]} />
            <meshStandardMaterial 
              color={accent}
              emissive={accent}
              emissiveIntensity={1.9}
              transparent 
              opacity={0.93}
              roughness={0}
              metalness={1}
            />
          </mesh>
          
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[2.9 * energy, 0.065]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={1.1}
              transparent 
              opacity={0.29}
            />
          </mesh>
          
          <Text 
            position={[0, 0, 0.03]} 
            fontSize={0.19} 
            color="white" 
            anchorX="center" 
            anchorY="middle" 
            fontWeight={900}
            outlineWidth={0.023}
            outlineColor="#000000"
            outlineOpacity={1}
          >
            {`${Math.round(energy * 100)}%`}
          </Text>
        </Billboard>

        {/* Trail transition */}
        {active && (
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

// --- LIENS ÉNERGÉTIQUES ---
const EnergyLinksHD = React.memo(() => {
  const linesRef = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.LineBasicMaterial
          material.opacity = 0.23 + Math.sin(state.clock.elapsedTime * 1.1 + i * 0.27) * 0.14
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

// --- DATA CONFIGURATION ---
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

// --- COMPOSANT PRINCIPAL AMD RADEON 780M OPTIMISÉ ---
export default function SephirotTree3D() {
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
        camera={{ position: [0, 0, 50], fov: 45 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.7,
          outputColorSpace: THREE.SRGBColorSpace,
          precision: 'highp',
          logarithmicDepthBuffer: false,
        }}
        performance={{ 
          min: 0.5, 
          max: 1,
          debounce: 100,
          regress: () => 1,
        }}
        frameloop="always"
      >
        <color attach="background" args={['#000000']} />
        
        {/* Éclairages optimisés AMD */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[30, 30, 30]} intensity={1.7} color="#60a5fa" />
        <directionalLight position={[-30, -30, 30]} intensity={1.2} color="#a855f7" />
        <pointLight position={[0, 0, 25]} intensity={1.6} color="#ffffff" />
        <spotLight 
          position={[0, 38, 20]} 
          intensity={2} 
          angle={0.27} 
          penumbra={0.45} 
          color="#3a86ff"
        />

        {/* ENVIRONNEMENT SPATIAL AAA+ */}
        <SpaceEnvironmentAAA />

        {/* Arbre Sephirot */}
        <group position={[0, 1.5, 0]}>
          <EnergyLinksHD />
          {NODES.map((node, i) => (
            <CrystalNodeHD key={i} {...node} onClick={handleNodeClick} />
          ))}
        </group>

        {/* Post-processing léger AMD */}
        <EffectComposer multisampling={0}>
          <Bloom 
            intensity={0.45} 
            luminanceThreshold={0.35} 
            luminanceSmoothing={0.7}
            mipmapBlur
            radius={0.4}
          />
        </EffectComposer>

        {/* Contrôles 180Hz optimisés */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.035} 
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
