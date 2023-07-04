// Type-safe branching on a class hierarchy of transform functions,
// implemented after a classical GoF pattern (see
// http://en.wikipedia.org/wiki/Visitor_pattern#Java_example).
import type { MatrixFunction } from './matrix_function';
import type { RotateFunction } from './rotate_function';
import type { ScaleFunction } from './scale_function';
import type { TranslateFunction } from './translate_function';

export abstract class TransformFunctionVisitor {
  abstract VisitMatrix(matrix_function: MatrixFunction): void
  abstract VisitRotate(rotate_function: RotateFunction): void
  abstract VisitScale(scale_function: ScaleFunction): void
  abstract VisitTranslate(translate_function: TranslateFunction): void
};
