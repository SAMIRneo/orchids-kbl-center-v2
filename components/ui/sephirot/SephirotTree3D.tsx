// @ts-nocheck
'use client'

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Line, Text, Float, Sparkles, Billboard, 
  MeshTransmissionMaterial, Sphere
} from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { SpaceEnvironmentAAA } from './SpaceEnvironmentAAA'
import Spaceship3D from './Spaceship3D'

const NODES = [
  { name: 'KETHER', subtitle: 'CROWN', position: [0, 14, 0], accent: '#ffffff', route: '/home', energy: 1.0 },
  { name: 'TIPHERETH', subtitle: 'BEAUTY', position: [0, 0, 0], accent: '#ffcc00', route: '/charts', energy: 0.95 },
  { name: 'YESOD', subtitle: 'FOUNDATION', position: [0, -9, 0], accent: '#8b5cf6', route: '/gnosis', energy: 1.0 },
  { name: 'MALKUTH', subtitle: 'KINGDOM', position: [0, -16, 0], accent: '#a0522d', route: '/communautes', energy: 0.5 },
  { name: 'CHOKHMAH', subtitle: 'WISDOM', position: [8, 10, 0], accent: '#c0c0c0', route: '/ia', energy: 0.95 },
  { name: 'CHESED', subtitle: 'MERCY', position: [8, 2, 0], accent: '#3b82f6', route: '/audiovisuel', energy: 0.85 },
  { name: 'NETZACH', subtitle: 'VICTORY', position: [7, -6, 0], accent: '#22c55e', route: '/terminal', energy: 0.75 },
  { name: 'BINAH', subtitle: 'UNDERSTANDING', position: [-8, 10, 0], accent: '#64748b', route: '/politique', energy: 0.9 },
  { name: 'GEVURAH', subtitle: 'STRENGTH', position: [-8, 2, 0], accent: '#dc2626', route: '/terminal', energy: 0.8 },
  { name: 'HOD', subtitle: 'GLORY', position: [-7, -6, 0], accent: '#f97316', route: '/politique', energy: 0.7 },
]

const LINKS = [
  [0, 1], [1, 2], [2, 3],
  [0, 4], [4, 5], [5, 6], [6, 2],
  [0, 7], [7, 8], [8, 9], [9, 2],
  [4, 1], [7, 1], [5, 1], [8, 1], [5, 6], [8, 9],
]

const SpaceshipController = React.memo(({ nodes, onNodeCollision }: { 
  nodes: any[], 
  onNodeCollision: (route: string, name: string) => void
}) => {
  const { camera, gl } = useThree()
  
  const shipPos = useRef(new THREE.Vector3(0, -5, 30))
  const shipVel = useRef(new THREE.Vector3())
  const yaw = useRef(0)
  const pitch = useRef(0)
  const targetYaw = useRef(0)
  const targetPitch = useRef(0)
  const lastNode = useRef<string | null>(null)
  const keys = useRef<Set<string>>(new Set())
  const isPointerLocked = useRef(false)
  const cameraPos = useRef(new THREE.Vector3(0, 10, 50))
  const cameraTarget = useRef(new THREE.Vector3(0, -5, 30))
  
  const [state, setState] = useState({
    position: new THREE.Vector3(0, -5, 30),
    velocity: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    boosting: false,
    isMoving: false
  })

  useEffect(() => {
    const canvas = gl.domElement
    let isDragging = false
    
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase())
      if (e.key === ' ') e.preventDefault()
    }
    
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase())
    }
    
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true
        isPointerLocked.current = true
      }
    }
    
    const onMouseUp = () => {
      isDragging = false
      isPointerLocked.current = false
    }
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const sensitivity = 0.003
      targetYaw.current -= e.movementX * sensitivity
      targetPitch.current = THREE.MathUtils.clamp(
        targetPitch.current - e.movementY * sensitivity,
        -Math.PI / 4,
        Math.PI / 4
      )
    }
    
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) {
        shipVel.current.y += 0.15
      } else {
        shipVel.current.y -= 0.15
      }
    }
    
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl])

  useFrame((_, delta) => {
    const pos = shipPos.current
    const vel = shipVel.current
    const k = keys.current
    
    // Interpolation très douce pour rotation fluide
    yaw.current = THREE.MathUtils.lerp(yaw.current, targetYaw.current, 0.06)
    pitch.current = THREE.MathUtils.lerp(pitch.current, targetPitch.current, 0.06)
    
    const forward = new THREE.Vector3(
      Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      Math.cos(yaw.current) * Math.cos(pitch.current)
    ).normalize()
    
    const right = new THREE.Vector3(
      Math.cos(yaw.current),
      0,
      -Math.sin(yaw.current)
    ).normalize()
    
    const up = new THREE.Vector3(0, 1, 0)
    
    const boost = k.has(' ')
    // Vitesse très réduite pour contrôle précis
    const baseSpeed = boost ? 3 : 1.5
    const speed = baseSpeed * delta
    
    const accel = new THREE.Vector3()
    
    if (k.has('z') || k.has('w') || k.has('arrowup')) {
      accel.add(forward.clone().multiplyScalar(speed))
    }
    if (k.has('s') || k.has('arrowdown')) {
      accel.add(forward.clone().multiplyScalar(-speed * 0.5))
    }
    if (k.has('q') || k.has('a') || k.has('arrowleft')) {
      accel.add(right.clone().multiplyScalar(speed * 0.6))
    }
    if (k.has('d') || k.has('arrowright')) {
      accel.add(right.clone().multiplyScalar(-speed * 0.6))
    }
    if (k.has('shift')) {
      accel.add(up.clone().multiplyScalar(speed * 0.5))
    }
    if (k.has('control')) {
      accel.add(up.clone().multiplyScalar(-speed * 0.5))
    }
    
    vel.add(accel)
    // Friction progressive - plus naturelle
    const currentSpeed = vel.length()
    const friction = currentSpeed > 0.15 ? 0.96 : (currentSpeed > 0.05 ? 0.90 : 0.80)
    vel.multiplyScalar(friction)
    
    // Limiter vitesse max
    const maxSpeed = boost ? 0.5 : 0.25
    if (vel.length() > maxSpeed) {
      vel.normalize().multiplyScalar(maxSpeed)
    }
    
    if (vel.length() < 0.0005) vel.set(0, 0, 0)
    
    pos.add(vel)
    
    pos.x = THREE.MathUtils.clamp(pos.x, -50, 50)
    pos.y = THREE.MathUtils.clamp(pos.y, -30, 30)
    pos.z = THREE.MathUtils.clamp(pos.z, -30, 60)
    
    // Caméra très proche du vaisseau
    const camDist = 10
    const camHeight = 5
    const camOffset = new THREE.Vector3(
      -Math.sin(yaw.current) * camDist,
      camHeight + Math.sin(pitch.current) * -2,
      -Math.cos(yaw.current) * camDist
    )
    
    const targetCamPos = pos.clone().add(camOffset)
    // Suivi caméra très serré
    cameraPos.current.lerp(targetCamPos, 0.15)
    camera.position.copy(cameraPos.current)
    
    const lookAhead = pos.clone().add(forward.clone().multiplyScalar(3))
    cameraTarget.current.lerp(lookAhead, 0.18)
    camera.lookAt(cameraTarget.current)
    
    // Inclinaison du vaisseau vers l'arrière (~25°) pour vue du dessous
    const rot = new THREE.Quaternion()
    const tiltX = THREE.MathUtils.clamp(vel.z * 0.12, -0.2, 0.2)
    const tiltZ = THREE.MathUtils.clamp(-vel.x * 0.15, -0.4, 0.4)
    const euler = new THREE.Euler(
      pitch.current * 0.3 + 0.45 + tiltX, // Inclinaison permanente vers l'arrière
      yaw.current + Math.PI,
      tiltZ,
      'YXZ'
    )
    rot.setFromEuler(euler)
    
    setState({
      position: pos.clone(),
      velocity: vel.clone(),
      rotation: rot,
      boosting: boost,
      isMoving: vel.length() > 0.03
    })
    
    for (const node of nodes) {
      const nodePos = new THREE.Vector3(...node.position)
      const dist = pos.distanceTo(nodePos)
      
      if (dist < 5 && lastNode.current !== node.route) {
        lastNode.current = node.route
        onNodeCollision(node.route, node.name)
        break
      } else if (dist > 7 && lastNode.current === node.route) {
        lastNode.current = null
        onNodeCollision('', '')
      }
    }
  })

  return (
    <Spaceship3D
      position={state.position}
      velocity={state.velocity}
      rotation={state.rotation}
      boosting={state.boosting}
      isMoving={state.isMoving}
    />
  )
})

const CrystalNode = React.memo(({ position, accent, name, subtitle, route, onClick, energy, isTargeted }: any) => {
  const group = useRef<THREE.Group>(null!)
  const [hovered, setHover] = useState(false)

  useFrame((state, delta) => {
    if (!group.current) return
    
    group.current.rotation.y += delta * 0.08
    
    const scale = isTargeted ? 1.4 : (hovered ? 1.25 : 1)
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02
    group.current.scale.lerp(new THREE.Vector3(scale * breathe, scale * breathe, scale * breathe), 0.08)
    
    group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1
  })

  const routeName = route === '/' ? 'HOME' : route.replace('/', '').toUpperCase()

  return (
    <group ref={group} position={position}>
      <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.2}>
        
        <Sphere args={[0.4, 24, 24]}>
          <meshBasicMaterial color={accent} transparent opacity={0.9} toneMapped={false} />
        </Sphere>

        <mesh
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto' }}
          onClick={(e) => { e.stopPropagation(); onClick(route) }}
        >
          <octahedronGeometry args={[1.1, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            resolution={128}
            thickness={0.6}
            chromaticAberration={0.2}
            color={accent}
            roughness={0.1}
            transmission={0.9}
            ior={2}
            toneMapped={false}
          />
        </mesh>

        <mesh scale={0.5}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.7} toneMapped={false} />
        </mesh>

        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[Math.PI / 4 * i, Math.PI / 3 * i, 0]}>
            <mesh>
              <ringGeometry args={[1.5 + i * 0.12, 1.54 + i * 0.12, 48]} />
              <meshBasicMaterial color={accent} transparent opacity={isTargeted ? 0.7 : (hovered ? 0.5 : 0.3)} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </group>
        ))}

        <Sphere args={[1.8, 16, 16]}>
          <meshBasicMaterial color={accent} transparent opacity={isTargeted ? 0.15 : 0.05} side={THREE.BackSide} toneMapped={false} />
        </Sphere>

        {(hovered || isTargeted) && (
          <>
            <Sparkles count={isTargeted ? 50 : 30} scale={isTargeted ? 6 : 4} size={isTargeted ? 5 : 3} speed={2} color={accent} />
            <pointLight color={accent} intensity={isTargeted ? 5 : 3} distance={8} />
          </>
        )}

        <Billboard position={[0, 3, 0]}>
          <mesh>
            <planeGeometry args={[5, 2.2]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.92} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[5.15, 2.35]} />
            <meshBasicMaterial color={accent} transparent opacity={0.3} toneMapped={false} />
          </mesh>
        </Billboard>

        <Billboard position={[0, 3, 0]}>
          <Text position={[0, 0.65, 0.02]} fontSize={0.28} color={accent} anchorX="center" anchorY="middle" letterSpacing={0.15} fontWeight={800}>
            {routeName}
          </Text>
          <Text position={[0, 0.05, 0.02]} fontSize={0.58} fontWeight={900} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.06} outlineColor="#000000">
            {name}
          </Text>
          <Text position={[0, -0.52, 0.02]} fontSize={0.24} color={isTargeted ? '#ffffff' : accent} anchorX="center" anchorY="middle" letterSpacing={0.15} fontWeight={700}>
            {isTargeted ? '[ ENTRER ]' : `[ ${subtitle} ]`}
          </Text>
        </Billboard>

        <Billboard position={[0, -2.4, 0]}>
          <mesh>
            <planeGeometry args={[3, 0.18]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <mesh position={[-(3 * (1 - energy)) / 2, 0, 0.01]}>
            <planeGeometry args={[3 * energy, 0.14]} />
            <meshBasicMaterial color={accent} transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <Text position={[0, 0, 0.02]} fontSize={0.16} color="white" anchorX="center" anchorY="middle" fontWeight={800}>
            {`${Math.round(energy * 100)}%`}
          </Text>
        </Billboard>

      </Float>
    </group>
  )
})

const EnergyLinks = React.memo(() => {
  const lines = useMemo(() => LINKS.map(([s, e]) => ({
    start: new THREE.Vector3(...(NODES[s].position as [number, number, number])),
    end: new THREE.Vector3(...(NODES[e].position as [number, number, number])),
    color: NODES[s].accent
  })), [])

  return (
    <group>
      {lines.map((line, i) => (
        <Line key={i} points={[line.start, line.end]} color={line.color} lineWidth={1.5} transparent opacity={0.3} />
      ))}
    </group>
  )
})

const HUD = ({ targetedNode, onDive, showHelp, setShowHelp }: any) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && targetedNode) onDive()
      if (e.key === 'h' || e.key === 'H') setShowHelp((v: boolean) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [targetedNode, onDive, setShowHelp])

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div className="absolute top-5 left-5 pointer-events-auto">
        <h1 className="text-xl font-black text-white tracking-widest">KBLMVP</h1>
        <button onClick={() => setShowHelp((v: boolean) => !v)} className="mt-2 px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20 text-xs text-white/70">
          [H] Aide
        </button>
      </div>

      {showHelp && (
        <div className="absolute top-16 left-5 bg-black/90 backdrop-blur rounded-lg p-4 border border-amber-500/30 pointer-events-auto text-xs min-w-[200px]">
          <h3 className="text-amber-400 font-bold mb-2">CONTRÔLES</h3>
          <div className="space-y-2 text-white/70">
            <div className="border-b border-white/10 pb-2">
              <div className="flex justify-between"><span className="text-amber-400">Z/W/↑</span><span>Avancer</span></div>
              <div className="flex justify-between"><span className="text-amber-400">S/↓</span><span>Reculer</span></div>
              <div className="flex justify-between"><span className="text-amber-400">Q/A/←</span><span>Gauche</span></div>
              <div className="flex justify-between"><span className="text-amber-400">D/→</span><span>Droite</span></div>
              <div className="flex justify-between"><span className="text-amber-400">SHIFT</span><span>Monter</span></div>
              <div className="flex justify-between"><span className="text-amber-400">CTRL</span><span>Descendre</span></div>
              <div className="flex justify-between"><span className="text-amber-400">MOLETTE</span><span>Monter/Descendre</span></div>
              <div className="flex justify-between"><span className="text-amber-400">ESPACE</span><span>Boost</span></div>
            </div>
            <div>
              <div className="flex justify-between"><span className="text-cyan-400">CLIC + DRAG</span><span>Orienter</span></div>
              <div className="flex justify-between"><span className="text-green-400">ENTRÉE</span><span>Accéder au nœud</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-5 right-5">
        <div className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white/60 text-xs">
          Clic + Drag pour orienter
        </div>
      </div>

      {targetedNode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-8">
          <div className="bg-black/90 backdrop-blur rounded-lg p-4 border-2 border-cyan-400 animate-pulse">
            <p className="text-cyan-400 text-center font-bold text-lg">{targetedNode}</p>
            <p className="text-white/80 text-center text-sm">Appuyez <span className="text-amber-400 font-bold">ENTRÉE</span></p>
          </div>
        </div>
      )}
    </div>
  )
}

const Scene = ({ onNodeClick, targetedRoute, setTargetedRoute, setTargetedName }: any) => (
  <>
    <ambientLight intensity={0.5} />
    <directionalLight position={[20, 20, 20]} intensity={0.8} />
    <directionalLight position={[-20, -20, 20]} intensity={0.5} />

    <SpaceEnvironmentAAA />

    <group position={[0, 1, 0]}>
      <EnergyLinks />
      {NODES.map((node, i) => (
        <CrystalNode key={i} {...node} onClick={onNodeClick} isTargeted={targetedRoute === node.route} />
      ))}
    </group>

    <SpaceshipController 
      nodes={NODES}
      onNodeCollision={(route, name) => {
        setTargetedRoute(route || null)
        setTargetedName(name || null)
      }}
    />
  </>
)

export default function SephirotTree3D() {
  const router = useRouter()
  const [targetedRoute, setTargetedRoute] = useState<string | null>(null)
  const [targetedName, setTargetedName] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const handleNodeClick = useCallback((route: string) => router.push(route), [router])
  const handleDive = useCallback(() => { if (targetedRoute) router.push(targetedRoute) }, [router, targetedRoute])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, background: '#000' }}>
      <HUD targetedNode={targetedName} onDive={handleDive} showHelp={showHelp} setShowHelp={setShowHelp} />
      
      <Canvas 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 45], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
        frameloop="always"
      >
        <color attach="background" args={['#020208']} />
        <Scene onNodeClick={handleNodeClick} targetedRoute={targetedRoute} setTargetedRoute={setTargetedRoute} setTargetedName={setTargetedName} />
      </Canvas>
    </div>
  )
}