import type {
  AttributesByTagName,
  TagName,
  VoidElementTagName,
} from './elements.js'
import {
  concatReadableStreams,
  readableStreamFromChunk,
  readableStreamFromIterable,
  readableStreamFromPromise,
} from './readableStream.js'
import { ReadableTokenStream } from './readableTokenStream.js'
import type { LooseToken, Token } from './token.js'
import { TextCapturingTransformStream } from './transformStreams.js'

/** The type of the `...children` rest parameter of `createElement`. */
export type Children<SpecificTagName extends TagName> =
  SpecificTagName extends VoidElementTagName
    ? readonly []
    : readonly (Child | readonly Child[])[]

export const createElement = (
  // This function gets called for fragments too. Direct callers of
  // `createElement` shouldn't have to see the function parameter, so the
  // externally-visible type above excludes `CreateFragmentParameters`.
  ...[tagNameOrFragmentFunction, attributes, ...children]:
    | CreateElementParameters
    | CreateFragmentParameters
) => {
  const childrenAsStreams = children.map(child =>
    isReadonlyArray(child)
      ? concatReadableStreams(child.map(childToReadableStream))
      : childToReadableStream(child),
  )

  if (typeof tagNameOrFragmentFunction === 'function') {
    // This is a fragment.
    return ReadableTokenStream.fromConcatenatedReadableStreams(
      childrenAsStreams,
    )
  } else {
    // This is an element.
    return ReadableTokenStream.fromConcatenatedReadableStreams([
      readableStreamFromChunk<Token>(
        // TODO: Use runtime validation to prove tag/attribute correspondence.
        {
          kind: 'openingTag',
          tagName: tagNameOrFragmentFunction,
          attributes: attributes ?? {},
        } satisfies LooseToken as Token,
      ),
      ...childrenAsStreams,
      readableStreamFromChunk<Token>({
        kind: 'closingTag',
      }),
    ])
  }
}

export type CreateElementParameters =
  | {
      readonly [SpecificTagName in TagName]: readonly [
        tagName: SpecificTagName,
        attributes: AttributesByTagName[SpecificTagName] | null,
        ...children: Children<SpecificTagName>,
      ]
    }[TagName]

type CreateFragmentParameters = readonly [
  // With standard configuration this will be `createElement` itself.
  component: (...parameters: never) => unknown,
  attributes: null,
  ...children: readonly (Child | readonly Child[])[],
]

type Child =
  | string
  | Promise<string | ReadableStream<string> | ReadableStream<Token>>
  | AsyncIterable<string>
  | ReadableStream<Token>

const childToReadableStream = (child: Child): ReadableStream<Token> => {
  let stream =
    typeof child === 'object' && Symbol.asyncIterator in child
      ? readableStreamFromIterable<Token | string>(child)
      : typeof child === 'string'
      ? readableStreamFromChunk(child)
      : readableStreamFromPromise<Token | string>(child)

  return stream.pipeThrough(new TextCapturingTransformStream())
}

const isReadonlyArray: (value: unknown) => value is readonly unknown[] =
  Array.isArray
