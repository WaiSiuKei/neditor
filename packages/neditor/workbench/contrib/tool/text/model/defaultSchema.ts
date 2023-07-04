import { NodeSpec, Schema } from './schema';

export const defaultSchema = new Schema({
  nodes: {
    doc: {
      content: 'block+'
    } as NodeSpec,

    paragraph: {
      content: 'inline*',
      group: 'block',
      attrs: {},
      toDOM() {
        return [
          'p',
          {
            style: {
              display: 'block',
              fontFamily: '"source han sans"',
              fontSize: '14px',
              color: 'black',
              lineHeight: '20px',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            },
          },
          0,
        ];
      }
    } as NodeSpec,

    text: {
      group: 'inline'
    } as NodeSpec,
  },
  marks: {}
});
