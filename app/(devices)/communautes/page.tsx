'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere, Text, Billboard, Line } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, MessageCircle, Heart, Share2, TrendingUp, UserPlus, Bell, Hash, Send, Smile, Image as ImageIcon, Video, MapPin, Bookmark, MoreHorizontal } from 'lucide-react'

// --- NETWORK NODES 3D ---
function NetworkNodes() {
  const groupRef = useRef<THREE.Group>(null!)
  const nodesCount = 50
  
  const nodesRef = useRef(
    Array.from({ length: nodesCount }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      ),
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2
    }))
  )

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
      
      groupRef.current.children.forEach((node, i) => {
        if (i < nodesRef.current.length) {
          const data = nodesRef.current[i]
          node.position.y += Math.sin(state.clock.elapsedTime * data.speed + data.phase) * 0.01
        }
      })
    }
  })

  // Create connections between nearby nodes
  const connections = []
  for (let i = 0; i < nodesRef.current.length; i++) {
    for (let j = i + 1; j < nodesRef.current.length; j++) {
      if (nodesRef.current[i].pos.distanceTo(nodesRef.current[j].pos) < 15) {
        connections.push([nodesRef.current[i].pos, nodesRef.current[j].pos])
      }
    }
  }

  return (
    <group ref={groupRef} position={[0, 0, -15]}>
      {/* Nodes */}
      {nodesRef.current.map((node, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
          <Sphere args={[0.4, 16, 16]} position={node.pos}>
            <meshStandardMaterial
              color="#9333ea"
              emissive="#9333ea"
              emissiveIntensity={2 + Math.sin(i) * 0.5}
              roughness={0}
              metalness={1}
            />
          </Sphere>
        </Float>
      ))}

      {/* Connections */}
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={conn}
          color="#9333ea"
          lineWidth={1}
          transparent
          opacity={0.2}
        />
      ))}

      {/* Central Hub */}
      <Sphere args={[3, 64, 64]}>
        <MeshDistortMaterial
          color="#9333ea"
          emissive="#a855f7"
          emissiveIntensity={2}
          distort={0.4}
          speed={2.5}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.8}
        />
      </Sphere>

      <Billboard position={[0, 5, 0]}>
        <Text
          fontSize={0.8}
          color="#d8b4fe"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          fontWeight={900}
        >
          SOCIAL NEXUS
        </Text>
      </Billboard>
    </group>
  )
}

// --- FLOATING AVATARS ---
function FloatingAvatars() {
  const groupRef = useRef<THREE.Group>(null!)
  const avatars = [
    { pos: [-15, 8, -12], color: '#9333ea' },
    { pos: [15, 6, -14], color: '#a855f7' },
    { pos: [-12, -6, -10], color: '#c084fc' },
    { pos: [12, -8, -16], color: '#d8b4fe' },
    { pos: [0, 10, -18], color: '#e9d5ff' },
  ]

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((avatar, i) => {
        avatar.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.01
        avatar.rotation.y += 0.01
      })
    }
  })

  return (
    <group ref={groupRef}>
      {avatars.map((avatar, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Sphere args={[1.2, 32, 32]} position={avatar.pos as [number, number, number]}>
            <meshStandardMaterial
              color={avatar.color}
              emissive={avatar.color}
              emissiveIntensity={1.5}
              roughness={0.3}
              metalness={0.7}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  )
}

// --- PARTICLE CONNECTIONS ---
function ConnectionParticles() {
  const pointsRef = useRef<THREE.Points>(null!)
  const count = 1500
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return pos
  })

  const [colors] = useState(() => {
    const cols = new Float32Array(count * 3)
    const purple = new THREE.Color('#9333ea')
    for (let i = 0; i < count; i++) {
      const brightness = 0.5 + Math.random() * 0.5
      cols[i * 3] = purple.r * brightness
      cols[i * 3 + 1] = purple.g * brightness
      cols[i * 3 + 2] = purple.b * brightness
    }
    return cols
  })

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// --- MAIN COMPONENT ---
export default function CommunautesPage() {
  const [activeTab, setActiveTab] = useState('feed')
  const [postInput, setPostInput] = useState('')
  const [stats, setStats] = useState({
    totalMembers: 8547,
    activeNow: 342,
    postsToday: 156,
    engagementRate: 87.3
  })

  const posts = [
    {
      id: 1,
      author: 'Marie Dubois',
      avatar: '👩‍💼',
      time: '5 min',
      content: 'Super présentation du nouveau projet KBL ! Hâte de voir la suite 🚀',
      likes: 42,
      comments: 8,
      shares: 3,
      trending: true
    },
    {
      id: 2,
      author: 'Thomas Martin',
      avatar: '👨‍💻',
      time: '12 min',
      content: 'Qui participe à l\'événement communautaire demain ? On fait un point technique sur les dernières avancées.',
      likes: 28,
      comments: 15,
      shares: 5,
      trending: false
    },
    {
      id: 3,
      author: 'Sophie Laurent',
      avatar: '👩‍🎨',
      time: '1h',
      content: 'Nouveau design concept pour la plateforme ! Qu\'en pensez-vous ? #Design #UX',
      likes: 67,
      comments: 23,
      shares: 12,
      trending: true
    },
  ]

  const trendingTopics = [
    { tag: 'KBLCenter', posts: 2847 },
    { tag: 'Innovation', posts: 1523 },
    { tag: 'Community', posts: 987 },
    { tag: 'TechNews', posts: 654 },
  ]

  const onlineUsers = [
    { name: 'Alex', status: 'online', avatar: '👨‍💼' },
    { name: 'Emma', status: 'online', avatar: '👩‍💻' },
    { name: 'Lucas', status: 'away', avatar: '👨‍🎓' },
    { name: 'Chloé', status: 'online', avatar: '👩‍🔬' },
    { name: 'Hugo', status: 'online', avatar: '👨‍🎨' },
  ]

  const tabs = [
    { id: 'feed', label: 'Feed', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'events', label: 'Events', icon: Bell },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeNow: Math.max(100, prev.activeNow + Math.floor((Math.random() - 0.5) * 20)),
        postsToday: prev.postsToday + (Math.random() > 0.7 ? 1 : 0),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full min-h-screen bg-black">
      
      {/* === 3D ANIMATION SECTION === */}
      <div className="relative w-full h-[55vh]">
        <Canvas 
          camera={{ position: [0, 0, 40], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 45, 120]} />

          <ambientLight intensity={0.4} />
          <pointLight position={[15, 15, 15]} intensity={3} color="#9333ea" />
          <pointLight position={[-15, -15, 15]} intensity={2} color="#a855f7" />
          <spotLight position={[0, 30, 0]} intensity={2.5} angle={0.5} penumbra={0.5} color="#c084fc" />

          <Stars radius={250} depth={100} count={10000} factor={6} saturation={0} fade speed={0.5} />
          
          <NetworkNodes />
          <FloatingAvatars />
          <ConnectionParticles />

          <EffectComposer>
            <Bloom intensity={1.3} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
          </EffectComposer>

          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            autoRotate 
            autoRotateSpeed={0.3}
            maxDistance={70}
            minDistance={25}
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
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-3xl bg-black/90 backdrop-blur-xl border-2 border-purple-500/50 shadow-[0_0_60px_rgba(147,51,234,0.4)]">
              <Users className="w-10 h-10 text-purple-400" />
              <div className="text-left">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                    COMMUNAUTÉS
                  </span>
                </h1>
                <p className="text-purple-400 font-mono text-sm tracking-[0.3em] uppercase mt-1">
                  Social Network Hub
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
              { label: 'Total Members', value: stats.totalMembers.toLocaleString(), icon: Users, color: '#9333ea' },
              { label: 'Active Now', value: stats.activeNow, icon: UserPlus, color: '#a855f7' },
              { label: 'Posts Today', value: stats.postsToday, icon: MessageCircle, color: '#c084fc' },
              { label: 'Engagement', value: `${stats.engagementRate}%`, icon: Heart, color: '#d8b4fe' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
                <div className="relative p-6 rounded-2xl bg-black/90 backdrop-blur-xl border-2 border-purple-800/50 group-hover:border-purple-500 transition-all">
                  <stat.icon className="w-6 h-6 mb-3" style={{ color: stat.color }} />
                  <p className="text-xs text-slate-500 font-mono mb-1">{stat.label}</p>
                  <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 mb-8 overflow-x-auto pb-2"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-[0_0_40px_rgba(147,51,234,0.5)] scale-105'
                    : 'bg-purple-950/30 text-purple-400 hover:bg-purple-900/50 border-2 border-purple-800/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            
            {/* Left Sidebar - Trending */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/90 backdrop-blur-2xl border-2 border-purple-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(147,51,234,0.2)]"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-800/50">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Trending</h3>
              </div>

              <div className="space-y-3">
                {trendingTopics.map((topic, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.05, x: 5 }}
                    className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/50 hover:border-purple-500 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-bold text-sm">{topic.tag}</span>
                    </div>
                    <p className="text-xs text-purple-500">{topic.posts.toLocaleString()} posts</p>
                  </motion.div>
                ))}
              </div>

              {/* Online Users */}
              <div className="mt-8 pt-6 border-t border-purple-800/50">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Online ({onlineUsers.filter(u => u.status === 'online').length})
                </h4>
                <div className="space-y-2">
                  {onlineUsers.map((user, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-950/30 cursor-pointer transition-all"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-xl">
                          {user.avatar}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
                          user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                      <span className="text-white text-sm font-semibold">{user.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Center - Feed */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 space-y-6"
            >
              {/* Create Post */}
              <div className="bg-black/90 backdrop-blur-2xl border-2 border-purple-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(147,51,234,0.2)]">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-2xl flex-shrink-0">
                    👤
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={postInput}
                      onChange={(e) => setPostInput(e.target.value)}
                      placeholder="Partagez vos idées avec la communauté..."
                      className="w-full px-4 py-3 rounded-xl bg-purple-950/30 border-2 border-purple-800/50 focus:border-purple-500 text-white placeholder-purple-700 outline-none resize-none h-24 transition-all"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-purple-950/50 text-purple-400 hover:bg-purple-900/50 border border-purple-800"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-purple-950/50 text-purple-400 hover:bg-purple-900/50 border border-purple-800"
                        >
                          <Video className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-purple-950/50 text-purple-400 hover:bg-purple-900/50 border border-purple-800"
                        >
                          <Smile className="w-5 h-5" />
                        </motion.button>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!postInput.trim()}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Post
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts Feed */}
              <AnimatePresence>
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-black/90 backdrop-blur-2xl border-2 border-purple-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(147,51,234,0.2)] hover:border-purple-500 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-2xl flex-shrink-0">
                        {post.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-white font-bold">{post.author}</h4>
                            <p className="text-xs text-purple-500">{post.time} ago</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {post.trending && (
                              <span className="px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500 text-purple-400 text-xs font-bold flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Trending
                              </span>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-lg hover:bg-purple-950/50 transition-colors"
                            >
                              <MoreHorizontal className="w-5 h-5 text-purple-400" />
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-white leading-relaxed mb-4">{post.content}</p>
                        
                        <div className="flex items-center gap-6">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <Heart className="w-5 h-5" />
                            <span className="font-semibold">{post.likes}</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-semibold">{post.comments}</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <Share2 className="w-5 h-5" />
                            <span className="font-semibold">{post.shares}</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="ml-auto text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <Bookmark className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Right Sidebar - Suggestions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/90 backdrop-blur-2xl border-2 border-purple-800/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(147,51,234,0.2)]"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-800/50">
                <UserPlus className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Suggestions</h3>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Jean Dupont', role: 'Developer', mutual: 12 },
                  { name: 'Clara Bernard', role: 'Designer', mutual: 8 },
                  { name: 'Marc Petit', role: 'Product Manager', mutual: 15 },
                ].map((user, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 hover:border-purple-500 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-2xl flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{user.name}</h4>
                        <p className="text-xs text-purple-500">{user.role}</p>
                        <p className="text-xs text-slate-600 mt-1">{user.mutual} mutual friends</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all"
                    >
                      Follow
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              {/* Events */}
              <div className="mt-8 pt-6 border-t border-purple-800/50">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  Upcoming Events
                </h4>
                <div className="space-y-3">
                  {[
                    { title: 'Community Meetup', date: 'Tomorrow, 6 PM', attendees: 42 },
                    { title: 'Tech Workshop', date: 'Dec 15, 2 PM', attendees: 28 },
                  ].map((event, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 5 }}
                      className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/50 hover:border-purple-500 cursor-pointer transition-all"
                    >
                      <h5 className="text-white font-semibold text-sm mb-1">{event.title}</h5>
                      <div className="flex items-center justify-between text-xs text-purple-500">
                        <span>{event.date}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.attendees}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(147, 51, 234, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(147, 51, 234, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(147, 51, 234, 0.8); }
      `}</style>
    </div>
  )
}
