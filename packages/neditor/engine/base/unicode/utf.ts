/**
 * Helper constant for U16_GET_SUPPLEMENTARY.
 * @internal
 */
const U16_SURROGATE_OFFSET = ((0xd800 << 10) + 0xdc00 - 0x10000);
/**
 * Is this code unit a trail surrogate (U+dc00..U+dfff)?
 * @param c 16-bit code unit
 * @return TRUE or FALSE
 * @stable ICU 2.4
 */
export function U16_IS_TRAIL(c: number): boolean {return (((c) & 0xfffffc00) == 0xdc00);}

/**
 * Get a supplementary code point value (U+10000..U+10ffff)
 * from its lead and trail surrogates.
 * The result is undefined if the input values are not
 * lead and trail surrogates.
 *
 * @param lead lead surrogate (U+d800..U+dbff)
 * @param trail trail surrogate (U+dc00..U+dfff)
 * @return supplementary code point (U+10000..U+10ffff)
 * @stable ICU 2.4
 */
export function U16_GET_SUPPLEMENTARY(lead: number, trail: number) {
  return (((lead) << 10) + (trail) - U16_SURROGATE_OFFSET);
}
