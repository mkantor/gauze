export type TagName = keyof typeof elementSpecifications
export type VoidElementTagName = (typeof voidTagNames)[number]

export const elementSpecifications = {
  moveAbsolute: {
    start: (attributes: { readonly row: bigint; readonly column: bigint }) =>
      `\x1B[${attributes.row};${attributes.column}H`,
    end: '',
  },
  moveRelative: {
    start: (attributes: {
      readonly horizontal: bigint
      readonly vertical: bigint
    }) =>
      `${
        attributes.horizontal < 0
          ? `\x1B[${attributes.horizontal}D`
          : attributes.horizontal > 0
          ? `\x1B[${attributes.horizontal}C`
          : ''
      }${
        attributes.vertical < 0
          ? `\x1B[${attributes.vertical}A`
          : attributes.vertical > 0
          ? `\x1B[${attributes.vertical}B`
          : ''
      }`,
    end: '',
  },

  eraseToEndOfScreen: { start: '\x1B[0J', end: '' },
  eraseFromStartOfScreen: { start: '\x1B[1J', end: '' },
  eraseScreen: { start: '\x1B[2J', end: '' },
  eraseToEndOfLine: { start: '\x1B[0K', end: '' },
  eraseFromStartOfLine: { start: '\x1B[1K', end: '' },
  eraseLine: { start: '\x1B[2K', end: '' },

  bold: { start: '\x1B[22m\x1B[1m', end: '\x1B[22m' },
  dim: { start: '\x1B[22m\x1B[2m', end: '\x1B[22m' },
  italic: { start: '\x1B[3m', end: '\x1B[23m' },
  underline: { start: '\x1B[4m', end: '\x1B[24m' },
  blink: { start: '\x1B[5m', end: '\x1B[25m' },
  negative: { start: '\x1B[7m', end: '\x1B[27m' },
  conceal: { start: '\x1B[8m', end: '\x1B[28m' },

  black: { start: '\x1B[30m', end: '\x1B[39m' },
  red: { start: '\x1B[31m', end: '\x1B[39m' },
  green: { start: '\x1B[32m', end: '\x1B[39m' },
  yellow: { start: '\x1B[33m', end: '\x1B[39m' },
  blue: { start: '\x1B[34m', end: '\x1B[39m' },
  magenta: { start: '\x1B[35m', end: '\x1B[39m' },
  cyan: { start: '\x1B[36m', end: '\x1B[39m' },
  white: { start: '\x1B[37m', end: '\x1B[39m' },

  blackBackground: { start: '\x1B[40m', end: '\x1B[49m' },
  redBackground: { start: '\x1B[41m', end: '\x1B[49m' },
  greenBackground: { start: '\x1B[42m', end: '\x1B[49m' },
  yellowBackground: { start: '\x1B[43m', end: '\x1B[49m' },
  blueBackground: { start: '\x1B[44m', end: '\x1B[49m' },
  magentaBackground: { start: '\x1B[45m', end: '\x1B[49m' },
  cyanBackground: { start: '\x1B[46m', end: '\x1B[49m' },
  whiteBackground: { start: '\x1B[47m', end: '\x1B[49m' },
}

export const resolveStartSequence = ({
  tagName,
  attributes,
}: TagNameWithAttributes): string => {
  switch (tagName) {
    // These silly repetitive cases prove that everything is in alignment.
    case 'moveAbsolute':
      return elementSpecifications[tagName].start(attributes)
    case 'moveRelative':
      return elementSpecifications[tagName].start(attributes)
    default:
      return elementSpecifications[tagName].start
  }
}

export type AttributesByTagName = {
  [TagName in keyof ElementSpecifications]: ElementSpecifications[TagName]['start'] extends (
    attributes: infer Attributes,
  ) => unknown
    ? Attributes
    : {}
}

const voidTagNames = [
  'eraseFromStartOfLine',
  'eraseFromStartOfScreen',
  'eraseLine',
  'eraseScreen',
  'eraseToEndOfLine',
  'eraseToEndOfScreen',
  'moveAbsolute',
  'moveRelative',
] as const

const voidTagNamesAsSet = new Set<TagName>(voidTagNames)
export const isVoidElementTagName = (
  tagName: TagName,
): tagName is VoidElementTagName => voidTagNamesAsSet.has(tagName)

type ElementSpecifications = typeof elementSpecifications

type TagNameWithAttributes = {
  [TagName in keyof ElementSpecifications]: {
    readonly tagName: TagName
    readonly attributes: AttributesByTagName[TagName]
  }
}[keyof ElementSpecifications]
