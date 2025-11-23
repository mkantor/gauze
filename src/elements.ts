export type TagName = keyof typeof elementSpecifications
export type VoidElementTagName = (typeof voidTagNames)[number]

export const elementSpecifications = {
  eraseLine: { start: '\x1B[2K', end: '' },
  bold: { start: '\x1B[22m\x1B[1m', end: '\x1B[22m' },
  dim: { start: '\x1B[22m\x1B[2m', end: '\x1B[22m' },
  red: { start: '\x1B[31m', end: '\x1B[39m' },
}

const voidTagNames = ['eraseLine'] as const

const voidTagNamesAsSet = new Set<TagName>(voidTagNames)
export const isVoidElementTagName = (
  tagName: TagName,
): tagName is VoidElementTagName => voidTagNamesAsSet.has(tagName)
