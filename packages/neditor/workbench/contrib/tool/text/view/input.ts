import { isMacintosh } from "../../../../../base/common/platform";
import { NOTIMPLEMENTED } from "../../../../../base/common/notreached";
import { IEditorView } from "./view";

export class InputState {
  shiftKey = false
  mouseDown: MouseDown | null = null
  lastKeyCode: number | null = null
  lastKeyCodeTime = 0
  lastClick = { time: 0, x: 0, y: 0, type: "" }
  lastSelectionOrigin: string | null = null
  lastSelectionTime = 0
  lastIOSEnter = 0
  lastIOSEnterFallbackTimeout = -1
  lastFocus = 0
  lastTouch = 0
  lastAndroidDelete = 0
  composing = false
  composingTimeout = -1
  compositionNodes: any[] = []
  compositionEndedAt = -2e8
}

const selectNodeModifier: keyof MouseEvent = isMacintosh ? "metaKey" : "ctrlKey"

function setSelectionOrigin(view: IEditorView, origin: string) {
  NOTIMPLEMENTED()
  // view.input.lastSelectionOrigin = origin
  // view.input.lastSelectionTime = Date.now()
}

export class MouseDown {
  startDoc: Node
  selectNode: boolean
  allowDefault: boolean
  delayedSelectionSync = false
  mightDrag: { node: Node, pos: number, addAttr: boolean, setUneditable: boolean } | null = null
  target: HTMLElement | null

  constructor(
    readonly view: IEditorView,
    readonly pos: { pos: number, inside: number },
    readonly event: MouseEvent,
    readonly flushed: boolean
  ) {
    NOTIMPLEMENTED()
    // this.startDoc = view.state.doc
    // this.selectNode = !!event[selectNodeModifier]
    // this.allowDefault = event.shiftKey
    //
    // let targetNode: Node, targetPos
    // if (pos.inside > -1) {
    //   targetNode = view.state.doc.nodeAt(pos.inside)!
    //   targetPos = pos.inside
    // } else {
    //   let $pos = view.state.doc.resolve(pos.pos)
    //   targetNode = $pos.parent
    //   targetPos = $pos.depth ? $pos.before() : 0
    // }
    //
    // const target = flushed ? null : event.target as HTMLElement
    // const targetDesc = target ? view.docView.nearestDesc(target, true) : null
    // this.target = targetDesc ? targetDesc.dom as HTMLElement : null
    //
    // let { selection } = view.state
    // if (event.button == 0 &&
    //   targetNode.type.spec.draggable && targetNode.type.spec.selectable !== false ||
    //   selection instanceof NodeSelection && selection.from <= targetPos && selection.to > targetPos)
    //   this.mightDrag = {
    //     node: targetNode,
    //     pos: targetPos,
    //     addAttr: !!(this.target && !this.target.draggable),
    //     setUneditable: !!(this.target && browser.gecko && !this.target.hasAttribute("contentEditable"))
    //   }
    //
    // if (this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable)) {
    //   this.view.domObserver.stop()
    //   if (this.mightDrag.addAttr) this.target.draggable = true
    //   if (this.mightDrag.setUneditable)
    //     setTimeout(() => {
    //       if (this.view.input.mouseDown == this) this.target!.setAttribute("contentEditable", "false")
    //     }, 20)
    //   this.view.domObserver.start()
    // }
    //
    // view.root.addEventListener("mouseup", this.up = this.up.bind(this) as any)
    // view.root.addEventListener("mousemove", this.move = this.move.bind(this) as any)
    // setSelectionOrigin(view, "pointer")
  }

  done() {
    NOTIMPLEMENTED()
    // this.view.root.removeEventListener("mouseup", this.up as any)
    // this.view.root.removeEventListener("mousemove", this.move as any)
    // if (this.mightDrag && this.target) {
    //   this.view.domObserver.stop()
    //   if (this.mightDrag.addAttr) this.target.removeAttribute("draggable")
    //   if (this.mightDrag.setUneditable) this.target.removeAttribute("contentEditable")
    //   this.view.domObserver.start()
    // }
    // if (this.delayedSelectionSync) setTimeout(() => selectionToDOM(this.view))
    // this.view.input.mouseDown = null
  }

  up(event: MouseEvent) {
    NOTIMPLEMENTED()
    // this.done()
    //
    // if (!this.view.dom.contains(event.target as HTMLElement))
    //   return
    //
    // let pos: { pos: number, inside: number } | null = this.pos
    // if (this.view.state.doc != this.startDoc) pos = this.view.posAtCoords(eventCoords(event))
    //
    // this.updateAllowDefault(event)
    // if (this.allowDefault || !pos) {
    //   setSelectionOrigin(this.view, "pointer")
    // } else if (handleSingleClick(this.view, pos.pos, pos.inside, event, this.selectNode)) {
    //   event.preventDefault()
    // } else if (event.button == 0 &&
    //   (this.flushed ||
    //     // Safari ignores clicks on draggable elements
    //     (browser.safari && this.mightDrag && !this.mightDrag.node.isAtom) ||
    //     // Chrome will sometimes treat a node selection as a
    //     // cursor, but still report that the node is selected
    //     // when asked through getSelection. You'll then get a
    //     // situation where clicking at the point where that
    //     // (hidden) cursor is doesn't change the selection, and
    //     // thus doesn't get a reaction from ProseMirror. This
    //     // works around that.
    //     (browser.chrome && !this.view.state.selection.visible &&
    //       Math.min(Math.abs(pos.pos - this.view.state.selection.from),
    //         Math.abs(pos.pos - this.view.state.selection.to)) <= 2))) {
    //   updateSelection(this.view, Selection.near(this.view.state.doc.resolve(pos.pos)), "pointer")
    //   event.preventDefault()
    // } else {
    //   setSelectionOrigin(this.view, "pointer")
    // }
  }

  move(event: MouseEvent) {
    this.updateAllowDefault(event)
    setSelectionOrigin(this.view, "pointer")
    if (event.buttons == 0) this.done()
  }

  updateAllowDefault(event: MouseEvent) {
    if (!this.allowDefault && (Math.abs(this.event.x - event.clientX) > 4 ||
      Math.abs(this.event.y - event.clientY) > 4))
      this.allowDefault = true
  }
}
