import { Directive } from '.'
import { NOTIMPLEMENTED } from "../../../../../../base/common/notreached";

export const html: Directive = ({ el, get, effect }) => {
  effect(() => {
    NOTIMPLEMENTED()
  })
}
