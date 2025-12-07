'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere, Text, Billboard, Torus } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Zap, MessageSquare, Image, Code, Mic, Eye, TrendingUp, Activity, Send, Copy, Download } from 'lucide-react'

// --- NEURAL NETWORK VISUALIZATION ---
function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null!)
  const [nodes] = useState(() => {
    const n = []
    for (let layer = 0; layer < 4; layer++) {
      for (let i = 0; i < 6; i++) {
        n.push({
          pos: new THREE.Vector3(
            (layer - 1.5) * 6,
            (i - 2.5) * 2,
            Math.random() * 4 - 2
          ),
          layer
        })
      }
    }
    return n
  })

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -15]}>
      {/* Nodes */}
      {nodes.map((node, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <Sphere args={[0.3, 16, 16]} position={node.pos}>
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={2 + Math.sin(i) * 0.5}
              roughness={0}
              metalness={1}
            />
          </Sphere>
        </Float>
      ))}

      {/* Connections */}
      {nodes.map((node, i) => {
        if (node.layer < 3) {
          const nextLayerNodes = nodes.filter(n => n.layer === node.layer + 1)
          return nextLayerNodes.map((target, j) => (
            <line key={`${i}-${j}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([...node.pos.toArray(), ...target.pos.toArray()]), 3]}
                  count={2}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#38bdf8" transparent opacity={0.2} />
            </line>
          ))
        }
        return null
      })}

      {/* Central Core */}
      <Sphere args={[2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={2}
          distort={0.4}
          speed={2}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.7}
        />
      </Sphere>

      <Billboard position={[0, 4, 0]}>
        <Text
          fontSize={0.7}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          fontWeight={900}
        >
          NEURAL CORTEX
        </Text>
      </Billboard>
    </group>
  )
}

// --- DATA STREAMS ---
function DataStreams() {
  const groupRef = useRef<THREE.Group>(null!)
  const streamsCount = 30
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y -= delta * (2 + i * 0.1)
        if (child.position.y < -30) child.position.y = 30
      })
    }
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: streamsCount }).map((_, i) => (
        <Torus
          key={i}
          args={[0.5, 0.1, 16, 32]}
          position={[
            (Math.random() - 0.5) * 30,
            Math.random() * 60 - 30,
            (Math.random() - 0.5) * 30
          ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </Torus>
      ))}
    </group>
  )
}

// --- MAIN COMPONENT ---
export default function IAPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'IA de KBL Center. Comment puis-je vous aider aujourd\'hui ?', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [stats, setStats] = useState({
    tokensUsed: 1247,
    responsesGenerated: 342,
    accuracy: 97.8,
    avgResponseTime: '1.2s'
  })

  const models = [
    { id: 'gpt-4', name: 'GPT-4 Turbo', speed: '95%', accuracy: '98%', icon: Brain },
    { id: 'claude', name: 'Claude 3.5', speed: '92%', accuracy: '97%', icon: Sparkles },
    { id: 'gemini', name: 'Gemini Pro', speed: '90%', accuracy: '95%', icon: Zap },
  ]

  const features = [
    { icon: MessageSquare, label: 'Chat', active: true, color: '#38bdf8' },
    { icon: Image, label: 'Vision', active: false, color: '#8b5cf6' },
    { icon: Code, label: 'Code', active: false, color: '#10b981' },
    { icon: Mic, label: 'Audio', active: false, color: '#f59e0b' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        tokensUsed: prev.tokensUsed + Math.floor(Math.random() * 10),
        responsesGenerated: prev.responsesGenerated + (Math.random() > 0.7 ? 1 : 0),
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage = { role: 'user', content: input, timestamp: new Date() }
    setMessages([...messages, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Je comprends votre question. Voici une analyse détaillée basée sur les dernières données disponibles...",
        "Excellente question ! Laissez-moi vous expliquer avec des exemples concrets...",
        "D'après mes calculs et l'analyse des données, voici ce que je peux vous recommander...",
        "Intéressant ! Voici plusieurs perspectives à considérer pour votre situation..."
      ]
      const aiMessage = {
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
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
          <pointLight position={[15, 15, 15]} intensity={3} color="#38bdf8" />
          <pointLight position={[-15, -15, 15]} intensity={2} color="#0ea5e9" />
          <spotLight position={[0, 30, 0]} intensity={2.5} angle={0.5} penumbra={0.5} color="#38bdf8" />

          <Stars radius={250} depth={100} count={12000} factor={7} saturation={0} fade speed={0.6} />
          
          <NeuralNetwork />
          <DataStreams />

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
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-black/90 backdrop-blur-xl border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(56,189,248,0.4)]">
              <Brain className="w-10 h-10 text-cyan-400" />
              <div className="text-left">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    INTELLIGENCE
                  </span>
                </h1>
                <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] uppercase mt-1">
                  Artificial Neural Center
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Tokens Used', value: stats.tokensUsed.toLocaleString(), icon: Activity, color: '#38bdf8' },
              { label: 'Responses', value: stats.responsesGenerated, icon: MessageSquare, color: '#0ea5e9' },
              { label: 'Accuracy', value: `${stats.accuracy}%`, icon: TrendingUp, color: '#06b6d4' },
              { label: 'Avg Time', value: stats.avgResponseTime, icon: Zap, color: '#0891b2' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
                <div className="relative p-6 rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-cyan-800/50 group-hover:border-cyan-500 transition-all">
                  <stat.icon className="w-6 h-6 mb-3" style={{ color: stat.color }} />
                  <p className="text-xs text-slate-500 font-mono mb-1">{stat.label}</p>
                  <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Model Selector */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 mb-8 overflow-x-auto pb-2"
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${
                  selectedModel === model.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_40px_rgba(56,189,248,0.5)] scale-105'
                    : 'bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/50 border-2 border-cyan-800/50'
                }`}
              >
                <model.icon className="w-6 h-6" />
                <div className="text-left">
                  <p className="text-sm font-black">{model.name}</p>
                  <p className="text-xs opacity-70">Speed: {model.speed} • Accuracy: {model.accuracy}</p>
                </div>
              </button>
            ))}
          </motion.div>

          {/* Main Chat Interface */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Chat Area */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 bg-black/90 backdrop-blur-2xl border-2 border-cyan-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(56,189,248,0.2)]"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-800/50">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Neural Conversation</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                  <span className="text-xs text-cyan-400 font-mono">ACTIVE</span>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[400px] overflow-y-auto mb-4 space-y-4 custom-scrollbar">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                          : 'bg-cyan-950/40 border-2 border-cyan-800/50 text-white'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {msg.role === 'assistant' && <Brain className="w-4 h-4 text-cyan-400" />}
                          <span className="text-xs font-mono opacity-70">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.role === 'assistant' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-cyan-800/30">
                            <button className="p-2 rounded-lg bg-cyan-900/30 hover:bg-cyan-800/50 transition-all">
                              <Copy className="w-4 h-4 text-cyan-400" />
                            </button>
                            <button className="p-2 rounded-lg bg-cyan-900/30 hover:bg-cyan-800/50 transition-all">
                              <Download className="w-4 h-4 text-cyan-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-cyan-950/40 border-2 border-cyan-800/50 p-4 rounded-2xl">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Posez votre question à l'IA..."
                  className="flex-1 px-6 py-4 rounded-xl bg-cyan-950/30 border-2 border-cyan-800/50 focus:border-cyan-500 text-white placeholder-cyan-700 outline-none transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:shadow-[0_0_50px_rgba(56,189,248,0.7)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Features Panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Capabilities */}
              <div className="bg-black/90 backdrop-blur-2xl border-2 border-cyan-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(56,189,248,0.2)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-800/50">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Capabilities</h3>
                </div>

                <div className="space-y-3">
                  {features.map((feature, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                        feature.active
                          ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-2 border-cyan-500'
                          : 'bg-cyan-950/20 border-2 border-cyan-800/30 hover:border-cyan-700'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${feature.active ? 'bg-cyan-500' : 'bg-cyan-900/50'}`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-bold">{feature.label}</p>
                        <p className="text-xs text-cyan-500">
                          {feature.active ? 'Active' : 'Coming Soon'}
                        </p>
                      </div>
                      {feature.active && (
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-black/90 backdrop-blur-2xl border-2 border-cyan-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(56,189,248,0.2)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan-800/50">
                  <Activity className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl font-bold text-white">Activity</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { action: 'Code Generation', time: '2 min ago', status: 'success' },
                    { action: 'Text Analysis', time: '5 min ago', status: 'success' },
                    { action: 'Image Processing', time: '8 min ago', status: 'pending' },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30">
                      <div>
                        <p className="text-white text-sm font-semibold">{activity.action}</p>
                        <p className="text-xs text-cyan-600">{activity.time}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        activity.status === 'success' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(56, 189, 248, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.8); }
      `}</style>
    </div>
  )
}
