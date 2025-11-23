import { elementSpecifications, type TagName } from './elements.js'
import type { Token } from './token.js'

export class TextCapturingTransformStream extends TransformStream<
  string | Token,
  Token
> {
  constructor() {
    super({
      transform: (chunk, controller) => {
        // Omit empty text chunks.
        if (chunk !== '') {
          controller.enqueue(
            typeof chunk === 'string' ? { kind: 'text', text: chunk } : chunk,
          )
        }
      },
    })
  }
}

export class OutputTransformStream extends TransformStream<Token, string> {
  #mutableTagStack: TagName[] = []
  constructor() {
    super({
      transform: (chunk, controller) => {
        if (chunk.kind === 'openingTag') {
          this.#mutableTagStack.push(chunk.tagName)
        }
        const htmlFragment = tokenToOutput(chunk, this.#mutableTagStack)
        if (chunk.kind === 'closingTag') {
          this.#mutableTagStack.pop()
        }
        if (htmlFragment !== '') {
          controller.enqueue(htmlFragment)
        }
      },
    })
  }
}

const tokenToOutput = (chunk: Token, tagStack: readonly TagName[]): string => {
  switch (chunk.kind) {
    case 'text':
      return escapeText(chunk.text)
    case 'openingTag':
      return elementSpecifications[chunk.tagName].start
    case 'closingTag':
      const parentTagName = tagStack[tagStack.length - 2]
      const currentTagName = tagStack[tagStack.length - 1]
      if (currentTagName === undefined) {
        throw new Error(
          'Received a `closingTag` token without a current tag name. This is a bug!',
        )
      }
      let output = elementSpecifications[currentTagName].end
      if (parentTagName !== undefined) {
        output += elementSpecifications[parentTagName].start
      }
      return output
  }
}

const escapeText = (content: string): string => content.replaceAll('\x1B', '␛')
