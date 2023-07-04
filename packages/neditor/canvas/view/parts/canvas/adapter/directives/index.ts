import { Context } from '../context'
import { effect as rawEffect } from '@vue/reactivity'
import { bind } from './bind'
import { show } from './show'
import { text } from './text'
import { html } from './html'
import { model } from './model'
import { effect } from './effect'
import { Element } from "../../../../../../engine/dom/element";

export interface Directive<T = Element> {
  (ctx: DirectiveContext<T>): (() => void) | void
}

export interface DirectiveContext<T = Element> {
  el: T
  get: (exp?: string) => any
  effect: typeof rawEffect
  exp: string
  arg?: string
  modifiers?: Record<string, true>
  ctx: Context
}

export const builtInDirectives: Record<string, Directive<any>> = {
  bind,
  show,
  text,
  html,
  model,
  effect
}
