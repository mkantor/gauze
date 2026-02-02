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

    assert.deepEqual(await chunksFromMockTerminal(tokenStream), [])
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

    assert.deepEqual(await chunksFromMockTerminal(tokenStream), [
      'plain',
      '\x1B[22m\x1B[1m',
      'bold',
      '\x1B[22m',
      'plain again',
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
): Promise<readonly string[]> => {
  const chunks: string[] = []
  const mockWriteStream = new stream.Writable({
    write: (chunk: string | Buffer, _encoding, callback) => {
      chunks.push(typeof chunk === 'string' ? chunk : chunk.toString())
      callback()
    },
  })

  const result = tokenStream.pipeToTerminal(mockWriteStream)
  return new Promise((resolve, reject) => {
    result.on('finish', () => resolve(chunks))
    result.on('error', reject)
  })
}
