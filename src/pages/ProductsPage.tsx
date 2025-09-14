import { useCallback, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProducts, fetchProductsByParent, patchProductPrice } from '../services/api'
import type { ProductNode } from '../types'
import Papa from 'papaparse'
import PriceUpdateDialog from '../components/PriceUpdateDialog'
import { downloadCsv } from '../utils/csv'

type Props = {
  cookieString: string
  companyId: string
  onChangeCookie: () => void
}

export default function ProductsPage({ cookieString, companyId, onChangeCookie }: Props) {
  const qc = useQueryClient()
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [parentFilter, setParentFilter] = useState<string | ''>('')
  const [pendingCsvRows, setPendingCsvRows] = useState<Array<{ node_id: string; new_price: number }>>([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['products', companyId, pagination.page, pagination.pageSize, parentFilter],
    queryFn: async () => {
      if (parentFilter) {
        return fetchProductsByParent({ companyId, cookieString, parentId: parentFilter, limit: 100, offset: 0 })
      }
      return fetchProducts({ companyId, cookieString, limit: pagination.pageSize, offset: pagination.page * pagination.pageSize })
    },
    keepPreviousData: true,
  })

  const products: ProductNode[] = data?.items ?? []
  const total = data?.total ?? products.length

  const parentsQuery = useQuery({
    // Lightweight fetch to seed parent filter; adjust limit as needed
    queryKey: ['products-parents', companyId],
    queryFn: async () => fetchProducts({ companyId, cookieString, limit: 100, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  })

  const parentOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of parentsQuery.data?.items ?? []) {
      if (p.parent_node_id && !seen.has(p.parent_node_id)) {
        seen.set(p.parent_node_id, `Parent ${p.parent_node_id}`)
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [parentsQuery.data])

  const columns: GridColDef<ProductNode>[] = [
    { field: 'node_id', headerName: 'node_id', flex: 1, minWidth: 140 },
    { field: 'sid', headerName: 'sid', flex: 1, minWidth: 120 },
    { field: 'name', headerName: 'name', flex: 1.5, minWidth: 180 },
    { field: 'parent_node_id', headerName: 'parent_node_id', flex: 1, minWidth: 140 },
    { field: 'updated_at', headerName: 'updated_at', flex: 1, minWidth: 160 },
    {
      field: 'price',
      headerName: 'price',
      type: 'number',
      valueGetter: (p) => (typeof p.row.price === 'string' ? parseFloat(p.row.price) : p.row.price ?? null),
      flex: 1,
      minWidth: 120,
    },
  ]

  const onUploadCsv = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: Array<{ node_id: string; new_price: number }> = []
        for (const r of results.data as any[]) {
          const nid = String(r.node_id ?? '').trim()
          const price = Number(String(r.price ?? '').trim())
          if (nid && !Number.isNaN(price)) {
            rows.push({ node_id: nid, new_price: price })
          }
        }
        setPendingCsvRows(rows)
        setPreviewOpen(true)
      },
    })
  }, [])

  const onConfirmUpdates = useCallback(async () => {
    if (!pendingCsvRows.length) return []
    const now = new Date()
    const snapshot: Array<{ node_id: string; sid: string; name: string; old_price: number | null; new_price: number; timestamp: string; status: string }>
      = []
    for (const item of pendingCsvRows) {
      const node = products.find((p) => String(p.node_id) === String(item.node_id))
      const oldPrice = typeof node?.price === 'string' ? parseFloat(node.price) : node?.price ?? null
      try {
        await patchProductPrice({ companyId, cookieString, nodeId: String(item.node_id), price: item.new_price })
        snapshot.push({ node_id: String(item.node_id), sid: node?.sid ?? '', name: node?.name ?? '', old_price: oldPrice, new_price: item.new_price, timestamp: now.toISOString(), status: 'success' })
      } catch (e: any) {
        snapshot.push({ node_id: String(item.node_id), sid: node?.sid ?? '', name: node?.name ?? '', old_price: oldPrice, new_price: item.new_price, timestamp: now.toISOString(), status: 'error' })
      }
    }
    // Download snapshot
    downloadCsv(snapshot, `changes-${formatTimestamp(now)}.csv`)
    // Refresh list
    qc.invalidateQueries({ queryKey: ['products'] })
    return snapshot
  }, [pendingCsvRows, products, companyId, cookieString, qc])

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Toolbar disableGutters sx={{ mb: 2, gap: 1, justifyContent: 'space-between' }}>
        <Typography variant="h6">Sortly Products</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onChangeCookie}>Change Cookie</Button>
          <Button variant="contained" component="label">
            Upload CSV
            <input type="file" hidden accept=".csv,text/csv" onChange={(e) => e.target.files && e.target.files[0] && onUploadCsv(e.target.files[0])} />
          </Button>
        </Stack>
      </Toolbar>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel id="parent-filter-label">Filter by Parent</InputLabel>
          <Select
            labelId="parent-filter-label"
            label="Filter by Parent"
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {parentOptions.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name} ({p.id})</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          loading={isLoading}
          rows={products}
          columns={columns}
          rowCount={total}
          getRowId={(r) => String(r.node_id)}
          paginationMode={parentFilter ? 'client' : 'server'}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[10, 25, 50, 100]}
          slots={{ loadingOverlay: LinearProgress as any }}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Update Preview</DialogTitle>
        <DialogContent>
          <PriceUpdateDialog
            rows={pendingCsvRows.map(r => {
              const node = products.find(p => String(p.node_id) === String(r.node_id))
              const oldPrice = typeof node?.price === 'string' ? parseFloat(node.price) : node?.price ?? null
              return {
                node_id: String(r.node_id),
                sid: node?.sid ?? '',
                name: node?.name ?? '',
                old_price: oldPrice,
                new_price: r.new_price,
              }
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { await onConfirmUpdates(); setPreviewOpen(false) }}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

function formatTimestamp(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const HH = pad(d.getHours())
  const MM = pad(d.getMinutes())
  return `${yyyy}${mm}${dd}-${HH}${MM}`
}
