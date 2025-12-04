# gauze

Gauze is an embedded DSL for generating [`ReadableStream`s][readable-stream] of
text containing [ANSI escape sequences][ansi] using typed [JSX][jsx].

Child nodes can be async values or streams.

Here's an example:

```tsx
import { createElement } from '@superhighway/gauze'

;(
  <>
    <bold>bold</bold> <dim>dim</dim> <italic>italic</italic> <underline>underline</underline>
    {'\n'}
    <negative>
      <red>R</red>
      <color red="75%" green="25%" blue="0%">O</color>
      <yellow>Y</yellow>
      <green>G</green>
      <cyan>B</cyan>
      <blue>I</blue>
      <magenta>V</magenta>
    </negative>
    {'\n'}
  </>
).readable.pipe(process.stdout)
```

In my terminal that looks like this:

<!-- This screenshot is double-sized and shrank for HiDPI screens. -->
<img src="./media/screenshot.png" alt="Screenshot" width="340">

## Setup

To use Gauze, add these options to your `tsconfig.json`[^1]:

```json
"jsx": "react",
"jsxFactory": "createElement",
"jsxFragmentFactory": "createElement",
```

Also, `import { createElement } from '@superhighway/gauze'` in each of your
`.tsx` files.

## Elements

### Formatting

#### `<bold>`, `<dim>`, `<italic>`, `<underline>`, `<blink>`, `<negative>`, `<conceal>`

These each apply the given style to their contents and take no attributes.

### Colors

#### `<black>`, `<red>`, `<green>`, `<yellow>`, `<blue>`, `<magenta>`, `<cyan>`, `<white>`

These set the foreground color of their contents, or the background color if the
boolean `background` attribute is set (e.g.
`<red background>this has a red background</red>`). These colors are typically
configurable by users, so exact shades may vary.

#### `<color>`

Sets a more precise color using 8-bit color codes. Expects attributes `red`,
`green`, and `blue` to specify each color channel (values may be either numbers
between `0` and `1` or strings ending with a `%` sign, e.g. `red={0.5}` or
`red="50%"`). Color specification assumes the standard [xterm color
palette][xterm-colors].

Like the named colors, `<color>` accepts a boolean `background` attribute (e.g.
`<color background red="40%" green="10%" blue="10%"><green>this is green with a
reddish background</green></color>`).

### Commands

#### `<move />`

A void element which moves the cursor to the specified location. Has `relative`
and `absolute` modes, specified via boolean attributes with those names, and
attributes named `x` and `y` (whose values are `bigint`s or numeric strings) to
specify the location/offset. For example `<move relative x="-1" y="-1" />` moves
the cursor up and to the left by one, and `<move absolute x={0n} y={0n} />`
moves the cursor to the top-left corner of the terminal.

#### `<erase />`

A void element which erases text from the terminal. Has several different modes:

- `<erase screen />` erases the entire screen.
- `<erase line />` erases the line (where the cursor is).
- `<erase to="…" />` erases from the cursor to the indicated location. Possible
  attribute values for `to` are `"screen-start"`, `"screen-end"`,
  `"line-start"`, and `"line-end"`.

[^1]: `"jsx": "react"` may seem odd because Gauze isn't related to React, but
TypeScript's JSX configuration is based around React's semantics.

[ansi]: https://en.wikipedia.org/wiki/ANSI_escape_code
[jsx]: https://facebook.github.io/jsx/
[readable-stream]: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
[xterm-colors]: https://robotmoon.com/256-colors/
