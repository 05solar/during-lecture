// SGF FF[4] reader: preserves variations, escaped comments and setup ranges.
export interface SgfNode {
  props: Record<string, string[]>
  children: SgfNode[]
}

export function parseSgf(source: string): SgfNode {
  let cursor = 0
  const skip = () => { while (/\s/.test(source[cursor] ?? '') && cursor < source.length) cursor++ }
  function value(): string {
    cursor++
    let result = ''
    while (cursor < source.length) {
      const ch = source[cursor++]
      if (ch === ']') return result
      if (ch === '\\') {
        const escaped = source[cursor++]
        if (escaped === '\r' || escaped === '\n') {
          if (escaped === '\r' && source[cursor] === '\n') cursor++
        } else if (escaped !== undefined) result += escaped
      } else result += ch
    }
    throw new Error('Unterminated SGF value')
  }
  function tree(): SgfNode {
    skip()
    if (source[cursor++] !== '(') throw new Error('Expected SGF tree')
    let root: SgfNode | undefined
    let tail: SgfNode | undefined
    skip()
    while (source[cursor] === ';') {
      cursor++
      const node: SgfNode = { props: {}, children: [] }
      if (tail) tail.children.push(node)
      else root = node
      tail = node
      skip()
      while (/[A-Za-z]/.test(source[cursor] ?? '') && cursor < source.length) {
        let name = ''
        while (/[A-Za-z]/.test(source[cursor] ?? '') && cursor < source.length) name += source[cursor++]
        skip()
        const values: string[] = []
        while (source[cursor] === '[') { values.push(value()); skip() }
        if (!values.length) throw new Error('SGF property without value')
        node.props[name] = [...(node.props[name] ?? []), ...values]
      }
    }
    while (source[cursor] === '(') { tail!.children.push(tree()); skip() }
    if (!root || source[cursor++] !== ')') throw new Error('Malformed SGF tree')
    return root
  }
  const root = tree()
  skip()
  if (cursor !== source.length) throw new Error('Expected a single SGF game')
  return root
}

export function sgfPoint(value: string): number {
  if (!value || value === 'tt') return -1
  if (!/^[a-s]{2}$/.test(value)) throw new Error(`Invalid SGF point: ${value}`)
  return (value.charCodeAt(1) - 97) * 19 + value.charCodeAt(0) - 97
}

export function setupPoints(values: string[] = []): number[] {
  return values.flatMap(value => {
    if (!value.includes(':')) return [sgfPoint(value)]
    const [start, end] = value.split(':').map(sgfPoint)
    const points: number[] = []
    for (let row = Math.floor(start / 19); row <= Math.floor(end / 19); row++) {
      for (let col = start % 19; col <= end % 19; col++) points.push(row * 19 + col)
    }
    return points
  })
}
