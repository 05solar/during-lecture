// Accessible SVG Go board with local zoom, move numbers and review annotations.
import { memo, useId, useState } from 'react'
import { coordinate, type Position, type StudyProblem } from './tsumegoStudy'
import type { Color } from './tsumegoGo'

interface Props {
  problem: StudyProblem
  position: Position
  fullBoard: boolean
  numbered: boolean
  hint: number | null
  review: boolean
  disabled: boolean
  color: Color
  onMove: (point: number) => void
}

export function boardBounds(points: number[], full: boolean) {
  if (full || !points.length) return { row: 0, col: 0, rows: 19, cols: 19 }
  const rows = points.map(p => Math.floor(p / 19)), cols = points.map(p => p % 19)
  const minR = Math.max(0, Math.min(...rows) - 1), minC = Math.max(0, Math.min(...cols) - 1)
  const maxR = Math.min(18, Math.max(...rows) + 1), maxC = Math.min(18, Math.max(...cols) + 1)
  const rowCount = Math.min(19, Math.max(7, maxR - minR + 1))
  const colCount = Math.min(19, Math.max(9, maxC - minC + 1))
  return { row: Math.min(minR, 19 - rowCount), col: Math.min(minC, 19 - colCount), rows: rowCount, cols: colCount }
}

export default memo(function TsumegoBoard({ problem, position, fullBoard, numbered, hint, review, disabled, color, onMove }: Props) {
  const { row, col, rows, cols } = boardBounds(problem.points, fullBoard)
  const id = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const pad = 24, step = 34, width = pad * 2 + (cols - 1) * step, height = pad * 2 + (rows - 1) * step
  const x = (point: number) => pad + (point % 19 - col) * step
  const y = (point: number) => pad + (Math.floor(point / 19) - row) * step
  const points = Array.from({ length: rows * cols }, (_, i) => (row + Math.floor(i / cols)) * 19 + col + i % cols)
  const last = position.moves[position.moves.length - 1]?.point
  const labels = review ? position.node?.labels ?? [] : []
  const moveNumbers = new Map(position.moves.map((move, index) => [move.point, index + 1]))
  const cursor = focus !== null && points.includes(focus) ? focus : points[0]
  const select = (point: number) => { if (!disabled) onMove(point) }
  return <svg className="tsumego__board" viewBox={`0 0 ${width} ${height}`} role="grid" aria-label="사활 문제 바둑판" aria-busy={disabled} onMouseLeave={() => setHover(null)}>
    <defs>
      <radialGradient id={`${id}-black`} cx="35%" cy="30%" r="70%"><stop stopColor="#555" /><stop offset="1" stopColor="#141414" /></radialGradient>
      <radialGradient id={`${id}-white`} cx="35%" cy="30%" r="70%"><stop stopColor="#fff" /><stop offset="1" stopColor="#d4d2cd" /></radialGradient>
    </defs>
    <rect width={width} height={height} fill="#dfb36f" />
    {Array.from({ length: cols }, (_, i) => <g key={`col-${i}`} pointerEvents="none">
      <path d={`M${pad + i * step} ${pad}V${height - pad}`} stroke="#8a5b30" strokeWidth="0.8" />
      <text x={pad + i * step} y="11" textAnchor="middle" className="tsumego__coordinate">{'ABCDEFGHJKLMNOPQRST'[col + i]}</text>
    </g>)}
    {Array.from({ length: rows }, (_, i) => <g key={`row-${i}`} pointerEvents="none">
      <path d={`M${pad} ${pad + i * step}H${width - pad}`} stroke="#8a5b30" strokeWidth="0.8" />
      <text x="10" y={pad + i * step + 3} textAnchor="middle" className="tsumego__coordinate">{19 - row - i}</text>
    </g>)}
    {points.filter(p => [3, 9, 15].includes(p % 19) && [3, 9, 15].includes(Math.floor(p / 19))).map(p => <circle key={p} cx={x(p)} cy={y(p)} r="2.6" fill="#6f4523" pointerEvents="none" />)}
    {points.map(point => {
      const stone = position.state.board[point]
      const label = labels.find(mark => mark.point === point)
      return <g key={point}>
        <rect role="gridcell" aria-label={`${coordinate(point)} ${stone === 1 ? '흑돌' : stone === 2 ? '백돌' : '빈 자리'}`}
          tabIndex={point === cursor ? 0 : -1} x={x(point) - step / 2} y={y(point) - step / 2} width={step} height={step}
          fill="transparent" className="tsumego__intersection" onClick={() => select(point)} onMouseEnter={() => setHover(point)} onFocus={() => setFocus(point)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(point); return }
            const offset = ({ ArrowUp: -19, ArrowDown: 19, ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[event.key]
            if (offset !== undefined) {
              event.preventDefault()
              const next = point + offset
              if (points.includes(next) && (Math.abs(offset) !== 1 || Math.floor(next / 19) === Math.floor(point / 19))) {
                setFocus(next)
                const svg = event.currentTarget.ownerSVGElement
                const nextIndex = points.indexOf(next)
                ;(svg?.querySelectorAll<SVGRectElement>('[role="gridcell"]')[nextIndex])?.focus()
              }
            }
          }} />
        <g pointerEvents="none">
          {stone > 0 && <circle cx={x(point)} cy={y(point)} r="15" fill={`url(#${id}-${stone === 1 ? 'black' : 'white'})`} stroke={stone === 1 ? '#181818' : '#aaa49b'} strokeWidth="0.7" />}
          {!stone && hover === point && !disabled && <circle cx={x(point)} cy={y(point)} r="14" fill={color === 1 ? '#111' : '#fff'} opacity="0.3" />}
          {stone > 0 && numbered && moveNumbers.has(point)
            ? <text x={x(point)} y={y(point) + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={stone === 1 ? '#fff' : '#111'}>{moveNumbers.get(point)}</text>
            : point === last && stone > 0 && <circle cx={x(point)} cy={y(point)} r="5" fill="none" stroke={stone === 1 ? '#fff' : '#222'} strokeWidth="2" />}
          {hint === point && !stone && <circle cx={x(point)} cy={y(point)} r="10" fill="none" stroke="#4f46e5" strokeWidth="3" />}
          {label && <><rect x={x(point) - 7} y={y(point) - 9} width="14" height="18" fill={stone ? 'transparent' : '#dfb36f'} /><text x={x(point)} y={y(point) + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={stone === 1 ? '#fff' : '#181818'}>{label.text}</text></>}
        </g>
      </g>
    })}
  </svg>
})
