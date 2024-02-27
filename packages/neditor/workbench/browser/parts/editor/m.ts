import { IDocument } from '../../../../common/record';
import { RecordType } from '../../../../common/record/types/base';
import { LayoutType } from '../../../../common/record/types/block';
import { RootNodeId } from '../../../../platform/model/common/model';

const a: IDocument = {
  nodes: {
    [RootNodeId]: {
      id: RootNodeId,
      type: RecordType.Root,
      from: '',
      order: '',
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    },
    div1: {
      id: 'div1',
      type: RecordType.Block,
      // style: {
      //   width: '300px',
      //   height: 'auto',
      //   top: '100px',
      //   left: '50px',
      //   position: 'relative',
      //   backgroundColor: 'white',
      //   padding: '10px',
      //   borderColor: '#add6ff',
      //   borderStyle: 'solid',
      //   borderWidth: '1px',
      // },
      from: RootNodeId,
      order: '0.5',
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      display: LayoutType.auto,
    },
    p1: {
      id: 'p1',
      type: RecordType.Block,
      // style: {
      //   width: 'auto',
      //   height: 'auto',
      //   position: 'relative',
      //   display: 'block',
      //   lineHeight: '40px',
      //   overflowWrap: 'break-word',
      //   whiteSpace: 'pre-wrap',
      // },
      from: 'div1',
      order: '0.1',
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      display: LayoutType.auto,
    },
    title1: {
      id: 'title1',
      type: RecordType.Text,
      // style: {
      //   display: 'inline',
      //   position: 'relative',
      //   fontFamily: '"source han sans"',
      //   fontSize: '28px',
      //   color: 'black'
      // },
      content: 'Title',
      from: 'p1',
      order: '0.1',
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    },
    p2: {
      id: 'p2',
      type: RecordType.Block,
      // style: {
      //   width: 'auto',
      //   height: 'auto',
      //   position: 'relative',
      //   display: 'block',
      //   lineHeight: '20px',
      //   overflowWrap: 'break-word',
      //   whiteSpace: 'pre-wrap'
      // },
      from: 'div1',
      order: '0.2',
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      display: LayoutType.float
    },
    text1: {
      id: 'text1',
      type: RecordType.Text,
      // style: {
      //   display: 'inline',
      //   position: 'relative',
      //   fontFamily: '"source han sans"',
      //   fontSize: '14px',
      //   color: 'black'
      // },
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco',
      from: 'p2',
      order: '0.1',
      width: 0,
      height: 0,
      top: 0,
      left: 0,
    },
    // div2: {
    //   id: 'div2',
    //   type: RecordType.Block,
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
    //   type: RecordType.Text,
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
    //   type: RecordType.Text,
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

export default a;
