import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useLampStore = create((set, get) => ({
  maps: [],
  lamps: [],
  history: [],
  activeMapId: null,
  loading: false,
  error: null,

  // ── MAPS ──────────────────────────────────────────
  fetchMaps: async () => {
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .eq('is_active', true)
      .order('created_at')
    if (error) { set({ error: error.message }); return }
    set({ maps: data || [] })
  },

  createMap: async (payload) => {
    const { data, error } = await supabase
      .from('maps')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    set((s) => ({ maps: [...s.maps, data] }))
    return data
  },

  uploadMapImage: async (mapId, file) => {
    const ext = file.name.split('.').pop()
    const path = `${mapId}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('maps')
      .upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data: { publicUrl } } = supabase.storage.from('maps').getPublicUrl(path)
    const { error: upd } = await supabase
      .from('maps')
      .update({ image_url: publicUrl })
      .eq('id', mapId)
    if (upd) throw upd
    set((s) => ({
      maps: s.maps.map((m) => m.id === mapId ? { ...m, image_url: publicUrl } : m)
    }))
    return publicUrl
  },

   uploadMapPdf: async (mapId, file) => {
    // Convert first page of PDF to PNG image, then upload
    const pdfjsLib = await import('pdfjs-dist')
    const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
    const pngFile = new File([blob], `${mapId}-page-1.png`, { type: 'image/png' })
    return get().uploadMapImage(mapId, pngFile)
  },

  deleteMap: async (mapId) => {
    const { error } = await supabase.from('maps').update({ is_active: false }).eq('id', mapId)
    if (error) throw error
    set((s) => ({ maps: s.maps.filter((m) => m.id !== mapId) }))
  },

  setActiveMap: (mapId) => set({ activeMapId: mapId }),

  // ── LAMPS ─────────────────────────────────────────
  fetchLamps: async (mapId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('lamps')
      .select('*')
      .eq('map_id', mapId)
      .eq('is_active', true)
      .order('lamp_code')
    if (error) { set({ error: error.message, loading: false }); return }
    set({ lamps: data || [], loading: false })
  },

  upsertLamp: async (lamp) => {
    const { data, error } = await supabase
      .from('lamps')
      .upsert(lamp, { onConflict: 'lamp_code' })
      .select()
      .single()
    if (error) throw error
    set((s) => {
      const exists = s.lamps.find((l) => l.id === data.id)
      return {
        lamps: exists
          ? s.lamps.map((l) => l.id === data.id ? data : l)
          : [...s.lamps, data]
      }
    })
    return data
  },

  updateLampPosition: async (lampId, posX, posY) => {
    // Optimistic update
    set((s) => ({
      lamps: s.lamps.map((l) =>
        l.id === lampId ? { ...l, pos_x: posX, pos_y: posY } : l
      )
    }))
    const { error } = await supabase
      .from('lamps')
      .update({ pos_x: posX, pos_y: posY, updated_at: new Date().toISOString() })
      .eq('id', lampId)
    if (error) throw error
  },

  updateLamp: async (lampId, updates) => {
    const { data, error } = await supabase
      .from('lamps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', lampId)
      .select()
      .single()
    if (error) throw error
    set((s) => ({ lamps: s.lamps.map((l) => l.id === lampId ? data : l) }))
    return data
  },

  deleteLamp: async (lampId) => {
    const { error } = await supabase
      .from('lamps')
      .update({ is_active: false })
      .eq('id', lampId)
    if (error) throw error
    set((s) => ({ lamps: s.lamps.filter((l) => l.id !== lampId) }))
  },

  // Batch save positions after drag edit
  saveLampPositions: async (positions) => {
    // positions = [{ id, pos_x, pos_y }]
    const updates = positions.map((p) =>
      supabase.from('lamps').update({ pos_x: p.pos_x, pos_y: p.pos_y }).eq('id', p.id)
    )
    await Promise.all(updates)
  },

  seedLamps: async (mapId, seedData) => {
    // Insert all seed lamps for a map
    const rows = seedData.map((l) => ({ ...l, map_id: mapId }))
    const { error } = await supabase.from('lamps').upsert(rows, { onConflict: 'lamp_code' })
    if (error) throw error
    await get().fetchLamps(mapId)
  },

  // ── HISTORY ───────────────────────────────────────
  fetchHistory: async (mapId) => {
    // Fetch history for all lamps in this map
    const lampIds = get().lamps.map((l) => l.id)
    if (!lampIds.length) { set({ history: [] }); return }
    const { data, error } = await supabase
      .from('lamp_history')
      .select('*, lamp:lamps(lamp_code, group_code, area_code), created_by_profile:profiles(full_name)')
      .in('lamp_id', lampIds)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) { set({ error: error.message }); return }
    set({ history: data || [] })
  },

  fetchAllHistory: async () => {
    const { data, error } = await supabase
      .from('lamp_history')
      .select('*, lamp:lamps(lamp_code, group_code, area_code, area_name, map_id), created_by_profile:profiles(full_name)')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) { set({ error: error.message }); return }
    set({ history: data || [] })
  },

  getLampHistory: (lampId) => {
    return get().history.filter((h) => h.lamp_id === lampId)
  },

  addHistory: async (lampId, payload, userId) => {
    const { data, error } = await supabase
      .from('lamp_history')
      .insert({ lamp_id: lampId, ...payload, created_by: userId })
      .select('*, lamp:lamps(lamp_code, group_code, area_code), created_by_profile:profiles(full_name)')
      .single()
    if (error) throw error
    set((s) => ({ history: [data, ...s.history] }))
    return data
  },

  deleteHistory: async (histId) => {
    const { error } = await supabase.from('lamp_history').delete().eq('id', histId)
    if (error) throw error
    set((s) => ({ history: s.history.filter((h) => h.id !== histId) }))
  },

  // ── STATS ─────────────────────────────────────────
  getStats: () => {
    const { lamps, history } = get()
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = history.filter((h) => new Date(h.tanggal) >= firstOfMonth)
    return {
      totalLamps: lamps.length,
      totalHistory: history.length,
      thisMonth: thisMonth.length,
      lmd: lamps.filter((l) => l.lamp_position === 'LMD').length,
      lml: lamps.filter((l) => l.lamp_position === 'LML').length,
    }
  },
}))
