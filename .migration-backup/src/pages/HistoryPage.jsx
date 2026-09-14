import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Filter, X } from 'lucide-react'
import { useLampStore } from '../store/useLampStore'
import { useAuthStore } from '../store/useAuthStore'
import { exportHistoryToExcel } from '../lib/exportExcel'

const KONDISI_COLOR = {
  'Mati': '#9ca3af',
  'Redup / Kedip': '#fbbf24',
  'Pecah / Rusak': '#f87171',
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { history, fetchAllHistory, deleteHistory, maps } = useLampStore()
  const { isAdmin } = useAuthStore()

  const [filterArea, setFilterArea] = useState('all')
  const [filterKondisi, setFilterKondisi] = useState('all')
  const [filterMonth, setFilterMonth] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => { fetchAllHistory() }, [])

  // Filter
  const filtered = history.filter((h) => {
    if (filterArea !== 'all' && h.lamp?.area_code !== filterArea) return false
    if (filterKondisi !== 'all' && h.kondisi !== filterKondisi) return false
    if (filterMonth && !h.tanggal.startsWith(filterMonth)) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      const code = (h.lamp?.lamp_code || '').toLowerCase()
      if (!code.includes(q)) return false
    }
    return true
  })

  const handleExport = () => {
    exportHistoryToExcel(filtered, { area: filterArea !== 'all' ? filterArea : '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus catatan ini?')) return
    await deleteHistory(id)
  }

  const areaCodes = [...new Set(maps.flatMap((m) => m.area_codes || []))]

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
            <button onClick={() => navigate('/')}
              className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-dim">
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted">Riwayat</p>
              <p className="text-sm font-bold text-white">History Pergantian</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilter((v) => !v)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${showFilter ? 'bg-accent text-white' : 'bg-border text-dim'}`}>
                <Filter size={15} />
              </button>
              <button onClick={handleExport}
                className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-dim hover:bg-border-2 transition-colors"
                title="Export Excel">
                <Download size={16} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Cari kode lampu…"
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="px-4 pb-3 flex flex-col gap-3 border-t border-border pt-3 bg-s3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button onClick={() => setFilterArea('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${filterArea === 'all' ? 'bg-accent text-white' : 'bg-border text-dim'}`}>
                  Semua Area
                </button>
                {areaCodes.map((a) => (
                  <button key={a} onClick={() => setFilterArea(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${filterArea === a ? 'bg-accent text-white' : 'bg-border text-dim'}`}>
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[['all', 'Semua Kondisi'], ['Mati', 'Mati'], ['Redup / Kedip', 'Redup/Kedip'], ['Pecah / Rusak', 'Pecah/Rusak']].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterKondisi(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${filterKondisi === v ? 'bg-accent text-white' : 'bg-border text-dim'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  style={{ colorScheme: 'dark' }} />
                {filterMonth && (
                  <button onClick={() => setFilterMonth('')}
                    className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Count + export info */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-muted">{filtered.length} data</p>
          <button onClick={handleExport}
            className="text-xs text-accent font-semibold flex items-center gap-1">
            <Download size={12} /> Export Excel
          </button>
        </div>

        {/* List */}
        <div className="px-4 pb-8 flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted text-sm">Tidak ada data</p>
            </div>
          ) : (
            filtered.map((h) => {
              const c = KONDISI_COLOR[h.kondisi] || '#6b7280'
              return (
                <div key={h.id} className="bg-surface border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                        <p className="text-sm font-bold font-mono text-white">{h.lamp?.lamp_code}</p>
                      </div>
                      <p className="text-xs font-medium" style={{ color: c }}>{h.kondisi}</p>
                      {h.catatan && <p className="text-xs text-muted mt-1">{h.catatan}</p>}
                      {h.created_by_profile?.full_name && (
                        <p className="text-[11px] text-muted mt-1">oleh {h.created_by_profile.full_name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-xs font-semibold text-dim">
                        {new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="text-[11px] bg-border text-dim px-2 py-0.5 rounded-lg">{h.tindakan}</span>
                      <span className="text-[11px] text-muted">{h.lamp?.area_code}</span>
                      {isAdmin() && (
                        <button onClick={() => handleDelete(h.id)}
                          className="text-[11px] text-bad/70 hover:text-bad transition-colors">
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
