import {
  Ancestor,
  Descendant, DescendantInit,
  Editor,
  Element,
  Node,
  NodeEntry,
  Operation,
  Path,
  Point,
  Range,
  Scrubber,
  Selection,
  Text,
} from '../../index';

export interface GeneralTransforms {
  /**
   * Transform the editor by an operation.
   */
  transform: (editor: Editor, op: Operation) => void;
}

const applyToDraft = (editor: Editor, selection: Selection, op: Operation) => {
  switch (op.type) {
    case 'insert_node': {
      const { path, node } = op;
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];

      if (index > parent.children.length) {
        throw new Error(
          `Cannot apply an "insert_node" operation at path [${path}] because the destination is past the end of the node.`
        );
      }

      Node.insertChildAt(parent, index, node);

      if (selection) {
        for (const [point, key] of Range.points(selection)) {
          selection[key] = Point.transform(point, op)!;
        }
      }

      break;
    }

    case 'insert_text': {
      const { path, offset, text } = op;
      if (text.length === 0) break;
      const node = Node.leaf(editor, path);
      const before = node.content.slice(0, offset);
      const after = node.content.slice(offset);
      Text.setContent(node, before + text + after);

      if (selection) {
        for (const [point, key] of Range.points(selection)) {
          selection[key] = Point.transform(point, op)!;
        }
      }

      break;
    }

    case 'merge_node': {
      const { path } = op;
      const node = Node.get(editor, path);
      const prevPath = Path.previous(path);
      const prev = Node.get(editor, prevPath);
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];

      if (Text.isText(node) && Text.isText(prev)) {
        Text.setContent(prev, prev.content + node.content);
      } else if (!Text.isText(node) && !Text.isText(prev)) {
        Node.appendChildren(prev, ...node.children);
      } else {
        throw new Error(
          `Cannot apply a "merge_node" operation at path [${path}] to nodes of different interfaces: ${Scrubber.stringify(
            node
          )} ${Scrubber.stringify(prev)}`
        );
      }

      Node.removeChildAt(parent, index);

      if (selection) {
        for (const [point, key] of Range.points(selection)) {
          selection[key] = Point.transform(point, op)!;
        }
      }

      break;
    }

    case 'move_node': {
      const { path, newPath } = op;

      if (Path.isAncestor(path, newPath)) {
        throw new Error(
          `Cannot move a path [${path}] to new path [${newPath}] because the destination is inside itself.`
        );
      }

      const node = Node.get(editor, path);
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];

      // This is tricky, but since the `path` and `newPath` both refer to
      // the same snapshot in time, there's a mismatch. After either
      // removing the original position, the second step's path can be out
      // of date. So instead of using the `op.newPath` directly, we
      // transform `op.path` to ascertain what the `newPath` would be after
      // the operation was applied.
      Node.removeChildAt(parent, index);
      const truePath = Path.transform(path, op)!;
      const newParent = Node.get(editor, Path.parent(truePath)) as Ancestor;
      const newIndex = truePath[truePath.length - 1];

      Node.insertChildAt(newParent, newIndex, node);

      if (selection) {
        for (const [point, key] of Range.points(selection)) {
          selection[key] = Point.transform(point, op)!;
        }
      }

      break;
    }

    case 'remove_node': {
      const { path } = op;
      const index = path[path.length - 1];
      const parent = Node.parent(editor, path);
      Node.removeChildAt(parent, index);

      // Transform all of the points in the value, but if the point was in the
      // node that was removed we need to update the range or remove it.
      if (selection) {
        for (const [point, key] of Range.points(selection)) {
          const result = Point.transform(point, op);

          if (selection != null && result != null) {
            selection[key] = result;
          } else {
            let prev: NodeEntry<Text> | undefined;
            let next: NodeEntry<Text> | undefined;

            for (const [n, p] of Node.texts(editor)) {
              if (Path.compare(p, path) === -1) {
                prev = [n, p];
              } else {
                next = [n, p];
                break;
              }
            }

            let preferNext = false;
            if (prev && next) {
              if (Path.equals(next[1], path)) {
                preferNext = !Path.hasPrevious(next[1]);
              } else {
                preferNext =
                  Path.common(prev[1], path).length <
                  Path.common(next[1], path).length;
              }
            }

            if (prev && !preferNext) {
              point.path = prev[1];
              point.offset = prev[0].content.length;
            } else if (next) {
              point.path = next[1];
              point.offset = 0;
            } else {
              selection = null;
            }
          }
        }
      }

      break;
    }

    case 'remove_text': {
      const { path, offset, text } = op;
      if (text.length === 0) break;
      const node = Node.leaf(editor, path);
      const before = node.content.slice(0, offset);
      const after = node.content.slice(offset + text.length);
      Text.setContent(node, before + after);

      if (selection) {
        for (const [point, key] of Range.points(selection)) {
          selection[key] = Point.transform(point, op)!;
        }
      }

      break;
    }

    case 'set_node': {
      const { path, properties, newProperties } = op;

      if (path.length === 0) {
        throw new Error(`Cannot set properties on the root node!`);
      }

      const node = Node.get(editor, path);

      for (const key in newProperties) {
        if (key === 'children' || key === 'text') {
          throw new Error(`Cannot set the "${key}" property of nodes!`);
        }

        // @ts-ignore
        const value = newProperties[key];

        if (value == null) {
          // @ts-ignore
          delete node[key];
        } else {
          // @ts-ignore
          node[key] = value;
        }
      }

      // properties that were previously defined, but are now missing, must be deleted
      for (const key in properties) {
        if (!newProperties.hasOwnProperty(key)) {
          // @ts-ignore
          delete node[key];
        }
      }

      break;
    }

    case 'set_selection': {
      const { newProperties } = op;

      if (newProperties == null) {
        selection = newProperties;
      } else {
        if (selection == null) {
          if (!Range.isRange(newProperties)) {
            throw new Error(
              `Cannot apply an incomplete "set_selection" operation properties ${Scrubber.stringify(
                newProperties
              )} when there is no current selection.`
            );
          }

          selection = { ...newProperties };
        }

        for (const k in newProperties) {
          const key = k as keyof typeof newProperties;
          const value = newProperties[key];

          if (value == null) {
            if (key === 'anchor' || key === 'focus') {
              throw new Error(`Cannot remove the "${key}" selection property`);
            }

            delete selection[key];
          } else {
            selection[key] = value;
          }
        }
      }

      break;
    }

    case 'split_node': {
      const { path, position, properties } = op;

      if (path.length === 0) {
        throw new Error(
          `Cannot apply a "split_node" operation at path [${path}] because the root node cannot be split.`
        );
      }

      const node = Node.get(editor, path);
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];
      let newNode: DescendantInit;

      if (Text.isText(node)) {
        const before = node.content.slice(0, position);
        const after = node.content.slice(position);
        Text.setContent(node, before);
        newNode = {
          ...(properties as Partial<Text>),
          type: 'text',
          content: after,
        };
      } else {
        const before = node.children.slice(0, position);
        const after = node.children.slice(position);
        Node.setChildren(node, ...before);

        newNode = {
          ...(properties as Partial<Element>),
          children: after,
        };
      }

      Node.insertChildAt(parent, index + 1, newNode);

      if (selection) {
        for (const [point, key] of Range.points(selection)) {
          selection[key] = Point.transform(point, op)!;
        }
      }

      break;
    }
  }
  return selection;
};

// eslint-disable-next-line no-redeclare
export const GeneralTransforms: GeneralTransforms = {
  transform(editor: Editor, op: Operation): void {
    editor.selection = applyToDraft(editor, editor.selection, op);
  },
};
