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
        top: '100px',
        left: '50px',
        position: 'relative',
        backgroundColor: 'white',
        padding: '10px',
        borderColor: '#add6ff',
        borderStyle: 'solid',
        borderWidth: '1px',
      },
      from: RootNodeId,
      order: '0.5',
    },
    p1: {
      id: 'p1',
      type: NodeType.Block,
      style: {
        width: 'auto',
        height: 'auto',
        position: 'relative',
        display: 'block',
        lineHeight: '40px',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
      },
      from: 'div1',
      order: '0.1',
    },
    title1: {
      id: 'title1',
      type: NodeType.Text,
      style: {
        display: 'inline',
        position: 'relative',
        fontFamily: '"source han sans"',
        fontSize: '28px',
        color: 'black'
      },
      content: 'Title',
      from: 'p1',
      order: '0.1'
    },
    p2: {
      id: 'p2',
      type: NodeType.Block,
      style: {
        width: 'auto',
        height: 'auto',
        position: 'relative',
        display: 'block',
        lineHeight: '20px',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      },
      from: 'div1',
      order: '0.2',
    },
    text1: {
      id: 'text1',
      type: NodeType.Text,
      style: {
        display: 'inline',
        position: 'relative',
        fontFamily: '"source han sans"',
        fontSize: '14px',
        color: 'black'
      },
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco',
      from: 'p2',
      order: '0.1'
    },
    // div2: {
    //   id: 'div2',
    //   type: NodeType.Block,
    //   style: {
    //     width: '300px',
    //     height: 'auto',
    //     marginLeft: '550px',
    //     marginTop: '100px',
    //     position: 'absolute',
    //     backgroundColor: 'white',
    //     borderColor: '#b2f2bb',
    //     // borderColor: 'rgba(178, 242, 187, 1)',
    //     // borderColor: 'hsl(128, 71%, 82%)',
    //     borderStyle: 'solid',
    //     borderWidth: '1px',
    //     padding: '10px'
    //   },
    //   from: RootNodeId,
    //   order: '0.75',
    // },
    // title2: {
    //   id: 'title2',
    //   type: NodeType.Text,
    //   style: {
    //     display: 'block',
    //     fontFamily: '"source han sans"',
    //     fontSize: '28px',
    //     color: 'black',
    //     lineHeight: '40px',
    //     overflowWrap: 'break-word',
    //     whiteSpace: 'pre-wrap'
    //   },
    //   content: '千字文',
    //   from: 'div2',
    //   order: '0.1'
    // },
    // text2: {
    //   id: 'text2',
    //   type: NodeType.Text,
    //   style: {
    //     display: 'block',
    //     fontFamily: '"source han sans"',
    //     fontSize: '14px',
    //     color: 'black',
    //     lineHeight: '20px',
    //     overflowWrap: 'break-word',
    //     whiteSpace: 'pre-wrap'
    //   },
    //   content: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。云腾致雨，露结为霜。金生丽水，玉出昆冈。剑号巨阙，珠称夜光。果珍李柰，菜重芥姜。海咸河淡，鳞潜羽翔。龙师火帝，鸟官人皇。',
    //   from: 'div2',
    //   order: '0.3'
    // },
  }
};

const b: IDocumentModel = {
  'nodes': {
    'root': {
      'id': 'root',
      'type': 'root'
    },
    'div1': {
      'id': 'div1',
      'type': 'block',
      'style': {
        'width': '250px',
        'height': 'auto',
        'top': '100px',
        'left': '50px',
        'position': 'relative',
        'backgroundColor': 'white',
        'padding': '10px',
        'borderColor': '#add6ff',
        'borderStyle': 'solid',
        'borderWidth': '1px'
      },
      'from': 'root',
      'order': '0.5'
    },
    'p1': {
      'id': 'p1',
      'type': 'block',
      'style': {
        'width': 'auto',
        'height': 'auto',
        'position': 'relative',
        'display': 'block',
        'lineHeight': '20px',
        'overflowWrap': 'break-word',
        'whiteSpace': 'pre-wrap',
        'textPath': 'M 0 0 C 0 50 200 50 200 0'
      },
      'from': 'div1',
      'order': '0.1'
    },
    'part1': {
      'id': 'part1',
      'type': 'text',
      'style': {
        'display': 'inline',
        'position': 'relative',
        'fontFamily': '"source han sans"',
        'fontSize': '17px',
        'color': 'black'
      },
      'content': 'Lorem ',
      'from': 'p1',
      'order': '0.5'
    },
    'part2': {
      'id': 'part2',
      'style': {
        'display': 'inline',
        'position': 'relative',
        'fontFamily': '"source han sans"',
        'fontSize': '17px',
        'color': 'black'
      },
      'type': 'text',
      'content': 'ipsum dolor sit ametw',
      'from': 'p1',
      'order': '0.75'
    }
  }
};
export default b;
