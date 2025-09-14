import { Box } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

export type PreviewRow = {
  node_id: string
  sid: string
  name: string
  old_price: number | null
  new_price: number
}

const columns: GridColDef<PreviewRow>[] = [
  { field: 'node_id', headerName: 'node_id', flex: 1, minWidth: 140 },
  { field: 'sid', headerName: 'sid', flex: 1, minWidth: 120 },
  { field: 'name', headerName: 'name', flex: 1.5, minWidth: 180 },
  { field: 'old_price', headerName: 'old_price', type: 'number', flex: 1, minWidth: 120 },
  { field: 'new_price', headerName: 'new_price', type: 'number', flex: 1, minWidth: 120 },
]

export default function PriceUpdateDialog({ rows }: { rows: PreviewRow[] }) {
  return (
    <Box sx={{ height: 400 }}>
      <DataGrid rows={rows} columns={columns} getRowId={(r) => r.node_id} hideFooterSelectedRowCount />
    </Box>
  )
}

