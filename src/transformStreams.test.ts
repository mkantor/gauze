import assert from 'node:assert'
import test, { suite } from 'node:test'
import { readableStreamFromIterable } from './readableStream.js'
import { arrayFromAsync } from './testUtilities.test.js'
import type { Token } from './token.js'
import { OutputTransformStream } from './transformStreams.js'

suite('transform streams', _ => {
  test('output', async _ => {
    assert.deepEqual(
      await arrayFromAsync(
        readableStreamFromIterable<Token>([
          { kind: 'text', text: 'Hello, ' },
          { kind: 'openingTag', tagName: 'bold', attributes: {} },
          { kind: 'text', text: 'world' },
          { kind: 'closingTag' },
          { kind: 'text', text: '!' },
        ]).pipeThrough(new OutputTransformStream()),
      ),
      ['Hello, ', '\x1B[22m\x1B[1m', 'world', '\x1B[22m', '!'],
    )
  })
})
