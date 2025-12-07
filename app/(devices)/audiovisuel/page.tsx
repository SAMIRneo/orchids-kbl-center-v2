'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere, Text, Billboard } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Music, Camera, Play, Pause, SkipForward, Volume2, Eye, Film, Headphones, Maximize2, Share2, Download } from 'lucide-react'

// --- AUDIO VISUALIZER 3D (CORRIGÉ) ---
function AudioVisualizer() {
  const groupRef = useRef<THREE.Group>(null!)
  const barsCount = 64
  const barsRef = useRef(
    Array.from({ length: barsCount }, (_, i) => ({
      height: Math.random() * 5 + 2,
      phase: i * 0.1,
      speed: 0.5 + Math.random() * 0.5
    }))
  )

  useFrame((state) => {
    if (groupRef.current && groupRef.current.children.length > 0) {
      groupRef.current.rotation.y += 0.003
      
      groupRef.current.children.forEach((child, i) => {
        if (i < barsRef.current.length && child instanceof THREE.Mesh) {
          const bar = barsRef.current[i]
          const scale = 1 + Math.sin(state.clock.elapsedTime * bar.speed + bar.phase) * 0.8
          child.scale.y = scale
        }
      })
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -12]}>
      {barsRef.current.map((bar, i) => {
        const angle = (i / barsCount) * Math.PI * 2
        const radius = 8
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius
            ]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.5, bar.height, 0.5]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={2}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        )
      })}

      {/* Central Sphere */}
      <Sphere args={[3, 64, 64]}>
        <MeshDistortMaterial
          color="#f59e0b"
          emissive="#fb923c"
          emissiveIntensity={2}
          distort={0.5}
          speed={3}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.8}
        />
      </Sphere>

      <Billboard position={[0, 6, 0]}>
        <Text
          fontSize={0.8}
          color="#f59e0b"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          fontWeight={900}
        >
          MEDIA CORE
        </Text>
      </Billboard>
    </group>
  )
}

// --- FLOATING MEDIA CARDS ---
function FloatingMediaCards() {
  const groupRef = useRef<THREE.Group>(null!)
  const cards = [
    { pos: [-12, 6, -10], color: '#f59e0b' },
    { pos: [12, 4, -12], color: '#fb923c' },
    { pos: [-10, -4, -8], color: '#fbbf24' },
    { pos: [10, -6, -14], color: '#fcd34d' },
  ]

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((card, i) => {
        card.position.y += Math.sin(state.clock.elapsedTime + i) * 0.01
        card.rotation.y += 0.01
      })
    }
  })

  return (
    <group ref={groupRef}>
      {cards.map((card, i) => (
        <Float key={i} speed={2} rotationIntensity={0.4} floatIntensity={1}>
          <mesh position={card.pos as [number, number, number]}>
            <boxGeometry args={[3, 2, 0.2]} />
            <meshStandardMaterial
              color={card.color}
              emissive={card.color}
              emissiveIntensity={1.5}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// --- WAVEFORM PARTICLES ---
function WaveformParticles() {
  const pointsRef = useRef<THREE.Points>(null!)
  const count = 2000
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 4
      pos[i * 3] = Math.cos(t) * (15 + Math.random() * 5)
      pos[i * 3 + 1] = Math.sin(t) * 8 + (Math.random() - 0.5) * 4
      pos[i * 3 + 2] = Math.sin(t * 2) * 10 + (Math.random() - 0.5) * 5
    }
    return pos
  })

  const [colors] = useState(() => {
    const cols = new Float32Array(count * 3)
    const orange = new THREE.Color('#f59e0b')
    for (let i = 0; i < count; i++) {
      const brightness = 0.6 + Math.random() * 0.4
      cols[i * 3] = orange.r * brightness
      cols[i * 3 + 1] = orange.g * brightness
      cols[i * 3 + 2] = orange.b * brightness
    }
    return cols
  })

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.1
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// --- MAIN COMPONENT ---
export default function AudiovisuelPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(180)
  const [volume, setVolume] = useState(75)
  const [activeTab, setActiveTab] = useState('video')
  const [mediaStats] = useState({
    videosProcessed: 1247,
    audioFiles: 3421,
    storageUsed: '245 GB',
    activeSessions: 12
  })

  const mediaLibrary = [
    { 
      id: 1, 
      title: 'KBL Center Présentation 2025',
      type: 'video',
      duration: '12:34',
      thumbnail: '🎬',
      views: 2847,
      quality: '4K'
    },
    { 
      id: 2, 
      title: 'Projet Audiovisuel - Teaser',
      type: 'video',
      duration: '02:15',
      thumbnail: '🎥',
      views: 1523,
      quality: 'HD'
    },
    { 
      id: 3, 
      title: 'Bande Son Originale',
      type: 'audio',
      duration: '04:56',
      thumbnail: '🎵',
      views: 987,
      quality: 'HiFi'
    },
    { 
      id: 4, 
      title: 'Interview Exclusive',
      type: 'video',
      duration: '18:42',
      thumbnail: '🎙️',
      views: 4521,
      quality: '4K'
    },
  ]

  const categories = [
    { id: 'video', label: 'Vidéos', icon: Video, count: 247 },
    { id: 'audio', label: 'Audio', icon: Music, count: 342 },
    { id: 'live', label: 'Live', icon: Camera, count: 12 },
    { id: 'studio', label: 'Studio', icon: Film, count: 8 },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full min-h-screen bg-black">
      
      {/* === 3D ANIMATION SECTION === */}
      <div className="relative w-full h-[55vh]">
        <Canvas 
          camera={{ position: [0, 0, 35], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 40, 120]} />

          <ambientLight intensity={0.4} />
          <pointLight position={[15, 15, 15]} intensity={3} color="#f59e0b" />
          <pointLight position={[-15, -15, 15]} intensity={2} color="#fb923c" />
          <spotLight position={[0, 30, 0]} intensity={2.5} angle={0.5} penumbra={0.5} color="#fbbf24" />

          <Stars radius={250} depth={100} count={10000} factor={6} saturation={0} fade speed={0.5} />
          
          <AudioVisualizer />
          <FloatingMediaCards />
          <WaveformParticles />

          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
            <ChromaticAberration offset={[0.002, 0.002]} />
          </EffectComposer>

          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            autoRotate 
            autoRotateSpeed={0.4}
            maxDistance={60}
            minDistance={20}
            enablePan={false}
          />
        </Canvas>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </div>

      {/* === CONTENT SECTION === */}
      <div className="relative w-full bg-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 -mt-8"
          >
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-black/90 backdrop-blur-xl border-2 border-orange-500/50 shadow-[0_0_60px_rgba(245,158,11,0.4)]">
              <Film className="w-10 h-10 text-orange-400" />
              <div className="text-left">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                    AUDIOVISUEL
                  </span>
                </h1>
                <p className="text-orange-400 font-mono text-sm tracking-[0.3em] uppercase mt-1">
                  Media Production Studio
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Vidéos', value: mediaStats.videosProcessed, icon: Video, color: '#f59e0b' },
              { label: 'Audio Files', value: mediaStats.audioFiles, icon: Music, color: '#fb923c' },
              { label: 'Storage', value: mediaStats.storageUsed, icon: Eye, color: '#fbbf24' },
              { label: 'Live Sessions', value: mediaStats.activeSessions, icon: Camera, color: '#fcd34d' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
                <div className="relative p-6 rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-orange-800/50 group-hover:border-orange-500 transition-all">
                  <stat.icon className="w-6 h-6 mb-3" style={{ color: stat.color }} />
                  <p className="text-xs text-slate-500 font-mono mb-1">{stat.label}</p>
                  <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 mb-8 overflow-x-auto pb-2"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${
                  activeTab === cat.id
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_0_40px_rgba(245,158,11,0.5)] scale-105'
                    : 'bg-orange-950/30 text-orange-400 hover:bg-orange-900/50 border-2 border-orange-800/50'
                }`}
              >
                <cat.icon className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-black">{cat.label}</p>
                  <p className="text-xs opacity-70">{cat.count} items</p>
                </div>
              </button>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Media Player */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 bg-black/90 backdrop-blur-2xl border-2 border-orange-800/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.2)]"
            >
              {/* Video Display */}
              <div className="relative aspect-video bg-gradient-to-br from-orange-950 to-black flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] opacity-50" />
                <motion.div
                  animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                  className="relative z-10"
                >
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.6)] hover:scale-110 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause className="w-16 h-16 text-white" />
                    ) : (
                      <Play className="w-16 h-16 text-white ml-2" />
                    )}
                  </button>
                </motion.div>
                
                <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-orange-600/80 backdrop-blur-sm border border-orange-400 text-white text-xs font-bold">
                  4K ULTRA HD
                </div>

                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-orange-800">
                  <Eye className="w-4 h-4 text-orange-400" />
                  <span className="text-white text-xs font-bold">2.8K views</span>
                </div>
              </div>

              {/* Player Controls */}
              <div className="p-6">
                <h3 className="text-2xl font-black text-white mb-2">KBL Center Présentation 2025</h3>
                <p className="text-orange-400 text-sm mb-6">Studio Production • Published 2 days ago</p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="h-2 bg-orange-950/50 rounded-full overflow-hidden cursor-pointer group">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-orange-600 to-amber-600 rounded-full relative"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                      whileHover={{ height: '150%' }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-4 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)]"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-orange-950/50 text-orange-400 hover:bg-orange-900/50 border border-orange-800"
                    >
                      <SkipForward className="w-5 h-5" />
                    </motion.button>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-950/50 border border-orange-800">
                      <Volume2 className="w-5 h-5 text-orange-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-24 accent-orange-500"
                      />
                      <span className="text-xs text-orange-400 font-mono">{volume}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-orange-950/50 text-orange-400 hover:bg-orange-900/50 border border-orange-800"
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-orange-950/50 text-orange-400 hover:bg-orange-900/50 border border-orange-800"
                    >
                      <Download className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-full bg-orange-950/50 text-orange-400 hover:bg-orange-900/50 border border-orange-800"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Media Library */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/90 backdrop-blur-2xl border-2 border-orange-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.2)]"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-orange-800/50">
                <Headphones className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold text-white">Bibliothèque</h3>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {mediaLibrary.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    whileHover={{ scale: 1.03, x: 5 }}
                    className="p-4 rounded-xl bg-orange-950/30 border border-orange-800/50 hover:border-orange-500 cursor-pointer transition-all group"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                        {item.thumbnail}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm mb-1 truncate group-hover:text-orange-300 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-orange-500 mb-2">
                          <span className="font-mono">{item.duration}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded bg-orange-900/50 border border-orange-700 font-bold">
                            {item.quality}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Eye className="w-3 h-3" />
                          <span>{item.views.toLocaleString()} vues</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] transition-all"
              >
                Upload New Media
              </motion.button>
            </motion.div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(245, 158, 11, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.8); }
      `}</style>
    </div>
  )
}
