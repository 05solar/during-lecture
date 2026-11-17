// Advanced tsumego study: authored variations, delayed replies, review and local progress.
import { useEffect, useMemo, useRef, useState } from 'react'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import { type Color, PASS } from './tsumegoGo'
import { TSUMEGO_PROBLEMS } from './tsumegoData'
import { advance, coordinate, emptyProgress, historyAt, loadProgress, positionAt, PROGRESS_KEY, recordResult, startPosition, type Position, type StudyProblem, type StudyProgress } from './tsumegoStudy'
import TsumegoBoard from './TsumegoBoard'
import './TsumegoGame.css'

type Mode = 'solve' | 'review' | 'analysis'
type Feedback = 'idle' | 'correct' | 'refuted' | 'unknown' | 'solved'
interface Session {
  position: Position; history: Position[]; mode: Mode; feedback: Feedback; message: string
  auto: boolean; pending: number[][]; lines: number; mistakes: number; assisted: boolean; recorded: boolean
}
const ready = (problem: StudyProblem): Session => ({ position: startPosition(problem), history: [], mode: 'solve', feedback: 'idle',
  message: '먼저 끝까지 읽어 보세요. 돌을 놓으면 상대가 응수합니다.', auto: false, pending: [], lines: 0, mistakes: 0, assisted: false, recorded: false })
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function TsumegoGame() {
  const [index, setIndex] = useState(0)
  const problem = TSUMEGO_PROBLEMS[index]
  const [session, setSession] = useState<Session>(() => ready(problem))
  const [progress, setProgress] = useState<StudyProgress>(() => { try { return loadProgress(localStorage.getItem(PROGRESS_KEY)) } catch { return {} } })
  const [storageWarning, setStorageWarning] = useState(false)
  const [filter, setFilter] = useState('all')
  const [tag, setTag] = useState('all')
  const [search, setSearch] = useState('')
  const [showLibrary, setShowLibrary] = useState(false)
  const [fullBoard, setFullBoard] = useState(false)
  const [numbered, setNumbered] = useState(true)
  const [hint, setHint] = useState<number | null>(null)
  const [analysisColor, setAnalysisColor] = useState<Color>(1)
  const [elapsed, setElapsed] = useState(0)
  const started = useRef(Date.now())
  const actionLock = useRef(false)
  const completion = useRef(false)
  const libraryRef = useRef<HTMLElement>(null)
  const { position, mode } = session
  const busy = session.auto

  useEffect(() => { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); setStorageWarning(false) } catch { setStorageWarning(true) } }, [progress])
  useEffect(() => {
    if (mode !== 'solve' || session.feedback === 'solved') return
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [mode, session.feedback, index])

  // Only the authored reply is played, after a visible pause. Cleanup prevents stale moves after navigation.
  useEffect(() => {
    if (!session.auto || mode !== 'solve') { actionLock.current = false; return }
    const timer = window.setTimeout(() => {
      const candidates = position.node?.children ?? []
      const solutions = candidates.map((node, child) => ({ node, child })).filter(item => item.node.hasSolution)
      const selected = solutions[0] ?? (candidates[0] ? { node: candidates[0], child: 0 } : null)
      if (!selected || selected.node.move === null) {
        setSession(prev => ({ ...prev, auto: false, feedback: 'unknown', message: '이 위치의 다음 응수는 원본에 없습니다. 해설 복기에서 확인하세요.' }))
        return
      }
      const next = advance(position, selected.node.move, selected.node.color)
      if (!next) return
      const alternatives = solutions.slice(1).map(item => [...position.path, item.child])
      setSession(prev => ({ ...prev, position: next, history: [...prev.history, position], auto: false,
        pending: [...prev.pending, ...alternatives],
        message: session.feedback === 'refuted' ? '원본에 기록된 반박 수입니다. 한 수 되돌리거나 해설 복기에서 이어 보세요.' : '상대가 응수했습니다. 다음 급소를 찾아보세요.' }))
    }, 420)
    return () => clearTimeout(timer)
  }, [session.auto, position, mode, session.feedback])

  // Finish every queued opponent defense before recording a clean solution.
  useEffect(() => {
    if (mode !== 'solve' || busy || !position.node?.correct || session.feedback === 'solved' || session.feedback === 'refuted') return
    if (session.pending.length) {
      const [path, ...pending] = session.pending
      setSession(prev => ({ ...prev, pending, lines: prev.lines + 1, position: positionAt(problem, path), history: historyAt(problem, path),
        message: '한 변화도를 풀었습니다. 이번에는 상대의 다른 응수에도 답해 보세요.', feedback: 'correct' }))
      return
    }
    if (completion.current) return
    completion.current = true
    const seconds = Math.max(1, Math.floor((Date.now() - started.current) / 1000))
    setElapsed(seconds)
    const clean = !session.assisted && session.mistakes === 0
    if (!session.recorded) setProgress(prev => ({ ...prev, [problem.id]: recordResult(prev[problem.id], clean, seconds, Date.now()) }))
    if (clean) {
      try { submitScore('tsumego', Math.max(100, 500 - Math.floor(seconds / 5))) }
      catch { setStorageWarning(true) }
    }
    const ko = /\bko\b/i.test(position.node.comment)
    setSession(prev => ({ ...prev, feedback: 'solved', lines: prev.lines + 1, recorded: true,
      message: `${ko ? '패를 만드는 것이 원본의 정답입니다.' : '정답입니다.'} ${clean ? '모든 선택된 응수를 스스로 해결했습니다.' : '도움을 받은 문제는 복습 목록에 남겼습니다.'} 해설 복기에서 다른 변화도도 살펴보세요.` }))
  }, [mode, busy, position, session.pending, session.feedback, session.assisted, session.mistakes, session.recorded, problem])

  const reset = (next = index) => {
    actionLock.current = false; completion.current = false
    setIndex(next); setSession(ready(TSUMEGO_PROBLEMS[next])); setHint(null); setAnalysisColor(TSUMEGO_PROBLEMS[next].player)
    setElapsed(0); started.current = Date.now()
  }
  const markReview = () => {
    if (session.recorded) return
    setProgress(prev => ({ ...prev, [problem.id]: recordResult(prev[problem.id], false, elapsed, Date.now()) }))
    setSession(prev => ({ ...prev, recorded: true }))
  }
  const move = (point: number) => {
    if (busy || actionLock.current || (mode === 'solve' && session.feedback === 'solved')) return
    if (mode === 'solve' && ['refuted', 'unknown'].includes(session.feedback)) return
    const next = advance(position, point, mode === 'analysis' ? analysisColor : position.state.toMove)
    if (!next) { setSession(prev => ({ ...prev, message: '착수할 수 없는 자리입니다. 돌·자충·즉시 패 되따냄을 확인하세요.' })); return }
    setHint(null)
    if (mode !== 'solve') {
      setAnalysisColor(next.state.toMove)
      setSession(prev => ({ ...prev, position: next, history: [...prev.history, position], message: next.node ? '원본 변화도를 복기하고 있습니다.' : '자유 분석 중입니다. 이 수순은 자동 판정하지 않습니다.' }))
      return
    }
    const known = next.node !== null, accepted = next.node?.hasSolution === true
    if (!accepted) markReview()
    const auto = known && !next.node!.correct && next.node!.children.length > 0
    actionLock.current = auto
    setSession(prev => ({ ...prev, position: next, history: [...prev.history, position], auto,
      feedback: accepted ? 'correct' : known ? 'refuted' : 'unknown',
      mistakes: prev.mistakes + (accepted ? 0 : 1), assisted: prev.assisted || !accepted,
      message: accepted ? '상대의 응수를 확인하세요.' : known ? '원본의 정답 가지와 다른 수입니다. 기록된 응수를 확인하세요.' : '원본 해답에 없는 수입니다. 정답·오답을 단정하지 않고 자유 분석으로 확인할 수 있습니다.' }))
  }
  const undo = () => {
    if (busy || !session.history.length) return
    let target = session.history.length - 1
    if (mode === 'solve') while (target > 0 && session.history[target].state.toMove !== problem.player) target--
    const previous = session.history[target]
    setSession(prev => ({ ...prev, position: previous, history: prev.history.slice(0, target), feedback: 'idle', auto: false, mode: prev.feedback === 'solved' ? 'review' : prev.mode,
      assisted: true, message: '되돌렸습니다. 다른 수를 읽어 보세요.' }))
    setAnalysisColor(previous.state.toMove); setHint(null)
  }
  const enterReview = () => {
    markReview(); setHint(null)
    setSession(prev => ({ ...prev, mode: 'review', auto: false, assisted: true, position: startPosition(problem), history: [],
      message: '아래 변화도를 선택하거나 다음 수로 해설을 한 수씩 확인하세요.' }))
  }
  const showHint = () => {
    const child = position.node?.children.find(node => node.hasSolution)
    if (!child || child.move === null) return
    const point = child.move
    markReview(); setHint(point)
    setSession(prev => ({ ...prev, assisted: true, message: `${coordinate(point)} 부근을 읽어 보세요. 힌트를 사용한 문제는 복습 목록에 남습니다.` }))
  }
  const analysis = () => {
    markReview(); setHint(null); setAnalysisColor(position.state.toMove)
    setSession(prev => ({ ...prev, mode: 'analysis', auto: false, assisted: true, message: '흑·백을 번갈아 직접 놓아 보세요. 자유 분석은 정답 판정을 하지 않습니다.' }))
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([problem.raw], { type: 'application/x-go-sgf;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `${problem.id}.sgf`; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const filtered = useMemo(() => TSUMEGO_PROBLEMS.filter(p => {
    const entry = progress[p.id]
    const matching = filter === 'all' || (filter === 'unsolved' && !entry?.solved) || (filter === 'solved' && !!entry?.solved)
      || (filter === 'review' && !!entry?.attempts && (entry.lastResult === 'review' || entry.due <= Date.now())) || (filter === 'saved' && entry?.bookmarked)
    return matching && (tag === 'all' || p.tags.includes(tag)) && (!search || String(p.number).includes(search.trim()))
  }), [progress, filter, tag, search])
  const stepProblem = (dir: 1 | -1) => {
    const current = filtered.findIndex(p => p.id === problem.id)
    const count = filtered.length || TSUMEGO_PROBLEMS.length
    const nextIndex = (current + dir + count) % count
    const next = filtered.length ? filtered[nextIndex] : TSUMEGO_PROBLEMS[(index + dir + TSUMEGO_PROBLEMS.length) % TSUMEGO_PROBLEMS.length]
    reset(TSUMEGO_PROBLEMS.indexOf(next))
  }
  const nextProblem = () => stepProblem(1)
  const previousProblem = () => stepProblem(-1)
  const openLibrary = () => {
    setShowLibrary(true)
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const solved = Object.values(progress).filter(entry => entry.solved > 0).length
  const reviewCount = Object.values(progress).filter(entry => entry.attempts > 0 && (entry.lastResult === 'review' || entry.due <= Date.now())).length
  const entry = progress[problem.id]
  const canStudy = mode !== 'solve' || session.feedback === 'solved' || session.feedback === 'refuted'
  const options = position.node?.children ?? []
  const nextNode = options.find(node => node.hasSolution) ?? options[0]

  return <GamePage gameId="tsumego" title="사활 훈련" scoreUnit="최고 점수">
    <div className="tsumego">
      <header className="tsumego__header">
        <div><p className="tsumego__eyebrow">GO GAME GURU · HARD COLLECTION</p><h2>한 수 너머까지 읽는 연습</h2><p className="tsumego__intro">상급 140문제 · 정답과 반박 변화도 · 원문 해설</p></div>
        <div className="tsumego__progress"><strong>{solved}<small> / 140</small></strong><span>스스로 해결 · 복습 {reviewCount}</span><progress value={solved} max={140} aria-label="문제집 학습 진도" /></div>
      </header>
      {storageWarning && <p role="status">브라우저 저장 공간을 사용할 수 없어 이번 학습 기록을 저장하지 못했습니다.</p>}
      <div className="tsumego__workspace">
        <section className="tsumego__play" aria-label="사활 풀이">
          <div className="tsumego__problem-head"><div><span className="tsumego__eyebrow">문제 {String(problem.number).padStart(3, '0')}</span><h3>{problem.player === 1 ? '흑' : '백'} 선수, 최선의 수를 찾으세요</h3></div><div className="tsumego__problem-head-right"><button className="tsumego__jump" onClick={openLibrary}>문제 목록</button><span className="tsumego__clock" aria-label="풀이 시간">{formatTime(elapsed)}</span></div></div>
          <div className="tsumego__board-tools"><div className="tsumego__tags">{problem.tags.map(t => <span key={t}>{t}</span>)}</div><button onClick={() => setFullBoard(v => !v)} aria-pressed={fullBoard}>{fullBoard ? '부분 확대' : '19×19 전체'}</button><button onClick={() => setNumbered(v => !v)} aria-pressed={numbered}>수순 번호</button></div>
          <div className="tsumego__board-wrap"><TsumegoBoard key={problem.id} problem={problem} position={position} fullBoard={fullBoard} numbered={numbered} hint={hint} review={canStudy} disabled={busy || (mode === 'solve' && ['solved', 'refuted', 'unknown'].includes(session.feedback))} color={mode === 'analysis' ? analysisColor : position.state.toMove} onMove={move} /></div>
          <div className={`tsumego__message ${session.feedback}`} role="status" aria-live="polite"><strong>{busy ? '상대 응수 중' : mode === 'analysis' ? '자유 분석' : mode === 'review' ? '해설 복기' : { idle: '풀이 중', correct: '계속 읽어 보세요', refuted: '반박 수순', unknown: '미등록 수순', solved: '풀이 완료' }[session.feedback]}</strong><p>{session.message}</p></div>
          <div className="tsumego__controls"><button onClick={undo} disabled={busy || !session.history.length}>한 수 되돌리기</button><button onClick={() => reset()}>다시 풀기</button><button onClick={previousProblem} className="tsumego__nav" aria-label="이전 문제">← 이전</button><button onClick={nextProblem} className="tsumego__primary">다음 문제 →</button></div>
          <div className="tsumego__move-strip" aria-label="착수 기록">{position.moves.length ? position.moves.map((m, i) => <button key={i} onClick={() => {
            if (busy) return
            markReview()
            const prior = i === position.moves.length - 1 ? position : session.history[i + 1]
            if (!prior) return
            setSession(prev => ({ ...prev, position: prior, history: prev.history.slice(0, i + 1), mode: 'review', auto: false, assisted: true }))
          }} disabled={busy} aria-label={`${i + 1}수 ${m.color === 1 ? '흑' : '백'} ${coordinate(m.point)}`}>{i + 1}. {m.color === 1 ? '흑' : '백'} {coordinate(m.point)}</button>) : <span>착수하면 수순이 여기에 표시됩니다.</span>}</div>
          <p className="tsumego__board-note">{fullBoard ? '19×19 전체 바둑판' : '전체 배치를 보존한 부분 확대'} · 잡은 돌 흑 {position.state.capB} / 백 {position.state.capW} · 방향키 이동, Enter 착수</p>
        </section>
        <aside className="tsumego__study" aria-label="학습 도구">
          <div className="tsumego__section-head"><h3>학습 노트</h3><button aria-pressed={!!entry?.bookmarked} onClick={() => setProgress(prev => ({ ...prev, [problem.id]: { ...(prev[problem.id] ?? emptyProgress()), bookmarked: !prev[problem.id]?.bookmarked } }))}>{entry?.bookmarked ? '저장됨' : '문제 저장'}</button></div>
          <div className="tsumego__mode-tabs" role="group" aria-label="학습 모드"><button aria-pressed={mode === 'solve'} onClick={() => { if (mode !== 'solve') reset() }}>문제 풀이</button><button aria-pressed={mode === 'review'} onClick={enterReview}>해설 복기</button><button aria-pressed={mode === 'analysis'} onClick={analysis}>자유 분석</button></div>
          <dl className="tsumego__facts"><div><dt>원본 난이도</dt><dd>Hard · 상급</dd></div><div><dt>이번 학습</dt><dd>{session.lines}개 응수 해결 · 재검토 {session.mistakes}회</dd></div><div><dt>나의 기록</dt><dd>{entry?.solved ? `${entry.solved}회 해결 · 최고 ${formatTime(entry.bestSeconds ?? 0)}` : '아직 스스로 푼 기록이 없어요'}</dd></div></dl>
          {mode === 'solve' && session.feedback !== 'solved' && <div className="tsumego__hint-box"><p>실전처럼 끝까지 읽은 뒤 착수해 보세요. 상대의 정답 가지가 여러 개면 다른 응수도 이어서 풀게 됩니다.</p><button onClick={showHint} disabled={busy || !nextNode?.hasSolution || ['refuted', 'unknown'].includes(session.feedback)}>급소 힌트</button></div>}
          {mode === 'analysis' && <div className="tsumego__analysis-tools"><span>다음 착수</span><button aria-pressed={analysisColor === 1} onClick={() => setAnalysisColor(1)}>흑</button><button aria-pressed={analysisColor === 2} onClick={() => setAnalysisColor(2)}>백</button><button onClick={() => move(PASS)}>패스</button></div>}
          {mode === 'review' && <div className="tsumego__review-tools"><button onClick={() => setSession(prev => ({ ...prev, position: startPosition(problem), history: [] }))}>처음</button><button disabled={!session.history.length} onClick={undo}>이전 수</button><button disabled={!nextNode || nextNode.move === null} onClick={() => { if (nextNode?.move !== null && nextNode?.move !== undefined) move(nextNode.move) }}>다음 수 →</button></div>}
          {canStudy && <section className="tsumego__variations"><h4>이 자리의 변화도</h4>{options.length ? options.map((node, child) => <button key={node.id} disabled={busy || mode === 'solve'} onClick={() => { if (node.move !== null) move(node.move) }}><span>{String.fromCharCode(65 + child)} · {node.color === 1 ? '흑' : '백'} {coordinate(node.move ?? PASS)}</span><small>{node.hasSolution ? '정답으로 이어지는 가지' : '참고·반박 변화'}</small></button>) : <p>이 가지의 마지막 수입니다.</p>}</section>}
          {canStudy && position.node?.comment && <section className="tsumego__comment"><h4>원문 해설</h4><p lang="en">{position.node.comment}</p></section>}
          <div className="tsumego__source"><p>문제·해설: An Younggil & David Ormerod<br />Go Game Guru · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a></p><a href={problem.sourceUrl} target="_blank" rel="noreferrer">원본 문제 보기 ↗</a><button onClick={download}>SGF 내려받기</button><p className="tsumego__source-note">원본에 표시된 정답을 기준으로 판정합니다. 등록되지 않은 수는 자유 분석에서 확인하세요.</p></div>
        </aside>
      </div>
      <section className="tsumego__library" aria-label="문제집" ref={libraryRef}>
        <div className="tsumego__section-head"><h3>상급 문제집 <span>{filtered.length}문제</span></h3><button onClick={() => setShowLibrary(v => !v)} aria-expanded={showLibrary}>{showLibrary ? '목록 접기' : '문제 선택'}</button></div>
        <div className="tsumego__filters"><label>학습 상태<select value={filter} onChange={event => { setFilter(event.target.value); setShowLibrary(true) }}><option value="all">전체</option><option value="unsolved">미해결</option><option value="review">오답·오늘 복습</option><option value="solved">해결한 문제</option><option value="saved">저장한 문제</option></select></label><label>주제<select value={tag} onChange={event => { setTag(event.target.value); setShowLibrary(true) }}><option value="all">모든 주제</option>{['패', '빅', '수상전·묘수', '긴 수읽기'].map(t => <option key={t}>{t}</option>)}</select></label><label>번호 검색<input type="search" inputMode="numeric" value={search} placeholder="예: 24" onChange={event => { setSearch(event.target.value); setShowLibrary(true) }} /></label></div>
        {showLibrary && <div className="tsumego__problem-list">{filtered.length ? filtered.map(p => <button key={p.id} aria-current={p.id === problem.id ? 'true' : undefined} onClick={() => reset(TSUMEGO_PROBLEMS.indexOf(p))}><strong>{String(p.number).padStart(3, '0')}</strong><span>Go Game Guru {p.number}<small>{p.tags.join(' · ')}</small></span><span>{progress[p.id]?.lastResult === 'review' ? '복습' : progress[p.id]?.solved ? '해결' : '미해결'}</span></button>) : <p className="tsumego__empty">조건에 맞는 문제가 없습니다. 다른 필터를 선택해 보세요.</p>}</div>}
      </section>
    </div>
  </GamePage>
}
