type InplaceMerkleHashFn = (out: Uint8Array, left: Readonly<Uint8Array>, right: Readonly<Uint8Array>) => Readonly<Uint8Array>
type MerkleProof = { index: number, root: Readonly<Uint8Array>, pathElements: Readonly<Uint8Array[]> }

export type {
  InplaceMerkleHashFn,
  MerkleProof
}
