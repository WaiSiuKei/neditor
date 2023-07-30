import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { IDisposable } from '../../../../../base/common/lifecycle';
import { Optional } from '../../../../../base/common/typescript';
import { Document } from '../../../../../engine/dom/document';
import { DOMNode, DOMSelection } from './dom';
import { ICanvasUpdater } from '../canvasUpdater';
import type { EditorState } from '../state/state';
import type { Transaction } from '../state/transaction';
import { DOMObserver } from './domObserver';
import { InputState } from './input';
import { Decoration, DecorationSource } from './decoration';
import { Mark } from '../model';
import { HTMLElement } from '../../../../../engine/dom/html_element';
import { NodeView, NodeViewDesc } from './viewdesc';
import { Plugin } from '../state/plugin';

export interface EditorProps<P = any> {
  handleKeyDown?: (this: P, view: IEditorView, event: IKeyboardEvent) => boolean | void;
}

export interface DirectEditorProps extends EditorProps {
  /// The current state of the editor.
  state: EditorState;

  /// A set of plugins to use in the view, applying their [plugin
  /// view](#state.PluginSpec.view) and
  /// [props](#state.PluginSpec.props). Passing plugins with a state
  /// component (a [state field](#state.PluginSpec.state) field or a
  /// [transaction](#state.PluginSpec.filterTransaction) filter or
  /// appender) will result in an error, since such plugins must be
  /// present in the state to work.
  plugins?: readonly Plugin[];

  /// The callback over which to send transactions (state updates)
  /// produced by the view. If you specify this, you probably want to
  /// make sure this ends up calling the view's
  /// [`updateState`](#view.EditorView.updateState) method with a new
  /// state that has the transaction
  /// [applied](#state.EditorState.apply). The callback will be bound to have
  /// the view instance as its `this` binding.
  // dispatchTransaction?: (tr: Transaction) => void;
}

export interface IDOMStateProvider {
  hasFocus(): boolean;
}

export interface IEditorView extends IDisposable {
  input: InputState;
  state: EditorState;
  dom: DOMNode;
  nodeViews: NodeViewSet;
  docView: NodeViewDesc;
  domObserver: DOMObserver;
  updater: ICanvasUpdater;
  root: Document;
  focused: boolean;
  hasFocus(): boolean;
  dispatch(tr: Transaction): void;
  updateState(state: EditorState): void;
  domSelection(): DOMSelection;
  posAtCoords(coords: { left: number, top: number }): Optional<{ pos: number, inside: number }>;
  endOfTextblock(dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward', state?: EditorState): boolean;

  someProp<PropName extends keyof EditorProps, Result>(
    propName: PropName,
    f: (value: NonNullable<EditorProps[PropName]>) => Result
  ): Result | undefined;
  someProp<PropName extends keyof EditorProps>(propName: PropName): NonNullable<EditorProps[PropName]> | undefined;
  someProp<PropName extends keyof EditorProps, Result>(
    propName: PropName,
    f?: (value: NonNullable<EditorProps[PropName]>) => Result
  ): Result | undefined;
}

/// The type of function [provided](#view.EditorProps.nodeViews) to
/// create [node views](#view.NodeView).
export type NodeViewConstructor = (node: Node, view: IEditorView, getPos: () => number | undefined,
                                   decorations: readonly Decoration[], innerDecorations: DecorationSource) => NodeView

/// The function types [used](#view.EditorProps.markViews) to create
/// mark views.
export type MarkViewConstructor = (mark: Mark, view: IEditorView, inline: boolean) => {
  dom: HTMLElement,
  contentDOM?: HTMLElement
}

export type NodeViewSet = { [name: string]: NodeViewConstructor | MarkViewConstructor }
