import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { OS } from '../../../../../base/browser/platform';
import { DCHECK } from '../../../../../base/check';
import { memoize } from '../../../../../base/common/decorators';
import { createSimpleKeybinding, KeyCode } from '../../../../../base/common/keyCodes';
import { Disposable, toDisposable } from '../../../../../base/common/lifecycle';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { ICommandService } from '../../../../../platform/commands/common/commands';
import { CommandService } from '../../../../../platform/commands/common/commandService';
import { IContextKeyService } from '../../../../../platform/contextkey/common/contextkey';
import { SyncDescriptor } from '../../../../../platform/instantiation/common/descriptors';
import { IInstantiationService } from '../../../../../platform/instantiation/common/instantiation';
import { ServiceCollection } from '../../../../../platform/instantiation/common/serviceCollection';
import { IKeybindingService } from '../../../../../platform/keybinding/common/keybinding';
import { IToolService } from '../../../../../platform/tool/common/tool';
import { Editor, Operation, Range, SelectionOperation, Transforms } from '../editor';
import { CanvasEditor } from './canvasEditorInterface';
import { ITextEditorService, TextEditorKeybindingService, TextEditorService } from './platform';
import './commands/deleteBackward';
import './commands/extendLine';
import './commands/moveInline';
import './commands/moveBlock';
import './commands/selectAll';

const EscKeybinding = createSimpleKeybinding(KeyCode.Escape, OS);

export class ViewController extends Disposable {
  _canvasEditor: CanvasEditor;
  _contextKeyService: IContextKeyService;
  _instantiationService: IInstantiationService;
  constructor(
    private editor: Editor,
    private canvas: ICanvas,
    private onEsc: () => void,
    @IInstantiationService instantiationService: IInstantiationService,
    @IContextKeyService contextKeyService: IContextKeyService,
  ) {
    super();
    this._canvasEditor = new CanvasEditor(this.canvas);
    this._registerDOMEvent();
    const serviceCollection = new ServiceCollection();
    const textEditorService = new TextEditorService();
    textEditorService.addEditor(editor);

    this._contextKeyService = this._register(contextKeyService.createScoped(this.editor.el));
    serviceCollection.set(ITextEditorService, textEditorService);
    serviceCollection.set(IKeybindingService, new SyncDescriptor(TextEditorKeybindingService));
    serviceCollection.set(IContextKeyService, this._contextKeyService);
    serviceCollection.set(ICommandService, new SyncDescriptor(CommandService));
    this._instantiationService = instantiationService.createChild(serviceCollection);
    this._registerEditorEvent();
    // 处理初始的 selection 状态
    this._onDOMSelectionChange();
  }

  @memoize
  private get _keybindingService(): IKeybindingService {
    return this._instantiationService.invokeFunction((accessor) => {
      return accessor.get<IKeybindingService>(IKeybindingService);
    });
  }

  private resolveKeybinding(e: IKeyboardEvent) {
    return this.canvas.invokeWithinContext(accessor => {
      const keybindingService = accessor.get<IKeybindingService>(IKeybindingService);
      return keybindingService.resolveKeyboardEvent(e);
    });
  }
  //#endregion

  //#region keybinding handlers
  private _exit() {
    this.onEsc();
    this.canvas.view.document.getSelection().removeAllRanges();
    this.canvas.invokeWithinContext(accessor => {
      const toolService = accessor.get<IToolService>(IToolService);
      toolService.switchDefault();
    });
  }
  //#endregion

  //#region register event
  private _registerDOMEvent() {
    const selection = this.canvas.view.document.getSelection();
    this._register(selection.onDidChange(() => this._onDOMSelectionChange()));
  }

  private _onDOMSelectionChange() {
    const domSelection = this.canvas.view.document.getSelection();
    if (domSelection.anchorNode) {
      const range = this._canvasEditor.toSlateRange(this.editor, domSelection, {
        exactMatch: false,
        suppressThrow: true,
      });

      DCHECK(range);
      Transforms.select(this.editor, range);
    } else {
      Transforms.deselect(this.editor);
    }
  }

  private _registerEditorEvent() {
    this.editor.onChange = (options?: { operation?: Operation }) => {
      console.log('op', options);
      if (!options) NOTIMPLEMENTED();
      const { operation } = options;
      if (!operation) NOTIMPLEMENTED();
      if (Operation.isSelectionOperation(operation)) {
        return this.handleEditorSelectionOperation(operation);
      }
    };
    this._register(toDisposable(() => this.editor.onChange = () => {}));
  }
  //#endregion

  //#region editor operations
  handleEditorSelectionOperation(op: SelectionOperation) {
    const rangeOfSlate = this.editor.selection;
    DCHECK(rangeOfSlate);

    const domSelection = this.canvas.view.document.getSelection();
    const rangeOfDOM = this._canvasEditor.toSlateRange(this.editor, domSelection, {
      exactMatch: false,
      suppressThrow: true,
    });
    DCHECK(rangeOfDOM);
    if (!Range.equals(rangeOfSlate, rangeOfDOM)) {
      const { anchor, focus } = rangeOfSlate;
      const anchorP = this.editor.root.children[anchor.path[0]];
      DCHECK(anchorP.isBlock());
      const anchorSpan = anchorP.children[anchor.path[1]];
      DCHECK(anchorSpan.isText());

      const focusP = this.editor.root.children[focus.path[0]];
      DCHECK(focusP.isBlock());
      const focusSpan = focusP.children[focus.path[1]];
      DCHECK(focusSpan.isText());

      const document = this.canvas.view.document;
      const anchorEl = document.getElementById(anchorSpan.id);
      DCHECK(anchorEl);
      const focusEl = document.getElementById(focusSpan.id);
      DCHECK(focusEl);

      const selection = document.getSelection();
      const range = document.createRange();
      range.setStart(anchorEl.firstChild!, anchor.offset);
      range.setEnd(focusEl.firstChild!, focus.offset);
      selection.addRange(range);
    }
  }
  //#endregion

  //#region DOM events
  public type(text: string): void {
    // const { view } = this;
    // if (!/[\r\n]/.test(text)) {
    //   view.dispatch(view.state.tr.insertText(text));
    // }
  }

  public compositionType(text: string, replacePrevCharCnt: number, replaceNextCharCnt: number, positionDelta: number): void {
    DCHECK(!replaceNextCharCnt);
    DCHECK(!positionDelta);

    // const { view } = this;
    // const { state } = view;
    // let { tr, selection } = state;
    // const { head } = selection;
    // if (replacePrevCharCnt) {
    //   tr.delete(head - replacePrevCharCnt, head);
    // }
    // tr.insertText(text);
    // view.dispatch(tr);
  }

  public compositionStart(): void {
    // const { view } = this;
    // const { state } = view;
    // const { selection } = state;
    // if (!selection.empty) {
    //   let { tr } = state;
    //   view.dispatch(tr.deleteSelection());
    // }
    // DCHECK(selection.empty);
  }

  public compositionEnd(): void {
  }

  public keyDown(event: IKeyboardEvent): void {
    const keybinding = event.toKeybinding();
    if (keybinding.equals(EscKeybinding)) {
      this.onEsc();
      return;
    }
    this._keybindingService.dispatchEvent(event, this.editor.el);
    console.log('keydown', this.resolveKeybinding(event).getLabel());
  };

  public focus() {
    // console.log('focus');
  }

  public blur() {
    // console.log('blur');
    // this._handleEsc();
  }
  //#endregion
}
