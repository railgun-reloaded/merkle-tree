import { poseidonT3 } from './poseidonT3'

const u256 = {
  /**
   * Number of bytes in a 256-bit integer buffer
   */
  BYTE_LENGTH: 32 as const,
  /**
   * Convert a Uint8Array in big-endian format to a BigInt
   * @param buf - 32 byte memory segment
   * @returns bigint
   */
  fromBytes (buf: Readonly<Uint8Array>): bigint {
    const view = new DataView(buf.buffer, buf.byteOffset, u256.BYTE_LENGTH)

    return view.getBigUint64(24, false) |
      (view.getBigUint64(16, false) << 64n) |
      (view.getBigUint64(8, false) << 128n) |
      (view.getBigUint64(0, false) << 192n)
  },

  /**
   * Convert a BigInt to a Uint8Array in big-endian format
   * @param bn - bigint to encode
   * @param buf - optional buffer to write to
   * @param byteOffset - optional `byteOffset` to write at. Note that `.subarray`'ed segments must pass `.byteOffset`
   * @returns `buf` (whether newly allocated or the passed segment)
   */
  toBytes (bn: bigint, buf: Uint8Array = new Uint8Array(u256.BYTE_LENGTH), byteOffset: number = 0): Uint8Array {
    const view = new DataView(buf.buffer, byteOffset, u256.BYTE_LENGTH)

    view.setBigUint64(24, bn, false)
    view.setBigUint64(16, bn >> 64n, false)
    view.setBigUint64(8, bn >> 128n, false)
    view.setBigUint64(0, bn >> 192n, false)

    return buf
  },

}

const hashScratch = new Uint8Array(u256.BYTE_LENGTH)

/**
 * Calculate the PosiedonT3 hash of two 256-bit inputs, writing the result to `out` for
 * optinal zero-copy. By default a scratch buffer is used, however this buffer may be reused
 * by subsequent calls.
 * @param out - 32 byte segment to write hash to
 * @param left - 32 byte left element
 * @param right - 32 byte right element
 * @returns `out` for convenience
 */
function hash (out: Uint8Array = hashScratch, left: Readonly<Uint8Array>, right: Readonly<Uint8Array>): Uint8Array {
  const hashBigInt = poseidonT3([u256.fromBytes(left), u256.fromBytes(right)])
  return u256.toBytes(hashBigInt, out, out.byteOffset)
}

export {
  u256,
  hash
}
