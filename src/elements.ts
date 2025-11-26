export type TagName = keyof typeof elementSpecifications

export type VoidElementTagName = keyof {
  // An element is void if its end sequence is an empty string.
  [TagName in keyof ElementSpecifications as ElementSpecifications[TagName]['end'] extends ''
    ? TagName
    : never]: unknown
}

export type AttributesByTagName = {
  [TagName in keyof ElementSpecifications]: ElementSpecifications[TagName]['start'] extends (
    attributes: infer Attributes,
  ) => unknown
    ? Attributes
    : {}
}

type ColorAttributes = {
  readonly background?: boolean
}
const basicColor = (colorIndicator: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) => ({
  start: (attributes: ColorAttributes) =>
    `\x1B[${attributes.background ? 4 : 3}${colorIndicator}m`,
  end: (attributes: ColorAttributes) =>
    `\x1B[${attributes.background ? 4 : 3}9m`,
})

export const elementSpecifications = {
  move: {
    start: (
      attributes:
        | {
            readonly absolute: true
            readonly relative?: false
            readonly x: bigint
            readonly y: bigint
          }
        | {
            readonly relative: true
            readonly absolute?: false
            readonly x: bigint
            readonly y: bigint
          },
    ) =>
      attributes.absolute === true
        ? `\x1B[${attributes.x};${attributes.y}H`
        : `${
            attributes.x < 0
              ? `\x1B[${attributes.x}D`
              : attributes.x > 0
              ? `\x1B[${attributes.x}C`
              : ''
          }${
            attributes.y < 0
              ? `\x1B[${attributes.y}A`
              : attributes.y > 0
              ? `\x1B[${attributes.y}B`
              : ''
          }`,
    end: '',
  },

  erase: {
    start: (
      attributes:
        | {
            readonly screen: true
            readonly line?: false
            readonly to?: false
          }
        | {
            readonly line: true
            readonly screen?: false
            readonly to?: false
          }
        | {
            readonly to:
              | 'screen-start'
              | 'screen-end'
              | 'line-start'
              | 'line-end'
            readonly screen?: false
            readonly line?: false
          },
    ) => {
      if (attributes.screen === true) {
        return '\x1B[2J'
      } else if (attributes.line === true) {
        return '\x1B[2K'
      } else if (attributes.to === 'screen-start') {
        return '\x1B[1J'
      } else if (attributes.to === 'screen-end') {
        return '\x1B[0J'
      } else if (attributes.to === 'line-start') {
        return '\x1B[1K'
      } else {
        const _assertExhaustion: 'line-end' = attributes.to
        return '\x1B[0K'
      }
    },
    end: '',
  },

  bold: { start: '\x1B[22m\x1B[1m', end: '\x1B[22m' },
  dim: { start: '\x1B[22m\x1B[2m', end: '\x1B[22m' },
  italic: { start: '\x1B[3m', end: '\x1B[23m' },
  underline: { start: '\x1B[4m', end: '\x1B[24m' },
  blink: { start: '\x1B[5m', end: '\x1B[25m' },
  negative: { start: '\x1B[7m', end: '\x1B[27m' },
  conceal: { start: '\x1B[8m', end: '\x1B[28m' },

  black: basicColor(0),
  red: basicColor(1),
  green: basicColor(2),
  yellow: basicColor(3),
  blue: basicColor(4),
  magenta: basicColor(5),
  cyan: basicColor(6),
  white: basicColor(7),
} as const

export const resolveStartSequence = ({
  tagName,
  attributes,
}: TagNameWithAttributes): string => {
  switch (tagName) {
    // These silly repetitive cases prove that everything is in alignment.
    case 'move':
      return elementSpecifications[tagName].start(attributes)
    case 'erase':
      return elementSpecifications[tagName].start(attributes)
    case 'black':
    case 'red':
    case 'green':
    case 'yellow':
    case 'blue':
    case 'magenta':
    case 'cyan':
    case 'white':
      return elementSpecifications[tagName].start(attributes)
    default:
      return elementSpecifications[tagName].start
  }
}

export const resolveEndSequence = ({
  tagName,
  attributes,
}: TagNameWithAttributes): string => {
  switch (tagName) {
    // These silly repetitive cases prove that everything is in alignment.
    case 'black':
    case 'red':
    case 'green':
    case 'yellow':
    case 'blue':
    case 'magenta':
    case 'cyan':
    case 'white':
      return elementSpecifications[tagName].end(attributes)
    default:
      return elementSpecifications[tagName].end
  }
}

type ElementSpecifications = typeof elementSpecifications

type TagNameWithAttributes = {
  [TagName in keyof ElementSpecifications]: {
    readonly tagName: TagName
    readonly attributes: AttributesByTagName[TagName]
  }
}[keyof ElementSpecifications]
