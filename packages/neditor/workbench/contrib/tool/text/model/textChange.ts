import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';

export class TextChange {

  public get oldLength(): number {
    return this.oldText.length;
  }

  public get oldEnd(): number {
    return this.oldPosition + this.oldText.length;
  }

  public get newLength(): number {
    return this.newText.length;
  }

  public get newEnd(): number {
    return this.newPosition + this.newText.length;
  }

  constructor(
    public readonly oldPosition: number,
    public readonly oldText: string,
    public readonly newPosition: number,
    public readonly newText: string
  ) {
  }

  public toString(): string {
    return NOTIMPLEMENTED()
    // if (this.oldText.length === 0) {
    //   return `(insert@${this.oldPosition} "${escapeNewLine(this.newText)}")`;
    // }
    // if (this.newText.length === 0) {
    //   return `(delete@${this.oldPosition} "${escapeNewLine(this.oldText)}")`;
    // }
    // return `(replace@${this.oldPosition} "${escapeNewLine(this.oldText)}" with "${escapeNewLine(this.newText)}")`;
  }

  private static _writeStringSize(str: string): number {
    return (
      4 + 2 * str.length
    );
  }

  private static _writeString(b: Uint8Array, str: string, offset: number): number {
    return NOTIMPLEMENTED()
    // const len = str.length;
    // buffer.writeUInt32BE(b, len, offset);
    // offset += 4;
    // for (let i = 0; i < len; i++) {
    //   buffer.writeUInt16LE(b, str.charCodeAt(i), offset);
    //   offset += 2;
    // }
    // return offset;
  }

  private static _readString(b: Uint8Array, offset: number): string {
    return NOTIMPLEMENTED()
    // const len = buffer.readUInt32BE(b, offset);
    // offset += 4;
    // return decodeUTF16LE(b, offset, len);
  }

  public writeSize(): number {
    return (
      +4 // oldPosition
      + 4 // newPosition
      + TextChange._writeStringSize(this.oldText)
      + TextChange._writeStringSize(this.newText)
    );
  }

  public write(b: Uint8Array, offset: number): number {
    return NOTIMPLEMENTED()
    // buffer.writeUInt32BE(b, this.oldPosition, offset);
    // offset += 4;
    // buffer.writeUInt32BE(b, this.newPosition, offset);
    // offset += 4;
    // offset = TextChange._writeString(b, this.oldText, offset);
    // offset = TextChange._writeString(b, this.newText, offset);
    // return offset;
  }

  public static read(b: Uint8Array, offset: number, dest: TextChange[]): number {
    return NOTIMPLEMENTED()
    // const oldPosition = buffer.readUInt32BE(b, offset);
    // offset += 4;
    // const newPosition = buffer.readUInt32BE(b, offset);
    // offset += 4;
    // const oldText = TextChange._readString(b, offset);
    // offset += TextChange._writeStringSize(oldText);
    // const newText = TextChange._readString(b, offset);
    // offset += TextChange._writeStringSize(newText);
    // dest.push(new TextChange(oldPosition, oldText, newPosition, newText));
    // return offset;
  }
}
