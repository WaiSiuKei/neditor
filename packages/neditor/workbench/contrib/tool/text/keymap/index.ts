import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { Command } from '../state/transaction';
import { IEditorView } from '../view/view';
import { Plugin } from '../state/plugin';

/// You can add multiple keymap plugins to an editor. The order in
/// which they appear determines their precedence (the ones early in
/// the array get to dispatch first).
export function keymapPlugin(bindings: Map<number, Command>): Plugin {
  return new Plugin({ props: { handleKeyDown: keydownHandler(bindings) } });
}

/// Given a set of bindings (using the same format as
/// [`keymap`](#keymap.keymap)), return a [keydown
/// handler](#view.EditorProps.handleKeyDown) that handles them.
export function keydownHandler(map: Map<number, Command>): (view: IEditorView, event: IKeyboardEvent) => boolean {
  return function (view, event) {
    const matchKeybinding = Array.from(map.keys()).find(kb => event.equals(kb));
    let direct = matchKeybinding && map.get(matchKeybinding);
    if (direct && direct(view.state, view.dispatch, view)) return true;
    // A character key
    // if (name.length == 1 && name != " ") {
    //   if (event.shiftKey) {
    //     // In case the name was already modified by shift, try looking
    //     // it up without its shift modifier
    //     let noShift = map[modifiers(name, event, false)]
    //     if (noShift && noShift(view.state, view.dispatch, view)) return true
    //   }
    //   if ((event.shiftKey || event.altKey || event.metaKey || name.charCodeAt(0) > 127) &&
    //     (baseName = base[event.keyCode]) && baseName != name) {
    //     // Try falling back to the keyCode when there's a modifier
    //     // active or the character produced isn't ASCII, and our table
    //     // produces a different name from the the keyCode. See #668,
    //     // #1060
    //     let fromCode = map[modifiers(baseName, event)]
    //     if (fromCode && fromCode(view.state, view.dispatch, view)) return true
    //   }
    // }
    return false;
  };
}
