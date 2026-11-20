// 별빛 토끼 페이지: 직접 그린 픽셀 에셋과 좌우 조작으로 즐기는 60초 수집 게임.
import { useEffect, useRef, useState } from 'react'
import GamePage from '../../components/GamePage/GamePage'
import { getBestScore, submitScore } from '../../lib/scoreStore'
import { createGame, stepGame, pauseGame, resumeGame, multiplier, WIDTH, HEIGHT, type Kind } from './engine'
import bunny from './assets/bunny.svg'
import star from './assets/star.svg'
import gold from './assets/gold.svg'
import meteor from './assets/meteor.svg'
import shield from './assets/shield.svg'
import './StarBunnyGame.css'

const sprites: Record<Kind, string> = { star, gold, meteor, shield }

export default function StarBunnyGame() {
  const [game, setGame] = useState(createGame)
  const current = useRef(game)
  const keys = useRef(new Set<string>())
  const touchDirection = useRef(0)
  const target = useRef<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const action = useRef<HTMLButtonElement>(null)
  const audio = useRef<AudioContext | null>(null)
  const soundRef = useRef(false)
  const [sound, setSound] = useState(false)
  const [record, setRecord] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [best, setBest] = useState(() => getBestScore('starbunny'))
  const clearInput = () => { keys.current.clear(); touchDirection.current = 0; target.current = null }
  const update = (next: typeof game) => { current.current = next; setGame(next) }
  const pause = () => { clearInput(); update(pauseGame(current.current)) }
  const resume = () => { clearInput(); update(resumeGame(current.current)); stage.current?.focus() }
  const start = () => {
    clearInput(); setRecord(false); setSaveFailed(false)
    update(createGame('countdown')); stage.current?.focus()
  }
  const toggleSound = () => {
    const enabled = !soundRef.current
    if (enabled) {
      try { audio.current ??= new AudioContext(); void audio.current.resume().catch(() => {}) }
      catch { return }
    }
    soundRef.current = enabled; setSound(enabled)
  }

  useEffect(() => {
    let frame = 0, last = 0
    const tone = (event: 'catch' | 'hurt' | 'shield') => {
      const ctx = audio.current
      if (!soundRef.current || !ctx || ctx.state !== 'running') return
      const oscillator = ctx.createOscillator(), gain = ctx.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(event === 'hurt' ? 160 : event === 'shield' ? 880 : 660, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(event === 'hurt' ? 70 : 1100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.035, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      oscillator.connect(gain); gain.connect(ctx.destination)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
      oscillator.start(); oscillator.stop(ctx.currentTime + 0.16)
    }
    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0
      last = now
      const right = keys.current.has('ArrowRight') || keys.current.has('d')
      const left = keys.current.has('ArrowLeft') || keys.current.has('a')
      const direction = touchDirection.current || Number(right) - Number(left)
      const before = current.current
      const next = stepGame(before, dt, direction, target.current)
      if (next !== before) {
        if (next.event) tone(next.event)
        if (next.phase === 'over') {
          clearInput()
          try { setRecord(submitScore('starbunny', next.score)); setBest(getBestScore('starbunny')) }
          catch { setSaveFailed(true) }
        }
        update(next)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    const hide = () => { if (document.hidden) pause() }
    const blur = () => pause()
    const release = (e: KeyboardEvent) => keys.current.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key)
    window.addEventListener('keyup', release)
    window.addEventListener('blur', blur)
    document.addEventListener('visibilitychange', hide)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keyup', release); window.removeEventListener('blur', blur)
      document.removeEventListener('visibilitychange', hide)
      void audio.current?.close().catch(() => {}); audio.current = null
    }
  }, [])

  useEffect(() => {
    if (game.phase === 'over' || game.phase === 'paused') action.current?.focus()
  }, [game.phase])

  const active = game.phase === 'playing' || game.phase === 'countdown'
  const pointer = (clientX: number) => {
    if (!active || !stage.current) return
    const bounds = stage.current.getBoundingClientRect()
    target.current = (clientX - bounds.left) / bounds.width * WIDTH
  }

  return <GamePage gameId="starbunny" title="별빛 토끼">
    <section className="starbunny" aria-label="별빛 토끼 게임">
      <div className="starbunny__layout">
        <div className="starbunny__console">
          <div className="starbunny__hud">
            <div><span>점수</span><strong data-testid="bunny-score">{game.score.toLocaleString()}</strong></div>
            <div><span>남은 시간</span><strong className={game.remaining <= 10 ? 'starbunny__urgent' : ''} data-testid="bunny-time">{Math.ceil(game.remaining)}<small>초</small></strong></div>
            <div><span>남은 기회</span><strong className="starbunny__hearts" aria-label={`남은 기회 ${game.hearts}개`}>
              {[0, 1, 2].map(i => <svg key={i} viewBox="0 0 16 14" aria-hidden="true" className={i < game.hearts ? '' : 'empty'}><path d="M2 0h4v2h4V0h4v2h2v6h-2v2h-2v2h-2v2H6v-2H4v-2H2V8H0V2h2z" /></svg>)}
            </strong></div>
          </div>
          <div ref={stage} tabIndex={0} className="starbunny__stage" aria-label="별 받기 영역. 방향키 또는 A, D로 이동하고 P 또는 Escape로 일시정지합니다."
            onKeyDown={e => {
              const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
              if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(key)) { e.preventDefault(); keys.current.add(key); target.current = null }
              if ((key === 'p' || key === 'Escape') && !e.repeat) { e.preventDefault(); game.phase === 'paused' ? resume() : pause() }
            }}
            onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) clearInput() }}
            onPointerDown={e => {
              if (!active) return
              e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); pointer(e.clientX)
            }}
            onPointerMove={e => { if (e.pointerType === 'mouse' || e.buttons > 0) pointer(e.clientX) }}
            onPointerUp={() => { target.current = null }} onPointerCancel={() => { target.current = null }}>
            <div className="starbunny__combo" aria-live="off">{game.combo > 0 ? `${game.combo} 연속 · ×${multiplier(game.combo)}` : ''}{game.shield && <span>보호막</span>}</div>
            {game.drops.map(drop => <img key={drop.id} src={sprites[drop.kind]} alt="" draggable={false}
              className={`starbunny__drop starbunny__drop--${drop.kind}`} style={{ left: `${drop.x / WIDTH * 100}%`, top: `${drop.y / HEIGHT * 100}%` }} />)}
            <div className={`starbunny__bunny ${game.shield ? 'is-shielded' : ''} ${game.invincible > 0 ? 'is-invincible' : ''}`}
              style={{ left: `${game.x / WIDTH * 100}%` }} data-x={Math.round(game.x)}><img src={bunny} alt="별 바구니를 든 토끼" draggable={false} /></div>
            {game.sparks.map(s => <span key={s.id} className="starbunny__spark" aria-hidden="true" style={{ left: `${s.x / WIDTH * 100}%`, top: `${s.y / HEIGHT * 100}%`, opacity: Math.min(1, s.life * 3) }}>{s.text}</span>)}
            {game.phase === 'countdown' && <div className="starbunny__countdown" role="status"><strong>{Math.ceil(game.countdown)}</strong></div>}
            {(game.phase === 'ready' || game.phase === 'paused' || game.phase === 'over') && <div className="starbunny__overlay">
              <div className="starbunny__dialog">
                {game.phase !== 'ready' && <h3>{game.phase === 'paused' ? '일시정지' : '게임 종료'}</h3>}
                {game.phase === 'over' && <>
                  <strong className="starbunny__result">{game.score.toLocaleString()}<small>점</small></strong>
                  <p className="starbunny__record">{record ? '최고 기록 갱신' : `최고 ${best.toLocaleString()}점`}</p>
                  {saveFailed && <p role="status">점수 저장 실패</p>}
                </>}
                <button ref={action} className="starbunny__primary" onClick={game.phase === 'paused' ? resume : start}>{game.phase === 'ready' ? '시작' : game.phase === 'paused' ? '계속하기' : '다시하기'}</button>
              </div>
            </div>}
          </div>
          <div className="starbunny__toolbar"><div>
            <button onClick={toggleSound} aria-pressed={sound}>소리 {sound ? '켜짐' : '꺼짐'}</button>
            <button onClick={game.phase === 'paused' ? resume : pause} disabled={!active && game.phase !== 'paused'}>{game.phase === 'paused' ? '계속하기' : '일시정지'}</button>
          </div></div>
          <div className="starbunny__touch" aria-label="터치 이동 버튼">
            {([-1, 1] as const).map(direction => <button key={direction} disabled={!active}
              aria-label={direction === -1 ? '왼쪽으로 이동' : '오른쪽으로 이동'}
              onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); target.current = null; touchDirection.current = direction }}
              onPointerUp={() => { touchDirection.current = 0 }} onPointerCancel={() => { touchDirection.current = 0 }}
              onLostPointerCapture={() => { touchDirection.current = 0 }}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); touchDirection.current = direction } }}
              onKeyUp={() => { touchDirection.current = 0 }} onBlur={() => { touchDirection.current = 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d={direction === -1 ? 'M11 2H7v3H4v6h3v3h4V2Z' : 'M5 2h4v3h3v6H9v3H5V2Z'} fill="currentColor" /></svg>{direction === -1 ? '왼쪽' : '오른쪽'}
            </button>)}
          </div>
        </div>
      </div>
    </section>
  </GamePage>
}
