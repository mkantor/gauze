import assert from 'node:assert'
import stream from 'node:stream'
import test, { suite } from 'node:test'
import { readableStreamFromChunk } from './readableStream.js'
import { ReadableTokenStream } from './readableTokenStream.js'
import { arrayFromAsync } from './testUtilities.test.js'
import type { Token } from './token.js'

suite('ReadableTokenStream', _ => {
  test('creation', async () => {
    const token: Token = { kind: 'text', text: 'Hello, world!' }

    const stream1 = ReadableTokenStream.fromConcatenatedReadableStreams([
      readableStreamFromChunk(token),
    ])
    const stream2 = new ReadableTokenStream({
      pull: async controller => {
        controller.enqueue(token)
        controller.close()
      },
    })

    const outputChunks = await Promise.all([
      arrayFromAsync(stream1),
      arrayFromAsync(stream2),
    ])

    assert.deepEqual(outputChunks[0], outputChunks[1])
  })

  test('empty stream to terminal', async () => {
    const tokenStream = readableStreamFromTokens([])

    assert.deepEqual(
      await chunksFromMockTerminal(tokenStream, { hasColors: false }),
      [],
    )
  })

  test('non-empty stream to terminal', async () => {
    const tokenStream = readableStreamFromTokens([
      { kind: 'text', text: 'plain' },
      {
        kind: 'openingTag',
        tagName: 'bold',
        attributes: {},
      },
      { kind: 'text', text: 'bold' },
      { kind: 'closingTag' },
      { kind: 'text', text: 'plain again' },
    ])

    assert.deepEqual(
      await chunksFromMockTerminal(tokenStream, { hasColors: false }),
      ['plain', '\x1B[22m\x1B[1m', 'bold', '\x1B[22m', 'plain again'],
    )
  })

  test('terminal capability detection', async () => {
    const tokens: readonly Token[] = [
      {
        kind: 'openingTag',
        tagName: 'color',
        attributes: { red: 0.02, green: 0.04, blue: 0.08 },
      },
      { kind: 'text', text: 'Hello, world!' },
      { kind: 'closingTag' },
    ]

    const outputChunksWithoutTrueColor = await chunksFromMockTerminal(
      readableStreamFromTokens(tokens),
      { hasColors: false },
    )

    const outputChunksWithTrueColor = await chunksFromMockTerminal(
      readableStreamFromTokens(tokens),
      { hasColors: true },
    )

    assert.deepEqual(outputChunksWithoutTrueColor, [
      '\x1B[38;5;232m',
      'Hello, world!',
      '\x1B[39m',
    ])

    assert.deepEqual(outputChunksWithTrueColor, [
      '\x1B[38;2;5;10;20m',
      'Hello, world!',
      '\x1B[39m',
    ])
  })
})

const readableStreamFromTokens = (tokens: readonly Token[]) =>
  new ReadableTokenStream({
    pull: async controller => {
      for (const token of tokens) {
        controller.enqueue(token)
      }
      controller.close()
    },
  })

const chunksFromMockTerminal = (
  tokenStream: ReadableTokenStream,
  { hasColors }: { readonly hasColors: boolean },
): Promise<readonly string[]> => {
  const mockWriteStream = new MockTTY({ hasColors })
  const result = tokenStream.pipeToTerminal(mockWriteStream)
  return new Promise((resolve, reject) => {
    result.on('finish', () => resolve(mockWriteStream.output))
    result.on('error', reject)
  })
}

class MockTTY extends stream.Writable {
  output
  hasColors
  constructor({ hasColors }: { readonly hasColors: boolean }) {
    const chunks: string[] = []
    super({
      write: (chunk: string | Buffer, _encoding, callback) => {
        chunks.push(typeof chunk === 'string' ? chunk : chunk.toString())
        callback()
      },
    })

    this.output = chunks
    if (hasColors) {
      this.hasColors = () => true
    }
  }
}
