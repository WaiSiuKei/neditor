export class SkGradientShader {
  static Flags = {
    /** By default gradients will interpolate their colors in unpremul space
     *  and then premultiply each of the results. By setting this flag, the
     *  gradients will premultiply their colors first, and then interpolate
     *  between them.
     *  example: https://fiddle.skia.org/c/@GradientShader_MakeLinear
     */
    kInterpolateColorsInPremul_Flag: 1 << 0,
  };
}
