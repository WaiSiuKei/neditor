// Type-safe branching on a class hierarchy of render tree brushes,
// implemented after a classical GoF pattern (see
// http://en.wikipedia.org/wiki/Visitor_pattern#Java_example).
//
// Usage example:
//
//     class ShaderFactory : public BrushVisitor {
//       SkShader* shader() {
//         return shader_;
//       }
//
//       void Visit(SolidColorBrush* solid_color_brush) override {
//         shader_ = new SkColorShader(...);
//       }
//
//       void Visit(LinearGradientBrush* linear_gradient_brush) override {
//         shader_ = new SkGradientShader(...);
//       }
//
//       void Visit(RadialGradientBrush* radial_gradient_brush) override {
//         shader_ = new SkGradientShader(...);
//       }
//     };
//
//     ShaderFactory shader_factory;
//     render_tree_rect->background_brush().Accept(&shader_factory);
//     paint.setShader(shader_factory.shader());
//

import { LinearGradientBrush, RadialGradientBrush, SolidColorBrush } from './components/brush';

export abstract class BrushVisitor {
  abstract visitSolidColorBrush(solid_color_brush: SolidColorBrush): void;
  abstract visitLinearGradientBrush(linear_gradient_brush: LinearGradientBrush): void
  abstract visitRadialGradientBrush(radial_gradient_brush: RadialGradientBrush): void
}
