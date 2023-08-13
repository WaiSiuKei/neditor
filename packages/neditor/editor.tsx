import React, { useMemo } from 'react';
// @ts-ignore
import { createRoot } from 'react-dom/client';
import { createEditor, Descendant, Transforms, Editor, Element } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
const editor = createEditor();

console.log(editor);
Reflect.set(window, 'editor', editor);
Reflect.set(window, 'tt', () => {
  const start = Editor.start(editor, []);
  start.offset += 1;
  Transforms.select(editor, start);
  Editor.insertBreak(editor);
});

const PlainTextExample = () => {
  const e = useMemo(() => withReact(editor), []);
  return (
    <Slate editor={e} initialValue={initialValue}>
      <Editable placeholder="Enter some plain text..."
                onChange={value => {
                  console.log(value);
                  const isAstChange = editor.operations.some(
                    op => 'set_selection' !== op.type
                  );
                  if (isAstChange) {
                    // Save the value to Local Storage.
                    const content = JSON.stringify(value);
                    console.log(JSON.parse(content));
                  }
                }}
      />
    </Slate>
  );
};

interface CustomElement extends Element {
  type: 'paragraph';
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable plain text, just like a <textarea>!' },
    ],
  } as CustomElement,
];

root.render(<PlainTextExample/>);

