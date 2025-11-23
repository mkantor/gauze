import type { Token } from './token.js'
import { OutputTransformStream } from './transformStreams.js'

export class ReadableTokenStream extends ReadableStream<Token> {
  static fromConcatenatedReadableStreams(
    streams: readonly ReadableStream<Token>[],
  ): ReadableTokenStream {
    let currentIndex = 0
    let currentIterator = streams[currentIndex]?.[Symbol.asyncIterator]()

    return new ReadableTokenStream({
      pull: async controller => {
        let nextResult: IteratorResult<Token, undefined> = {
          done: true,
          value: undefined,
        }
        while (nextResult.done && currentIterator !== undefined) {
          try {
            nextResult = await currentIterator.next()
            if (nextResult.done) {
              // Try again with the next stream.
              currentIndex = currentIndex + 1
              currentIterator = streams[currentIndex]?.[Symbol.asyncIterator]()
            }
          } catch (error) {
            controller.error(error)
            return
          }
        }

        if (nextResult.done) {
          controller.close()
        } else {
          controller.enqueue(nextResult.value)
        }
      },
    })
  }

  asStrings(): ReadableStream<string> {
    return this.pipeThrough(new OutputTransformStream())
  }

  asBytes(): ReadableStream<Uint8Array<ArrayBufferLike>> {
    return this.asStrings().pipeThrough(new TextEncoderStream())
  }
}
