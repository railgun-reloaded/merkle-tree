import { keccak_256 as keccak256 } from '@noble/hashes/sha3'
import test from 'brittle'

import { SparseMerkleTree } from '../src/sparse-merkle-tree'

import { field as Fp } from './babyjub'
import { hash, u256 } from './helpers'

const RAILGUN_DEPTH = 16
const RAILGUN_ZERO = u256.toBytes(Fp.create(Fp.fromBytes(keccak256('Railgun'))))
const RAILGUN_ZEROS_FIXTURE = [
  0x0488f89b25bc7011eaf6a5edce71aeafb9fe706faa3c0a5cd9cbe868ae3b9ffcn,
  0x01c405064436affeae1fc8e30b2e417b4243bbb819adca3b55bb32efc3e43a4fn,
  0x0888d37652d10d1781db54b70af87b42a2916e87118f507218f9a42a58e85ed2n,
  0x183f531ead7217ebc316b4c02a2aad5ad87a1d56d4fb9ed81bf84f644549eaf5n,
  0x093c48f1ecedf2baec231f0af848a57a76c6cf05b290a396707972e1defd17dfn,
  0x1437bb465994e0453357c17a676b9fdba554e215795ebc17ea5012770dfb77c7n,
  0x12359ef9572912b49f44556b8bbbfa69318955352f54cfa35cb0f41309ed445an,
  0x2dc656dadc82cf7a4707786f4d682b0f130b6515f7927bde48214d37ec25a46cn,
  0x2500bdfc1592791583acefd050bc439a87f1d8e8697eb773e8e69b44973e6fdcn,
  0x244ae3b19397e842778b254cd15c037ed49190141b288ff10eb1390b34dc2c31n,
  0x0ca2b107491c8ca6e5f7e22403ea8529c1e349a1057b8713e09ca9f5b9294d46n,
  0x18593c75a9e42af27b5e5b56b99c4c6a5d7e7d6e362f00c8e3f69aeebce52313n,
  0x17aca915b237b04f873518947a1f440f0c1477a6ac79299b3be46858137d4bfbn,
  0x2726c22ad3d9e23414887e8233ee83cc51603f58c48a9c9e33cb1f306d4365c0n,
  0x08c5bd0f85cef2f8c3c1412a2b69ee943c6925ecf79798bb2b84e1b76d26871fn,
  0x27f7c465045e0a4d8bec7c13e41d793734c50006ca08920732ce8c3096261435n,
  0x14fceeac99eb8419a2796d1958fc2050d489bf5a3eb170ef16a667060344ba90n // root
]

test('create - small tree', assert => {
  const tree = SparseMerkleTree.create({
    depth: RAILGUN_DEPTH,
    hashFn: hash,
    zeroElement: RAILGUN_ZERO
  })

  const proof = tree.proof(0)

  for (let i = 0; i < proof.pathElements.length; i++) {
    assert.alike(proof.pathElements[i], u256.toBytes(RAILGUN_ZEROS_FIXTURE.at(i)!), `Internal node at level ${i} is equivalent`)
  }

  assert.alike(proof.root, u256.toBytes(RAILGUN_ZEROS_FIXTURE.at(-1)!), 'Roots are equivalent')
})

test('Fixture - Check against a checkpoint from RAILGUN ethereum', assert => {
  const tree = SparseMerkleTree.create({
    depth: RAILGUN_DEPTH,
    hashFn: hash,
    zeroElement: RAILGUN_ZERO
  })

  const data = require('./fixture-tree.json') as { treePosition: number, hash: string }[][]
  const nodes = []
  for (const batch of data) {
    nodes.push(...batch.map(datum => u256.toBytes(BigInt(datum.hash))))
  }
  const start = Date.now()
  tree.append(nodes.slice(0, -1))
  const duration = Date.now() - start

  assert.comment(`Append duration: ${duration}ms`)
  assert.alike(tree.root(), u256.toBytes(0x02854cff26ac9b086f55ef638f22bdc43930921cf8458fdbcb981633e10bf22an), 'Root matches fixture')

  assert.end()
})
