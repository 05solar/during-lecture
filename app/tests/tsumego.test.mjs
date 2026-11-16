import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { buildSync } from 'esbuild'

const code = buildSync({ stdin: { contents: `export * from './src/pages/TsumegoGame/sgf'; export * from './src/pages/TsumegoGame/tsumegoStudy'; export * from './src/pages/TsumegoGame/tsumegoGo';`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm' }).outputFiles[0].text
const study = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const { parseSgf, setupPoints, sgfPoint, readProblem, positionAt, startPosition, advance, emptyState, play, recordResult, emptyProgress, loadProgress } = study
const raw = number => readFileSync(`src/pages/TsumegoGame/problems/ggg-hard-${String(number).padStart(2, '0')}.sgf`, 'utf8')

test('SGF escapes, multiline comments, branches and compressed setup points', () => {
  const tree = parseSgf('(;SZ[19]C[escaped \\] and \\\\ slash\nline]AB[aa:bb](;B[cc]C[Correct])(;B[dd];W[ee]))')
  assert.equal(tree.props.C[0], 'escaped ] and \\ slash\nline')
  assert.deepEqual(setupPoints(tree.props.AB), [0, 1, 19, 20])
  assert.equal(tree.children.length, 2)
  assert.equal(tree.children[1].children[0].props.W[0], 'ee')
  assert.throws(() => parseSgf('(;C[unfinished)'))
  assert.throws(() => sgfPoint('za'))
})

test('all 140 authored problems and their branches replay legally; 921 explicit correct nodes', () => {
  const files = readdirSync('src/pages/TsumegoGame/problems').filter(file => file.endsWith('.sgf'))
  assert.equal(files.length, 140)
  let solutions = 0, nodes = 0
  for (const file of files) {
    const problem = readProblem(readFileSync(`src/pages/TsumegoGame/problems/${file}`, 'utf8'), file.replace('.sgf', ''))
    assert.ok(problem.root.hasSolution)
    solutions += problem.solutionCount
    function walk(node, path = []) {
      nodes++
      if (node.correct) assert.equal(positionAt(problem, path).node.id, node.id)
      node.children.forEach((child, i) => walk(child, [...path, i]))
    }
    walk(problem.root)
  }
  assert.equal(solutions, 921)
  assert.ok(nodes > 5000)
})

test('published problem 1 accepts cr-br-bs-cs-es-as-gs and distinguishes unlisted moves', () => {
  const problem = readProblem(raw(1), 'ggg-hard-01')
  let position = startPosition(problem)
  for (const move of ['cr', 'br', 'bs', 'cs', 'es', 'as', 'gs']) position = advance(position, sgfPoint(move))
  assert.equal(position.node.correct, true)
  assert.equal(position.moves.length, 7)
  assert.equal(advance(startPosition(problem), sgfPoint('gs')).node.hasSolution, false)
  assert.equal(advance(startPosition(problem), sgfPoint('aa')).node, null)
  assert.equal(problem.initial.board[sgfPoint('cr')], 0)
})

test('published problem 2 retains three defenses and alternative correct answers', () => {
  const problem = readProblem(raw(2), 'ggg-hard-02')
  const first = advance(startPosition(problem), sgfPoint('jr'))
  assert.equal(first.node.children.filter(node => node.hasSolution).length, 3)
  const branch = study.historyAt(problem, [0, 1])
  assert.equal(branch.length, 2)
  assert.equal(branch[0].moves.length, 0)
  assert.equal(branch[1].moves[0].point, sgfPoint('jr'))
  let position = first
  for (const move of ['kr', 'dr', 'fr', 'fq', 'js']) position = advance(position, sgfPoint(move))
  assert.deepEqual(position.node.children.filter(n => n.correct).map(n => n.move), ['fs', 'ds'].map(sgfPoint))
})

test('ko remains a valid authored outcome, not a fabricated unconditional kill', () => {
  const problem = readProblem(raw(4), 'ggg-hard-04')
  let position = startPosition(problem)
  for (const move of ['rr', 'or', 'qs', 'ps', 'pr']) position = advance(position, sgfPoint(move))
  assert.equal(position.node.correct, true)
  assert.match(position.node.comment, /ko/i)
})

test('Go rules capture, reject immediate ko/suicide and preserve prior snapshots', () => {
  const state = emptyState()
  for (const point of ['ba', 'ab', 'bc']) state.board[sgfPoint(point)] = 1
  for (const point of ['bb', 'ca', 'cc', 'db']) state.board[sgfPoint(point)] = 2
  const result = play(state, sgfPoint('cb'))
  assert.equal(result.captured, 1)
  assert.equal(result.state.ko, sgfPoint('bb'))
  assert.equal(play(result.state, sgfPoint('bb')), null)
  assert.equal(state.board[sgfPoint('bb')], 2)
  assert.ok(play(play(play(result.state, -1).state, -1).state, sgfPoint('bb')))
  assert.equal(play(state, NaN), null)
  assert.equal(play(state, 1.5), null)
  const surrounded = emptyState()
  for (const point of ['ba', 'ab', 'bc', 'cb']) surrounded.board[sgfPoint(point)] = 2
  assert.equal(play(surrounded, sgfPoint('bb')), null)
})

test('hints and mistakes schedule review without awarding solved credit; clean solves extend intervals', () => {
  const now = 1000000
  const reviewed = recordResult(undefined, false, 20, now)
  assert.equal(reviewed.solved, 0)
  assert.equal(reviewed.due, now + 600000)
  const solved = recordResult(reviewed, true, 30, now)
  assert.equal(solved.solved, 1)
  assert.equal(solved.due, now + 86400000)
  const again = recordResult(solved, true, 40, now)
  assert.equal(again.due, now + 3 * 86400000)
  assert.equal(again.bestSeconds, 30)
  assert.deepEqual(loadProgress('{broken'), {})
  assert.deepEqual(loadProgress(JSON.stringify({ bad: {}, 'ggg-hard-01': { ...emptyProgress(), due: -1 } })), {})
  assert.equal(loadProgress(JSON.stringify({ 'ggg-hard-01': again }))['ggg-hard-01'].solved, 2)
})
