import * as BN from "@blocknote/core"

type EditorOutput<Block, V> = {
  version: V
  time: number
  blocks: Block[]
}

export type Block = BN.Block<BN.DefaultBlockSchema>

export type Output = EditorOutput<Block, "v1">
