// src/pages/ExerciseCapture.jsx
import React, { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageTitle from '../components/PageTitle'
import Loader from '../components/Loader'
import { db } from '../firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'
import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils
} from '@mediapipe/tasks-vision'
import './ExerciseCapture.css'

export default function ExerciseCapture() {
  const { id: challengeId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [exercise, setExercise]     = useState('')
  const [count, setCount]           = useState(0)
  const [running, setRunning]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [poseLandmarker, setPoseLandmarker] = useState(null)

  // Para controlar el estado de la repetición
  const repStage = useRef('up')   // 'up' o 'down'

  // Helper para calcular ángulo entre tres puntos
  function calculateAngle(a, b, c) {
    const ab = { x: a.x - b.x, y: a.y - b.y }
    const cb = { x: c.x - b.x, y: c.y - b.y }
    const dot = ab.x * cb.x + ab.y * cb.y
    const magAB = Math.hypot(ab.x, ab.y)
    const magCB = Math.hypot(cb.x, cb.y)
    return Math.acos(dot / (magAB * magCB)) * (180 / Math.PI)
  }

  // 1) Cargo el reto
  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'challenges', challengeId))
        if (!snap.exists()) {
          setError('Reto no encontrado')
        } else {
          setExercise(snap.data().activity.key)  
        }
      } catch (e) {
        console.error(e)
        setError('Error cargando el reto')
      } finally {
        setLoading(false)
      }
    })()
  }, [challengeId])

  // 2) Cargo MediaPipe
  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        )
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        })
        if (!cancel) setPoseLandmarker(landmarker)
      } catch (e) {
        console.error('MediaPipe fallo:', e)
        setError('Error inicializando MediaPipe')
      }
    })()
    return () => { cancel = true }
  }, [])

  // 3) Cámara
  useEffect(() => {
    if (loading || error) return
    // guardamos la instancia del <video> en una variable local
  const videoEl = videoRef.current;
  let stream;
 
  async function setup() {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
    await videoEl.play();
  }
  setup();
 
  return () => {
    // usamos esa misma referencia para limpiar
    if (stream) stream.getTracks().forEach(t => t.stop());
  };
  }, [loading, error])

  // 4) Bucle de detección y conteo
  useEffect(() => {
    if (!running || !poseLandmarker) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const drawingUtils = new DrawingUtils(ctx)
    let lastTime = -1
    let raf

    async function predict() {
      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime
        const now = performance.now()
        const result = await poseLandmarker.detectForVideo(video, now)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Si no detectó ninguna pose, saltamos este frame
        if (!result.landmarks || result.landmarks.length === 0) {
          raf = requestAnimationFrame(predict)
          return
        }
        const landmarks = result.landmarks[0]
        // Dibujo
        drawingUtils.drawLandmarks(landmarks, {
          radius: d => DrawingUtils.lerp(d.from.z, -0.15, 0.1, 5, 1)
        })
        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS)
        // Conteo según ejercicio
        if (exercise === 'pushup') {
          // Ángulo en codo: hombro(11)‑codo(13)‑muñeca(15)
          const ang = calculateAngle(
            landmarks[11], landmarks[13], landmarks[15]
          )
          if (ang < 90 && repStage.current === 'up') {
            repStage.current = 'down'
          }
          if (ang > 160 && repStage.current === 'down') {
            repStage.current = 'up'
            setCount(c => c + 1)
          }
        } else if (exercise === 'squat') {
          // Ángulo en rodilla: cadera(23)‑rodilla(25)‑tobillo(27)
          const ang = calculateAngle(
            landmarks[23], landmarks[25], landmarks[27]
          )
          if (ang < 90 && repStage.current === 'up') {
            repStage.current = 'down'
          }
          if (ang > 160 && repStage.current === 'down') {
            repStage.current = 'up'
            setCount(c => c + 1)
          }
        }
      }
      raf = requestAnimationFrame(predict)
    }

    predict()
    return () => cancelAnimationFrame(raf)
  }, [running, poseLandmarker, exercise])

  if (loading) return <Loader text="Cargando reto…" />
  if (error)   return <p className="error">{error}</p>

  return (
    <div className="capture-page">
      <PageTitle>Captura de {exercise}</PageTitle>

      <div className="controls">
        <span className="label">Ejercicio:</span>
        <select
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
        >
          <option value="pushup">Flexiones</option>
          <option value="squat">Sentadillas</option>
          <option value="pullup">Dominadas</option>
        </select>
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={!poseLandmarker}
          className="btn btn-primary"
        >
          {running ? 'Detener' : 'Iniciar'}
        </button>
        <span className="count">Reps: {count}</span>
        <button 
            onClick={() => navigate(-1)}
            className="btn btn-back"
        >
            ← Volver
        </button>
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          className="input-video"
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="output-canvas"
          width="640"
          height="480"
        />
      </div>
    </div>
  )
}
