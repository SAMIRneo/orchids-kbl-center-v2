'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere, Text, Billboard, Line } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, TrendingUp, Users, Globe, Vote, AlertTriangle, Shield, BarChart3, PieChart, Target, FileText, Briefcase, Award, MapPin } from 'lucide-react'

// --- GEOPOLITICAL GLOBE ---
function GeopoliticalGlobe() {
  const globeRef = useRef<THREE.Group>(null!)
  const markersRef = useRef(
    Array.from({ length: 30 }, () => ({
      lat: (Math.random() - 0.5) * Math.PI,
      lon: Math.random() * Math.PI * 2,
      type: Math.random() > 0.5 ? 'crisis' : 'diplomatic'
    }))
  )

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002
      globeRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  // Convert lat/lon to 3D coordinates
  const getPosition = (lat: number, lon: number, radius: number) => {
    return new THREE.Vector3(
      radius * Math.cos(lat) * Math.cos(lon),
      radius * Math.sin(lat),
      radius * Math.cos(lat) * Math.sin(lon)
    )
  }

  return (
    <group ref={globeRef} position={[0, 0, -10]}>
      {/* Main Globe */}
      <Sphere args={[5, 64, 64]}>
        <MeshDistortMaterial
          color="#64748b"
          emissive="#475569"
          emissiveIntensity={1.2}
          distort={0.2}
          speed={1.5}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Wireframe */}
      <Sphere args={[5.05, 32, 32]}>
        <meshStandardMaterial
          color="#94a3b8"
          emissive="#cbd5e1"
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.4}
        />
      </Sphere>

      {/* Crisis/Diplomatic Markers */}
      {markersRef.current.map((marker, i) => {
        const pos = getPosition(marker.lat, marker.lon, 5.3)
        return (
          <Float key={i} speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <Sphere args={[0.15, 16, 16]} position={pos}>
              <meshStandardMaterial
                color={marker.type === 'crisis' ? '#ef4444' : '#3b82f6'}
                emissive={marker.type === 'crisis' ? '#ef4444' : '#3b82f6'}
                emissiveIntensity={3}
              />
            </Sphere>
          </Float>
        )
      })}

      {/* Orbital Rings */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 4, 0, Math.PI / 3 * i]}>
          <torusGeometry args={[6 + i * 0.4, 0.04, 16, 64]} />
          <meshStandardMaterial
            color="#94a3b8"
            emissive="#cbd5e1"
            emissiveIntensity={1.2}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      <Billboard position={[0, 7, 0]}>
        <Text
          fontSize={0.7}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          fontWeight={900}
        >
          GLOBAL NEXUS
        </Text>
      </Billboard>
    </group>
  )
}

// --- DATA FLOW LINES ---
function DataFlowLines() {
  const groupRef = useRef<THREE.Group>(null!)
  const linesRef = useRef(
    Array.from({ length: 15 }, () => ({
      start: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        -15 + Math.random() * 10
      ),
      end: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        -15 + Math.random() * 10
      ),
      speed: 0.5 + Math.random() * 1
    }))
  )

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      {linesRef.current.map((line, i) => (
        <Line
          key={i}
          points={[line.start, line.end]}
          color={i % 2 === 0 ? '#ef4444' : '#3b82f6'}
          lineWidth={2}
          transparent
          opacity={0.3}
        />
      ))}
    </group>
  )
}

// --- FLOATING PANELS ---
function FloatingPanels() {
  const groupRef = useRef<THREE.Group>(null!)
  const panels = [
    { pos: [-15, 8, -12], color: '#64748b' },
    { pos: [15, 6, -14], color: '#94a3b8' },
    { pos: [-12, -6, -10], color: '#cbd5e1' },
    { pos: [12, -8, -16], color: '#475569' },
  ]

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((panel, i) => {
        panel.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.01
        panel.rotation.y += 0.008
      })
    }
  })

  return (
    <group ref={groupRef}>
      {panels.map((panel, i) => (
        <Float key={i} speed={2} rotationIntensity={0.4} floatIntensity={1}>
          <mesh position={panel.pos as [number, number, number]}>
            <boxGeometry args={[2.5, 1.8, 0.1]} />
            <meshStandardMaterial
              color={panel.color}
              emissive={panel.color}
              emissiveIntensity={1.2}
              roughness={0.3}
              metalness={0.7}
              transparent
              opacity={0.8}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// --- MAIN COMPONENT ---
export default function PolitiquePage() {
  const [selectedRegion, setSelectedRegion] = useState('global')
  const [selectedView, setSelectedView] = useState('overview')
  const [liveData, setLiveData] = useState({
    globalStability: 68,
    activeCrises: 12,
    peaceTalks: 8,
    economicIndex: 72,
    popularSupport: 61,
    diplomaticRelations: 85
  })

  const regions = [
    { id: 'global', name: 'Global', icon: Globe },
    { id: 'europe', name: 'Europe', icon: MapPin },
    { id: 'asia', name: 'Asia', icon: MapPin },
    { id: 'americas', name: 'Americas', icon: MapPin },
  ]

  const views = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'crises', label: 'Crises', icon: AlertTriangle },
    { id: 'diplomacy', label: 'Diplomacy', icon: Users },
    { id: 'economy', label: 'Economy', icon: TrendingUp },
  ]

  const crises = [
    { 
      region: 'Middle East',
      country: 'Multiple',
      severity: 'HIGH',
      status: 'Escalating',
      color: '#ef4444',
      affected: '2.4M',
      duration: '156 days'
    },
    { 
      region: 'Eastern Europe',
      country: 'Ukraine',
      severity: 'CRITICAL',
      status: 'Active Conflict',
      color: '#dc2626',
      affected: '8.1M',
      duration: '1043 days'
    },
    { 
      region: 'South Asia',
      country: 'Kashmir',
      severity: 'MEDIUM',
      status: 'Diplomatic Tension',
      color: '#f59e0b',
      affected: '650K',
      duration: '89 days'
    },
    { 
      region: 'East Africa',
      country: 'Sudan',
      severity: 'HIGH',
      status: 'Humanitarian Crisis',
      color: '#ef4444',
      affected: '5.2M',
      duration: '234 days'
    },
  ]

  const recentNews = [
    { 
      title: 'G20 Summit announces breakthrough climate agreement',
      time: '2h ago',
      sentiment: 'positive',
      category: 'Diplomacy',
      source: 'Reuters'
    },
    { 
      title: 'Border tensions escalate in contested region',
      time: '5h ago',
      sentiment: 'negative',
      category: 'Security',
      source: 'AFP'
    },
    { 
      title: 'Economic sanctions lifted on three nations',
      time: '8h ago',
      sentiment: 'positive',
      category: 'Economy',
      source: 'Bloomberg'
    },
    { 
      title: 'UN Security Council schedules emergency session',
      time: '12h ago',
      sentiment: 'neutral',
      category: 'International',
      source: 'BBC'
    },
  ]

  const keyIndicators = [
    { label: 'Democracy Index', value: 6.8, max: 10, trend: '+0.3' },
    { label: 'Peace Index', value: 2.3, max: 5, trend: '-0.1' },
    { label: 'Press Freedom', value: 72, max: 100, trend: '+2' },
    { label: 'Corruption Index', value: 43, max: 100, trend: '-1' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => ({
        ...prev,
        globalStability: Math.min(100, Math.max(40, prev.globalStability + (Math.random() - 0.5) * 5)),
        economicIndex: Math.min(100, Math.max(40, prev.economicIndex + (Math.random() - 0.5) * 8)),
        popularSupport: Math.min(100, Math.max(30, prev.popularSupport + (Math.random() - 0.5) * 6))
      }))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full min-h-screen bg-black">
      
      {/* === 3D ANIMATION SECTION === */}
      <div className="relative w-full h-[55vh]">
        <Canvas 
          camera={{ position: [0, 0, 30], fov: 65 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 35, 100]} />

          <ambientLight intensity={0.5} />
          <pointLight position={[15, 15, 15]} intensity={3} color="#94a3b8" />
          <pointLight position={[-15, -15, 15]} intensity={2} color="#64748b" />
          <spotLight position={[0, 25, 0]} intensity={2.5} angle={0.5} penumbra={0.6} color="#cbd5e1" />

          <Stars radius={200} depth={80} count={8000} factor={5} saturation={0} fade speed={0.4} />
          
          <GeopoliticalGlobe />
          <DataFlowLines />
          <FloatingPanels />

          <EffectComposer>
            <Bloom intensity={1.2} luminanceThreshold={0.3} luminanceSmoothing={0.9} mipmapBlur />
            <Vignette offset={0.3} darkness={0.5} />
          </EffectComposer>

          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            autoRotate 
            autoRotateSpeed={0.3}
            maxDistance={50}
            minDistance={15}
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
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-black/90 backdrop-blur-xl border-2 border-slate-500/50 shadow-[0_0_60px_rgba(148,163,184,0.3)]">
              <Scale className="w-10 h-10 text-slate-400" />
              <div className="text-left">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 bg-clip-text text-transparent">
                    POLITIQUE
                  </span>
                </h1>
                <p className="text-slate-400 font-mono text-sm tracking-[0.3em] uppercase mt-1">
                  Global Intelligence Center
                </p>
              </div>
            </div>
          </motion.div>

          {/* Live Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            {[
              { label: 'Global Stability', value: liveData.globalStability, icon: Shield, color: '#10b981' },
              { label: 'Active Crises', value: liveData.activeCrises, icon: AlertTriangle, color: '#ef4444' },
              { label: 'Peace Talks', value: liveData.peaceTalks, icon: Users, color: '#3b82f6' },
              { label: 'Economic Index', value: liveData.economicIndex, icon: TrendingUp, color: '#8b5cf6' },
              { label: 'Popular Support', value: liveData.popularSupport, icon: Vote, color: '#06b6d4' },
              { label: 'Diplomatic Relations', value: liveData.diplomaticRelations, icon: Globe, color: '#f59e0b' },
            ].map((metric, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
                <div className="relative p-5 rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-slate-700/50 group-hover:border-slate-500 transition-all">
                  <metric.icon className="w-6 h-6 mb-3" style={{ color: metric.color }} />
                  <p className="text-xs text-slate-500 font-mono mb-1">{metric.label}</p>
                  <p className="text-3xl font-black" style={{ color: metric.color }}>
                    {typeof metric.value === 'number' && metric.value > 20 ? `${metric.value}%` : metric.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Region Selector */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 mb-8 overflow-x-auto pb-2"
          >
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedRegion === region.id
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-[0_0_30px_rgba(148,163,184,0.5)] scale-105'
                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/70 border border-slate-700'
                }`}
              >
                <region.icon className="w-5 h-5" />
                {region.name}
              </button>
            ))}
          </motion.div>

          {/* View Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex gap-2 mb-8 overflow-x-auto pb-2"
          >
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedView === view.id
                    ? 'bg-slate-700 text-white border-2 border-slate-500'
                    : 'bg-slate-900/30 text-slate-500 hover:bg-slate-800/50 border border-slate-800'
                }`}
              >
                <view.icon className="w-4 h-4" />
                {view.label}
              </button>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Left - Crisis Monitor */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 bg-black/90 backdrop-blur-2xl border-2 border-slate-700/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(148,163,184,0.2)]"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-white">Active Crisis Monitoring</h3>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400 font-mono">LIVE</span>
                </div>
              </div>

              <div className="space-y-4">
                {crises.map((crisis, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="p-5 rounded-2xl bg-slate-900/50 border-2 border-slate-700/50 hover:border-slate-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">{crisis.region}</h4>
                        <p className="text-slate-400 text-sm mb-2">{crisis.country} • {crisis.status}</p>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>👥 {crisis.affected} affected</span>
                          <span>⏱️ {crisis.duration}</span>
                        </div>
                      </div>
                      <span 
                        className="px-4 py-2 rounded-xl text-xs font-black shadow-lg"
                        style={{ 
                          backgroundColor: `${crisis.color}20`,
                          color: crisis.color,
                          border: `2px solid ${crisis.color}`
                        }}
                      >
                        {crisis.severity}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: crisis.severity === 'CRITICAL' ? '95%' : crisis.severity === 'HIGH' ? '75%' : '50%',
                          backgroundColor: crisis.color
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Key Indicators */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <h4 className="text-white font-bold mb-4">Key Global Indicators</h4>
                <div className="grid grid-cols-2 gap-4">
                  {keyIndicators.map((indicator, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/30 border border-slate-700/30">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-slate-500">{indicator.label}</p>
                        <span className={`text-xs font-bold ${indicator.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                          {indicator.trend}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-white mb-2">{indicator.value}/{indicator.max}</p>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full"
                          style={{ width: `${(indicator.value / indicator.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right - News & Analysis */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* News Feed */}
              <div className="bg-black/90 backdrop-blur-2xl border-2 border-slate-700/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(148,163,184,0.2)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
                  <FileText className="w-6 h-6 text-slate-400" />
                  <h3 className="text-xl font-bold text-white">Live News</h3>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {recentNews.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      whileHover={{ scale: 1.03, x: 5 }}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-slate-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          item.sentiment === 'positive' ? 'bg-green-500' :
                          item.sentiment === 'negative' ? 'bg-red-500' :
                          'bg-slate-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold mb-2 group-hover:text-slate-300 transition-colors leading-snug">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                              {item.category}
                            </span>
                            <span>•</span>
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-black/90 backdrop-blur-2xl border-2 border-slate-700/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(148,163,184,0.2)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
                  <Briefcase className="w-6 h-6 text-slate-400" />
                  <h3 className="text-xl font-bold text-white">Quick Access</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Target, label: 'Strategic Analysis', color: '#3b82f6' },
                    { icon: PieChart, label: 'Reports', color: '#8b5cf6' },
                    { icon: Shield, label: 'Security', color: '#10b981' },
                    { icon: Award, label: 'Treaties', color: '#f59e0b' },
                  ].map((action, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-slate-500 transition-all text-center group"
                    >
                      <action.icon className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ color: action.color }} />
                      <p className="text-white text-xs font-bold">{action.label}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(148, 163, 184, 0.1); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.5); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.8); }
      `}</style>
    </div>
  )
}
