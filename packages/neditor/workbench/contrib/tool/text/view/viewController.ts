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
import { IContextKeyService, IContextKeyServiceTarget } from '../../../../../platform/contextkey/common/contextkey';
import { SyncDescriptor } from '../../../../../platform/instantiation/common/descriptors';
import { IInstantiationService } from '../../../../../platform/instantiation/common/instantiation';
import { ServiceCollection } from '../../../../../platform/instantiation/common/serviceCollection';
import { IKeybindingService } from '../../../../../platform/keybinding/common/keybinding';
import { DescendantModelProxy, isTextNodeModelProxy } from '../../../../../platform/model/common/model';
import { IToolService } from '../../../../../platform/tool/common/tool';
import { Editor, Operation, Range, Text, TextOperation, Transforms } from '../editor';
import { TextTransforms } from '../editor/interfaces/transforms/text';
import { CanvasEditor } from './canvasEditorInterface';
import { LineFeed } from './common';
import { ITextEditorService, TextEditorKeybindingService, TextEditorService } from './platform';
import './commands';

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
    this._canvasEditor = new CanvasEditor(this.editor, this.canvas);
    this._registerDOMEvent();
    const serviceCollection = new ServiceCollection();
    const textEditorService = new TextEditorService();
    textEditorService.addEditor(editor);

    this._contextKeyService = this._register(contextKeyService.createScoped(this.editor.el as IContextKeyServiceTarget));
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
      const range = this._canvasEditor.toSlateRange(domSelection, {
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
      if (!options) NOTIMPLEMENTED();
      const { operation } = options;
      if (!operation) NOTIMPLEMENTED();
      if (Operation.isSelectionOperation(operation)) {
        return this.syncSelectionToDOM();
      }
      if (Operation.isNodeOperation(operation)) {
        this.syncSelectionToDOM();
      }
      if (Operation.isTextOperation(operation)) {
        return this.handleTextOperation(operation);
      }
      console.log('op', performance.now(), options?.operation?.type, options?.operation);
    };
    this._register(toDisposable(() => this.editor.onChange = () => {}));
  }
  //#endregion

  //#region editor operations
  syncSelectionToDOM(force = false) {
    const rangeOfSlate = this.editor.selection;
    DCHECK(rangeOfSlate);

    const domSelection = this.canvas.view.document.getSelection();
    const rangeOfDOM = this._canvasEditor.toSlateRange(domSelection, {
      exactMatch: false,
      suppressThrow: true,
    });
    DCHECK(rangeOfDOM);
    if (!Range.equals(rangeOfSlate, rangeOfDOM) || force) {
      const { anchor, focus } = rangeOfSlate;
      const anchorP = this.editor.root.children[anchor.path[0]] as DescendantModelProxy;
      DCHECK(anchorP.isBlock());
      const anchorSpan = anchorP.children[anchor.path[1]];
      DCHECK(anchorSpan.isText());

      const focusP = this.editor.root.children[focus.path[0]] as DescendantModelProxy;
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

  handleTextOperation(operation: TextOperation) {
    // const { type, offset, text, path } = operation;
    // const node = this._canvasEditor.toNode(path);
    this.canvas.transform(() => {});
    /**
     * compositionType 的时候
     * step1 输入a，编辑器插入了a，候选的有「啊...」等汉字
     * step2 按空格，这时选中了第一个，即「啊」
     * 这时 selection 不变，但是光标位置变了，所以要强制刷一下
     */
    this.syncSelectionToDOM(true);
  }
  //#endregion

  //#region DOM events
  public type(text: string): void {
    if (text === LineFeed) {
      console.log('line feed');
    } else {
      // console.log('type', text);
      Editor.deleteFragment(this.editor);
      TextTransforms.insertText(this.editor, text);
    }
  }

  public compositionType(text: string, replacePrevCharCnt: number, replaceNextCharCnt: number, positionDelta: number): void {
    DCHECK(!replaceNextCharCnt);
    DCHECK(!positionDelta);

    TextTransforms.delete(this.editor, { unit: 'character', distance: replacePrevCharCnt, reverse: true });
    TextTransforms.insertText(this.editor, text);
  }

  public compositionStart(): void {
  }

  public compositionEnd(): void {
  }

  public keyDown(event: IKeyboardEvent): void {
    const keybinding = event.toKeybinding();
    if (keybinding.equals(EscKeybinding)) {
      this.onEsc();
      return;
    }
    this._keybindingService.dispatchEvent(event, this.editor.el as IContextKeyServiceTarget);
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
