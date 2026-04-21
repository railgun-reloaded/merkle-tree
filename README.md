# `@railgun-reloaded/merkle-tree`

> Collection of Merkle Tree implementations as used in RAILGUN

## Getting Started

```js
import { SparseMerkleTree } from '@railgun-reloaded/merkle-tree'

const treeDepth = 16

const zeroElement = new Uint8Array(32)

const hashFn = (out, left, right) => {
  crypto.createHash('sha3-256').update(left).update(right).digest(out)
}

const tree = SparseMerkleTree.create({ treeDepth, zeroElement, hashFn })

// Append three leaves to the tree
const newLength = tree.append([node1, node2, node3])

// Get the root node of the tree
const rootNode = tree.root()

// Generate a proof for the second leaf of the tree
const proofLeaf1 = tree.proof(1)

// Serialize the tree to primitives that can be stored
const flat = tree.serialize()
```

## Install

```sh
npm install --save @railgun-reloaded/merkle-tree
```

## API

### `SparseMerkleTree`

Sparse Merkle Tree implementation with efficient batch inserts. Inherits all methods from `MerkleTree`.

#### `const tree = SparseMerkleTree.create({ depth, hashFn, zeroElement, length })`

Create a new Sparse Merkle Tree instance with the given parameters.

#### `const tree = SparseMerkleTree.from({ buf, length }, { depth, hashFn })`

#### `const len = tree.length`

Current length of set leaf nodes in the tree

#### `const len = tree.append(nodes)`

Insert one or more leaf nodes efficiently in the tree. Returns the new length of the tree.

#### `const flat = tree.serialize()`

Returns a zero-copy flat object representation of the tree, which can be stored or transmitted.
The object includes all properties that are not global system parameters.
Zero-copy here means that references are preserved, hence no modification to the returned object must be made.

### `MerkleTree`

General base Merkle Tree implementation.

#### `const tree = MerkleTree.create({ depth, hashFn, zeroElement })`

#### `const tree = MerkleTree.from({ buf }, { depth, hashFn })`

#### `const buf = tree.buf`

The underlying buffer of the tree, which contains all nodes in a flat structure.

#### `const bytesPerElement = tree.bytesPerElement`

Bytes per node

#### `const capacity = tree.capacity`

Total number of nodes in the tree

#### `const size = tree.size`

Total number of leaf nodes in the tree

#### `const depth = tree.depth`

Depth of the tree

#### `const node = tree.at(index)`

Get a reference to the leaf node at a given index.
Note the node is read-only and must not be modified.

#### `const end = tree.insert(i, nodes)`

Insert nodes at a given index of the tree. Supports either a single node or an array of nodes, efficiently updating parents. Note only up to `size` elements can be filled, overfilling will cause an assertion error.

#### `const root = tree.root()`

Get a referent to the root node of the tree.
Note the node is read-only and must not be modified.

#### `const proof = tree.proof(i)`

Generate an inclusion proof for a given index. Returns an object with the index, root and path elements, where path elements are the first sibling and uncles of the node up to the root.

#### `const tree = tree.clone()`

Clone the current tree into an independent instance

#### `const flat = tree.serialize()`

Returns a zero-copy flat object representation of the tree, which can be stored or transmitted.
The object includes all properties that are not global system parameters.
Zero-copy here means that references are preserved, hence no modification to the returned object must be made.

## License

[MIT](LICENSE)
