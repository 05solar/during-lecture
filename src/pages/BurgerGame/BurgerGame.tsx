// BurgerGame 페이지
// 햄버거 재료 타워 쌓기 게임. 맨 아래에 번이 깔려 있고, 재료가 화면 위쪽에서 좌우로 왔다갔다 한다.
// 마우스 좌클릭 또는 스페이스바를 누르면 현재 위치에서 재료가 멈추고 아래로 떨어진다.
// 무게중심이 쏠려 균형을 잃으면(matter-js 물리) 타워가 무너지며 게임 오버.
// 무너지지 않는 한 화면이 자동 스크롤되며 무한히 쌓을 수 있다. 쌓은 개수가 점수가 된다.
// 재료 이미지는 "레트로 버거 재료 스프라이트 시트"를 재료별로 잘리지 않게 크롭해 사용한다.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Matter from 'matter-js'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import { BUN, TOPPINGS, ALL_INGREDIENTS, dispW, dispH, type Ingredient } from './ingredients'
import './BurgerGame.css'

// 캔버스 내부 해상도(논리 좌표). CSS로 반응형 축소된다.
const VW = 380
const VH = 580
const BASE_Y = 500 // 번(바닥 기준) 중심 y
const DROP_GAP = 130 // 재료가 타워 꼭대기에서 떠 있는 높이
const DANGER_ANGLE = 0.9 // 이 각도(rad, 약 51°) 이상 기울면 붕괴로 간주
const FELL_MARGIN = 46 // 번 아래로 이만큼 떨어지면 붕괴
const EDGE = 36 // 좌우 왕복 경계(및 시작점) 여백

interface Placed {
  body: Matter.Body
  ing: Ingredient
}

export default function BurgerGame() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'aiming' | 'dropping' | 'over'>('aiming')

  // 이미지 캐시
  const imgs = useRef<Record<string, HTMLImageElement>>({})

  // 물리/상태 refs (렌더 루프에서 사용 — 리렌더와 분리)
  const engineRef = useRef<Matter.Engine | null>(null)
  const placedRef = useRef<Placed[]>([])
  const activeRef = useRef<Matter.Body | null>(null)
  const moverRef = useRef<{ ing: Ingredient; x: number; dir: number; y: number }>({
    ing: TOPPINGS[0], x: EDGE, dir: 1, y: 0,
  })
  const phaseRef = useRef<'aiming' | 'dropping' | 'over'>('aiming')
  const scoreRef = useRef(0)
  const camYRef = useRef(0)
  const settleRef = useRef(0)
  const rafRef = useRef(0)

  const randTopping = () => TOPPINGS[Math.floor(Math.random() * TOPPINGS.length)]

  // 안착된 타워 꼭대기 y(가장 작은 y).
  // 낙하 중(아직 안 멈춘) 재료는 제외한다 → 카메라가 공중의 재료를 쫓아 튀는 현상 방지.
  const stackTopY = useCallback((): number => {
    let top = BASE_Y - dispH(BUN) / 2
    for (const p of placedRef.current) {
      if (p.body === activeRef.current) continue
      const t = p.body.position.y - dispH(p.ing) / 2
      if (t < top) top = t
    }
    return top
  }, [])

  // 다음 재료를 조준 상태로 준비
  const nextMover = useCallback(() => {
    const ing = randTopping()
    // 좌우 왕복 시작점: 왼쪽 맨 끝에서 오른쪽으로 출발
    moverRef.current = { ing, x: EDGE, dir: 1, y: stackTopY() - DROP_GAP }
    phaseRef.current = 'aiming'
    setPhase('aiming')
  }, [stackTopY])

  // 엔진 초기화 + 번 바닥 배치
  const init = useCallback(() => {
    const engine = Matter.Engine.create()
    engine.gravity.y = 1.1
    engine.enableSleeping = true
    engineRef.current = engine

    // 바닥 번(정적 베이스)
    const bw = dispW(BUN) * 0.92
    const bh = dispH(BUN) * 0.7
    const base = Matter.Bodies.rectangle(VW / 2, BASE_Y, bw, bh, {
      isStatic: true,
      friction: 1,
      label: 'base',
    })
    Matter.Composite.add(engine.world, base)
    placedRef.current = [{ body: base, ing: BUN }]
    activeRef.current = null
    scoreRef.current = 0
    camYRef.current = 0
    settleRef.current = 0
    setScore(0)
    nextMover()
  }, [nextMover])

  // 현재 조준 재료를 떨어뜨림
  const drop = useCallback(() => {
    if (phaseRef.current !== 'aiming') return
    const engine = engineRef.current
    if (!engine) return
    const m = moverRef.current
    const bw = dispW(m.ing) * 0.86
    const bh = dispH(m.ing) * 0.66
    const body = Matter.Bodies.rectangle(m.x, m.y, bw, bh, {
      friction: 1,
      frictionStatic: 4,
      restitution: 0, // 튕김 없음
      frictionAir: 0.09, // 공기저항 ↑↑ → 안착 시 출렁임(또잉또잉) 크게 억제
      density: 0.0016,
      label: m.ing.key,
    })
    Matter.Body.setVelocity(body, { x: 0, y: 2 })
    Matter.Composite.add(engine.world, body)
    placedRef.current.push({ body, ing: m.ing })
    activeRef.current = body
    settleRef.current = 0
    phaseRef.current = 'dropping'
    setPhase('dropping')
  }, [])

  const gameOver = useCallback(() => {
    if (phaseRef.current === 'over') return
    phaseRef.current = 'over'
    setPhase('over')
    submitScore('burger', scoreRef.current)
  }, [])

  // 메인 루프 + 입력 바인딩
  useEffect(() => {
    // 이미지 로드
    let alive = true
    const entries = ALL_INGREDIENTS
    let count = 0
    entries.forEach((ing) => {
      const img = new Image()
      img.src = ing.url
      img.onload = () => {
        count++
        if (count === entries.length && alive) setLoaded(true)
      }
      imgs.current[ing.key] = img
    })

    init()

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const draw = () => {
      const camY = camYRef.current
      ctx.clearRect(0, 0, VW, VH)
      // 배경
      ctx.fillStyle = '#efeee8'
      ctx.fillRect(0, 0, VW, VH)
      // 중앙 기준선(옅게)
      ctx.strokeStyle = 'rgba(60,90,70,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(VW / 2, 0)
      ctx.lineTo(VW / 2, VH)
      ctx.stroke()

      // 쌓인 재료
      for (const p of placedRef.current) {
        const img = imgs.current[p.ing.key]
        if (!img) continue
        const dw = dispW(p.ing)
        const dh = dispH(p.ing)
        ctx.save()
        ctx.translate(p.body.position.x, p.body.position.y - camY)
        ctx.rotate(p.body.angle)
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
        ctx.restore()
      }

      // 조준 중인 재료 + 가이드
      if (phaseRef.current === 'aiming') {
        const m = moverRef.current
        const img = imgs.current[m.ing.key]
        const dw = dispW(m.ing)
        const dh = dispH(m.ing)
        // 낙하 가이드선
        ctx.strokeStyle = 'rgba(60,90,70,0.35)'
        ctx.setLineDash([5, 6])
        ctx.beginPath()
        ctx.moveTo(m.x, m.y - camY + dh / 2)
        ctx.lineTo(m.x, stackTopY() - camY)
        ctx.stroke()
        ctx.setLineDash([])
        if (img) {
          ctx.globalAlpha = 0.92
          ctx.drawImage(img, m.x - dw / 2, m.y - camY - dh / 2, dw, dh)
          ctx.globalAlpha = 1
        }
      }
    }

    const step = () => {
      const engine = engineRef.current!
      // 조준 재료 좌우 이동
      if (phaseRef.current === 'aiming') {
        const m = moverRef.current
        // 위로 올라갈수록(쌓은 개수 ↑) 좌우 왕복 속도 증가
        const speed = 2 + Math.min(scoreRef.current * 0.22, 8)
        m.x += m.dir * speed
        if (m.x < EDGE) { m.x = EDGE; m.dir = 1 }
        if (m.x > VW - EDGE) { m.x = VW - EDGE; m.dir = -1 }
        m.y = stackTopY() - DROP_GAP
      }

      Matter.Engine.update(engine, 1000 / 60)

      // 낙하 재료 안착 판정
      if (phaseRef.current === 'dropping' && activeRef.current) {
        const b = activeRef.current
        if (b.speed < 0.45 && b.angularSpeed < 0.035) settleRef.current++
        else settleRef.current = 0
        if (settleRef.current > 14) {
          activeRef.current = null
          scoreRef.current++
          setScore(scoreRef.current)
          nextMover()
        }
      }

      // 붕괴 판정 (베이스 제외)
      if (phaseRef.current !== 'over') {
        for (let i = 1; i < placedRef.current.length; i++) {
          const b = placedRef.current[i].body
          if (
            b.position.y > BASE_Y + FELL_MARGIN ||
            b.position.x < -90 ||
            b.position.x > VW + 90 ||
            Math.abs(b.angle) > DANGER_ANGLE
          ) {
            gameOver()
            break
          }
        }
      }

      // 카메라: 안착된 타워 꼭대기를 화면 상단 200px 부근에 유지.
      // 위로만(camY 감소) 이동하도록 클램프 → 아래위로 흔들리지 않음.
      const target = Math.min(0, stackTopY() - 200)
      const nextCam = camYRef.current + (target - camYRef.current) * 0.1
      camYRef.current = Math.min(camYRef.current, nextCam)

      draw()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        drop()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onKey)
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false)
        Matter.Engine.clear(engineRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onClick = () => drop() // 마우스 좌클릭으로 낙하
  const onTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    drop()
  }

  const restart = () => {
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, false)
      Matter.Engine.clear(engineRef.current)
    }
    init()
  }

  return (
    <GamePage gameId="burger" title="버거 타워">
      <div className="burger">
        <div className="burger__hud">
          <div className="burger__count">
            <span className="burger__count-label">쌓은 높이</span>
            <span className="burger__count-value">{score}</span>
          </div>
          <span className="burger__next">다음: {phase === 'over' ? '-' : moverRef.current.ing.name}</span>
        </div>

        <div className="burger__stage">
          <canvas
            ref={canvasRef}
            width={VW}
            height={VH}
            className="burger__canvas"
            onClick={onClick}
            onTouchStart={onTouch}
          />
          {!loaded && <div className="burger__loading">재료 불러오는 중…</div>}

          {phase === 'over' && (
            <div className="burger__over">
              <div className="burger__over-card">
                <h3>타워 붕괴</h3>
                <p className="burger__over-score">{score}층</p>
                <div className="burger__over-btns">
                  <button className="burger__btn burger__btn--primary" onClick={restart}>다시하기</button>
                  <button className="burger__btn" onClick={() => navigate('/')}>게임 목록</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="burger__hint">
          마우스 <b>좌클릭</b> 또는 <b>스페이스바</b>로 재료를 떨어뜨리세요. 무게중심이 쏠리면 무너집니다.
        </p>
      </div>
    </GamePage>
  )
}
