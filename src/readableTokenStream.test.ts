import assert from 'node:assert'
import test, { suite } from 'node:test'
import { readableStreamFromChunk } from './readableStream.js'
import { ReadableTokenStream } from './readableTokenStream.js'
import { arrayFromAsync } from './testUtilities.test.js'

suite('ReadableTokenStream', _ => {
  test('empty stream as strings', async _ => {
    const chunks = await arrayFromAsync(
      ReadableTokenStream.fromConcatenatedReadableStreams([]).asStrings(),
    )

    assert.deepEqual(chunks, [])
  })

  test('non-empty stream as strings', async _ => {
    const chunks = await arrayFromAsync(
      ReadableTokenStream.fromConcatenatedReadableStreams([
        readableStreamFromChunk({
          kind: 'text',
          text: 'Hello, world!',
        }),
      ]).asStrings(),
    )

    assert.deepEqual(chunks, ['Hello, world!'])
  })

  test('empty stream as bytes', async _ => {
    const chunks = await arrayFromAsync(
      ReadableTokenStream.fromConcatenatedReadableStreams([]).asBytes(),
    )

    assert.deepEqual(chunks, [])
  })

  test('non-empty stream as bytes', async _ => {
    const chunks = await arrayFromAsync(
      ReadableTokenStream.fromConcatenatedReadableStreams([
        readableStreamFromChunk({
          kind: 'text',
          text: 'Hello, world!',
        }),
      ]).asBytes(),
    )

    const encoder = new TextEncoder()
    assert.deepEqual(chunks, [encoder.encode('Hello, world!')])
  })
})
