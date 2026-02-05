import stream from 'node:stream'
import tty from 'node:tty'
import type { TerminalCapabilities } from './capabilities.js'
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

  pipeToTerminal(
    // Despite what @node/types claims, IO streams like `process.stdout` aren't
    // always `tty.WriteStream`s (e.g. when output is redirected to a file).
    // See <https://github.com/DefinitelyTyped/DefinitelyTyped/issues/68299>.
    terminalWriteStream: tty.WriteStream | stream.Writable,
  ): stream.Writable {
    const capabilities: TerminalCapabilities = {
      // NOTE: This is sketchy. The mechanisms by which `hasColors` detects
      // color support are unreliable, also a terminal may support 24-bit colors
      // without using xterm-style escape sequences.
      xtermTrueColor:
        'hasColors' in terminalWriteStream &&
        typeof terminalWriteStream.hasColors === 'function'
          ? terminalWriteStream.hasColors(2 ** 24, process.env)
          : false,
    }

    return stream.Readable.fromWeb(
      this.pipeThrough(new OutputTransformStream(capabilities)),
    ).pipe(terminalWriteStream)
  }
}
