import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Upload, Trash2, Users, Map, Database } from 'lucide-react'
import { useLampStore } from '../store/useLampStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { buildSeedLamps } from '../lib/seedLamps'

export default function AdminPage() {
  const navigate = useNavigate()
  const { maps, fetchMaps, createMap, uploadMapImage, deleteMap, seedLamps } = useLampStore()
  const { isAdmin } = useAuthStore()

  const [tab, setTab] = useState('maps') // maps | users
  const [showAddMap, setShowAddMap] = useState(false)
  const [newMapName, setNewMapName] = useState('')
  const [newMapDesc, setNewMapDesc] = useState('')
  const [newMapAreas, setNewMapAreas] = useState('')
  const [creating, setCreating] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [seeding, setSeeding] = useState(null)
  const fileRefs = useRef({})

  if (!isAdmin()) {
    navigate('/')
    return null
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setUsers(data || [])
    setLoadingUsers(false)
  }

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'users') fetchUsers()
  }

  const handleCreateMap = async () => {
    if (!newMapName.trim()) return
    setCreating(true)
    try {
      const areaCodes = newMapAreas.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
      await createMap({
        name: newMapName.trim(),
        description: newMapDesc.trim(),
        area_codes: areaCodes,
      })
      setNewMapName(''); setNewMapDesc(''); setNewMapAreas('')
      setShowAddMap(false)
      await fetchMaps()
    } catch (e) {
      alert('Gagal membuat denah: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleUploadImage = async (mapId, file) => {
    try {
      await uploadMapImage(mapId, file)
      alert('Gambar berhasil diupload!')
    } catch (e) {
      alert('Gagal upload: ' + e.message)
    }
  }

  const handleSeedLamps = async (mapId) => {
    if (!confirm('Seed data lampu Gudang 1 & 2 ke denah ini? Data yang sudah ada tidak akan terduplikasi.')) return
    setSeeding(mapId)
    try {
      const seedData = buildSeedLamps(mapId)
      await seedLamps(mapId, seedData)
      alert(`${seedData.length} titik lampu berhasil di-seed!`)
    } catch (e) {
      alert('Gagal seed: ' + e.message)
    } finally {
      setSeeding(null)
    }
  }

  const handleDeleteMap = async (mapId, mapName) => {
    if (!confirm(`Hapus denah "${mapName}"?\nSemua titik lampu di denah ini akan dinonaktifkan.`)) return
    try {
      await deleteMap(mapId)
    } catch (e) {
      alert('Gagal hapus: ' + e.message)
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) { alert('Gagal ubah role.'); return }
    setUsers((u) => u.map((p) => p.id === userId ? { ...p, role: newRole } : p))
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg sticky top-0 z-10"
          style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
          <button onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-dim">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted">Admin</p>
            <p className="text-sm font-bold text-white">Panel Admin</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 bg-s3 border-b border-border">
          {[['maps', 'Denah', Map], ['users', 'User', Users]].map(([t, label, Icon]) => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-accent text-white' : 'text-dim hover:text-white'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Maps tab */}
        {tab === 'maps' && (
          <div className="p-4 flex flex-col gap-4">
            <button onClick={() => setShowAddMap((v) => !v)}
              className="w-full bg-accent hover:bg-accent-2 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
              <Plus size={16} /> Tambah Denah Baru
            </button>

            {/* Add map form */}
            {showAddMap && (
              <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-white">Denah Baru</p>
                <div>
                  <label className="block text-xs text-muted font-semibold mb-1.5">Nama Denah</label>
                  <input value={newMapName} onChange={(e) => setNewMapName(e.target.value)}
                    placeholder="Lampu TL Gudang 3"
                    className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-muted" />
                </div>
                <div>
                  <label className="block text-xs text-muted font-semibold mb-1.5">Deskripsi</label>
                  <input value={newMapDesc} onChange={(e) => setNewMapDesc(e.target.value)}
                    placeholder="Gudang 3 area Weaving"
                    className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-muted" />
                </div>
                <div>
                  <label className="block text-xs text-muted font-semibold mb-1.5">Kode Area (pisah koma)</label>
                  <input value={newMapAreas} onChange={(e) => setNewMapAreas(e.target.value)}
                    placeholder="AF, AG"
                    className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent placeholder:text-muted font-mono uppercase" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddMap(false)}
                    className="flex-1 bg-border text-dim font-semibold py-3 rounded-xl text-sm">Batal</button>
                  <button onClick={handleCreateMap} disabled={creating || !newMapName.trim()}
                    className="flex-1 bg-accent disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                    {creating ? 'Membuat...' : 'Buat Denah'}
                  </button>
                </div>
              </div>
            )}

            {/* Map list */}
            {maps.map((map) => (
              <div key={map.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{map.name}</p>
                    <p className="text-xs text-muted mt-0.5">{map.area_codes?.join(', ')} · {map.description}</p>
                    {map.image_url && (
                      <p className="text-[11px] text-ok mt-1">✓ Gambar denah tersedia</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteMap(map.id, map.name)}
                    className="w-8 h-8 rounded-lg bg-bad/10 flex items-center justify-center text-bad flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Map image preview */}
                {map.image_url && (
                  <img src={map.image_url} alt={map.name}
                    className="w-full h-28 object-cover rounded-xl border border-border" />
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {/* Upload image */}
                  <input
                    type="file" accept="image/*"
                    ref={(el) => fileRefs.current[map.id] = el}
                    onChange={(e) => e.target.files?.[0] && handleUploadImage(map.id, e.target.files[0])}
                    className="hidden"
                  />
                  <button onClick={() => fileRefs.current[map.id]?.click()}
                    className="w-full bg-border hover:bg-border-2 text-dim font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                    <Upload size={14} /> {map.image_url ? 'Ganti Gambar Denah' : 'Upload Gambar Denah'}
                  </button>

                  {/* Seed lamps (only for Gudang 1&2 map) */}
                  {map.area_codes?.includes('AC') && map.area_codes?.includes('AD') && (
                    <button onClick={() => handleSeedLamps(map.id)}
                      disabled={seeding === map.id}
                      className="w-full bg-accent/10 hover:bg-accent/20 text-accent font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-60">
                      <Database size={14} />
                      {seeding === map.id ? 'Menyimpan...' : 'Seed Data Lampu Gudang 1 & 2'}
                    </button>
                  )}

                  <button onClick={() => navigate(`/map/${map.id}`)}
                    className="w-full bg-s2 hover:bg-border text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    Buka Denah →
                  </button>
                </div>
              </div>
            ))}

            {maps.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted text-sm">Belum ada denah. Tambah denah baru di atas.</p>
              </div>
            )}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="p-4 flex flex-col gap-3">
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-xs text-muted mb-1">Cara tambah user baru</p>
              <p className="text-xs text-dim leading-relaxed">
                Buka Supabase Dashboard → Authentication → Users → Invite user. Masukkan email, lalu set role di panel ini setelah user register.
              </p>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8 text-muted text-sm">Memuat...</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="bg-surface border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">{u.email}</p>
                  </div>
                  <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    className="bg-s2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent flex-shrink-0">
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
