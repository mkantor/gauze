import assert from 'node:assert'
import test, { suite } from 'node:test'
import { createElement } from './jsx.js'
import { arrayFromAsync, asArrayOfOutputChunks } from './testUtilities.test.js'

suite('jsx', _ => {
  test('empty fragment', async _ =>
    assert.deepEqual(await asArrayOfOutputChunks(<></>), []))

  test('fragment with text content', async _ =>
    assert.deepEqual(await asArrayOfOutputChunks(<>blah</>), ['blah']))

  test('nested fragments', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(
        <>
          <>
            <>a</>
          </>
        </>,
      ),
      ['a'],
    ))

  test('fragment with mixed content', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(
        <>
          a
          <eraseLine />b
        </>,
      ),
      ['a', '\x1B[2K', 'b'],
    ))

  test('escaping', async _ =>
    assert.deepEqual(await asArrayOfOutputChunks(<>{'\x1B[1mhax'}</>), [
      '␛[1mhax',
    ]))

  test('same-element nesting', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(
        <red>
          <red>
            <red>really red</red>
          </red>
        </red>,
      ),
      [
        '\x1B[31m',
        '\x1B[31m',
        '\x1B[31m',
        'really red',
        '\x1B[39m\x1B[31m\x1B[31m',
        '\x1B[39m\x1B[31m',
        '\x1B[39m',
      ],
    ))

  test('convert to strings', async _ => {
    const html = await arrayFromAsync((<bold>a</bold>).asStrings())
    assert.deepEqual(html, ['\x1B[22m\x1B[1m', 'a', '\x1B[22m'])
  })

  test('convert to bytes', async _ => {
    const html = await arrayFromAsync((<bold>a</bold>).asBytes())
    const encoder = new TextEncoder()
    assert.deepEqual(html, [
      encoder.encode('\x1B[22m\x1B[1m'),
      encoder.encode('a'),
      encoder.encode('\x1B[22m'),
    ])
  })

  test('elaborate nesting', async _ =>
    assert.deepEqual(
      await asArrayOfOutputChunks(
        <>
          normal
          <bold>
            bold
            <dim>
              dim
              <bold>
                bold<red>redbold</red>bold
              </bold>
              dim<red>reddim</red>dim<bold>bold</bold>dim
            </dim>
            bold
          </bold>
          normal
          <dim>dim</dim>
          normal
          <red>red</red>
          normal
          <bold>bold</bold>
          normal
          <whiteBackground>
            <black>
              (black with white background)
              <red>(red with white background)</red>
              (black with white background)
            </black>
            <blue>
              <green>
                <redBackground>(green with red background)</redBackground>
                (green with white background)
              </green>
              <yellowBackground>(blue with yellow background)</yellowBackground>
              (blue with white background)
            </blue>
            (default with white background)
          </whiteBackground>
          <blink>
            (this{' '}
            <negative>
              <cyan>is</cyan>
            </negative>{' '}
            <italic>
              some{' '}
              <underline>
                <bold>
                  <conceal>secret </conceal>text
                </bold>
              </underline>
            </italic>
            )
          </blink>
          <eraseScreen />
          <move absolute x={0n} y={0n} />
          the end
        </>,
      ),
      [
        'normal',
        '\x1B[22m\x1B[1m',
        'bold',
        '\x1B[22m\x1B[2m',
        'dim',
        '\x1B[22m\x1B[1m',
        'bold',
        '\x1B[31m',
        'redbold',
        '\x1B[39m\x1B[22m\x1B[1m\x1B[22m\x1B[2m\x1B[22m\x1B[1m',
        'bold',
        '\x1B[22m\x1B[22m\x1B[1m\x1B[22m\x1B[2m',
        'dim',
        '\x1B[31m',
        'reddim',
        '\x1B[39m\x1B[22m\x1B[1m\x1B[22m\x1B[2m',
        'dim',
        '\x1B[22m\x1B[1m',
        'bold',
        '\x1B[22m\x1B[22m\x1B[1m\x1B[22m\x1B[2m',
        'dim',
        '\x1B[22m\x1B[22m\x1B[1m',
        'bold',
        '\x1B[22m',
        'normal',
        '\x1B[22m\x1B[2m',
        'dim',
        '\x1B[22m',
        'normal',
        '\x1B[31m',
        'red',
        '\x1B[39m',
        'normal',
        '\x1B[22m\x1B[1m',
        'bold',
        '\x1B[22m',
        'normal',
        '\x1B[47m',
        '\x1B[30m',
        '(black with white background)',
        '\x1B[31m',
        '(red with white background)',
        '\x1B[39m\x1B[47m\x1B[30m',
        '(black with white background)',
        '\x1B[39m\x1B[47m',
        '\x1B[34m',
        '\x1B[32m',
        '\x1B[41m',
        '(green with red background)',
        '\x1B[49m\x1B[47m\x1B[34m\x1B[32m',
        '(green with white background)',
        '\x1B[39m\x1B[47m\x1B[34m',
        '\x1B[43m',
        '(blue with yellow background)',
        '\x1B[49m\x1B[47m\x1B[34m',
        '(blue with white background)',
        '\x1B[39m\x1B[47m',
        '(default with white background)',
        '\x1B[49m',
        '\x1B[5m',
        '(this',
        ' ',
        '\x1B[7m',
        '\x1B[36m',
        'is',
        '\x1B[39m\x1B[5m\x1B[7m',
        '\x1B[27m\x1B[5m',
        ' ',
        '\x1B[3m',
        'some',
        ' ',
        '\x1B[4m',
        '\x1B[22m\x1B[1m',
        '\x1B[8m',
        'secret ',
        '\x1B[28m\x1B[5m\x1B[3m\x1B[4m\x1B[22m\x1B[1m',
        'text',
        '\x1B[22m\x1B[5m\x1B[3m\x1B[4m',
        '\x1B[24m\x1B[5m\x1B[3m',
        '\x1B[23m\x1B[5m',
        ')',
        '\x1B[25m',
        '\x1B[2J',
        '\x1B[0;0H',
        'the end',
      ],
    ))
})

// Type-level tests:
try {
  function FunctionWhichShouldNotBeUsableAsAComponent() {}
  class ClassWhichShouldNotBeUsableAsAComponent {}

  // @ts-expect-error
  ;<FunctionWhichShouldNotBeUsableAsAComponent />

  // @ts-expect-error
  ;<ClassWhichShouldNotBeUsableAsAComponent />

  // @ts-expect-error
  ;<eraseLine>illegal</eraseLine>

  // @ts-expect-error
  ;<non-existent-element />

  // @ts-expect-error
  ;<moveAbsolute row="not a number" column={0n} />

  // Unfortunately hyphenated attributes are special-cased by TypeScript (see
  // <https://github.com/microsoft/TypeScript/issues/32447>), so this is not a
  // type error.
  ;<red non-existent-attribute={() => '☹️'}></red>
} catch (_) {}
