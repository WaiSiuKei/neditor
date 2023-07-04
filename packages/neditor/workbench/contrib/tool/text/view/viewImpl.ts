import { NOTREACHED } from '../../../../../base/common/notreached';
import { Optional } from '../../../../../base/common/typescript';
import { Document } from '../../../../../engine/dom/document';
import { ICanvasUpdater } from '../canvasUpdater';
import { selectionToDOM } from './dom';
import { InputState } from './input';
import { EditorState } from '../state/state';
import { DirectEditorProps, EditorProps, IDOMStateProvider, IEditorView, NodeViewSet } from './view';
import { Transaction } from '../state/transaction';
import { isChrome, isIE } from '../../../../../base/browser/browser';
import { docViewDesc, NodeViewDesc } from './viewdesc';
import { clearComposition, syncNodeSelection } from './viewUpdate';
import { selectionContextChanged } from '../state/selection';
import { DOMObserver } from './domObserver';
import { Decoration, viewDecorations } from './decoration';
import { HTMLElement } from '../../../../../engine/dom/html_element';
import { posAtCoords } from './domcoords';
import { Disposable } from '../../../../../base/common/lifecycle';
import { endOfTextblock } from './domcoords';
import { Plugin } from '../state/plugin';

export class EditorView extends Disposable implements IEditorView {
  focused = false;
  input = new InputState;
  state: EditorState;
  domObserver: DOMObserver;
  nodeViews: NodeViewSet = Object.create(null);
  docView: NodeViewDesc;
  private _props: DirectEditorProps;
  private directPlugins: readonly Plugin[];
  constructor(
    public dom: HTMLElement,
    public root: Document,
    public domState: IDOMStateProvider,
    public updater: ICanvasUpdater,
    props: DirectEditorProps
  ) {
    super();
    this._props = props;
    this.directPlugins = props.plugins || [];
    this.state = props.state;

    this.dispatch = this.dispatch.bind(this);

    /**
     * 在prosemirror，EditorView的dom是new出来然后挂在外部指定的容器下
     * 这里的实现是直接使用外部指定的dom
     */
    this.docView = this._register(docViewDesc(this.state.doc, computeDocDeco(this), viewDecorations(this), this.dom, this));

    this.domObserver = this._register(new DOMObserver(this));
    this.domObserver.start();
    this._register(this.updater.onAfterMutation(() => {
      this.updateStateAfterMutation();
    }));
  }

  get composing() {
    return this.input.composing;
  }

  hasFocus(): boolean {
    return this.domState.hasFocus();
  }

  domSelection() {
    return this.root.getSelection();
  }

  dispatch(tr: Transaction) {
    this.updateState(this.state.apply(tr));
  }

  /// Goes over the values of a prop, first those provided directly,
  /// then those from plugins given to the view, then from plugins in
  /// the state (in order), and calls `f` every time a non-undefined
  /// value is found. When `f` returns a truthy value, that is
  /// immediately returned. When `f` isn't provided, it is treated as
  /// the identity function (the prop value is returned directly).
  someProp<PropName extends keyof EditorProps, Result>(
    propName: PropName,
    f: (value: NonNullable<EditorProps[PropName]>) => Result
  ): Result | undefined
  someProp<PropName extends keyof EditorProps>(propName: PropName): NonNullable<EditorProps[PropName]> | undefined
  someProp<PropName extends keyof EditorProps, Result>(
    propName: PropName,
    f?: (value: NonNullable<EditorProps[PropName]>) => Result
  ): Result | undefined {
    let prop = this._props && this._props[propName], value;
    if (prop != null && (value = f ? f(prop as any) : prop)) return value as any;
    for (let i = 0; i < this.directPlugins.length; i++) {
      let prop = this.directPlugins[i].props[propName];
      if (prop != null && (value = f ? f(prop as any) : prop)) return value as any;
    }
    let plugins = this.state.plugins;
    if (plugins) for (let i = 0; i < plugins.length; i++) {
      let prop = plugins[i].props[propName];
      if (prop != null && (value = f ? f(prop as any) : prop)) return value as any;
    }
  }

  updateStateAfterMutation() {
    let state = this.state;
    // When stored marks are added, stop composition, so that they can
    // be displayed.
    if (state.storedMarks && this.composing) {
      clearComposition(this);
    }

    // updateCursorWrapper(this)
    // let innerDeco = viewDecorations(this);
    // let outerDeco = computeDocDeco(this);
    //
    // this.domObserver.stop();
    // this.docView.updateOuterDeco([]);
    // this.docView.destroy();
    // this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this);

    if (!(this.input.mouseDown)
    ) {
      selectionToDOM(this, true);
    } else {
      syncNodeSelection(this, state.selection);
      this.domObserver.setCurSelection();
    }
    this.domObserver.start();
  }

  updateState(state: EditorState) {
    let prev = this.state;
    let updateSel = false;
    // When stored marks are added, stop composition, so that they can
    // be displayed.
    if (state.storedMarks && this.composing) {
      clearComposition(this);
      updateSel = true;
    }
    this.state = state;

    let innerDeco = viewDecorations(this);
    let outerDeco = computeDocDeco(this);

    let updateDoc = !this.docView.matchesNode(state.doc, outerDeco, innerDeco);
    if (updateDoc || !state.selection.eq(prev.selection)) updateSel = true;

    if (updateDoc) {
      // If the node that the selection points into is written to,
      // Chrome sometimes starts misreporting the selection, so this
      // tracks that and forces a selection reset when our update
      // did write to the node.
      // let chromeKludge = isChrome ? (this.trackWrites = this.domSelectionRange().focusNode) : null
      if (!this.docView.update(state.doc, outerDeco, innerDeco, this)) {
        NOTREACHED();
        //   this.docView.updateOuterDeco([])
        //   this.docView.destroy()
        //   this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this)
      }
      // if (chromeKludge && !this.trackWrites) forceSelUpdate = true
    }

    if (updateSel /*&& !this.hasPendingUpdate()*/) {
      this.domObserver.stop();
      // Work around an issue in Chrome, IE, and Edge where changing
      // the DOM around an active selection puts it into a broken
      // state where the thing the user sees differs from the
      // selection reported by the Selection object (#710, #973,
      // #1011, #1013, #1035).
      let forceSelUpdate = updateDoc
        && (isIE || isChrome)
        && !this.composing
        && !prev.selection.empty
        && !state.selection.empty
        && selectionContextChanged(prev.selection, state.selection);

      if (forceSelUpdate ||
        !(this.input.mouseDown
          && this.domObserver.currentSelection.eq(this.domSelection())
        )
      ) {
        selectionToDOM(this, forceSelUpdate);
      } else {
        syncNodeSelection(this, state.selection);
        this.domObserver.setCurSelection();
      }
      this.domObserver.start();
    }
  }

  /// Given a pair of viewport coordinates, return the document
  /// position that corresponds to them. May return null if the given
  /// coordinates aren't inside of the editor. When an object is
  /// returned, its `pos` property is the position nearest to the
  /// coordinates, and its `inside` property holds the position of the
  /// inner node that the position falls inside of, or -1 if it is at
  /// the top level, not in any node.
  posAtCoords(coords: { left: number, top: number }): Optional<{ pos: number, inside: number }> {
    return posAtCoords(this, coords);
  }

  /// Find out whether the selection is at the end of a textblock when
  /// moving in a given direction. When, for example, given `"left"`,
  /// it will return true if moving left from the current cursor
  /// position would leave that position's parent textblock. Will apply
  /// to the view's current state by default, but it is possible to
  /// pass a different state.
  endOfTextblock(dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward', state?: EditorState): boolean {
    return endOfTextblock(this, state || this.state, dir);
  }
}

function computeDocDeco(view: EditorView) {
  return [Decoration.node(0, view.state.doc.content.size, {})];
}
