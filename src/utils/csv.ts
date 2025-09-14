import Papa from 'papaparse'

export function downloadCsv<T extends object>(rows: T[], filename: string) {
  const csv = Papa.unparse(rows as any)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

