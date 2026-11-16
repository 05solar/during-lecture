// Go Game Guru hard collection, distributed under CC BY-NC-SA 4.0.
// Original SGFs and attribution are preserved in ./problems/.
import { readProblem } from './tsumegoStudy'

const sources = import.meta.glob('./problems/*.sgf', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
export const TSUMEGO_PROBLEMS = Object.entries(sources)
  .map(([path, raw]) => readProblem(raw, path.split('/').pop()!.replace('.sgf', '')))
  .sort((a, b) => a.number - b.number)
