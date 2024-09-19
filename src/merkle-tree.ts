import tree from 'flat-tree'
import assert from 'nanoassert'

import type { InplaceMerkleHashFn, MerkleProof } from './types'

type CreateParams = { depth: number; hashFn: InplaceMerkleHashFn; zeroElement: Uint8Array }
type ConstructorParams = { buf: Uint8Array; hashFn: InplaceMerkleHashFn; bytesPerElement: number }
type Serialized = { buf: Readonly<Uint8Array> }

/**
 * General base Merkle Tree implementation.
 */
class MerkleTree {
  /**
   * Level of leaf nodes in the tree. All leaf nodes are at this level, while all internal nodes are at higher levels.
   */
  static LEAF_LEVEL = 0
  /**
   * Underlying buffer holding all tree nodes
   */
  readonly buf: Uint8Array
  /**
   * 3-arity hash function deriving parents. First argument is output buffer to be populated with the hash digest
   */
  readonly hashFn: InplaceMerkleHashFn
  /**
   * Bytes per node
   */
  readonly bytesPerElement: number
  /**
   * Total number of nodes in the tree
   */
  readonly capacity: number
  /**
   * Cached index of root node
   */
  protected readonly _rootIndex: number
  /**
   * Total number of leaf nodes in the tree
   */
  readonly size: number
  /**
   * Depth of the tree
   */
  readonly depth: number

  /**
   * Create a new MerkleTree instance with the given parameters, allocating memory to contain all nodes. Initializes the tree with the zero element. Returns an instance to use
   * @param params - Creation parameters
   * @param params.depth - Depth of the tree, excluding the root node. Must be at least 1
   * @param params.hashFn - Hash function to use for internal nodes. Must follow the InplaceMerkleHashFn signature
   * @param params.zeroElement - Zero element to use for leaf nodes. Internal nodes are calculated up to the root. Must be at least 1 byte
   * @returns Instance of MerkleTree
   */
  static create (params: CreateParams) {
    assert(params.depth > 0, 'depth must be at least 1')
    assert(params.zeroElement.byteLength > 0, 'zeroElement must be at least 1 byte')

    const bytesPerElement = params.zeroElement.byteLength
    const capacity = tree.count(2 ** params.depth - 1, params.depth)
    const buf = new Uint8Array(bytesPerElement * capacity)

    const zeroElement = params.zeroElement.slice()
    for (let d = 0; d <= params.depth; d++) {
      const iter = tree.iterator(tree.index(d, 0))

      buf.set(zeroElement, iter.index * bytesPerElement)
      while (iter.next() < capacity) {
        buf.set(zeroElement, iter.index * bytesPerElement)
      }

      // TODO: this assumes that the output buffer is not mutated before hashing completes
      params.hashFn(zeroElement, zeroElement, zeroElement)
    }

    return new this({ buf, bytesPerElement, ...params })
  }

  /**
   * Create a new MerkleTree instance from a serialized object and global parameters
   * @param obj Serialized object of the merkle tree
   * @param params Additional system parameters
   * @returns Instance
   */
  static from (obj: Serialized, params: Omit<ConstructorParams, keyof Serialized>) {
    return new this({ ...params, ...obj })
  }

  /**
   * The constructor is not meant to be used directly, use `create` or `from` methods instead.
   * @param args Constructor parameters
   * @param args.buf Uint8Array big enough to hold all nodes in the tree
   * @param args.hashFn Hash function for internal nodes. Must follow the InplaceMerkleHashFn signature
   * @param args.bytesPerElement Size of each node in bytes. Must be at least 1 byte
   */
  constructor ({ buf, hashFn, bytesPerElement }: ConstructorParams) {
    assert(bytesPerElement > 0, 'bytesPerElement must be at least 1')
    this.buf = buf
    this.hashFn = hashFn
    this.bytesPerElement = bytesPerElement
    this.capacity = this.buf.byteLength / this.bytesPerElement
    this._rootIndex = Math.trunc(this.capacity / 2)
    this.size = tree.countLeaves(this._rootIndex)
    this.depth = tree.depth(this._rootIndex)

    assert(this._rootIndex * 2 + 1 === this.capacity, 'uneven number of bytes')
  }

  /**
   * Internal method to get a reference to the buffer slice for a node at a given index
   * @param index - element-wise index
   * @returns subarray of `bytesPerElement` aligned to a multiple of the node size
   */
  protected _get (index: number) {
    const from = index * this.bytesPerElement
    const to = from + this.bytesPerElement
    return this.buf.subarray(from, to)
  }

  /**
   * Internal method to set a node at a given
   * @param index - element-wise index
   * @param value `bytesPerElement`-sized buffer to copy
   */
  protected _set (index: number, value: Readonly<Uint8Array>) {
    const from = index * this.bytesPerElement
    this.buf.set(value, from)
  }

  /**
   * Get a reference to the leaf node at a given index
   * @param index Zero-based index of the leaf node. Out of bounds indices will throw an error
   * @returns Read-only zero-copy leaf node
   */
  at (index: number): Readonly<Uint8Array> {
    assert(index >= 0, 'index out of bounds')
    assert(index < this.size, 'index out of bounds')
    const from = tree.index(MerkleTree.LEAF_LEVEL, index) * this.bytesPerElement
    const to = from + this.bytesPerElement

    return this.buf.subarray(from, to)
  }

  /**
   * Insert nodes at a given index of the tree. Supports either a single node or an array of nodes,
   * efficiently updating parents. Note only up to `size` elements can be filled, overfilling will
   * cause an assertion error.
   * @param index - start index of first element
   * @param nodes - single element or sequence of consecutive elements
   * @returns index after last element inserted. Useful for chaining inserts
   */
  insert (index: number, nodes: Readonly<Uint8Array | Uint8Array[]>): number {
    assert(index >= 0, 'index out of bounds')
    assert(index < this.size, 'index out of bounds')

    if (Array.isArray(nodes) === false) return this.insert(index, [nodes as Uint8Array])

    assert(nodes.length <= this.size - index, 'insufficient capacity')

    // Insert all leaf nodes
    const startIndex = tree.index(MerkleTree.LEAF_LEVEL, index)
    for (const node of nodes) {
      const idx = tree.index(MerkleTree.LEAF_LEVEL, index++)
      this._set(idx, node)
    }
    const endIndex = tree.index(MerkleTree.LEAF_LEVEL, index - 1)

    // Update parents, walking level by level, updating all parents in between
    let startParent = tree.parent(startIndex)
    let endParent = tree.parent(endIndex)

    // We just filled in level 0 with leaf nodes, so start at level 1
    for (let lvl = 1; lvl <= this.depth; lvl++) {
      for (const iter = tree.iterator(startParent); iter.index <= endParent; iter.next()) {
        // Type assertion here as left and right children are always defined since we are walking up the tree
        const [left, right] = tree.children(iter.index) as [number, number]

        this.hashFn(this._get(iter.index), this._get(left), this._get(right))
      }

      // Move up a level
      startParent = tree.parent(startParent)
      endParent = tree.parent(endParent)
    }

    return endIndex
  }

  /**
   * Return the root element of the tree
   * @returns Read-only zero-copy root element
   */
  root (): Readonly<Uint8Array> {
    return this._get(this._rootIndex)
  }

  /**
   * Generate an inclusion proof for a given index. Returns an object with the index, root and
   * path elements, where path elements are the first sibling and uncles of the node up to the root.
   * @param index - Leaf index to prove
   * @returns Merkle proof for the given leaf index
   */
  proof (index: number): MerkleProof {
    assert(index >= 0, 'index out of bounds')
    assert(index < this.size, 'index out of bounds')

    const iter = tree.iterator(tree.index(MerkleTree.LEAF_LEVEL, index))

    // Path of node indexes. Mapped into actual node elements later
    const path: number[] = []

    // Add adjacent sibling
    path.push(iter.sibling())
    // Walk the tree up to the root, adding each uncle
    while (true) {
      iter.parent()
      const uncleIndex = iter.sibling() // uncle
      if (uncleIndex > this.capacity) break
      path.push(uncleIndex)
    }

    return { index, root: this.root(), pathElements: path.map(i => this._get(i)) }
  }

  /**
   * Clone the current tree into an independent instance
   * @returns Cloned MerkleTree instance
   */
  clone () {
    return new MerkleTree({
      buf: this.buf.slice(),
      hashFn: this.hashFn,
      bytesPerElement: this.bytesPerElement
    })
  }

  /**
   * Zero-copy a serialisable representation of the current tree into a plain object
   * @returns Serializable object representation of the tree
   */
  serialize (): Serialized {
    return {
      buf: this.buf
    }
  }
}

export {
  type CreateParams,
  type ConstructorParams,
  type Serialized,
  MerkleTree
}
