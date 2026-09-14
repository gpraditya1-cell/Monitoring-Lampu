import * as XLSX from 'xlsx'

export function exportHistoryToExcel(history, filters = {}) {
  const rows = history.map((h, i) => ({
    'No': i + 1,
    'Tanggal': h.tanggal,
    'Kode Lampu': h.lamp?.lamp_code || '',
    'Area': h.lamp?.area_code || '',
    'Kelompok': h.lamp?.group_code || '',
    'Kondisi': h.kondisi,
    'Tindakan': h.tindakan,
    'Catatan': h.catatan || '',
    'Dicatat Oleh': h.created_by_profile?.full_name || '',
    'Waktu Input': new Date(h.created_at).toLocaleString('id-ID'),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 14 },  // Tanggal
    { wch: 18 },  // Kode Lampu
    { wch: 8 },   // Area
    { wch: 12 },  // Kelompok
    { wch: 16 },  // Kondisi
    { wch: 16 },  // Tindakan
    { wch: 24 },  // Catatan
    { wch: 20 },  // Dicatat Oleh
    { wch: 20 },  // Waktu Input
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'History Pergantian')

  // Filename with date
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const label = filters.area ? `_${filters.area}` : ''
  XLSX.writeFile(wb, `history-lampu${label}_${dateStr}.xlsx`)
}
