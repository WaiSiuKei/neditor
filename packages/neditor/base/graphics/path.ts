import { getCubicArcLength, getQuadraticArcLength, t2length } from './BezierFunctions';
import { PathCommand, PathSegment, Vector2d } from './types';

export class Path {
  static getLineLength(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }

  static getPathLength(dataArray: Array<{ pathLength: number }>) {
    let pathLength = 0;
    for (let i = 0; i < dataArray.length; ++i) {
      pathLength += dataArray[i].pathLength;
    }
    return pathLength;
  }

  static getPointAtLengthOfDataArray(length: number, dataArray: PathSegment[]) {
    let point,
      i = 0,
      ii = dataArray.length;

    if (!ii) {
      return null;
    }

    while (i < ii && length > dataArray[i].pathLength) {
      length -= dataArray[i].pathLength;
      ++i;
    }

    if (i === ii) {
      point = dataArray[i - 1].points.slice(-2);
      return {
        x: point[0],
        y: point[1],
      };
    }

    if (length < 0.01) {
      point = dataArray[i].points.slice(0, 2);
      return {
        x: point[0],
        y: point[1],
      };
    }

    let cp = dataArray[i];
    let p = cp.points;
    switch (cp.command) {
      case 'L':
        return Path.getPointOnLine(length, cp.start!.x, cp.start!.y, p[0], p[1]);
      case 'C':
        return Path.getPointOnCubicBezier(
          t2length(length, Path.getPathLength(dataArray), (i) => {
            return getCubicArcLength(
              [cp.start!.x, p[0], p[2], p[4]],
              [cp.start!.y, p[1], p[3], p[5]],
              i
            );
          }),
          cp.start!.x,
          cp.start!.y,
          p[0],
          p[1],
          p[2],
          p[3],
          p[4],
          p[5]
        );
      case 'Q':
        return Path.getPointOnQuadraticBezier(
          t2length(length, Path.getPathLength(dataArray), (i) => {
            return getQuadraticArcLength(
              [cp.start!.x, p[0], p[2]],
              [cp.start!.y, p[1], p[3]],
              i
            );
          }),
          cp.start!.x,
          cp.start!.y,
          p[0],
          p[1],
          p[2],
          p[3]
        );
      case 'A':
        let cx = p[0],
          cy = p[1],
          rx = p[2],
          ry = p[3],
          theta = p[4],
          dTheta = p[5],
          psi = p[6];
        theta += (dTheta * length) / cp.pathLength;
        return Path.getPointOnEllipticalArc(cx, cy, rx, ry, theta, psi);
    }

    return null;
  }

  static getPointOnLine(dist: number, P1x: number, P1y: number, P2x: number, P2y: number, fromX?: number, fromY?: number) {
    if (fromX === undefined) {
      fromX = P1x;
    }
    if (fromY === undefined) {
      fromY = P1y;
    }

    let m = (P2y - P1y) / (P2x - P1x + 0.00000001);
    let run = Math.sqrt((dist * dist) / (1 + m * m));
    if (P2x < P1x) {
      run *= -1;
    }
    let rise = m * run;
    let pt;

    if (P2x === P1x) {
      // vertical line
      pt = {
        x: fromX,
        y: fromY + rise,
      };
    } else if ((fromY - P1y) / (fromX - P1x + 0.00000001) === m) {
      pt = {
        x: fromX + run,
        y: fromY + rise,
      };
    } else {
      let ix, iy;

      let len = this.getLineLength(P1x, P1y, P2x, P2y);
      // if (len < 0.00000001) {
      //   return {
      //     x: P1x,
      //     y: P1y,
      //   };
      // }
      let u = (fromX - P1x) * (P2x - P1x) + (fromY - P1y) * (P2y - P1y);
      u = u / (len * len);
      ix = P1x + u * (P2x - P1x);
      iy = P1y + u * (P2y - P1y);

      let pRise = this.getLineLength(fromX, fromY, ix, iy);
      let pRun = Math.sqrt(dist * dist - pRise * pRise);
      run = Math.sqrt((pRun * pRun) / (1 + m * m));
      if (P2x < P1x) {
        run *= -1;
      }
      rise = m * run;
      pt = {
        x: ix + run,
        y: iy + rise,
      };
    }

    return pt;
  }

  static getPointOnCubicBezier(pct: number, P1x: number, P1y: number, P2x: number, P2y: number, P3x: number, P3y: number, P4x: number, P4y: number) {
    function CB1(t: number) {
      return t * t * t;
    }
    function CB2(t: number) {
      return 3 * t * t * (1 - t);
    }
    function CB3(t: number) {
      return 3 * t * (1 - t) * (1 - t);
    }
    function CB4(t: number) {
      return (1 - t) * (1 - t) * (1 - t);
    }
    let x = P4x * CB1(pct) + P3x * CB2(pct) + P2x * CB3(pct) + P1x * CB4(pct);
    let y = P4y * CB1(pct) + P3y * CB2(pct) + P2y * CB3(pct) + P1y * CB4(pct);

    return {
      x: x,
      y: y,
    };
  }
  static getPointOnQuadraticBezier(pct: number, P1x: number, P1y: number, P2x: number, P2y: number, P3x: number, P3y: number) {
    function QB1(t: number) {
      return t * t;
    }
    function QB2(t: number) {
      return 2 * t * (1 - t);
    }
    function QB3(t: number) {
      return (1 - t) * (1 - t);
    }
    let x = P3x * QB1(pct) + P2x * QB2(pct) + P1x * QB3(pct);
    let y = P3y * QB1(pct) + P2y * QB2(pct) + P1y * QB3(pct);

    return {
      x: x,
      y: y,
    };
  }
  static getPointOnEllipticalArc(cx: number, cy: number, rx: number, ry: number, theta: number, psi: number) {
    let cosPsi = Math.cos(psi),
      sinPsi = Math.sin(psi);
    let pt = {
      x: rx * Math.cos(theta),
      y: ry * Math.sin(theta),
    };
    return {
      x: cx + (pt.x * cosPsi - pt.y * sinPsi),
      y: cy + (pt.x * sinPsi + pt.y * cosPsi),
    };
  }
  /*
   * get parsed data array from the data
   *  string.  V, v, H, h, and l data are converted to
   *  L data for the purpose of high performance Path
   *  rendering
   */
  static parsePathData(data: string): PathSegment[] {
    // Path Data Segment must begin with a moveTo
    //m (x y)+  Relative moveTo (subsequent points are treated as lineTo)
    //M (x y)+  Absolute moveTo (subsequent points are treated as lineTo)
    //l (x y)+  Relative lineTo
    //L (x y)+  Absolute LineTo
    //h (x)+    Relative horizontal lineTo
    //H (x)+    Absolute horizontal lineTo
    //v (y)+    Relative vertical lineTo
    //V (y)+    Absolute vertical lineTo
    //z (closepath)
    //Z (closepath)
    //c (x1 y1 x2 y2 x y)+ Relative Bezier curve
    //C (x1 y1 x2 y2 x y)+ Absolute Bezier curve
    //q (x1 y1 x y)+       Relative Quadratic Bezier
    //Q (x1 y1 x y)+       Absolute Quadratic Bezier
    //t (x y)+    Shorthand/Smooth Relative Quadratic Bezier
    //T (x y)+    Shorthand/Smooth Absolute Quadratic Bezier
    //s (x2 y2 x y)+       Shorthand/Smooth Relative Bezier curve
    //S (x2 y2 x y)+       Shorthand/Smooth Absolute Bezier curve
    //a (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+     Relative Elliptical Arc
    //A (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+  Absolute Elliptical Arc

    // return early if data is not defined
    if (!data) {
      return [];
    }

    // command string
    let cs = data;

    // command chars
    let cc = [
      'm',
      'M',
      'l',
      'L',
      'v',
      'V',
      'h',
      'H',
      'z',
      'Z',
      'c',
      'C',
      'q',
      'Q',
      't',
      'T',
      's',
      'S',
      'a',
      'A',
    ];
    // convert white spaces to commas
    cs = cs.replace(new RegExp(' ', 'g'), ',');
    // create pipes so that we can split the data
    for (let n = 0; n < cc.length; n++) {
      cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
    }
    // create array
    let arr = cs.split('|');
    let ca: Array<{ command: PathCommand, points: number[], start?: Vector2d, pathLength: number }> = [];
    let coords = [];
    // init context point
    let cpx = 0;
    let cpy = 0;

    let re = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:e[-+]?\d+)?)/gi;
    let match;
    for (let n = 1; n < arr.length; n++) {
      let str = arr[n];
      let c = str.charAt(0) as PathCommand;
      str = str.slice(1);

      coords.length = 0;
      while ((match = re.exec(str))) {
        coords.push(match[0]);
      }

      // while ((match = re.exec(str))) {
      //   coords.push(match[0]);
      // }
      let p = [];

      for (let j = 0, jlen = coords.length; j < jlen; j++) {
        // extra case for merged flags
        if (coords[j] === '00') {
          p.push(0, 0);
          continue;
        }
        let parsed = parseFloat(coords[j]);
        if (!isNaN(parsed)) {
          p.push(parsed);
        } else {
          p.push(0);
        }
      }

      while (p.length > 0) {
        if (isNaN(p[0])) {
          // case for a trailing comma before next command
          break;
        }

        let cmd: PathCommand | null = null;
        let points: number[] = [];
        let startX = cpx,
          startY = cpy;
        // Move let from within the switch to up here (jshint)
        let prevCmd: { command: PathCommand, points: number[] };
        // Ss, Tt
        let ctlPtx: number;
        let ctlPty: number;
        // Aa
        let rx: number;
        let ry: number;
        let psi: number;
        let fa: number;
        let fs: number;
        let x1: number;
        let y1: number;

        // convert l, H, h, V, and v to L
        switch (c) {
          // Note: Keep the lineTo's above the moveTo's in this switch
          case 'l':
            cpx += p.shift()!;
            cpy += p.shift()!;
            cmd = 'L';
            points.push(cpx, cpy);
            break;
          case 'L':
            cpx = p.shift()!;
            cpy = p.shift()!;
            points.push(cpx, cpy);
            break;
          // Note: lineTo handlers need to be above this point
          case 'm':
            let dx = p.shift()!;
            let dy = p.shift()!;
            cpx += dx;
            cpy += dy;
            cmd = 'M';
            // After closing the path move the current position
            // to the the first point of the path (if any).
            if (ca.length > 2 && ca[ca.length - 1].command === 'z') {
              for (let idx = ca.length - 2; idx >= 0; idx--) {
                if (ca[idx].command === 'M') {
                  cpx = ca[idx].points[0] + dx;
                  cpy = ca[idx].points[1] + dy;
                  break;
                }
              }
            }
            points.push(cpx, cpy);
            c = 'l';
            // subsequent points are treated as relative lineTo
            break;
          case 'M':
            cpx = p.shift()!;
            cpy = p.shift()!;
            cmd = 'M';
            points.push(cpx, cpy);
            c = 'L';
            // subsequent points are treated as absolute lineTo
            break;

          case 'h':
            cpx += p.shift()!;
            cmd = 'L';
            points.push(cpx, cpy);
            break;
          case 'H':
            cpx = p.shift()!;
            cmd = 'L';
            points.push(cpx, cpy);
            break;
          case 'v':
            cpy += p.shift()!;
            cmd = 'L';
            points.push(cpx, cpy);
            break;
          case 'V':
            cpy = p.shift()!;
            cmd = 'L';
            points.push(cpx, cpy);
            break;
          case 'C':
            points.push(p.shift()!, p.shift()!, p.shift()!, p.shift()!);
            cpx = p.shift()!;
            cpy = p.shift()!;
            points.push(cpx, cpy);
            break;
          case 'c':
            points.push(
              cpx + p.shift()!,
              cpy + p.shift()!,
              cpx + p.shift()!,
              cpy + p.shift()!
            );
            cpx += p.shift()!;
            cpy += p.shift()!;
            cmd = 'C';
            points.push(cpx, cpy);
            break;
          case 'S':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];
            if (prevCmd.command === 'C') {
              ctlPtx = cpx + (cpx - prevCmd.points[2]);
              ctlPty = cpy + (cpy - prevCmd.points[3]);
            }
            points.push(ctlPtx, ctlPty, p.shift()!, p.shift()!);
            cpx = p.shift()!;
            cpy = p.shift()!;
            cmd = 'C';
            points.push(cpx, cpy);
            break;
          case 's':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];
            if (prevCmd.command === 'C') {
              ctlPtx = cpx + (cpx - prevCmd.points[2]);
              ctlPty = cpy + (cpy - prevCmd.points[3]);
            }
            points.push(ctlPtx, ctlPty, cpx + p.shift()!, cpy + p.shift()!);
            cpx += p.shift()!;
            cpy += p.shift()!;
            cmd = 'C';
            points.push(cpx, cpy);
            break;
          case 'Q':
            points.push(p.shift()!, p.shift()!);
            cpx = p.shift()!;
            cpy = p.shift()!;
            points.push(cpx, cpy);
            break;
          case 'q':
            points.push(cpx + p.shift()!, cpy + p.shift()!);
            cpx += p.shift()!;
            cpy += p.shift()!;
            cmd = 'Q';
            points.push(cpx, cpy);
            break;
          case 'T':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];
            if (prevCmd.command === 'Q') {
              ctlPtx = cpx + (cpx - prevCmd.points[0]);
              ctlPty = cpy + (cpy - prevCmd.points[1]);
            }
            cpx = p.shift()!;
            cpy = p.shift()!;
            cmd = 'Q';
            points.push(ctlPtx, ctlPty, cpx, cpy);
            break;
          case 't':
            ctlPtx = cpx;
            ctlPty = cpy;
            prevCmd = ca[ca.length - 1];
            if (prevCmd.command === 'Q') {
              ctlPtx = cpx + (cpx - prevCmd.points[0]);
              ctlPty = cpy + (cpy - prevCmd.points[1]);
            }
            cpx += p.shift()!;
            cpy += p.shift()!;
            cmd = 'Q';
            points.push(ctlPtx, ctlPty, cpx, cpy);
            break;
          case 'A':
            rx = p.shift()!;
            ry = p.shift()!;
            psi = p.shift()!;
            fa = p.shift()!;
            fs = p.shift()!;
            x1 = cpx;
            y1 = cpy;
            cpx = p.shift()!;
            cpy = p.shift()!;
            cmd = 'A';
            points = this.convertEndpointToCenterParameterization(
              x1,
              y1,
              cpx,
              cpy,
              fa,
              fs,
              rx,
              ry,
              psi
            );
            break;
          case 'a':
            rx = p.shift()!;
            ry = p.shift()!;
            psi = p.shift()!;
            fa = p.shift()!;
            fs = p.shift()!;
            x1 = cpx;
            y1 = cpy;
            cpx += p.shift()!;
            cpy += p.shift()!;
            cmd = 'A';
            points = this.convertEndpointToCenterParameterization(
              x1,
              y1,
              cpx,
              cpy,
              fa,
              fs,
              rx,
              ry,
              psi
            );
            break;
        }

        ca.push({
          command: cmd || c,
          points: points,
          start: {
            x: startX,
            y: startY,
          },
          pathLength: this.calcLength(startX, startY, cmd || c, points),
        });
      }

      if (c === 'z' || c === 'Z') {
        ca.push({
          command: 'z' as const,
          points: [],
          start: undefined,
          pathLength: 0,
        });
      }
    }

    return ca;
  }
  static calcLength(x: number, y: number, cmd: PathCommand, points: number[]) {
    let len, p1, p2, t;
    let path = Path;

    switch (cmd) {
      case 'L':
        return path.getLineLength(x, y, points[0], points[1]);
      case 'C':
        return getCubicArcLength(
          [x, points[0], points[2], points[4]],
          [y, points[1], points[3], points[5]],
          1
        );
      case 'Q':
        return getQuadraticArcLength(
          [x, points[0], points[2]],
          [y, points[1], points[3]],
          1
        );
      case 'A':
        // Approximates by breaking curve into line segments
        len = 0.0;
        let start = points[4];
        // 4 = theta
        let dTheta = points[5];
        // 5 = dTheta
        let end = points[4] + dTheta;
        let inc = Math.PI / 180.0;
        // 1 degree resolution
        if (Math.abs(start - end) < inc) {
          inc = Math.abs(start - end);
        }
        // Note: for purpose of calculating arc length, not going to worry about rotating X-axis by angle psi
        p1 = path.getPointOnEllipticalArc(
          points[0],
          points[1],
          points[2],
          points[3],
          start,
          0
        );
        if (dTheta < 0) {
          // clockwise
          for (t = start - inc; t > end; t -= inc) {
            p2 = path.getPointOnEllipticalArc(
              points[0],
              points[1],
              points[2],
              points[3],
              t,
              0
            );
            len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
            p1 = p2;
          }
        } else {
          // counter-clockwise
          for (t = start + inc; t < end; t += inc) {
            p2 = path.getPointOnEllipticalArc(
              points[0],
              points[1],
              points[2],
              points[3],
              t,
              0
            );
            len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
            p1 = p2;
          }
        }
        p2 = path.getPointOnEllipticalArc(
          points[0],
          points[1],
          points[2],
          points[3],
          end,
          0
        );
        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);

        return len;
    }

    return 0;
  }
  static convertEndpointToCenterParameterization(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    fa: number,
    fs: number,
    rx: number,
    ry: number,
    psiDeg: number
  ) {
    // Derived from: http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
    let psi = psiDeg * (Math.PI / 180.0);
    let xp =
      (Math.cos(psi) * (x1 - x2)) / 2.0 + (Math.sin(psi) * (y1 - y2)) / 2.0;
    let yp =
      (-1 * Math.sin(psi) * (x1 - x2)) / 2.0 +
      (Math.cos(psi) * (y1 - y2)) / 2.0;

    let lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);

    if (lambda > 1) {
      rx *= Math.sqrt(lambda);
      ry *= Math.sqrt(lambda);
    }

    let f = Math.sqrt(
      (rx * rx * (ry * ry) - rx * rx * (yp * yp) - ry * ry * (xp * xp)) /
      (rx * rx * (yp * yp) + ry * ry * (xp * xp))
    );

    if (fa === fs) {
      f *= -1;
    }
    if (isNaN(f)) {
      f = 0;
    }

    let cxp = (f * rx * yp) / ry;
    let cyp = (f * -ry * xp) / rx;

    let cx = (x1 + x2) / 2.0 + Math.cos(psi) * cxp - Math.sin(psi) * cyp;
    let cy = (y1 + y2) / 2.0 + Math.sin(psi) * cxp + Math.cos(psi) * cyp;

    let vMag = function (v: number[]) {
      return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    };
    let vRatio = function (u: number[], v: number[]) {
      return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
    };
    let vAngle = function (u: number[], v: number[]) {
      return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(vRatio(u, v));
    };
    let theta = vAngle([1, 0], [(xp - cxp) / rx, (yp - cyp) / ry]);
    let u = [(xp - cxp) / rx, (yp - cyp) / ry];
    let v = [(-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry];
    let dTheta = vAngle(u, v);

    if (vRatio(u, v) <= -1) {
      dTheta = Math.PI;
    }
    if (vRatio(u, v) >= 1) {
      dTheta = 0;
    }
    if (fs === 0 && dTheta > 0) {
      dTheta = dTheta - 2 * Math.PI;
    }
    if (fs === 1 && dTheta < 0) {
      dTheta = dTheta + 2 * Math.PI;
    }
    return [cx, cy, rx, ry, theta, dTheta, psi, fs];
  }
}
