import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, useAnimations } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import './App.css'

const FPS = 60
const LOOP_START_FRAME = 100
const LOOP_START_TIME = LOOP_START_FRAME / FPS

function Model() {
  const group = useRef()
  const { scene, animations } = useGLTF('/bodyman.glb')
  const { actions, mixer } = useAnimations(animations, group)

  useEffect(() => {
    // Start all actions
    const actionList = Object.values(actions)
    actionList.forEach((action) => {
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = false
      action.timeScale = 0.5
      action.reset().play()
    })

    return () => {
      actionList.forEach((action) => {
        if (action) action.stop()
      })
    }
  }, [actions, mixer, scene])

  // Handle the loop: after first full play, clamp loop start to frame 100
  const hasCompletedFirst = useRef(false)

  useFrame(() => {
    const allActions = Object.values(actions)
    if (allActions.length === 0) return

    if (!hasCompletedFirst.current) {
      const maxDuration = Math.max(...allActions.map(a => a.getClip().duration))
      if (allActions[0].time >= maxDuration * 0.99) {
        hasCompletedFirst.current = true
      }
      return
    }

    allActions.forEach((action) => {
      if (action.time < LOOP_START_TIME) {
        action.time = LOOP_START_TIME
      }
    })
  })

  return <primitive ref={group} object={scene} />
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 60 }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          <Model />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          minDistance={1}
          maxDistance={50}
        />
      </Canvas>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        opacity: 0.7,
        pointerEvents: 'none',
        textAlign: 'center',
      }}>
        Scroll para zoom · Click + arrastrar para rotar · Click derecho para mover
      </div>
    </div>
  )
}

export default App
