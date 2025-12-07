'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere, Text, Billboard } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal as TerminalIcon, Cpu, HardDrive, Activity, Zap, ChevronRight, Database, Server, Code, GitBranch, Shield, Lock, Wifi, BarChart3 } from 'lucide-react'

// --- MATRIX PARTICLES 3D ---
function MatrixParticles() {
  const pointsRef = useRef<THREE.Points>(null!)
  const count = 3000
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80
      pos[i * 3 + 1] = Math.random() * 80 - 40
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80
    }
    return pos
  })

  const [colors] = useState(() => {
    const cols = new Float32Array(count * 3)
    const green = new THREE.Color('#00ff00')
    for (let i = 0; i < count; i++) {
      const brightness = 0.5 + Math.random() * 0.5
      cols[i * 3] = green.r * brightness
      cols[i * 3 + 1] = green.g * brightness
      cols[i * 3 + 2] = green.b * brightness
    }
    return cols
  })

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= delta * (1.5 + Math.random() * 3)
        if (positions[i * 3 + 1] < -40) {
          positions[i * 3 + 1] = 40
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
      pointsRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// --- CENTRAL TERMINAL CORE ---
function TerminalCore() {
  const coreRef = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.005
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      coreRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5
    }
  })

  return (
    <group ref={coreRef} position={[0, 0, -10]}>
      {/* Core Sphere */}
      <Sphere args={[2, 64, 64]}>
        <MeshDistortMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={2}
          distort={0.5}
          speed={2}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Inner Wireframe */}
      <Sphere args={[2.5, 32, 32]}>
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.6}
        />
      </Sphere>

      {/* Rotating Rings */}
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[Math.PI / 3 * i, 0, Math.PI / 4 * i]}>
          <mesh>
            <torusGeometry args={[3 + i * 0.5, 0.1, 16, 64]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={2}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      ))}

      {/* Label */}
      <Billboard position={[0, 4, 0]}>
        <Text
          fontSize={0.8}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          fontWeight={900}
        >
          TERMINAL CORE
        </Text>
      </Billboard>
    </group>
  )
}

// --- FLOATING DATA CUBES ---
function FloatingCubes() {
  const groupRef = useRef<THREE.Group>(null!)
  const cubePositions = [
    [-10, 5, -8],
    [10, 3, -12],
    [-8, -3, -10],
    [8, -5, -14],
    [0, 8, -15]
  ]

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((cube, i) => {
        cube.position.y += Math.sin(state.clock.elapsedTime + i) * 0.01
        cube.rotation.x += 0.005
        cube.rotation.y += 0.008
      })
    }
  })

  return (
    <group ref={groupRef}>
      {cubePositions.map((pos, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
          <mesh position={pos as [number, number, number]}>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={1.5}
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// --- GRID FLOOR ---
function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null!)
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = ((state.clock.elapsedTime * 2) % 20) - 10
    }
  })

  return (
    <>
      <gridHelper ref={gridRef} args={[100, 50, '#00ff00', '#004400']} position={[0, -15, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#00ff00"
          emissiveIntensity={0.1}
          transparent
          opacity={0.4}
        />
      </mesh>
    </>
  )
}

// --- MAIN COMPONENT ---
export default function TerminalPage() {
  const [commandHistory, setCommandHistory] = useState([
    { command: '$ system init', output: '✓ KBL TERMINAL v4.0 initialized...', timestamp: new Date().toLocaleTimeString() },
    { command: '$ status --all', output: '✓ All systems operational. CPU: 23% | RAM: 8.2GB | Network: Active', timestamp: new Date().toLocaleTimeString() }
  ])
  const [currentCommand, setCurrentCommand] = useState('')
  const [systemStats, setSystemStats] = useState({
    cpu: 23,
    ram: 8.2,
    disk: 45,
    network: 'ONLINE',
    processes: 127,
    uptime: '48h 32m',
    security: 'SECURE',
    bandwidth: '1.2 GB/s'
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() - 0.5) * 10)),
        ram: Math.min(16, Math.max(4, prev.ram + (Math.random() - 0.5) * 0.5)),
        bandwidth: `${(Math.random() * 2 + 0.5).toFixed(1)} GB/s`
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const executeCommand = () => {
    if (!currentCommand.trim()) return
    
    const responses: any = {
      'help': '📋 Available commands: status, deploy, logs, monitor, clear, reboot, security',
      'status': `📊 SYSTEM STATUS\nCPU: ${systemStats.cpu.toFixed(1)}% | RAM: ${systemStats.ram.toFixed(1)}GB\nProcesses: ${systemStats.processes} | Uptime: ${systemStats.uptime}\nNetwork: ${systemStats.network} | Bandwidth: ${systemStats.bandwidth}`,
      'deploy': '🚀 DEPLOYMENT INITIATED\n⏳ Building project...\n⏳ Running tests...\n⏳ Deploying to production...\n✓ Deployment successful! Live at: kbl-center.io',
      'logs': '📝 FETCHING SYSTEM LOGS\n[INFO] 2025-12-06 23:18:12 - All services operational\n[INFO] 2025-12-06 23:18:13 - Database: 127 active connections\n[SUCCESS] No critical errors detected',
      'monitor': '👁️ MONITORING ENABLED\nReal-time system metrics now active.\nScanning for anomalies...\n✓ All systems nominal.',
      'security': `🔒 SECURITY STATUS\nFirewall: ACTIVE | Encryption: AES-256\nIntrusion Detection: ${systemStats.security}\nLast scan: 2 minutes ago`,
      'reboot': '🔄 SYSTEM REBOOT\nShutting down services...\nRestarting kernel...\n✓ System reboot complete.',
      'clear': 'CLEAR'
    }

    const output = responses[currentCommand.toLowerCase()] || `❌ Command not found: ${currentCommand}\nType 'help' for available commands.`
    
    if (output === 'CLEAR') {
      setCommandHistory([])
    } else {
      setCommandHistory([...commandHistory, { 
        command: `$ ${currentCommand}`, 
        output,
        timestamp: new Date().toLocaleTimeString()
      }])
    }
    setCurrentCommand('')
  }

  return (
    <div className="relative w-full min-h-screen bg-black">
      
      {/* === 3D ANIMATION SECTION - PLEINE LARGEUR EN HAUT === */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <Canvas 
          camera={{ position: [0, 0, 35], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 30, 100]} />

          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={4} color="#00ff00" />
          <pointLight position={[-10, -10, 10]} intensity={3} color="#00ff00" />
          <spotLight position={[0, 20, 0]} intensity={3} angle={0.5} penumbra={0.5} color="#00ff00" />

          <Stars radius={200} depth={80} count={10000} factor={6} saturation={0} fade speed={0.5} />
          
          <MatrixParticles />
          <TerminalCore />
          <FloatingCubes />
          <GridFloor />

          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
            <ChromaticAberration offset={[0.001, 0.001]} />
          </EffectComposer>

          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            autoRotate 
            autoRotateSpeed={0.4}
            maxDistance={60}
            minDistance={20}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>

        {/* Gradient Overlay Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </div>

      {/* === CONTENT SECTION - EN DESSOUS === */}
      <div className="relative w-full bg-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          
          {/* Header Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 -mt-8"
          >
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-black/90 backdrop-blur-xl border-2 border-green-500/50 shadow-[0_0_60px_rgba(0,255,0,0.3)]">
              <TerminalIcon className="w-10 h-10 text-green-400" />
              <div className="text-left">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                    TERMINAL
                  </span>
                </h1>
                <p className="text-green-400 font-mono text-sm tracking-[0.3em] uppercase mt-1">
                  System Control Center
                </p>
              </div>
            </div>
          </motion.div>

          {/* System Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: Cpu, label: 'CPU Usage', value: `${systemStats.cpu.toFixed(1)}%`, color: '#10b981', gradient: 'from-green-600 to-emerald-600' },
              { icon: HardDrive, label: 'Memory', value: `${systemStats.ram.toFixed(1)} GB`, color: '#3b82f6', gradient: 'from-blue-600 to-cyan-600' },
              { icon: Activity, label: 'Network', value: systemStats.network, color: '#06b6d4', gradient: 'from-cyan-600 to-teal-600' },
              { icon: Shield, label: 'Security', value: systemStats.security, color: '#10b981', gradient: 'from-green-600 to-emerald-600' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" 
                     style={{ background: `linear-gradient(135deg, ${stat.color}, transparent)` }} 
                />
                <div className="relative p-6 rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-green-900/50 group-hover:border-green-500 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                      <span className="text-xs text-green-400 font-mono">LIVE</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            
            {/* Terminal Console */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/90 backdrop-blur-2xl border-2 border-green-900/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,255,0,0.2)]"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-green-900/50">
                <Code className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Command Terminal</h3>
                <div className="ml-auto flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
                </div>
              </div>

              <div className="h-[350px] overflow-y-auto mb-4 font-mono text-sm space-y-3 custom-scrollbar">
                <AnimatePresence>
                  {commandHistory.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-green-400 font-bold">{item.command}</p>
                            <span className="text-slate-600 text-xs">[{item.timestamp}]</span>
                          </div>
                          <p className="text-slate-300 whitespace-pre-line leading-relaxed">{item.output}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-950/30 border-2 border-green-900/50 focus-within:border-green-500 transition-all">
                  <ChevronRight className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                    placeholder="Enter command..."
                    className="flex-1 bg-transparent text-white font-mono outline-none placeholder-slate-600"
                  />
                </div>
                <button
                  onClick={executeCommand}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.7)] hover:scale-105 active:scale-95"
                >
                  <Zap className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* System Info Panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {/* Process Monitor */}
              <div className="bg-black/90 backdrop-blur-2xl border-2 border-green-900/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,255,0,0.2)]">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-green-900/50">
                  <Server className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold text-white">Process Monitor</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'kbl-core.service', cpu: 12, ram: 2.1, status: 'running' },
                    { name: 'database-sync', cpu: 8, ram: 1.8, status: 'running' },
                    { name: 'api-gateway', cpu: 15, ram: 3.2, status: 'running' },
                    { name: 'auth-service', cpu: 5, ram: 0.9, status: 'running' },
                  ].map((process, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-green-950/20 border border-green-900/30 hover:border-green-500/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <div>
                          <p className="text-white font-mono text-sm">{process.name}</p>
                          <p className="text-xs text-slate-500">{process.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-mono text-sm">{process.cpu}%</p>
                        <p className="text-xs text-slate-500">{process.ram}GB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Stats */}
              <div className="bg-black/90 backdrop-blur-2xl border-2 border-green-900/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,255,0,0.2)]">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-green-900/50">
                  <Wifi className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold text-white">Network Activity</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/30">
                    <p className="text-xs text-slate-500 mb-2">Bandwidth</p>
                    <p className="text-2xl font-black text-green-400">{systemStats.bandwidth}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/30">
                    <p className="text-xs text-slate-500 mb-2">Uptime</p>
                    <p className="text-2xl font-black text-green-400">{systemStats.uptime}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: GitBranch, label: 'Deploy', cmd: 'deploy', color: '#10b981' },
              { icon: BarChart3, label: 'Monitor', cmd: 'monitor', color: '#3b82f6' },
              { icon: Lock, label: 'Security', cmd: 'security', color: '#8b5cf6' },
              { icon: Database, label: 'Status', cmd: 'status', color: '#06b6d4' },
            ].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentCommand(action.cmd)
                  setTimeout(executeCommand, 100)
                }}
                className="relative group p-6 rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-green-900/50 hover:border-green-500 transition-all text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <action.icon className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition-transform" style={{ color: action.color }} />
                <p className="relative text-white font-bold">{action.label}</p>
              </motion.button>
            ))}
          </motion.div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 255, 0, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 0, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 0, 0.8); }
      `}</style>
    </div>
  )
}
