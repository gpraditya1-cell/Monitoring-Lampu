import { useState } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { useLampStore } from '../../store/useLampStore'

export default function EditLampSheet({ lamp, onClose, onSave, onDelete }) {
  const { updateLamp, deleteLamp } = useLampStore()
  const [groupCode, setGroupCode] = useState(lamp?.group_code || '')
  const [lampNumber, setLampNumber] = useState(lamp?.lamp_number || '')
  const [areaCode, setAreaCode] = useState(lamp?.area_code || 'AC')
  const [posX, setPosX] = useState(lamp?.pos_x || 50)
  const [posY, setPosY] = useState(lamp?.pos_y || 50)
  const [saving, setSaving] = useState(false)

  const areaName = (c) => c === 'AC' ? 'Gudang 1' : 'Gudang 2'

  const handleSave = () => {
    const grp = groupCode.trim().toUpperCase()
    const n = String(parseInt(lampNumber) || 1).padStart(3, '0')
    const updated = {
      ...lamp,
      group_code: grp,
      lamp_number: n,
      lamp_code: `${areaCode} LMD ${grp} ${n}`,
      area_code: areaCode,
      area_name: areaName(areaCode),
      pos_x: parseFloat(posX) || lamp.pos_x,
      pos_y: parseFloat(posY) || lamp.pos_y,
    }
    onSave(updated)
  }

  const handleDelete = async () => {
    if (!confirm(`Hapus titik lampu ${lamp.lamp_code}?\nHistory pergantian juga akan ikut terhapus.`)) return
    setSaving(true)
    try {
      if (!lamp.id.startsWith('new-')) await deleteLamp(lamp.id)
      onDelete(lamp.id)
    } finally {
      setSaving(false)
    }
  }

  if (!lamp) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-0 right-0 bottom-0 z-60 bg-surface border-t border-border rounded-t-[20px] max-h-[88dvh] overflow-y-auto shadow-2xl"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', animation: 'sheetUp .25s cubic-bezier(.22,1,.36,1)' }}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div className="w-9 h-1 rounded-full bg-border-2 mx-auto mt-2.5 mb-2" />

        <div className="flex items-center gap-3 px-5 pb-3">
          <div className="flex-1">
            <p className="text-xs text-muted">Edit Titik Lampu</p>
            <p className="text-sm font-bold font-mono text-white">{lamp.lamp_code}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-dim">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-4">
          <p className="text-xs text-muted -mb-2">💡 Posisi juga bisa diubah dengan drag langsung di denah.</p>

          {/* Koordinat */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-muted font-semibold mb-2">X (%)</label>
              <input type="number" value={posX} onChange={(e) => setPosX(e.target.value)} min={0} max={100} step={0.1}
                className="w-full bg-s2 border border-border rounded-xl px-3 py-3 text-sm text-white text-center focus:outline-none focus:border-accent" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted font-semibold mb-2">Y (%)</label>
              <input type="number" value={posY} onChange={(e) => setPosY(e.target.value)} min={0} max={100} step={0.1}
                className="w-full bg-s2 border border-border rounded-xl px-3 py-3 text-sm text-white text-center focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Area</label>
            <select value={areaCode} onChange={(e) => setAreaCode(e.target.value)}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent">
              <option value="AC">AC — Gudang 1</option>
              <option value="AD">AD — Gudang 2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Kode Grup</label>
            <input type="text" value={groupCode} onChange={(e) => setGroupCode(e.target.value)}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-mono uppercase" />
          </div>
          <div>
            <label className="block text-xs text-muted font-semibold mb-2">Nomor Lampu</label>
            <input type="text" value={lampNumber} onChange={(e) => setLampNumber(e.target.value)}
              className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-mono" />
          </div>

          <div className="flex flex-col gap-2.5">
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-accent hover:bg-accent-2 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
              <Save size={15} /> Simpan Perubahan
            </button>
            <button onClick={handleDelete} disabled={saving}
              className="w-full bg-bad/10 hover:bg-bad/20 text-bad font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
              <Trash2 size={15} /> Hapus Titik Ini
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
