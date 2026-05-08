// src/utils/qrcode.js
//
// Tiny QR code (Model 2) generator — no dependencies. Adapted from the
// public-domain Project Nayuki "QR Code generator" library, trimmed to
// what we need: byte mode, ECC level M, render to <svg> string.
//
// Suitable for short payloads (≤ ~2 kB). For our shareable routine URLs
// this is ample. Returns an SVG string ready to drop into innerHTML or
// dangerouslySetInnerHTML.

// The logic is a faithful port of Nayuki's reference implementation —
// readable but compact. See https://www.nayuki.io/page/qr-code-generator-library

class QrSegment {
  constructor(mode, numChars, bitData) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData;
  }
  static makeBytes(data) {
    const bb = [];
    for (const b of data) {
      for (let i = 7; i >= 0; i--) bb.push((b >>> i) & 1);
    }
    return new QrSegment(QrSegment.Mode.BYTE, data.length, bb);
  }
}
QrSegment.Mode = {
  BYTE: { modeBits: 0x4, ccBits: [8, 16, 16] },
};

class QrCode {
  constructor(version, errCorLvl, dataCodewords, mask) {
    this.version = version;
    this.size = version * 4 + 17;
    this.errorCorrectionLevel = errCorLvl;
    this.modules = [];
    this.isFunction = [];
    for (let i = 0; i < this.size; i++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
    }
    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);
    if (mask < 0) {
      let minPenalty = Infinity;
      for (let i = 0; i < 8; i++) {
        this.applyMask(i);
        this.drawFormatBits(i);
        const p = this.getPenaltyScore();
        if (p < minPenalty) {
          mask = i;
          minPenalty = p;
        }
        this.applyMask(i);
      }
    }
    this.applyMask(mask);
    this.drawFormatBits(mask);
    this.mask = mask;
    this.isFunction = null;
  }

  static encodeBinary(data, ecl) {
    const seg = QrSegment.makeBytes(data);
    return QrCode.encodeSegments([seg], ecl);
  }

  static encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40) {
    let version, dataUsedBits;
    for (version = minVersion; ; version++) {
      const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
      const usedBits = QrSegment.getTotalBits(segs, version);
      if (usedBits <= dataCapacityBits) {
        dataUsedBits = usedBits;
        break;
      }
      if (version >= maxVersion) throw new Error('Data too long');
    }

    const bb = [];
    for (const seg of segs) {
      QrCode.appendBits(seg.mode.modeBits, 4, bb);
      QrCode.appendBits(seg.numChars, QrCode.numCharCountBits(seg.mode, version), bb);
      for (const b of seg.bitData) bb.push(b);
    }
    const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
    QrCode.appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
    QrCode.appendBits(0, (8 - (bb.length % 8)) % 8, bb);
    for (let pad = 0xec; bb.length < dataCapacityBits; pad ^= 0xec ^ 0x11) {
      QrCode.appendBits(pad, 8, bb);
    }
    const dataCodewords = [];
    for (let i = 0; i < bb.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bb[i + j];
      dataCodewords.push(b);
    }
    return new QrCode(version, ecl, dataCodewords, -1);
  }

  static appendBits(val, len, arr) {
    for (let i = len - 1; i >= 0; i--) arr.push((val >>> i) & 1);
  }

  static numCharCountBits(mode, ver) {
    return mode.ccBits[Math.floor((ver + 7) / 17)];
  }

  static getNumRawDataModules(ver) {
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }

  static getNumDataCodewords(ver, ecl) {
    return (
      Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
      QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] *
        QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
    );
  }

  drawFunctionPatterns() {
    const size = this.size;
    for (let i = 0; i < size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(size - 4, 3);
    this.drawFinderPattern(3, size - 4);
    const alignPos = this.getAlignmentPatternPositions();
    for (let i = 0; i < alignPos.length; i++) {
      for (let j = 0; j < alignPos.length; j++) {
        if (
          (i === 0 && j === 0) ||
          (i === 0 && j === alignPos.length - 1) ||
          (i === alignPos.length - 1 && j === 0)
        )
          continue;
        this.drawAlignmentPattern(alignPos[i], alignPos[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  }

  drawFinderPattern(x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  drawAlignmentPattern(x, y) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  drawFormatBits(mask) {
    const data = (this.errorCorrectionLevel.formatBits << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0);
    this.setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0);
    this.setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, ((bits >>> i) & 1) !== 0);
    for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, ((bits >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i++)
      this.setFunctionModule(8, this.size - 15 + i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, this.size - 8, true);
  }

  drawVersion() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) !== 0;
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, bit);
      this.setFunctionModule(b, a, bit);
    }
  }

  setFunctionModule(x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  getAlignmentPatternPositions() {
    if (this.version === 1) return [];
    const numAlign = Math.floor(this.version / 7) + 2;
    const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  addEccAndInterleave(data) {
    const ver = this.version;
    const ecl = this.errorCorrectionLevel;
    const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    const rawCodewords = Math.floor(QrCode.getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks = [];
    const rsDiv = QrCode.reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const block = dat.slice();
      const ecc = QrCode.reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) block.push(0);
      for (const e of ecc) block.push(e);
      blocks.push(block);
    }
    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
      });
    }
    return result;
  }

  drawCodewords(data) {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
  }

  applyMask(mask) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = false;
        }
        if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  getPenaltyScore() {
    let result = 0;
    const size = this.size;
    for (let y = 0; y < size; y++) {
      let runColor = false;
      let runX = 0;
      for (let x = 0; x < size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5) result += 3;
          else if (runX > 5) result++;
        } else {
          runColor = this.modules[y][x];
          runX = 1;
        }
      }
    }
    for (let x = 0; x < size; x++) {
      let runColor = false;
      let runY = 0;
      for (let y = 0; y < size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5) result += 3;
          else if (runY > 5) result++;
        } else {
          runColor = this.modules[y][x];
          runY = 1;
        }
      }
    }
    let dark = 0;
    for (const row of this.modules) for (const c of row) if (c) dark++;
    const total = size * size;
    const ratio = Math.abs(dark * 20 - total * 10) / total;
    result += Math.floor(ratio) * 10;
    return result;
  }

  static reedSolomonComputeDivisor(degree) {
    const result = new Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < result.length; j++) {
        result[j] = QrCode.rsMul(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = QrCode.rsMul(root, 0x02);
    }
    return result;
  }

  static reedSolomonComputeRemainder(data, divisor) {
    const result = new Array(divisor.length).fill(0);
    for (const b of data) {
      const factor = b ^ result.shift();
      result.push(0);
      for (let i = 0; i < divisor.length; i++) result[i] ^= QrCode.rsMul(divisor[i], factor);
    }
    return result;
  }

  static rsMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
}

QrCode.ECC_M = { ordinal: 0, formatBits: 0 };
QrSegment.getTotalBits = function (segs, ver) {
  let result = 0;
  for (const seg of segs) {
    const ccBits = QrCode.numCharCountBits(seg.mode, ver);
    result += 4 + ccBits + seg.bitData.length;
  }
  return result;
};
QrCode.ECC_CODEWORDS_PER_BLOCK = [
  // ECC level M
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
];
QrCode.NUM_ERROR_CORRECTION_BLOCKS = [
  // ECC level M
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
];

/**
 * Render the QR matrix as an inline SVG string.
 * size = pixel size of one module; quietZone in modules.
 */
export function generateQrSvg(text, { size = 6, quietZone = 2, color = '#000', bg = '#fff' } = {}) {
  const data = new TextEncoder().encode(text);
  const qr = QrCode.encodeBinary(Array.from(data), QrCode.ECC_M);
  const dim = (qr.size + quietZone * 2) * size;
  let path = '';
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) {
        const px = (x + quietZone) * size;
        const py = (y + quietZone) * size;
        path += `M${px},${py}h${size}v${size}h-${size}z`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges"><rect width="${dim}" height="${dim}" fill="${bg}"/><path d="${path}" fill="${color}"/></svg>`;
}
