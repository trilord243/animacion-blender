import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, useAnimations, Html, useProgress } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

const FPS = 60
const LOOP_START_FRAME = 100
const LOOP_START_TIME = LOOP_START_FRAME / FPS

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        color: 'white',
        fontFamily: 'sans-serif',
      }}>
        <div className="spinner" />
        <p style={{ fontSize: '18px', margin: 0 }}>
          Cargando... {progress.toFixed(0)}%
        </p>
        <div style={{
          width: '200px',
          height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: '#4fc3f7',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </Html>
  )
}

function Model({ onReady }) {
  const group = useRef()
  const { scene, animations } = useGLTF('/bodyman.glb')
  const { actions, mixer } = useAnimations(animations, group)

  useEffect(() => {
    const actionList = Object.values(actions)
    actionList.forEach((action) => {
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = false
      action.timeScale = 0.35
      action.reset().play()
    })

    if (actionList.length > 0) {
      onReady()
    }

    return () => {
      actionList.forEach((action) => {
        if (action) action.stop()
      })
    }
  }, [actions, mixer, scene, onReady])

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
  const audioRef = useRef(null)
  const [musicStarted, setMusicStarted] = useState(false)

  const handleModelReady = () => {
    if (!musicStarted && audioRef.current) {
      audioRef.current.play().catch(() => {})
      setMusicStarted(true)
    }
  }

  const handleInteraction = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {})
    }
  }

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}
      onClick={handleInteraction}
    >
      <audio ref={audioRef} src="/music.mp3" loop />
      <Canvas
        camera={{ position: [0, 2, 5], fov: 60 }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />
        <Suspense fallback={<Loader />}>
          <Model onReady={handleModelReady} />
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
