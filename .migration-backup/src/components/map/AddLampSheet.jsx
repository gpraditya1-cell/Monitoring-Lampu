import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useLampStore } from '../../store/useLampStore'
import { useAuthStore } from '../../store/useAuthStore'

export default function AddLampSheet({ mapId, pendingPos, onClose, onAdded, editMode }) {
  const { upsertLamp } = useLampStore()
  const { user } = useAuthStore()

  const [groupCode, setGroupCode] = useState('')
  const [lampNumber, setLampNumber] = useState('')
  const [areaCode, setAreaCode] = useState('AC')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const areaName = (c) => c === 'AC' ? 'Gudang 1' : 'Gudang 2'

  const handleSave = async () => {
    const grp = groupCode.trim().toUpperCase()
    const num = lampNumber.trim()
    if (!grp) { setError('Isi kode grup.'); return }
    if (!num) { setError('Isi nomor lampu.'); return }
    const n = String(parseInt(num) || 1).padStart(3, '0')
    const lampCode = `${areaCode} LMD ${grp} ${n}`
    setError(''); setSaving(true)
    try {
      const lamp = await upsertLamp({
        lamp_code: lampCode,
        area_code: areaCode,
        area_name: areaName(areaCode),
        lamp_position: 'LMD',
        group_code: grp,
        lamp_number: n,
        map_id: mapId,
        pos_x: Math.round((pendingPos?.x || 50) * 100) / 100,
        pos_y: Math.round((pendingPos?.y || 50) * 100) / 100,
      })
      onAdded(lamp)
    } catch (e) {
      setError('Gagal menyimpan. Kode lampu mungkin sudah ada.')
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
          <div className="flex-1">
            <p className="text-xs text-muted">Tambah Titik Lampu</p>
            {pendingPos && <p className="text-xs text-muted font-mono mt-0.5">X={pendingPos.x.toFixed(1)}% Y={pendingPos.y.toFixed(1)}%</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Area</label>
            <select value={areaCode} onChange={(e) => setAreaCode(e.target.value)}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent">
              <option value="AC">AC — Gudang 1</option>
              <option value="AD">AD — Gudang 2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Kode Grup (contoh: A8, H7, L3)</label>
            <input type="text" value={groupCode} onChange={(e) => setGroupCode(e.target.value)}
              placeholder="A8" autoCapitalize="characters"
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-muted font-mono uppercase" />
          </div>
          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Nomor Lampu</label>
            <input type="number" value={lampNumber} onChange={(e) => setLampNumber(e.target.value)}
              placeholder="001" min={1}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-muted" />
          </div>

          {groupCode && lampNumber && (
            <div className="bg-accent/10 border border-accent/25 rounded-xl px-4 py-3">
              <p className="text-xs text-muted mb-1">Preview ID Lampu</p>
              <p className="text-sm font-bold font-mono text-accent">
                {areaCode} LMD {groupCode.toUpperCase()} {String(parseInt(lampNumber)||1).padStart(3,'0')}
              </p>
            </div>
          )}

          {error && <p className="text-xs text-bad bg-bad/10 rounded-lg px-3 py-2">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-accent hover:bg-accent-2 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
            <Plus size={15} />
            {saving ? 'Menyimpan...' : 'Tambah Titik'}
          </button>
        </div>
      </div>
    </>
  )
}
