import { twistedEdwards } from '@noble/curves/abstract/edwards'
import { Field } from '@noble/curves/abstract/modular'
import { sha512 } from '@noble/hashes/sha512'
import { randomBytes } from '@noble/hashes/utils'

/**
 * jubjub Twisted Edwards curve.
 * https://neuromancer.sk/std/other/JubJub
 * jubjub does not use EdDSA, so `hash`/sha512 params are passed because interface expects them.
 */
const babyjub = twistedEdwards({
  // Params: a, d
  a: 168700n,
  d: 168696n,
  // Finite field 𝔽p over which we'll do calculations
  // Same value as bls12-381 Fr (not Fp)
  Fp: Field(21888242871839275222246405745257275088548364400416034343698204186575808495617n),
  // Subgroup order: how many points curve has
  n: 21888242871839275222246405745257275088614511777268538073601725287587578984328n,
  // Cofactor
  h: 8n,
  // Base point (x, y) aka generator point
  Gx: 995203441582195749578291179787384436505546430278305826713579947235728471134n,
  Gy: 5472060717959818805561601436314318772137091100104008585924551046643952123905n,
  hash: sha512,
  randomBytes,
})

const field = babyjub.CURVE.Fp

export {
  babyjub,
  field
}
