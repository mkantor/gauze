import assert from 'node:assert'
import test, { suite } from 'node:test'
import { createElement } from './createElement.js'
import { readableStreamFromChunk } from './readableStream.js'
import { asArrayOfOutputChunks } from './testUtilities.test.js'

suite('createElement', _ => {
  test('empty element', async _ =>
    assert.deepEqual(await asArrayOfOutputChunks(createElement('bold', null)), [
      '\x1B[22m\x1B[1m',
      '\x1B[22m',
    ]))

  test('text content', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(createElement('bold', null, 'a')),
      ['\x1B[22m\x1B[1m', 'a', '\x1B[22m'],
    ))

  test('escaped text content', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(createElement('bold', null, '\x1Bgottem')),
      ['\x1B[22m\x1B[1m', '␛gottem', '\x1B[22m'],
    ))

  test('void elements', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(createElement('erase', { line: true })),
      ['\x1B[2K'],
    ))

  test('promise content', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(
        createElement('bold', null, Promise.resolve('\x1Bgottem')),
      ),
      ['\x1B[22m\x1B[1m', '␛gottem', '\x1B[22m'],
    ))

  test('stream content', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(
        createElement('bold', null, readableStreamFromChunk('\x1Bgottem')),
      ),
      ['\x1B[22m\x1B[1m', '␛gottem', '\x1B[22m'],
    ))

  test('attributes', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(
        createElement('move', { absolute: true, x: '42', y: '69' }),
      ),
      ['\x1B[42;69H'],
    ))
})
