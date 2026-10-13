// WatermelonGame 페이지
// 수박 게임(스이카 스타일 합체 퍼즐). matter-js 물리 엔진으로 과일을 떨어뜨리고,
// 같은 과일끼리 부딪히면 한 단계 큰 과일로 합쳐진다. 위험선 위로 과일이 쌓이면 게임 오버.
// 게임 오버 시 이번 판 점수를 scoreStore에 제출(최고 점수 유지)한다.
// (원본: Gangneung 프로젝트 → During-Lecture 테마/점수 시스템에 맞게 이식)

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Matter from 'matter-js'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import { FRUITS, loadFruitImages } from './fruitSprites'
import './WatermelonGame.css'

const { Engine, Bodies, Composite, Events } = Matter

// 캔버스 크기 (논리 좌표)
const W = 336
const H = 456
const DROP_Y = 44 // 과일이 떨어지기 시작하는 높이
const DANGER_Y = 92 // 이 선 위로 과일이 쌓이면 게임오버

// 단계별 합체 시 획득 점수 (누적 삼각수)
const POINTS = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55]
const MAX_TIER = FRUITS.length - 1
const DROPPABLE = 5 // 위에서 떨어뜨릴 수 있는 최대 단계(0~4)

type FruitBody = Matter.Body & { tier: number; spawnAt: number; entered: boolean }

export default function WatermelonGame() {
  const navigate = useNavigate()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [nextTier, setNextTier] = useState(0)
  const [round, setRound] = useState(0) // 값이 바뀌면 게임 재시작

  const scoreRef = useRef(0)
  const posted = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 엔진 & 벽
    const engine = Engine.create()
    engine.gravity.y = 1.3
    const wallOpt = { isStatic: true, render: { visible: false } }
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + 24, W + 120, 48, wallOpt), // 바닥
      Bodies.rectangle(-24, H / 2, 48, H * 2, wallOpt), // 좌
      Bodies.rectangle(W + 24, H / 2, 48, H * 2, wallOpt), // 우
    ])

    // 상태
    let pendingTier = Math.floor(Math.random() * DROPPABLE)
    let upcomingTier = Math.floor(Math.random() * DROPPABLE)
    let pendingX = W / 2
    let canDrop = true
    let ended = false
    let raf = 0
    let last = Date.now()
    const merging = new Set<number>()
    const sprites = loadFruitImages()
    setNextTier(upcomingTier)

    function addFruit(tier: number, x: number, y: number) {
      const f = FRUITS[tier]
      const body = Bodies.circle(x, y, f.r, {
        restitution: 0.18,
        friction: 0.4,
        density: 0.001,
      }) as FruitBody
      body.tier = tier
      body.spawnAt = Date.now()
      body.entered = false // 위험선 아래로 완전히 진입했는지
      Composite.add(engine.world, body)
      return body
    }

    // 합체 처리
    Events.on(engine, 'collisionStart', (evt) => {
      for (const pair of evt.pairs) {
        const a = pair.bodyA as FruitBody
        const b = pair.bodyB as FruitBody
        if (a.tier == null || b.tier == null) continue
        if (a.tier !== b.tier) continue
        if (merging.has(a.id) || merging.has(b.id)) continue
        merging.add(a.id)
        merging.add(b.id)

        const tier = a.tier
        const mx = (a.position.x + b.position.x) / 2
        const my = (a.position.y + b.position.y) / 2
        Composite.remove(engine.world, a)
        Composite.remove(engine.world, b)

        if (tier >= MAX_TIER) {
          // 수박 + 수박 → 보너스
          scoreRef.current += 100
        } else {
          const nt = tier + 1
          addFruit(nt, mx, my)
          scoreRef.current += POINTS[nt]
        }
        setScore(scoreRef.current)
      }
    })

    // 포인터 제어
    const toLocalX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect()
      const x = (clientX - rect.left) * (W / rect.width)
      const r = FRUITS[pendingTier].r
      return Math.max(r + 2, Math.min(W - r - 2, x))
    }
    const onMove = (e: PointerEvent) => {
      pendingX = toLocalX(e.clientX)
    }
    const onDown = (e: PointerEvent) => {
      pendingX = toLocalX(e.clientX)
      if (!canDrop || ended) return
      addFruit(pendingTier, pendingX, DROP_Y)
      canDrop = false
      pendingTier = upcomingTier
      upcomingTier = Math.floor(Math.random() * DROPPABLE)
      setNextTier(upcomingTier)
      setTimeout(() => {
        canDrop = true
      }, 480)
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)

    // 그리기 (과일 캐릭터 스프라이트, 미로드 시 원으로 대체)
    function drawFruit(x: number, y: number, tier: number, ghost = false) {
      const f = FRUITS[tier]
      const sprite = sprites[tier]
      ctx.globalAlpha = ghost ? 0.4 : 1
      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        const d = f.r * 2.1
        ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = f.color
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function render() {
      ctx.clearRect(0, 0, W, H)
      // 배경
      ctx.fillStyle = '#efeee8'
      ctx.fillRect(0, 0, W, H)
      // 위험선
      ctx.strokeStyle = 'rgba(186,26,26,0.5)'
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.moveTo(0, DANGER_Y)
      ctx.lineTo(W, DANGER_Y)
      ctx.stroke()
      ctx.setLineDash([])
      // 대기 과일 + 가이드
      if (!ended) {
        ctx.strokeStyle = 'rgba(60,90,70,0.25)'
        ctx.beginPath()
        ctx.moveTo(pendingX, DROP_Y)
        ctx.lineTo(pendingX, H)
        ctx.stroke()
        drawFruit(pendingX, DROP_Y, pendingTier, true)
      }
      // 과일들
      for (const body of Composite.allBodies(engine.world)) {
        const fb = body as FruitBody
        if (fb.tier == null) continue
        drawFruit(fb.position.x, fb.position.y, fb.tier)
      }
    }

    function loop() {
      const now = Date.now()
      const dt = Math.min(32, now - last)
      last = now
      Engine.update(engine, dt)

      // 게임오버 판정(즉시): 위험선 아래로 완전히 진입했던 과일이
      // 다시 위험선 위로 넘어가는 순간 종료
      let danger = false
      for (const body of Composite.allBodies(engine.world)) {
        const fb = body as FruitBody
        if (fb.tier == null) continue
        const top = fb.position.y - FRUITS[fb.tier].r
        if (!fb.entered) {
          if (top > DANGER_Y) fb.entered = true // 선 아래로 완전히 내려옴
        } else if (top < DANGER_Y) {
          danger = true
          break
        }
      }
      render()

      if (danger && !ended) {
        ended = true
        finish()
        return
      }
      raf = requestAnimationFrame(loop)
    }

    function finish() {
      setGameOver(true)
      // 게임 오버 시 이번 판 점수 제출 (최고 점수 유지)
      if (!posted.current) {
        posted.current = true
        submitScore('watermelon', scoreRef.current)
      }
    }

    raf = requestAnimationFrame(loop)

    // 정리
    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      Events.off(engine, 'collisionStart')
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    }
  }, [round])

  function restart() {
    scoreRef.current = 0
    posted.current = false
    setScore(0)
    setGameOver(false)
    setRound((r) => r + 1)
  }

  return (
    <GamePage gameId="watermelon" title="수박 게임">
      <div className="wgame">
        <div className="wgame__scores">
          <div className="wgame__score">
            <span className="wgame__score-label">이번 점수</span>
            <span className="wgame__score-value">{score}</span>
          </div>
          <div className="wgame__next">
            <span className="wgame__next-label">다음</span>
            <span className="wgame__next-dot" style={{ background: FRUITS[nextTier].color }}>
              {FRUITS[nextTier].name}
            </span>
          </div>
        </div>

        <div className="wgame__stage">
          <canvas ref={canvasRef} className="wgame__canvas" />
          {gameOver && (
            <div className="wgame__over">
              <div className="wgame__over-card">
                <h3>게임 오버</h3>
                <p className="wgame__over-score">{score}점</p>
                <div className="wgame__over-btns">
                  <button className="wgame__btn wgame__btn--primary" onClick={restart}>
                    다시하기
                  </button>
                  <button className="wgame__btn" onClick={() => navigate('/')}>
                    게임 목록
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="wgame__hint">화면을 눌러 과일을 떨어뜨리고, 같은 과일을 합쳐 수박을 만들어보세요.</p>
      </div>
    </GamePage>
  )
}
