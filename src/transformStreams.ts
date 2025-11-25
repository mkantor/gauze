import { elementSpecifications, resolveStartSequence } from './elements.js'
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
  #mutableTagStack: OpeningTagStack = []
  constructor() {
    super({
      transform: (chunk, controller) => {
        if (chunk.kind === 'openingTag') {
          this.#mutableTagStack.push(chunk)
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

const tokenToOutput = (token: Token, tagStack: OpeningTagStack): string => {
  switch (token.kind) {
    case 'text':
      return escapeText(token.text)
    case 'openingTag':
      return resolveStartSequence(token)
    case 'closingTag':
      const currentOpeningTag = tagStack[tagStack.length - 1]
      if (currentOpeningTag === undefined) {
        throw new Error(
          'Received a `closingTag` token without a current tag name. This is a bug!',
        )
      }
      let output = elementSpecifications[currentOpeningTag.tagName].end
      for (const ancestorOpeningTag of tagStack.slice(0, -1)) {
        output += resolveStartSequence(ancestorOpeningTag)
      }
      return output
  }
}

const escapeText = (content: string): string => content.replaceAll('\x1B', '␛')

type OpeningTagStack = Extract<Token, { readonly kind: 'openingTag' }>[]
