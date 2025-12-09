// @ts-nocheck
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// VOLUMETRIC NEBULA SHADER (RAYMARCHING AAA+)
// ============================================================================

const VolumetricNebulaMaterial = shaderMaterial(
  {
    time: 0,
    resolution: new THREE.Vector2(1024, 1024),
    cameraPos: new THREE.Vector3(),
    color1: new THREE.Color('#ff006e'),
    color2: new THREE.Color('#8338ec'),
    color3: new THREE.Color('#3a86ff'),
    color4: new THREE.Color('#06ffa5'),
    density: 0.15,
    brightness: 1.2,
  },
  /* VERTEX SHADER */
  `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* FRAGMENT SHADER - RAYMARCHING VOLUMÉTRIQUE */
  `
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 cameraPos;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 color4;
    uniform float density;
    uniform float brightness;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    // Hash pour noise procédural optimisé
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
    // Noise 3D fractal (FBM)
    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      
      return mix(
        mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
        f.z
      );
    }
    
    // FBM (Fractional Brownian Motion) 4 octaves
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for(int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    // Domain warping pour effet organique
    vec3 domainWarp(vec3 p, float t) {
      vec3 q = vec3(
        fbm(p + vec3(0.0, 0.0, t * 0.05)),
        fbm(p + vec3(5.2, 1.3, t * 0.05)),
        fbm(p + vec3(1.7, 9.2, t * 0.05))
      );
      
      vec3 r = vec3(
        fbm(p + 4.0 * q + vec3(1.7, 9.2, t * 0.08)),
        fbm(p + 4.0 * q + vec3(8.3, 2.8, t * 0.08)),
        fbm(p + 4.0 * q + vec3(3.1, 7.4, t * 0.08))
      );
      
      return p + 0.5 * r;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Ray direction
      vec3 rayDir = normalize(vWorldPosition - cameraPos);
      vec3 rayOrigin = vWorldPosition;
      
      // Raymarching parameters
      float maxDist = 80.0;
      float stepSize = 0.8;
      int steps = 64;
      
      vec3 pos = rayOrigin;
      vec4 accumColor = vec4(0.0);
      
      for(int i = 0; i < steps; i++) {
        if(accumColor.a >= 0.99) break;
        
        // Domain warped position
        vec3 warpedPos = domainWarp(pos * 0.02, time);
        
        // Density sampling avec rotation spirale
        float angle = length(pos.xy) * 0.05 + time * 0.02;
        vec3 rotatedPos = vec3(
          cos(angle) * warpedPos.x - sin(angle) * warpedPos.y,
          sin(angle) * warpedPos.x + cos(angle) * warpedPos.y,
          warpedPos.z
        );
        
        float densitySample = fbm(rotatedPos * 2.0 + time * 0.03);
        densitySample = smoothstep(0.3, 0.8, densitySample);
        
        // Color blending basé sur la densité et position
        float colorMix1 = fbm(rotatedPos * 3.0 + time * 0.05);
        float colorMix2 = fbm(rotatedPos * 1.5 - time * 0.04);
        
        vec3 nebulaColor = mix(color1, color2, colorMix1);
        nebulaColor = mix(nebulaColor, color3, colorMix2 * 0.5);
        nebulaColor = mix(nebulaColor, color4, pow(densitySample, 2.0) * 0.3);
        
        // Luminance additionnelle dans zones denses
        float glow = pow(densitySample, 3.0) * 2.0;
        nebulaColor += vec3(glow) * brightness;
        
        // Accumulation volumétrique
        float alpha = densitySample * density * stepSize;
        accumColor.rgb += nebulaColor * alpha * (1.0 - accumColor.a);
        accumColor.a += alpha * (1.0 - accumColor.a);
        
        pos += rayDir * stepSize;
      }
      
      // Vignette subtile
      float vignette = 1.0 - length(uv - 0.5) * 0.4;
      accumColor.rgb *= vignette;
      
      gl_FragColor = accumColor;
    }
  `
)

extend({ VolumetricNebulaMaterial })

// ============================================================================
// HDR STARFIELD AVEC GPU INSTANCING
// ============================================================================

export const HDRStarfield = React.memo(() => {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const count = 25000 // Ultra haute densité
  
  const { positions, colors, scales, twinkles } = useMemo(() => {
    const pos = []
    const cols = []
    const scls = []
    const twinks = []
    
    // Palette stellaire réaliste
    const starTypes = [
      { color: new THREE.Color('#ffffff'), weight: 0.4 }, // Blanc (type A)
      { color: new THREE.Color('#fff4e6'), weight: 0.25 }, // Jaune (type G - Soleil)
      { color: new THREE.Color('#ffebe6'), weight: 0.15 }, // Orange (type K)
      { color: new THREE.Color('#ffe6e6'), weight: 0.1 }, // Rouge (type M)
      { color: new THREE.Color('#e6f4ff'), weight: 0.07 }, // Bleu clair (type B)
      { color: new THREE.Color('#d6e8ff'), weight: 0.03 }, // Bleu (type O)
    ]
    
    for (let i = 0; i < count; i++) {
      // Distribution sphérique uniforme
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 150 + Math.random() * 350
      
      pos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      
      // Sélection couleur pondérée
      let random = Math.random()
      let selectedColor = starTypes[0].color
      for (const type of starTypes) {
        if (random < type.weight) {
          selectedColor = type.color
          break
        }
        random -= type.weight
      }
      
      // Variation de luminosité
      const brightness = 0.7 + Math.random() * 0.3
      cols.push(
        selectedColor.r * brightness,
        selectedColor.g * brightness,
        selectedColor.b * brightness
      )
      
      // Taille variable (magnitude)
      const magnitude = Math.pow(Math.random(), 2) // Distribution réaliste
      scls.push(0.15 + magnitude * 0.6)
      
      // Fréquence de scintillement
      twinks.push(0.5 + Math.random() * 2.0)
    }
    
    return { 
      positions: new Float32Array(pos), 
      colors: new Float32Array(cols), 
      scales: new Float32Array(scls),
      twinkles: new Float32Array(twinks)
    }
  }, [])
  
  // Setup instances
  React.useEffect(() => {
    if (!meshRef.current) return
    
    const dummy = new THREE.Object3D()
    const geometry = meshRef.current.geometry
    
    for (let i = 0; i < count; i++) {
      dummy.position.fromArray(positions, i * 3)
      dummy.scale.setScalar(scales[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
    
    // Attributs custom
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3))
    geometry.setAttribute('instanceTwinkle', new THREE.InstancedBufferAttribute(twinkles, 1))
  }, [positions, colors, scales, twinkles])
  
  // Animation de scintillement
  useFrame((state) => {
    if (!meshRef.current) return
    
    const geometry = meshRef.current.geometry
    const twinkleAttr = geometry.getAttribute('instanceTwinkle') as THREE.InstancedBufferAttribute
    
    for (let i = 0; i < count; i += 50) { // Optimisation: update 1/50
      const twinkleSpeed = twinkleAttr.array[i]
      const twinkle = Math.sin(state.clock.elapsedTime * twinkleSpeed + i) * 0.5 + 0.5
      
      const dummy = new THREE.Object3D()
      meshRef.current.getMatrixAt(i, dummy.matrix)
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
      
      const baseScale = scales[i]
      dummy.scale.setScalar(baseScale * (0.7 + twinkle * 0.3))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
})

// ============================================================================
// ANNEAUX PLANÉTAIRES ANIMÉS (PHYSIQUE RÉALISTE)
// ============================================================================

export const AnimatedPlanetaryRings = React.memo(({ position = [0, 0, 0], scale = 1 }: any) => {
  const ringsGroup = useRef<THREE.Group>(null!)
  
  // Configuration des anneaux (style Saturne)
  const ringConfigs = useMemo(() => [
    { 
      innerRadius: 22 * scale, 
      outerRadius: 26 * scale, 
      color: '#00ffff', 
      emissive: '#00dddd', 
      speed: 0.0008,
      particles: 800,
      opacity: 0.3,
      segments: 128
    },
    { 
      innerRadius: 28 * scale, 
      outerRadius: 32 * scale, 
      color: '#ff00ff', 
      emissive: '#dd00dd', 
      speed: 0.0006,
      particles: 1000,
      opacity: 0.25,
      segments: 128
    },
    { 
      innerRadius: 34 * scale, 
      outerRadius: 38 * scale, 
      color: '#ffff00', 
      emissive: '#dddd00', 
      speed: 0.0004,
      particles: 1200,
      opacity: 0.2,
      segments: 128
    },
  ], [scale])
  
  useFrame((state) => {
    if (!ringsGroup.current) return
    
    ringsGroup.current.rotation.y += 0.0012
    
    // Animation individuelle des anneaux (rotation différentielle)
    ringsGroup.current.children.forEach((child, i) => {
      const config = ringConfigs[i]
      if (!config) return
      
      child.rotation.z += config.speed
      
      // Ondulation subtile (Lindblad resonance simulation)
      const wave = Math.sin(state.clock.elapsedTime * 0.3 + i * 0.5) * 0.03
      child.scale.setScalar(1 + wave)
      
      // Pulsation d'intensité
      const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 1.0 + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.3
    })
  })
  
  return (
    <group ref={ringsGroup} position={position}>
      {ringConfigs.map((config, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * Math.PI / 6]}>
          <torusGeometry 
            args={[
              (config.innerRadius + config.outerRadius) / 2, 
              (config.outerRadius - config.innerRadius) / 2, 
              32, 
              config.segments
            ]} 
          />
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={1.2}
            transparent
            opacity={config.opacity}
            roughness={0.1}
            metalness={0.8}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      
      {/* Particules orbitales (débris) */}
      {ringConfigs.map((config, ringIndex) => (
        <RingParticles key={`particles-${ringIndex}`} config={config} ringIndex={ringIndex} />
      ))}
    </group>
  )
})

// Particules orbitales pour chaque anneau
const RingParticles = React.memo(({ config, ringIndex }: any) => {
  const particlesRef = useRef<THREE.Points>(null!)
  
  const { positions, colors, sizes } = useMemo(() => {
    const pos = []
    const cols = []
    const szs = []
    
    const color = new THREE.Color(config.color)
    
    for (let i = 0; i < config.particles; i++) {
      const angle = (i / config.particles) * Math.PI * 2
      const radius = config.innerRadius + Math.random() * (config.outerRadius - config.innerRadius)
      const height = (Math.random() - 0.5) * 0.3
      
      pos.push(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
      
      const brightness = 0.6 + Math.random() * 0.4
      cols.push(color.r * brightness, color.g * brightness, color.b * brightness)
      szs.push(0.2 + Math.random() * 0.3)
    }
    
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(cols),
      sizes: new Float32Array(szs)
    }
  }, [config])
  
  useFrame((state) => {
    if (!particlesRef.current) return
    
    const rotation = state.clock.elapsedTime * config.speed * 2
    particlesRef.current.rotation.y = rotation + ringIndex * 0.5
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={config.particles} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={config.particles} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={config.particles} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
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

// ============================================================================
// VOLUMETRIC NEBULA BACKGROUND
// ============================================================================

export const VolumetricNebula = React.memo(() => {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (!meshRef.current?.material) return
    
    const material = meshRef.current.material as any
    material.uniforms.time.value = state.clock.elapsedTime
    material.uniforms.cameraPos.value.copy(state.camera.position)
    
    meshRef.current.rotation.z += 0.00005
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, -80]} scale={200}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <volumetricNebulaMaterial
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
})

// ============================================================================
// DUST CLOUDS (NUAGES DE POUSSIÈRE COSMIQUE)
// ============================================================================

export const CosmicDustClouds = React.memo(() => {
  const count = 5000
  const pointsRef = useRef<THREE.Points>(null!)
  
  const { positions, colors, sizes } = useMemo(() => {
    const pos = []
    const cols = []
    const szs = []
    
    const palette = [
      new THREE.Color('#4a1a4a'),
      new THREE.Color('#1a2a4a'),
      new THREE.Color('#2a1a3a'),
    ]
    
    for (let i = 0; i < count; i++) {
      // Distribution en clusters
      const clusterX = (Math.random() - 0.5) * 300
      const clusterY = (Math.random() - 0.5) * 100
      const clusterZ = (Math.random() - 0.5) * 300
      
      pos.push(
        clusterX + (Math.random() - 0.5) * 40,
        clusterY + (Math.random() - 0.5) * 20,
        clusterZ + (Math.random() - 0.5) * 40
      )
      
      const color = palette[Math.floor(Math.random() * palette.length)]
      cols.push(color.r, color.g, color.b)
      szs.push(1 + Math.random() * 3)
    }
    
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(cols),
      sizes: new Float32Array(szs)
    }
  }, [])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    pointsRef.current.rotation.y += 0.00015
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.05
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        vertexColors
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
})

// ============================================================================
// COMPOSANT PRINCIPAL - ENVIRONNEMENT COMPLET
// ============================================================================

export const SpaceEnvironmentAAA = React.memo(() => {
  return (
    <>
      {/* Background volumétrique */}
      <VolumetricNebula />
      
      {/* Starfield HDR haute densité */}
      <HDRStarfield />
      
      {/* Nuages de poussière cosmique */}
      <CosmicDustClouds />
      
      {/* Anneaux planétaires animés */}
      <AnimatedPlanetaryRings position={[0, 0, 0]} scale={1} />
      
      {/* Fog volumétrique profond */}
      <fog attach="fog" args={['#000510', 50, 400]} />
    </>
  )
})

export default SpaceEnvironmentAAA
