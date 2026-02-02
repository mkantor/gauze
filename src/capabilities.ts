export type TerminalCapabilities = {
  /** Sequences like `\x1B[38;2;{r};{g};{b}m` and `\x1B[48;2;{r};{g};{b}m`. */
  readonly xtermTrueColor: boolean
}
