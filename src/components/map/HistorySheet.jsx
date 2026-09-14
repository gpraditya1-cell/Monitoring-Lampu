import { X, ArrowLeft, Trash2 } from 'lucide-react'
import { useLampStore } from '../../store/useLampStore'
import { useAuthStore } from '../../store/useAuthStore'

const KC = { 'Mati': '#9ca3af', 'Redup / Kedip': '#fbbf24', 'Pecah / Rusak': '#f87171' }

export default function HistorySheet({ lamp, onClose, onBack }) {
  const { getLampHistory, deleteHistory } = useLampStore()
  const { isAdmin } = useAuthStore()
  const history = getLampHistory(lamp.id)

  const handleDelete = async (id) => {
    if (!confirm('Hapus catatan ini?')) return
    await deleteHistory(id)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-0 right-0 bottom-0 z-60 bg-surface border-t border-border rounded-t-[20px] max-h-[88dvh] overflow-y-auto shadow-2xl"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', animation: 'sheetUp .25s cubic-bezier(.22,1,.36,1)' }}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div className="w-9 h-1 rounded-full bg-border-2 mx-auto mt-2.5 mb-2" />

        <div className="flex items-center gap-3 px-5 pb-4">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim">
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Riwayat Pergantian</p>
            <p className="text-sm font-bold font-mono text-white truncate">{lamp.lamp_code}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-4">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-sm">Belum ada riwayat pergantian</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
              <div className="flex flex-col">
                {history.map((h) => {
                  const c = KC[h.kondisi] || '#6b7280'
                  return (
                    <div key={h.id} className="flex gap-4 pb-3">
                      <div className="w-10 flex-shrink-0 flex justify-center pt-1 z-10">
                        <div className="w-3 h-3 rounded-full border-2 border-surface" style={{ background: c }} />
                      </div>
                      <div className="flex-1 bg-s2 border border-border rounded-xl p-3 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              {new Date(h.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
                            </p>
                            <p className="text-xs mt-0.5 font-medium" style={{ color: c }}>{h.kondisi}</p>
                            {h.catatan && <p className="text-xs text-muted mt-1">{h.catatan}</p>}
                            {h.created_by_profile?.full_name && (
                              <p className="text-[11px] text-muted mt-1">oleh {h.created_by_profile.full_name}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className="text-[11px] bg-border text-dim px-2.5 py-1 rounded-lg whitespace-nowrap">{h.tindakan}</span>
                            {isAdmin() && (
                              <button onClick={() => handleDelete(h.id)}
                                className="w-7 h-7 rounded-lg bg-bad/10 flex items-center justify-center text-bad">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-center text-xs text-muted mt-2">Total {history.length} pergantian tercatat</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
