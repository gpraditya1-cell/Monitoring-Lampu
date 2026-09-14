import { useState } from 'react'
import { X, Save, ArrowLeft } from 'lucide-react'
import { useLampStore } from '../../store/useLampStore'
import { useAuthStore } from '../../store/useAuthStore'

const KONDISI = [
  { value: 'Mati', color: '#9ca3af' },
  { value: 'Redup / Kedip', color: '#fbbf24' },
  { value: 'Pecah / Rusak', color: '#f87171' },
]

export default function FormPergantian({ lamp, onClose, onBack, onSaved }) {
  const { addHistory } = useLampStore()
  const { user } = useAuthStore()

  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [kondisi, setKondisi] = useState('')
  const [tindakan, setTindakan] = useState('Ganti Lampu')
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!kondisi) { setError('Pilih kondisi lampu.'); return }
    if (!tanggal) { setError('Isi tanggal.'); return }
    setError(''); setSaving(true)
    try {
      await addHistory(lamp.id, { tanggal, kondisi, tindakan: tindakan.trim() || 'Ganti Lampu', catatan }, user?.id)
      onSaved?.()
    } catch (e) {
      setError('Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-0 right-0 bottom-0 z-60 bg-surface border-t border-border rounded-t-[20px] max-h-[88dvh] overflow-y-auto shadow-2xl"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', animation: 'sheetUp .25s cubic-bezier(.22,1,.36,1)' }}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div className="w-9 h-1 rounded-full bg-border-2 mx-auto mt-2.5 mb-2" />

        <div className="flex items-center gap-3 px-5 pb-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim">
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Catat Pergantian</p>
            <p className="text-sm font-bold font-mono text-white truncate">{lamp.lamp_code}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Tanggal Pergantian</label>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Kondisi Lampu</label>
            <div className="flex flex-col gap-2">
              {KONDISI.map((k) => (
                <label key={k.value}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all"
                  style={{ borderColor: kondisi === k.value ? k.color : '#2d3147', background: kondisi === k.value ? k.color + '18' : 'transparent' }}>
                  <input type="radio" name="kondisi" value={k.value} checked={kondisi === k.value}
                    onChange={() => setKondisi(k.value)} className="sr-only" />
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: k.color }} />
                  <span className="text-sm text-white">{k.value}</span>
                  {kondisi === k.value && <span className="ml-auto text-white">✓</span>}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Tindakan</label>
            <input type="text" value={tindakan} onChange={(e) => setTindakan(e.target.value)}
              placeholder="Ganti Lampu"
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-muted" />
          </div>

          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Catatan (opsional)</label>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan jika ada…" rows={2}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-muted resize-none" />
          </div>

          {error && <p className="text-xs text-bad bg-bad/10 rounded-lg px-3 py-2">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-accent hover:bg-accent-2 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
            <Save size={15} />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </>
  )
}
