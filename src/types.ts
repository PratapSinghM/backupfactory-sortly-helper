export type ProductNode = {
  node_id: string
  sid: string
  name: string
  parent_node_id?: string
  updated_at?: string
  price?: number | string | null
}

export type ProductResponse = {
  items: ProductNode[]
  total: number
}

