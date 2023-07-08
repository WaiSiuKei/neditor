import { IDocumentModel } from '../../../../common/model';
import { RootNodeId } from '../../../../platform/model/common/model';
import { NodeType } from '../../../../common/node';

const a: IDocumentModel = {
  nodes: {
    [RootNodeId]: {
      id: RootNodeId,
      type: NodeType.Root
    },
    div1: {
      id: 'div1',
      type: NodeType.Block,
      style: {
        width: '300px',
        height: 'auto',
        marginLeft: '50px',
        marginTop: '100px',
        position: 'absolute',
        backgroundColor: 'white',
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        borderColor: 'yellow',
        borderStyle: 'solid',
        borderWidth: '1px',
        boxSizing: 'border-box'
      },
      from: RootNodeId,
      order: '0.5',
    },
    title1: {
      id: 'title1',
      type: NodeType.Text,
      style: {
        display: 'block',
        fontFamily: '"source han sans"',
        fontSize: '28px',
        color: 'black',
        lineHeight: '40px',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      },
      content: 'Title',
      from: 'div1',
      order: '0.1'
    },
    text1: {
      id: 'text1',
      type: NodeType.Text,
      style: {
        display: 'block',
        fontFamily: '"source han sans"',
        fontSize: '14px',
        color: 'black',
        lineHeight: '20px',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      },
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco',
      from: 'div1',
      order: '0.3'
    },

    div2: {
      id: 'div2',
      type: NodeType.Block,
      style: {
        width: '300px',
        height: 'auto',
        marginLeft: '550px',
        marginTop: '100px',
        position: 'absolute',
        backgroundColor: 'white'
      },
      from: RootNodeId,
      order: '0.75',
    },
    title2: {
      id: 'title2',
      type: NodeType.Text,
      style: {
        display: 'block',
        fontFamily: '"source han sans"',
        fontSize: '28px',
        color: 'black',
        lineHeight: '40px',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      },
      content: '千字文',
      from: 'div2',
      order: '0.1'
    },
    text2: {
      id: 'text2',
      type: NodeType.Text,
      style: {
        display: 'block',
        fontFamily: '"source han sans"',
        fontSize: '14px',
        color: 'black',
        lineHeight: '20px',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      },
      content: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。云腾致雨，露结为霜。金生丽水，玉出昆冈。剑号巨阙，珠称夜光。果珍李柰，菜重芥姜。海咸河淡，鳞潜羽翔。龙师火帝，鸟官人皇。',
      from: 'div2',
      order: '0.3'
    },
  }
};

export default a;