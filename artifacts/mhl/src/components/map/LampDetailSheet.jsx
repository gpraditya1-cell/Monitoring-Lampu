import { useState } from 'react'
import { X, Plus, History, ChevronRight } from 'lucide-react'
import { useLampStore } from '../../store/useLampStore'
import { useAuthStore } from '../../store/useAuthStore'
import FormPergantian from './FormPergantian'
import HistorySheet from './HistorySheet'

export default function LampDetailSheet({ lampId, mapId, onClose }) {
  const { lamps, getLampHistory } = useLampStore()
  const { user } = useAuthStore()
  const lamp = lamps.find((l) => l.id === lampId)
  const history = getLampHistory(lampId)
  const last = history[0] || null

  const [subSheet, setSubSheet] = useState(null)

  if (!lamp) return null

  if (subSheet === 'form') return (
    <FormPergantian lamp={lamp} onClose={() => setSubSheet(null)} onBack={() => setSubSheet(null)} onSaved={() => setSubSheet(null)} />
  )
  if (subSheet === 'history') return (
    <HistorySheet lamp={lamp} onClose={onClose} onBack={() => setSubSheet(null)} />
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-0 right-0 bottom-0 z-60 bg-surface border-t border-border rounded-t-[20px] max-h-[88dvh] overflow-y-auto shadow-2xl"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', animation: 'sheetUp .25s cubic-bezier(.22,1,.36,1)' }}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div className="w-9 h-1 rounded-full bg-border-2 mx-auto mt-2.5 mb-2" />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted mb-1">ID Lampu</p>
            <p className="text-base font-bold font-mono text-white">{lamp.lamp_code}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim mt-0.5">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-4">
          {/* Info */}
          <div className="bg-s2 border border-border rounded-2xl overflow-hidden mb-3">
            {[
              ['Area', `${lamp.area_name} (${lamp.area_code})`],
              ['Posisi', lamp.lamp_position === 'LMD' ? 'Lampu Dalam' : 'Lampu Luar'],
              ['Kelompok', lamp.group_code],
              ['Nomor', lamp.lamp_number],
            ].map(([k, v], i, arr) => (
              <div key={k} className={`flex justify-between items-center gap-3 px-4 py-2.5 ${i < arr.length-1 ? 'border-b border-border' : ''}`}>
                <span className="text-xs text-muted">{k}</span>
                <span className="text-xs font-semibold text-white font-mono">{v}</span>
              </div>
            ))}
          </div>

          {/* Last history */}
          <div className="bg-s2 border border-border rounded-2xl px-4 py-3 mb-4">
            {last ? (
              <>
                <p className="text-[11px] text-muted mb-1.5">Pergantian Terakhir</p>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {new Date(last.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{last.kondisi}</p>
                  </div>
                  <span className="text-[11px] bg-border text-dim px-2.5 py-1 rounded-lg">{last.tindakan}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted">Belum ada riwayat pergantian</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setSubSheet('form')}
              className="w-full bg-accent hover:bg-accent-2 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
              <Plus size={16} /> Catat Pergantian
            </button>
            <button onClick={() => setSubSheet('history')}
              className="w-full bg-border hover:bg-border-2 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
              <History size={16} /> Lihat History
              {history.length > 0 && (
                <span className="bg-accent text-white text-[11px] px-2 py-0.5 rounded-full">{history.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
