import type { AttributesByTagName, TagName } from './elements.js'

export type Token =
  | {
      readonly kind: 'text'
      readonly text: string
    }
  | {
      [TagName in keyof AttributesByTagName]: {
        readonly kind: 'openingTag'
        readonly tagName: TagName
        readonly attributes: AttributesByTagName[TagName]
      }
    }[keyof AttributesByTagName]
  | {
      readonly kind: 'closingTag'
    }

/**
 * Like `Token`, but doesn't require attribute types to correspond with their
 * associated tags.
 */
export type LooseToken =
  | Extract<Token, { readonly kind: 'text' }>
  | Extract<Token, { readonly kind: 'closingTag' }>
  | {
      readonly kind: 'openingTag'
      readonly tagName: TagName
      readonly attributes: AttributesByTagName[TagName]
    }
