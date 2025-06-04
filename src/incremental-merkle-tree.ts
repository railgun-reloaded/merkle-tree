import assert from 'nanoassert'

import type { ConstructorParams as MTConstructorParams, CreateParams as MTCreateParams, Serialized as MTSerialized } from './merkle-tree'
import { MerkleTree } from './merkle-tree'

type CreateParams = { length?: number } & MTCreateParams
type ConstructorParams = { length?: number } & MTConstructorParams
type Serialized = { length: number } & MTSerialized

/**
 * Incremental Merkle Tree implementation. Extends the base Merkle Tree, but provides the convenience of appending nodes at the end of the tree.
 */
class IncrementalMerkleTree extends MerkleTree {
  /**
   * Number of filled leaves in the tree
   */
  readonly length: number

  /**
   * Create a new IncrementalMerkleTree instance with the given parameters, allocating memory to contain all nodes. Initializes the tree with the zero element. Returns an instance to use
   * @param params - Creation parameters
   * @param params.depth - Depth of the tree, excluding the root node. Must be at least 1
   * @param params.hashFn - Hash function to use for internal nodes. Must follow the InplaceMerkleHashFn signature
   * @param params.zeroElement - Zero element to use for leaf nodes. Internal nodes are calculated up to the root. Must be at least 1 byte
   * @param params.length - Number of filled leaves in the tree. Defaults to 0
   * @returns Instance of MerkleTree
   */
  declare static create: (params: CreateParams) => IncrementalMerkleTree

  /**
   * Create a new IncrementalMerkleTree instance from a serialized object and global parameters
   * @param obj Serialized object of the merkle tree
   * @param params Additional system parameters
   * @returns Instance
   */
  declare static from: (obj: Serialized, params: Omit<ConstructorParams, keyof Serialized>) => IncrementalMerkleTree

  /**
   * Create a new incremental merkle tree
   * @param params - See type
   */
  constructor (params: ConstructorParams) {
    super(params)

    this.length = params.length ?? 0
    assert(this.length >= 0, 'length must be a non-negative integer')
  }

  /**
   * Append nodes at the end of the tree
   * @param nodes - Either a single node or list of nodes to append
   * @returns new length of the tree
   */
  append (nodes: Uint8Array | Uint8Array[]) {
    this.insert(this.length, nodes)
    // @ts-ignore
    this.length += nodes.length
    return this.length
  }

  /**
   * Clone the current tree into an independent instance
   * @returns Cloned IncrementalMerkleTree instance
   */
  override clone (): IncrementalMerkleTree {
    return new IncrementalMerkleTree({
      ...this.clone(),
      length: this.length
    })
  }

  /**
   * Zero-copy a serialisable representation of the current tree into a plain object
   * @returns Serializable object representation of the tree
   */
  override serialize (): Serialized {
    return { ...super.serialize(), length: this.length }
  }
}

export {
  IncrementalMerkleTree, type ConstructorParams, type CreateParams, type Serialized
}
