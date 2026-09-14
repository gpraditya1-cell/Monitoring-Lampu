import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, History, CalendarDays, MapPin, LogOut, ChevronRight, Settings } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useLampStore } from '../store/useLampStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile, signOut, isAdmin } = useAuthStore()
  const { maps, fetchMaps, getStats, fetchAllHistory, history } = useLampStore()

  useEffect(() => {
    fetchMaps()
    fetchAllHistory()
  }, [])

  const stats = getStats()

  const statCards = [
    { label: 'Total Titik Lampu', value: stats.totalLamps, color: '#6366f1', icon: Lightbulb },
    { label: 'Total History', value: stats.totalHistory, color: '#4ade80', icon: History },
    { label: 'Ganti Bulan Ini', value: stats.thisMonth, color: '#a78bfa', icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 pb-12">
        {/* Header */}
        <div className="pt-12 pb-6 flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-widest font-semibold mb-1">PT. Triputra Textile</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Monitoring Lampu</h1>
            <p className="text-sm text-muted mt-0.5">
              {profile?.full_name} · <span className="capitalize">{profile?.role}</span>
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            {isAdmin() && (
              <button
                onClick={() => navigate('/admin')}
                className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-dim hover:bg-border-2 transition-colors"
              >
                <Settings size={16} />
              </button>
            )}
            <button
              onClick={signOut}
              className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-dim hover:bg-border-2 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statCards.map((c) => (
            <div key={c.label} className="bg-surface border border-border rounded-2xl p-3.5">
              <c.icon size={14} style={{ color: c.color }} className="mb-2" />
              <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[11px] text-muted mt-0.5 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Maps list */}
        <div className="mb-2">
          <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-3">Denah Tersedia</p>
          <div className="flex flex-col gap-3">
            {maps.map((map) => (
              <button
                key={map.id}
                onClick={() => navigate(`/map/${map.id}`)}
                className="w-full bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-s3 active:bg-border transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{map.name}</p>
                  <p className="text-xs text-muted mt-0.5">{map.area_codes?.join(', ')} · {map.description}</p>
                </div>
                <ChevronRight size={16} className="text-muted flex-shrink-0" />
              </button>
            ))}
            {maps.length === 0 && (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                <p className="text-muted text-sm">Belum ada denah.</p>
                {isAdmin() && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="mt-2 text-accent text-sm font-semibold"
                  >
                    + Tambah Denah
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent history */}
        {history.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted font-semibold uppercase tracking-wider">Pergantian Terbaru</p>
              <button onClick={() => navigate('/history')} className="text-xs text-accent font-semibold">
                Lihat Semua
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {history.slice(0, 5).map((h) => (
                <div key={h.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-mono text-white">{h.lamp?.lamp_code}</p>
                    <p className="text-xs text-muted mt-0.5">{h.kondisi}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-dim">{new Date(h.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}</p>
                    <p className="text-[11px] text-muted mt-0.5">{h.lamp?.area_code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
