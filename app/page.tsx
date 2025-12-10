'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import SephirotTree3D from '@/components/ui/sephirot/SephirotTree3D'
import { Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    setIsMounted(true)
    setIsLoaded(true)
  }, [])

  const letters = ['K', 'B', 'L', '|', 'M', 'V', 'P']

  return (
    <main className="relative w-full h-full overflow-hidden bg-black">
      
      {/* ULTRA ADVANCED BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ 
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
            top: '20%', 
            left: '20%' 
          }}
          animate={{ 
            x: ['-10%', '10%', '-10%'],
            y: ['-10%', '10%', '-10%'],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute w-[700px] h-[700px] rounded-full blur-[150px]"
          style={{ 
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            bottom: '20%', 
            right: '20%' 
          }}
          animate={{ 
            x: ['10%', '-10%', '10%'],
            y: ['10%', '-10%', '10%'],
            scale: [1.2, 1, 1.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ 
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)' 
          }}
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* 3D SEPHIROT TREE */}
      <div className="absolute inset-0 z-0">
        <SephirotTree3D />
      </div>

      {/* ULTRA ADVANCED GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
        
        {/* Scanning lines */}
        <motion.div
          className="absolute w-full h-[3px]"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent)',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.9)'
          }}
          animate={{ y: ['0vh', '100vh'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-full h-[2px]"
          style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)'
          }}
          animate={{ y: ['100vh', '0vh'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', delay: 2 }}
        />
        <motion.div
          className="absolute h-full w-[2px]"
          style={{ 
            background: 'linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.6), transparent)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)'
          }}
          animate={{ x: ['0vw', '100vw'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 1 }}
        />
      </div>

      {/* PREMIUM FLOATING PARTICLES */}
      {isMounted && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => {
            const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            const size = Math.random() * 4 + 1
            const startX = Math.random() * 100
            const startY = Math.random() * 100
            const endX = Math.random() * 100
            const endY = Math.random() * 100
            
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  left: `${startX}%`,
                  top: `${startY}%`,
                  background: `linear-gradient(135deg, ${randomColor}, transparent)`,
                  boxShadow: `0 0 ${Math.random() * 20 + 10}px ${randomColor}cc`
                }}
                animate={{ 
                  left: [`${startX}%`, `${endX}%`],
                  top: [`${startY}%`, `${endY}%`],
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1, 1.5, 0]
                }}
                transition={{ 
                  duration: Math.random() * 8 + 5, 
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeInOut'
                }}
              />
            )
          })}
        </div>
      )}

      {/* ========================================= */}
      {/* LOGO 3D "KBL MVP" - NOIR & OR PREMIUM    */}
      {/* ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ opacity }}
        className="absolute top-6 right-6 z-30 pointer-events-auto"
      >
        <div className="relative group" style={{ perspective: '1200px' }}>
          {/* Gold ambient glow */}
          <motion.div
            className="absolute -inset-6 rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, transparent 70%)',
              filter: 'blur(25px)'
            }}
            animate={{ 
              opacity: [0.4, 0.7, 0.4],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Main 3D container */}
          <motion.div
            className="relative"
            animate={{
              rotateY: [0, 3, -3, 0],
              rotateX: [0, -2, 2, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            whileHover={{ 
              scale: 1.05,
              rotateY: 8
            }}
            style={{ 
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center'
            }}
          >
            {/* Dark glass background */}
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(145deg, rgba(0,0,0,0.95), rgba(10,10,10,0.98))',
                backdropFilter: 'blur(20px)',
                boxShadow: `
                  0 0 40px rgba(255,215,0,0.15),
                  inset 0 1px 0 rgba(255,215,0,0.1),
                  inset 0 -1px 0 rgba(0,0,0,0.5),
                  0 20px 40px rgba(0,0,0,0.8)
                `,
                border: '1px solid rgba(255,215,0,0.2)'
              }}
            />

            {/* Gold animated border */}
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700, #B8860B, #FFD700)',
                backgroundSize: '400% 100%',
                padding: '1.5px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude'
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            {/* Content container */}
            <div className="relative px-5 py-3">
              <div className="flex items-center">
                {letters.map((letter, i) => (
                  letter === '|' ? (
                    <motion.div
                      key={i}
                      className="mx-3 h-10 w-[2px] rounded-full"
                      style={{
                        background: 'linear-gradient(180deg, transparent, #FFD700, transparent)',
                        boxShadow: '0 0 10px rgba(255,215,0,0.6)'
                      }}
                      animate={{
                        opacity: [0.4, 1, 0.4],
                        scaleY: [0.85, 1, 0.85]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  ) : (
                    <motion.span
                      key={i}
                      className="font-black select-none relative"
                      style={{
                        fontSize: '3rem',
                        fontFamily: "'Bebas Neue', 'Oswald', 'Impact', sans-serif",
                        fontWeight: 900,
                        letterSpacing: '0.02em',
                        background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 30%, #B8860B 60%, #8B6914 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: `
                          drop-shadow(0 2px 0 rgba(139,105,20,0.9))
                          drop-shadow(0 4px 0 rgba(100,75,15,0.8))
                          drop-shadow(0 6px 15px rgba(0,0,0,0.9))
                        `,
                        transform: 'translateZ(20px)'
                      }}
                      initial={{ opacity: 0, y: -20, rotateX: -90 }}
                      animate={{ 
                        opacity: 1, 
                        y: [0, -3, 0],
                        rotateX: 0
                      }}
                      transition={{ 
                        opacity: { duration: 0.5, delay: i * 0.1 },
                        y: { duration: 2.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' },
                        rotateX: { duration: 0.8, delay: i * 0.1 }
                      }}
                      whileHover={{
                        scale: 1.15,
                        y: -5,
                        transition: { duration: 0.2 }
                      }}
                    >
                      {letter}
                      {/* Shine effect on each letter */}
                      <motion.span
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                          backgroundSize: '200% 100%',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                        animate={{
                          backgroundPosition: ['200% 0%', '-200% 0%']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.2 + 1,
                          ease: 'easeInOut'
                        }}
                      >
                        {letter}
                      </motion.span>
                    </motion.span>
                  )
                ))}
              </div>
            </div>

            {/* 3D depth layer */}
            <div 
              className="absolute inset-0 rounded-xl opacity-40" 
              style={{ 
                transform: 'translateZ(-15px)',
                background: 'linear-gradient(145deg, #0a0a0a, #000000)',
                border: '1px solid rgba(255,215,0,0.05)'
              }} 
            />
          </motion.div>

          {/* Floating gold particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: '#FFD700',
                boxShadow: '0 0 8px rgba(255,215,0,0.8)',
                left: `${15 + i * 18}%`,
                top: `${-15 + (i % 2) * 130}%`
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.9, 0.3],
                scale: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2.5 + i * 0.4,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* ENTRANCE ANIMATION */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute inset-0 z-50 bg-gradient-to-br from-black via-blue-950 to-black flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <Sparkles className="w-20 h-20 text-blue-500" style={{ filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.8))' }} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}