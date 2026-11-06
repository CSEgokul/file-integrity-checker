// Pure JS MD5 implementation for client-side hashing
function md5Cycle(x: number[], k: number[]): void {
  let a = x[0], b = x[1], c = x[2], d = x[3]

  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    const n = a + ((b & c) | (~b & d)) + x + t
    return ((n << s) | (n >>> (32 - s))) + b
  }
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    const n = a + ((b & d) | (c & ~d)) + x + t
    return ((n << s) | (n >>> (32 - s))) + b
  }
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    const n = a + (b ^ c ^ d) + x + t
    return ((n << s) | (n >>> (32 - s))) + b
  }
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
    const n = a + (c ^ (b | ~d)) + x + t
    return ((n << s) | (n >>> (32 - s))) + b
  }

  a = ff(a, b, c, d, k[0], 7, -680876936)
  d = ff(d, a, b, c, k[1], 12, -389564586)
  c = ff(c, d, a, b, k[2], 17, 606105819)
  b = ff(b, c, d, a, k[3], 22, -1044525330)
  a = ff(a, b, c, d, k[4], 7, -176418897)
  d = ff(d, a, b, c, k[5], 12, 1200080426)
  c = ff(c, d, a, b, k[6], 17, -1473231341)
  b = ff(b, c, d, a, k[7], 22, -45705983)
  a = ff(a, b, c, d, k[8], 7, 1770035416)
  d = ff(d, a, b, c, k[9], 12, -1958414417)
  c = ff(c, d, a, b, k[10], 17, -42063)
  b = ff(b, c, d, a, k[11], 22, -1990404162)
  a = ff(a, b, c, d, k[12], 7, 1804603682)
  d = ff(d, a, b, c, k[13], 12, -40341101)
  c = ff(c, d, a, b, k[14], 17, -1502002290)
  b = ff(b, c, d, a, k[15], 22, 1236535329)

  a = gg(a, b, c, d, k[1], 5, -165796510)
  d = gg(d, a, b, c, k[6], 9, -1069501632)
  c = gg(c, d, a, b, k[11], 14, 643717713)
  b = gg(b, c, d, a, k[0], 20, -373897302)
  a = gg(a, b, c, d, k[5], 5, -701558691)
  d = gg(d, a, b, c, k[10], 9, 38016083)
  c = gg(c, d, a, b, k[15], 14, -660478335)
  b = gg(b, c, d, a, k[4], 20, -405537848)
  a = gg(a, b, c, d, k[9], 5, 568446438)
  d = gg(d, a, b, c, k[14], 9, -1019803690)
  c = gg(c, d, a, b, k[3], 14, -187363961)
  b = gg(b, c, d, a, k[8], 20, 1163531501)
  a = gg(a, b, c, d, k[13], 5, -1444681467)
  d = gg(d, a, b, c, k[2], 9, -51403784)
  c = gg(c, d, a, b, k[7], 14, 1735328473)
  b = gg(b, c, d, a, k[12], 20, -1926607734)

  a = hh(a, b, c, d, k[5], 4, -378558)
  d = hh(d, a, b, c, k[8], 11, -2022574463)
  c = hh(c, d, a, b, k[11], 16, 1839030562)
  b = hh(b, c, d, a, k[14], 23, -35309556)
  a = hh(a, b, c, d, k[1], 4, -1530992060)
  d = hh(d, a, b, c, k[4], 11, 1272893353)
  c = hh(c, d, a, b, k[7], 16, -155497632)
  b = hh(b, c, d, a, k[10], 23, -1094730640)
  a = hh(a, b, c, d, k[13], 4, 681279174)
  d = hh(d, a, b, c, k[0], 11, -358537222)
  c = hh(c, d, a, b, k[3], 16, -722521979)
  b = hh(b, c, d, a, k[6], 23, 76029189)
  a = hh(a, b, c, d, k[9], 4, -640364487)
  d = hh(d, a, b, c, k[12], 11, -421815835)
  c = hh(c, d, a, b, k[15], 16, 530742520)
  b = hh(b, c, d, a, k[2], 23, -995338651)

  a = ii(a, b, c, d, k[0], 6, -198630844)
  d = ii(d, a, b, c, k[7], 10, 1126891415)
  c = ii(c, d, a, b, k[14], 15, -1416354905)
  b = ii(b, c, d, a, k[5], 21, -57434055)
  a = ii(a, b, c, d, k[12], 6, 1700485571)
  d = ii(d, a, b, c, k[3], 10, -1894986606)
  c = ii(c, d, a, b, k[10], 15, -1051523)
  b = ii(b, c, d, a, k[1], 21, -2054922799)
  a = ii(a, b, c, d, k[8], 6, 1873313359)
  d = ii(d, a, b, c, k[15], 10, -30611744)
  c = ii(c, d, a, b, k[6], 15, -1560198380)
  b = ii(b, c, d, a, k[13], 21, 1309151649)
  a = ii(a, b, c, d, k[4], 6, -145523070)
  d = ii(d, a, b, c, k[11], 10, -1120210379)
  c = ii(c, d, a, b, k[2], 15, 718787259)
  b = ii(b, c, d, a, k[9], 21, -343485551)

  x[0] = (x[0] + a) | 0
  x[1] = (x[1] + b) | 0
  x[2] = (x[2] + c) | 0
  x[3] = (x[3] + d) | 0
}

export function computeMD5(bytes: Uint8Array): string {
  const n = bytes.length
  let state = [1732584193, -271733879, -1732584194, 271733878]
  let i = 64
  for (; i <= n; i += 64) {
    const k: number[] = []
    for (let j = 0; j < 16; j++) {
      const idx = i - 64 + j * 4
      k[j] = bytes[idx] | (bytes[idx + 1] << 8) | (bytes[idx + 2] << 16) | (bytes[idx + 3] << 24)
    }
    md5Cycle(state, k)
  }

  const tail = bytes.subarray(i - 64)
  const tailBuf = new Uint8Array(64)
  tailBuf.set(tail)
  tailBuf[tail.length] = 0x80

  if (tail.length > 55) {
    const k: number[] = []
    for (let j = 0; j < 16; j++) {
      k[j] = tailBuf[j * 4] | (tailBuf[j * 4 + 1] << 8) | (tailBuf[j * 4 + 2] << 16) | (tailBuf[j * 4 + 3] << 24)
    }
    md5Cycle(state, k)
    tailBuf.fill(0)
  }

  // Length in bits (little endian 64-bit int)
  const bitLen = n * 8
  tailBuf[56] = bitLen & 0xff
  tailBuf[57] = (bitLen >>> 8) & 0xff
  tailBuf[58] = (bitLen >>> 16) & 0xff
  tailBuf[59] = (bitLen >>> 24) & 0xff
  tailBuf[60] = Math.floor(n / 0x20000000) & 0xff

  const kFinal: number[] = []
  for (let j = 0; j < 16; j++) {
    kFinal[j] = tailBuf[j * 4] | (tailBuf[j * 4 + 1] << 8) | (tailBuf[j * 4 + 2] << 16) | (tailBuf[j * 4 + 3] << 24)
  }
  md5Cycle(state, kFinal)

  let hex = ''
  for (let j = 0; j < 4; j++) {
    const word = state[j]
    for (let b = 0; b < 4; b++) {
      const byte = (word >>> (b * 8)) & 0xff
      hex += byte.toString(16).padStart(2, '0')
    }
  }
  return hex
}

export type SupportedAlgorithm = 'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-1' | 'MD5'

export const SUPPORTED_ALGORITHMS: { id: SupportedAlgorithm; name: string; lengthBits: number }[] = [
  { id: 'SHA-256', name: 'SHA-256 (Recommended)', lengthBits: 256 },
  { id: 'SHA-512', name: 'SHA-512 (High Security)', lengthBits: 512 },
  { id: 'SHA-384', name: 'SHA-384', lengthBits: 384 },
  { id: 'SHA-1', name: 'SHA-1 (Legacy)', lengthBits: 160 },
  { id: 'MD5', name: 'MD5 (Checksums)', lengthBits: 128 },
]

export async function computeHash(
  data: ArrayBuffer | ArrayBufferLike | Uint8Array,
  algorithm: SupportedAlgorithm
): Promise<string> {
  if (algorithm === 'MD5') {
    const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data)
    return computeMD5(uint8)
  }
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data)
  const digest = await crypto.subtle.digest(algorithm, uint8)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function computeAllHashes(
  data: ArrayBuffer | ArrayBufferLike | Uint8Array
): Promise<Record<SupportedAlgorithm, string>> {
  const [sha256, sha512, sha384, sha1] = await Promise.all([
    computeHash(data, 'SHA-256'),
    computeHash(data, 'SHA-512'),
    computeHash(data, 'SHA-384'),
    computeHash(data, 'SHA-1'),
  ])
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data)
  const md5 = computeMD5(uint8)
  return {
    'SHA-256': sha256,
    'SHA-512': sha512,
    'SHA-384': sha384,
    'SHA-1': sha1,
    'MD5': md5,
  }
}
