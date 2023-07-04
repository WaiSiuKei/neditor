// Checks whether a character is affected by a CSS white space processing.
//   https://www.w3.org/TR/css3-text/#white-space-rules
export function IsWhiteSpace(character: string): boolean {
  // Histogram from Apple's page load test combined with some ad hoc browsing
  // some other test suites.
  //
  //     82%: 216330 non-space characters, all > U+0020
  //     11%:  30017 plain space characters, U+0020
  //      5%:  12099 newline characters, U+000A
  //      2%:   5346 tab characters, U+0009
  //
  // No other characters seen. No U+000C or U+000D, and no other control
  // characters. Accordingly, we check for non-spaces first, then space,
  // then newline, then tab, then the other characters.

  return character.codePointAt(0)! <= (' ').codePointAt(0)! &&
    (character == ' ' || character == '\n' || character == '\t' ||
      character == '\r' || character == '\f');
}
