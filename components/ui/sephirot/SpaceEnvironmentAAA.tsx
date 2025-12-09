// @ts-nocheck
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// VOLUMETRIC NEBULA SHADER
// ============================================================================

const VolumetricNebulaMaterial = shaderMaterial(
  {
    time: 0,
    resolution: new THREE.Vector2(1024, 1024),
    cameraPos: new THREE.Vector3(),
    color1: new THREE.Color('#2a0a3a'),
    color2: new THREE.Color('#1a0a2a'),
    color3: new THREE.Color('#0a0a2a'),
    color4: new THREE.Color('#0a2a1a'),
    density: 0.06,
    brightness: 0.4,
  },
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
    
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
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
    
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for(int i = 0; i < 3; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vec2 uv = vUv;
      vec3 rayDir = normalize(vWorldPosition - cameraPos);
      vec3 rayOrigin = vWorldPosition;
      
      float maxDist = 60.0;
      float stepSize = 1.2;
      int steps = 32;
      
      vec3 pos = rayOrigin;
      vec4 accumColor = vec4(0.0);
      
      for(int i = 0; i < steps; i++) {
        if(accumColor.a >= 0.95) break;
        
        float angle = length(pos.xy) * 0.03 + time * 0.015;
        vec3 rotatedPos = vec3(
          cos(angle) * pos.x - sin(angle) * pos.y,
          sin(angle) * pos.x + cos(angle) * pos.y,
          pos.z
        );
        
        float densitySample = fbm(rotatedPos * 0.015 + time * 0.02);
        densitySample = smoothstep(0.4, 0.75, densitySample);
        
        float colorMix = fbm(rotatedPos * 0.02 + time * 0.03);
        
        vec3 nebulaColor = mix(color1, color2, colorMix);
        nebulaColor = mix(nebulaColor, color3, pow(densitySample, 2.0) * 0.4);
        nebulaColor = mix(nebulaColor, color4, sin(angle * 2.0) * 0.5 + 0.5);
        
        float glow = pow(densitySample, 4.0) * 0.8;
        nebulaColor += vec3(glow) * brightness;
        
        float alpha = densitySample * density * stepSize;
        accumColor.rgb += nebulaColor * alpha * (1.0 - accumColor.a);
        accumColor.a += alpha * (1.0 - accumColor.a);
        
        pos += rayDir * stepSize;
      }
      
      float vignette = 1.0 - length(uv - 0.5) * 0.5;
      accumColor.rgb *= vignette;
      
      gl_FragColor = accumColor;
    }
  `
)

extend({ VolumetricNebulaMaterial })

// ============================================================================
// SHADER ANNEAUX HOLOGRAPHIQUES ULTRA-FINS
// ============================================================================

const HolographicRingMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('#00ffff'),
    opacity: 0.6,
    thickness: 0.5,
    speed: 1.0,
  },
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    uniform float thickness;
    uniform float speed;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      float angle = atan(vPosition.z, vPosition.x);
      float radius = length(vPosition.xz);
      
      // Scanlines holographiques
      float scanline = sin((angle + time * speed) * 30.0) * 0.5 + 0.5;
      scanline = pow(scanline, 3.0);
      
      // Noise procédural
      float n = noise(vUv * 50.0 + time * 0.5);
      
      // Fresnel effect
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
      
      // Data streams (flux de données)
      float dataStream = step(0.95, fract((angle + time * speed * 2.0) * 15.0 + n));
      
      // Circuit patterns
      float circuit = step(0.98, sin((vUv.x + time * 0.3) * 80.0)) * step(0.97, cos((vUv.y - time * 0.2) * 60.0));
      
      // Couleur finale
      vec3 finalColor = color;
      finalColor += vec3(scanline) * 0.5;
      finalColor += vec3(dataStream) * color * 2.0;
      finalColor += vec3(circuit) * vec3(1.0, 1.0, 0.5);
      
      float alpha = fresnel * opacity;
      alpha += scanline * 0.3;
      alpha += dataStream * 0.4;
      alpha *= thickness;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ HolographicRingMaterial })

// ============================================================================
// HDR STARFIELD
// ============================================================================

export const HDRStarfield = React.memo(() => {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const count = 18000
  
  const { positions, colors, scales, twinkles } = useMemo(() => {
    const pos = []
    const cols = []
    const scls = []
    const twinks = []
    
    const starTypes = [
      { color: new THREE.Color('#ffffff'), weight: 0.35 },
      { color: new THREE.Color('#fff8f0'), weight: 0.25 },
      { color: new THREE.Color('#ffe8e0'), weight: 0.15 },
      { color: new THREE.Color('#ffd8d8'), weight: 0.1 },
      { color: new THREE.Color('#e0f0ff'), weight: 0.1 },
      { color: new THREE.Color('#d0e0ff'), weight: 0.05 },
    ]
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 120 + Math.random() * 380
      
      pos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      
      let random = Math.random()
      let selectedColor = starTypes[0].color
      for (const type of starTypes) {
        if (random < type.weight) {
          selectedColor = type.color
          break
        }
        random -= type.weight
      }
      
      const brightness = 0.6 + Math.random() * 0.4
      cols.push(
        selectedColor.r * brightness,
        selectedColor.g * brightness,
        selectedColor.b * brightness
      )
      
      const magnitude = Math.pow(Math.random(), 2)
      scls.push(0.12 + magnitude * 0.5)
      twinks.push(0.4 + Math.random() * 1.8)
    }
    
    return { 
      positions: new Float32Array(pos), 
      colors: new Float32Array(cols), 
      scales: new Float32Array(scls),
      twinkles: new Float32Array(twinks)
    }
  }, [])
  
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
    
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3))
    geometry.setAttribute('instanceTwinkle', new THREE.InstancedBufferAttribute(twinkles, 1))
  }, [positions, colors, scales, twinkles, count])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const geometry = meshRef.current.geometry
    const twinkleAttr = geometry.getAttribute('instanceTwinkle')
    
    if (!twinkleAttr || !twinkleAttr.array) return
    
    for (let i = 0; i < count; i += 60) {
      const twinkleSpeed = twinkleAttr.array[i]
      const twinkle = Math.sin(state.clock.elapsedTime * twinkleSpeed + i) * 0.5 + 0.5
      
      const dummy = new THREE.Object3D()
      meshRef.current.getMatrixAt(i, dummy.matrix)
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
      
      const baseScale = scales[i]
      dummy.scale.setScalar(baseScale * (0.65 + twinkle * 0.35))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.07, 6, 6]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.92}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
})

// ============================================================================
// ANNEAUX HOLOGRAPHIQUES ULTRA-FINS
// ============================================================================

export const HolographicRings = React.memo(({ position = [0, 0, 0], scale = 1 }: any) => {
  const ringsGroup = useRef<THREE.Group>(null!)
  
  const ringConfigs = useMemo(() => [
    { 
      radius: 22 * scale, 
      thickness: 0.08,
      color: '#00ffff', 
      speed: 0.8,
      opacity: 0.65,
      segments: 256
    },
    { 
      radius: 28 * scale, 
      thickness: 0.1,
      color: '#ff00ff', 
      speed: 0.6,
      opacity: 0.55,
      segments: 256
    },
    { 
      radius: 34 * scale, 
      thickness: 0.12,
      color: '#ffff00', 
      speed: 0.4,
      opacity: 0.45,
      segments: 256
    },
  ], [scale])
  
  useFrame((state) => {
    if (!ringsGroup.current) return
    
    ringsGroup.current.rotation.y += 0.0015
    
    ringsGroup.current.children.forEach((child, i) => {
      const config = ringConfigs[i]
      if (!config || !child.children[0]) return
      
      child.rotation.z += config.speed * 0.001
      
      const wave = Math.sin(state.clock.elapsedTime * 0.3 + i * 0.5) * 0.02
      child.scale.setScalar(1 + wave)
      
      const material = (child.children[0] as THREE.Mesh).material as any
      if (material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime
      }
    })
  })
  
  return (
    <group ref={ringsGroup} position={position}>
      {ringConfigs.map((config, i) => (
        <group key={i} rotation={[Math.PI / 2, 0, i * Math.PI / 8]}>
          <mesh>
            <torusGeometry args={[config.radius, config.thickness, 8, config.segments]} />
            <holographicRingMaterial
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              color={config.color}
              opacity={config.opacity}
              thickness={1.0}
              speed={config.speed}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
})

// ============================================================================
// ASTÉROÏDES DISTANTS
// ============================================================================

export const AsteroidField = React.memo(() => {
  const count = 150
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  
  const { positions, rotations, scales } = useMemo(() => {
    const pos = []
    const rots = []
    const scls = []
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 80 + Math.random() * 180
      const height = (Math.random() - 0.5) * 60
      
      pos.push(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
      
      rots.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      
      scls.push(0.3 + Math.random() * 1.2)
    }
    
    return {
      positions: new Float32Array(pos),
      rotations: new Float32Array(rots),
      scales: new Float32Array(scls)
    }
  }, [])
  
  React.useEffect(() => {
    if (!meshRef.current) return
    
    const dummy = new THREE.Object3D()
    
    for (let i = 0; i < count; i++) {
      dummy.position.fromArray(positions, i * 3)
      dummy.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2])
      dummy.scale.setScalar(scales[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, rotations, scales])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    for (let i = 0; i < count; i += 10) {
      const dummy = new THREE.Object3D()
      meshRef.current.getMatrixAt(i, dummy.matrix)
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
      
      dummy.rotation.x += 0.001
      dummy.rotation.y += 0.002
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#4a4a4a"
        roughness={0.9}
        metalness={0.3}
        emissive="#1a1a1a"
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  )
})

// ============================================================================
// RAYONS COSMIQUES
// ============================================================================

export const CosmicRays = React.memo(() => {
  const count = 30
  const linesRef = useRef<THREE.Group>(null!)
  
  const lines = useMemo(() => {
    const result = []
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const distance = 60 + Math.random() * 100
      
      const start = new THREE.Vector3(
        Math.cos(angle) * distance,
        (Math.random() - 0.5) * 50,
        Math.sin(angle) * distance
      )
      
      const end = start.clone().multiplyScalar(2.5)
      
      result.push({
        start,
        end,
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
        width: 0.5 + Math.random() * 1.5,
        speed: 0.5 + Math.random()
      })
    }
    
    return result
  }, [])
  
  useFrame((state) => {
    if (!linesRef.current) return
    
    linesRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const material = child.material as THREE.LineBasicMaterial
        const line = lines[i]
        material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * line.speed + i) * 0.15
      }
    })
  })
  
  return (
    <group ref={linesRef}>
      {lines.map((line, i) => {
        const points = [line.start, line.end]
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...line.start.toArray(), ...line.end.toArray()])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={line.color}
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              linewidth={line.width}
            />
          </line>
        )
      })}
    </group>
  )
})

// ============================================================================
// VOLUMETRIC NEBULA
// ============================================================================

export const VolumetricNebula = React.memo(() => {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (!meshRef.current?.material) return
    
    const material = meshRef.current.material as any
    material.uniforms.time.value = state.clock.elapsedTime
    material.uniforms.cameraPos.value.copy(state.camera.position)
    
    meshRef.current.rotation.z += 0.00003
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, -90]} scale={220}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <volumetricNebulaMaterial
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
})

// ============================================================================
// DUST CLOUDS
// ============================================================================

export const CosmicDustClouds = React.memo(() => {
  const count = 3500
  const pointsRef = useRef<THREE.Points>(null!)
  
  const { positions, colors, sizes } = useMemo(() => {
    const pos = []
    const cols = []
    const szs = []
    
    const palette = [
      new THREE.Color('#3a1a3a'),
      new THREE.Color('#1a2a3a'),
      new THREE.Color('#2a1a2a'),
    ]
    
    for (let i = 0; i < count; i++) {
      const clusterX = (Math.random() - 0.5) * 250
      const clusterY = (Math.random() - 0.5) * 80
      const clusterZ = (Math.random() - 0.5) * 250
      
      pos.push(
        clusterX + (Math.random() - 0.5) * 35,
        clusterY + (Math.random() - 0.5) * 18,
        clusterZ + (Math.random() - 0.5) * 35
      )
      
      const color = palette[Math.floor(Math.random() * palette.length)]
      cols.push(color.r, color.g, color.b)
      szs.push(0.8 + Math.random() * 2.5)
    }
    
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(cols),
      sizes: new Float32Array(szs)
    }
  }, [])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    pointsRef.current.rotation.y += 0.00012
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.015) * 0.04
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={1.2}
        vertexColors
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
})

// ============================================================================
// ENVIRONNEMENT COMPLET AAA+
// ============================================================================

export const SpaceEnvironmentAAA = React.memo(() => {
  return (
    <>
      <VolumetricNebula />
      <HDRStarfield />
      <CosmicDustClouds />
      <HolographicRings position={[0, 0, 0]} scale={1} />
      <AsteroidField />
      <CosmicRays />
      <fog attach="fog" args={['#000000', 40, 450]} />
    </>
  )
})

export default SpaceEnvironmentAAA
