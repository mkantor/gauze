import type { TagName } from './elements.js'

export type Token =
  | {
      readonly kind: 'text'
      readonly text: string
    }
  | {
      readonly kind: 'openingTag'
      readonly tagName: TagName
    }
  | {
      readonly kind: 'closingTag'
    }
