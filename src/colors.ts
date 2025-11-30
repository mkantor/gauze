/**
 * Convert an RGB tuple to the closest xterm-256color color index. Color
 * components should be numbers between 0 and 1, representing the amount of
 * each color.
 */
// All functions in this module besides this one accept RGB components as
// numbers in the range [0, 255].
export const rgbToColorIndex = (
  redPercentage: Percentage,
  greenPercentage: Percentage,
  bluePercentage: Percentage,
): ColorIndex => {
  if (
    redPercentage < 0 ||
    redPercentage > 1 ||
    isNaN(redPercentage) ||
    greenPercentage < 0 ||
    greenPercentage > 1 ||
    isNaN(greenPercentage) ||
    bluePercentage < 0 ||
    bluePercentage > 1 ||
    isNaN(bluePercentage)
  ) {
    throw new RangeError(
      'Value for one or more color components was out of bounds; should be a number between 0 and 1',
    )
  }

  const red = redPercentage * 255
  const green = greenPercentage * 255
  const blue = bluePercentage * 255

  // Try the grayscale range and color cube range, use whichever is closer to
  // the desired color.

  const gray = rgbToGrayColorIndex(red, green, blue)
  const grayRGB = grayColorIndexToRGB(gray)

  const cube = rgbToCubeColorIndex(red, green, blue)
  const cubeRGB = cubeColorIndexToRGB(cube)

  const grayDistance = distance(
    [red, green, blue],
    [grayRGB[0], grayRGB[1], grayRGB[2]],
  )
  const cubeDistance = distance(
    [red, green, blue],
    [cubeRGB[0], cubeRGB[1], cubeRGB[2]],
  )

  return grayDistance <= cubeDistance ? gray : cube
}

/** A percentage value modeled as a number in the range [0, 1]. */
type Percentage = number

// These are both in the range [0, 255], but have different semantics.
type ColorComponentAsByte = number
type ColorIndex = number

type ColorTuple = readonly [
  red: ColorComponentAsByte,
  green: ColorComponentAsByte,
  blue: ColorComponentAsByte,
]
const colorCubeLevels = [0, 95, 135, 175, 215, 255] as const

const nearestCubeColorIndex = (
  colorComponent: ColorComponentAsByte,
): ColorIndex => {
  const best = colorCubeLevels.reduce(
    (best, colorLevel, index) => {
      const difference = Math.abs(colorComponent - colorLevel)
      if (difference < best.difference) {
        return { index, difference }
      } else {
        return best
      }
    },
    { index: 0, difference: Infinity },
  )
  return best.index
}

const rgbToCubeColorIndex = (...[red, green, blue]: ColorTuple): ColorIndex => {
  const redIndex = nearestCubeColorIndex(red)
  const greenIndex = nearestCubeColorIndex(green)
  const blueIndex = nearestCubeColorIndex(blue)
  return 16 + 36 * redIndex + 6 * greenIndex + blueIndex
}

function cubeColorIndexToRGB(index: ColorIndex): ColorTuple {
  const red = colorCubeLevels[Math.floor((index - 16) / 36)]
  const green = colorCubeLevels[Math.floor(((index - 16) % 36) / 6)]
  const blue = colorCubeLevels[(index - 16) % 6]
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error('Color components could not be determined. This is a bug!')
  }
  return [red, green, blue]
}

const rgbToLuma = (...[red, green, blue]: ColorTuple): number =>
  // See <https://en.wikipedia.org/wiki/Luma_(video)#Rec._601_luma_versus_Rec._709_luma_coefficients>.
  // The difference between Rec. 601 and Rec. 709 is hard to notice since there
  // are only 23 shades of gray, but Rec. 709 is used here.
  0.2126 * red + 0.7152 * green + 0.0722 * blue

const rgbToGrayColorIndex = (...[red, green, blue]: ColorTuple): ColorIndex => {
  const luma = rgbToLuma(red, green, blue)
  const scaledLuma = Math.round((luma - 8) / 10)

  // Grayscale indexes are 232–255.
  const grayIndex = 232 + Math.min(Math.max(scaledLuma, 0), 23)
  return grayIndex
}

const grayColorIndexToRGB = (index: ColorIndex): ColorTuple => {
  const value = 8 + (index - 232) * 10
  return [value, value, value]
}

const distance = (color1: ColorTuple, color2: ColorTuple): number =>
  (color1[0] - color2[0]) ** 2 +
  (color1[1] - color2[1]) ** 2 +
  (color1[2] - color2[2]) ** 2
