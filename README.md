# gauze

Gauze is an embedded DSL for generating text containing [ANSI escape
sequences][ansi] using typed [JSX][jsx].

## Setup

To use Gauze, add these options to your `tsconfig.json`[^1]:
```json
"jsx": "react",
"jsxFactory": "createElement",
"jsxFragmentFactory": "createElement",
```

Also, `import { createElement } from '@superhighway/gauze'` in each of your
`.tsx` files.

[^1]: `"jsx": "react"` may seem odd because Gauze isn't related to React, but
TypeScript's JSX configuration is based around React's semantics.

[ansi]: https://en.wikipedia.org/wiki/ANSI_escape_code
[jsx]: https://facebook.github.io/jsx/
[readable-stream]: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
