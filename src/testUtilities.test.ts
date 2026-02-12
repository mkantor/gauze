import type { TerminalCapabilities } from './capabilities.js'
import type { ReadableTokenStream } from './readableTokenStream.js'
import { OutputTransformStream } from './transformStreams.js'

// TODO: Switch to `Array.fromAsync`.
export const arrayFromAsync = async <T>(
  source: AsyncIterable<T>,
): Promise<readonly T[]> => {
  const array = []
  for await (const element of source) {
    array.push(element)
  }
  return array
}

export const asArrayOfOutputChunks = async (
  capabilities: TerminalCapabilities,
  source: ReadableTokenStream,
) => arrayFromAsync(source.pipeThrough(new OutputTransformStream(capabilities)))

export const createMockElement = (tagName: string): MockElement => ({
  tagName,
  attributes: new Map(),
  content: [],
  parentElement: null,
  ownerDocument: { createElement: createMockElement },
  setAttribute(name, value) {
    this.attributes.set(name, value)
  },
  append(...nodes) {
    for (const node of nodes) {
      if (typeof node !== 'string') {
        node.parentElement = this
      }
      this.content.push(node)
    }
  },
})

type MockElement = {
  tagName: string
  attributes: Map<string, string>
  content: (string | MockElement)[]
  parentElement: MockElement | null
  readonly ownerDocument: {
    readonly createElement: (tagName: string) => MockElement
  }
  readonly setAttribute: (name: string, value: string) => void
  readonly append: (...nodes: readonly (MockElement | string)[]) => void
}
