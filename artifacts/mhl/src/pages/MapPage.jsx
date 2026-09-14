import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Edit2, Plus, ZoomIn, ZoomOut, Maximize2, Save, X, Check } from 'lucide-react'
import { useLampStore } from '../store/useLampStore'
import { useAuthStore } from '../store/useAuthStore'
import LampDetailSheet from '../components/map/LampDetailSheet'
import AddLampSheet from '../components/map/AddLampSheet'
import EditLampSheet from '../components/map/EditLampSheet'

// Grid layout constants
const CX = { '8':5,'7':16,'6':27,'5':38,'4':49,'3':60,'2':71,'1':82,'0':93 }
const RY = { M:6,L:15,K:23,J:32,H:42,G:53,F:63,E:69,D:76,C:83,B:90,A:96 }
const COLS = ['8','7','6','5','4','3','2','1','0']
const ROWS = ['M','L','K','J','H','G','F','E','D','C','B','A']

const ROOMS = [
  { label:'Ruang Reed Drawing', x:13,y:1,w:34,h:8.5, fill:'rgba(99,102,241,.05)', bd:'rgba(99,102,241,.28)' },
  { label:'Ruang AC', x:63,y:1,w:24,h:8.5, fill:'rgba(6,182,212,.06)', bd:'rgba(6,182,212,.3)' },
  { label:'Weaving 2', x:54,y:29,w:15,h:16, fill:'rgba(251,191,36,.04)', bd:'rgba(251,191,36,.18)' },
  { label:'Datalog', x:90,y:38,w:8,h:12, fill:'rgba(99,102,241,.04)', bd:'rgba(99,102,241,.22)' },
  { label:'Gudang Kapas / Benang', x:8,y:59,w:83,h:30, big:true, fill:'rgba(99,102,241,.02)', bd:'rgba(99,102,241,.1)' },
  { label:'Trafo', x:.5,y:59,w:7,h:6, fill:'rgba(251,191,36,.06)', bd:'rgba(251,191,36,.3)' },
  { label:'Ruang Elektrik', x:.5,y:65.5,w:8,h:7, fill:'rgba(99,102,241,.04)', bd:'rgba(99,102,241,.2)' },
  { label:'P2K3', x:.5,y:73,w:6,h:5.5, fill:'rgba(99,102,241,.04)', bd:'rgba(99,102,241,.18)' },
  { label:'Kantor Admin', x:.5,y:82,w:7,h:7, fill:'rgba(99,102,241,.04)', bd:'rgba(99,102,241,.18)' },
  { label:'Ruang Reed / Sisir', x:.5,y:89.5,w:9,h:10, fill:'rgba(6,182,212,.06)', bd:'rgba(6,182,212,.3)' },
  { label:'AC', x:88,y:88,w:8,h:5, fill:'rgba(6,182,212,.04)', bd:'rgba(6,182,212,.22)' },
]

export default function MapPage() {
  const { mapId } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()

  const { maps, lamps, fetchLamps, fetchHistory, updateLampPosition, saveLampPositions, loading } = useLampStore()
  const map = maps.find((m) => m.id === mapId)

  const [selectedId, setSelectedId] = useState(null)
  const [sheet, setSheet] = useState(null) // null | 'detail' | 'add' | 'edit'
  const [editMode, setEditMode] = useState(false)
  const [editDraft, setEditDraft] = useState([])
  const [addingDot, setAddingDot] = useState(false)
  const [pendingPos, setPendingPos] = useState(null)
  const [searchQ, setSearchQ] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Pan/zoom state
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const vpRef = useRef(null)
  const canvasRef = useRef(null)
  const ptsRef = useRef(new Map())
  const panRef = useRef(null)
  const pinchRef = useRef(null)
  const movedRef = useRef(false)
  const dragRef = useRef(null)

  useEffect(() => {
    if (mapId) {
      fetchLamps(mapId).then(() => fetchHistory(mapId))
    }
  }, [mapId])

  const displayLamps = editMode ? editDraft : lamps

  // Search filter
  const filtered = showSearch && searchQ
    ? displayLamps.filter((l) =>
        l.lamp_code.toLowerCase().includes(searchQ.toLowerCase()) ||
        l.group_code.toLowerCase().includes(searchQ.toLowerCase()) ||
        l.area_code.toLowerCase().includes(searchQ.toLowerCase())
      )
    : displayLamps

  // Transform helpers
  const applyTransform = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${offset.x}px,${offset.y}px) scale(${scale})`
    }
  }, [offset, scale])

  useEffect(() => { applyTransform() }, [applyTransform])

  const clientToPercent = (cx, cy) => {
    const r = vpRef.current?.getBoundingClientRect()
    if (!r) return { x: 50, y: 50 }
    return {
      x: Math.max(0, Math.min(100, (cx - r.left - offset.x) / scale / r.width * 100)),
      y: Math.max(0, Math.min(100, (cy - r.top - offset.y) / scale / r.height * 100)),
    }
  }

  const zoomBy = (factor, cx, cy) => {
    const r = vpRef.current?.getBoundingClientRect()
    if (!r) return
    const px = cx - r.left, py = cy - r.top
    const next = Math.min(12, Math.max(0.4, scale * factor))
    const k = next / scale
    setOffset({ x: px - (px - offset.x) * k, y: py - (py - offset.y) * k })
    setScale(next)
  }

  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }) }

  // Pointer events
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return
    ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try { vpRef.current?.setPointerCapture(e.pointerId) } catch {}
    movedRef.current = false

    // Check if tapping a lamp dot in edit mode
    if (editMode && ptsRef.current.size === 1) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const dot = el?.closest?.('[data-lamp-id]')
      if (dot) {
        const id = dot.getAttribute('data-lamp-id')
        const lamp = editDraft.find((l) => l.id === id)
        if (lamp) {
          dragRef.current = { id, startX: e.clientX, startY: e.clientY, basePx: lamp.pos_x, basePy: lamp.pos_y }
          dot.style.zIndex = 50
          return
        }
      }
    }

    if (ptsRef.current.size === 1) {
      panRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
      pinchRef.current = null
    } else if (ptsRef.current.size === 2) {
      dragRef.current = null
      const pts = Array.from(ptsRef.current.values())
      pinchRef.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        mx: (pts[0].x + pts[1].x) / 2, my: (pts[0].y + pts[1].y) / 2,
        ox: offset.x, oy: offset.y, scale,
      }
    }
  }

  const onPointerMove = (e) => {
    if (!ptsRef.current.has(e.pointerId)) return
    ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (dragRef.current && ptsRef.current.size === 1) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true
      if (movedRef.current) {
        const r = vpRef.current?.getBoundingClientRect()
        if (!r) return
        const newX = Math.max(0, Math.min(100, dragRef.current.basePx + dx / scale / r.width * 100))
        const newY = Math.max(0, Math.min(100, dragRef.current.basePy + dy / scale / r.height * 100))
        setEditDraft((d) => d.map((l) => l.id === dragRef.current.id ? { ...l, pos_x: newX, pos_y: newY } : l))
      }
      return
    }

    if (ptsRef.current.size === 1 && panRef.current) {
      const dx = e.clientX - panRef.current.x, dy = e.clientY - panRef.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true
      if (movedRef.current) setOffset({ x: panRef.current.ox + dx, y: panRef.current.oy + dy })
    } else if (ptsRef.current.size === 2 && pinchRef.current) {
      movedRef.current = true
      const pts = Array.from(ptsRef.current.values())
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const r = vpRef.current?.getBoundingClientRect()
      if (!r) return
      const next = Math.min(12, Math.max(0.4, pinchRef.current.scale * (d / pinchRef.current.dist)))
      const k = next / pinchRef.current.scale
      const px = pinchRef.current.mx - r.left, py = pinchRef.current.my - r.top
      setOffset({
        x: px - (px - pinchRef.current.ox) * k + (pts[0].x + pts[1].x) / 2 - pinchRef.current.mx,
        y: py - (py - pinchRef.current.oy) * k + (pts[0].y + pts[1].y) / 2 - pinchRef.current.my,
      })
      setScale(next)
    }
  }

  const onPointerUp = (e) => {
    if (dragRef.current) {
      const el = document.querySelector(`[data-lamp-id="${dragRef.current.id}"]`)
      if (el) el.style.zIndex = ''
      if (!movedRef.current) {
        // tap on dot in edit mode
        const lamp = editDraft.find((l) => l.id === dragRef.current.id)
        if (lamp) { setSelectedId(lamp.id); setSheet('edit') }
      }
      dragRef.current = null
      ptsRef.current.delete(e.pointerId)
      return
    }

    if (ptsRef.current.size === 1 && !movedRef.current) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const dot = el?.closest?.('[data-lamp-id]')
      if (dot && !editMode) {
        setSelectedId(dot.getAttribute('data-lamp-id'))
        setSheet('detail')
      } else if (!dot && sheet) {
        setSheet(null); setSelectedId(null)
      } else if (!dot && editMode && addingDot) {
        const pct = clientToPercent(e.clientX, e.clientY)
        setPendingPos(pct)
        setSheet('add')
      }
    }

    ptsRef.current.delete(e.pointerId)
    if (ptsRef.current.size === 0) { panRef.current = null; pinchRef.current = null }
    else if (ptsRef.current.size === 1) {
      const pt = Array.from(ptsRef.current.values())[0]
      panRef.current = { x: pt.x, y: pt.y, ox: offset.x, oy: offset.y }
      pinchRef.current = null
    }
  }

  const onWheel = (e) => {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY)
  }

  useEffect(() => {
    const el = vpRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scale, offset])

  // Edit mode
  const enterEdit = () => {
    setEditDraft(lamps.map((l) => ({ ...l })))
    setEditMode(true)
    setSheet(null)
    setSelectedId(null)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditDraft([])
    setAddingDot(false)
    setSheet(null)
    setSelectedId(null)
  }

  const saveEdit = async () => {
    const positions = editDraft.map((l) => ({ id: l.id, pos_x: l.pos_x, pos_y: l.pos_y }))
    await saveLampPositions(positions)
    setEditMode(false)
    setEditDraft([])
    setAddingDot(false)
    await fetchLamps(mapId)
  }

  const handleAddLamp = (newLamp) => {
    if (editMode) {
      setEditDraft((d) => [...d, { ...newLamp, id: 'new-' + Date.now(), pos_x: pendingPos?.x || 50, pos_y: pendingPos?.y || 50 }])
    }
    setPendingPos(null)
    setSheet(null)
  }

  const handleDeleteInEdit = (lampId) => {
    setEditDraft((d) => d.filter((l) => l.id !== lampId))
    setSheet(null)
    setSelectedId(null)
  }

  return (
    <div className="fixed inset-0 bg-bg flex flex-col">
      {/* Topbar */}
      <header className="flex items-center gap-2.5 px-3.5 bg-surface border-b border-border flex-shrink-0 z-20"
        style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))', paddingBottom: '10px' }}>
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-dim">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted">Lampu TL</p>
          <p className="text-sm font-semibold text-white truncate">{map?.name || '...'}</p>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <button onClick={() => setShowSearch((v) => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${showSearch ? 'bg-accent text-white' : 'bg-border text-dim'}`}>
              <Search size={15} />
            </button>
          )}
          {isAdmin() && !editMode && (
            <button onClick={enterEdit}
              className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-dim">
              <Edit2 size={15} />
            </button>
          )}
          {editMode && (
            <button onClick={() => setAddingDot((v) => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${addingDot ? 'bg-warn text-black' : 'bg-border text-dim'}`}>
              <Plus size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Edit banner */}
      {editMode && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-warn/10 border-b border-warn/25 flex-shrink-0 z-20">
          <p className="text-xs text-warn flex-1">
            {addingDot ? '⊕ Ketuk denah untuk tambah titik lampu' : '⇌ Drag titik untuk pindahkan • Ketuk untuk edit/hapus'}
          </p>
          <button onClick={cancelEdit} className="text-xs font-semibold bg-border text-dim px-3 py-1.5 rounded-lg">Batal</button>
          <button onClick={saveEdit} className="text-xs font-semibold bg-warn text-black px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Save size={12} /> Simpan
          </button>
        </div>
      )}

      {/* Search bar */}
      {showSearch && !editMode && (
        <div className="px-4 py-2.5 bg-s3 border-b border-border flex-shrink-0 z-20">
          <input
            autoFocus
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Cari kode lampu, kelompok, area…"
            className="w-full bg-s2 border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Viewport */}
      <div
        ref={vpRef}
        className="flex-1 relative overflow-hidden touch-none select-none"
        style={{ cursor: editMode && addingDot ? 'crosshair' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={canvasRef} className="absolute inset-0" style={{ background: '#12141f', transformOrigin: '0 0' }}>
          {/* Grid lines */}
          {COLS.map((c) => (
            <div key={`cv-${c}`}>
              <div style={{ position:'absolute', left:`${CX[c]}%`, top:0, bottom:0, width:1, background:'rgba(99,102,241,.06)', pointerEvents:'none' }} />
              <span style={{ position:'absolute', left:`${CX[c]}%`, top:'0.3%', transform:'translateX(-50%)', fontSize:8, fontWeight:700, color:'rgba(248,113,113,.55)', pointerEvents:'none' }}>{c}</span>
              <span style={{ position:'absolute', left:`${CX[c]}%`, bottom:'0.3%', transform:'translateX(-50%)', fontSize:8, fontWeight:700, color:'rgba(248,113,113,.55)', pointerEvents:'none' }}>{c}</span>
            </div>
          ))}
          {ROWS.map((r) => (
            <div key={`rh-${r}`}>
              <div style={{ position:'absolute', top:`${RY[r]}%`, left:0, right:0, height:1, background:'rgba(99,102,241,.06)', pointerEvents:'none' }} />
              <span style={{ position:'absolute', top:`${RY[r]}%`, left:'0.3%', transform:'translateY(-50%)', fontSize:8, fontWeight:700, color:'rgba(248,113,113,.55)', pointerEvents:'none' }}>{r}</span>
              <span style={{ position:'absolute', top:`${RY[r]}%`, right:'0.3%', transform:'translateY(-50%)', fontSize:8, fontWeight:700, color:'rgba(248,113,113,.55)', pointerEvents:'none' }}>{r}</span>
            </div>
          ))}

          {/* Zone separator & labels */}
          <div style={{ position:'absolute', left:0, right:0, top:'58%', height:2, background:'rgba(99,102,241,.22)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'50%', top:'31%', transform:'translateX(-50%)', fontSize:9.5, fontWeight:700, letterSpacing:'.1em', color:'rgba(99,102,241,.38)', pointerEvents:'none', whiteSpace:'nowrap' }}>GUDANG 2 (AD)</div>
          <div style={{ position:'absolute', left:'50%', top:'80%', transform:'translateX(-50%)', fontSize:9.5, fontWeight:700, letterSpacing:'.1em', color:'rgba(99,102,241,.3)', pointerEvents:'none', whiteSpace:'nowrap' }}>GUDANG 1 (AC)</div>

          {/* Rooms */}
          {ROOMS.map((room) => (
            <div key={room.label} style={{ position:'absolute', left:`${room.x}%`, top:`${room.y}%`, width:`${room.w}%`, height:`${room.h}%`, background:room.fill, border:`1px solid ${room.bd}`, borderRadius:3, overflow:'hidden', pointerEvents:'none' }}>
              <span style={{ position:'absolute', ...(room.big ? { top:'50%', left:0, right:0, transform:'translateY(-50%)', textAlign:'center', fontSize:8.5, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'rgba(200,210,255,.28)' } : { bottom:2, left:3, right:2, fontSize:7, fontWeight:500, color:'rgba(200,210,255,.42)', whiteSpace:'nowrap', overflow:'hidden' }) }}>
                {room.label}
              </span>
            </div>
          ))}

          {/* Lamp dots */}
          {(filtered.length > 0 ? filtered : displayLamps).map((lamp) => {
            const isSelected = selectedId === lamp.id
            return (
              <div
                key={lamp.id}
                data-lamp-id={lamp.id}
                style={{
                  position: 'absolute',
                  left: `${lamp.pos_x}%`,
                  top: `${lamp.pos_y}%`,
                  width: isSelected ? 16 : 10,
                  height: isSelected ? 16 : 10,
                  marginLeft: isSelected ? -8 : -5,
                  marginTop: isSelected ? -8 : -5,
                  borderRadius: '50%',
                  background: '#4ade80',
                  border: isSelected ? '2.5px solid #fff' : editMode ? '1.5px solid rgba(251,191,36,.7)' : '1.5px solid rgba(255,255,255,.25)',
                  boxShadow: isSelected ? '0 0 0 3px rgba(255,255,255,.2), 0 0 12px rgba(255,255,255,.6)' : '0 0 4px rgba(74,222,128,.5)',
                  zIndex: isSelected ? 20 : 10,
                  transition: 'width .12s, height .12s, margin .12s',
                  cursor: editMode ? 'move' : 'pointer',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3.5 z-30 flex flex-col gap-2"
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        {[
          { icon: ZoomIn, action: () => { const r = vpRef.current?.getBoundingClientRect(); if (r) zoomBy(1.4, r.left+r.width/2, r.top+r.height/2) } },
          { icon: ZoomOut, action: () => { const r = vpRef.current?.getBoundingClientRect(); if (r) zoomBy(1/1.4, r.left+r.width/2, r.top+r.height/2) } },
          { icon: Maximize2, action: resetView },
        ].map(({ icon: Icon, action }, i) => (
          <button key={i} onClick={action}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-dim shadow-lg active:bg-border">
            <Icon size={15} />
          </button>
        ))}
      </div>

      {/* Count badge */}
      <div className="absolute left-3.5 z-30 bg-surface border border-border rounded-xl px-3 py-2 shadow-lg"
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <p className="text-[11px] text-muted">Titik</p>
        <p className="text-sm font-bold text-white">{displayLamps.length}</p>
      </div>

      {/* Sheets */}
      {sheet === 'detail' && selectedId && (
        <LampDetailSheet
          lampId={selectedId}
          mapId={mapId}
          onClose={() => { setSheet(null); setSelectedId(null) }}
        />
      )}
      {sheet === 'add' && (
        <AddLampSheet
          mapId={mapId}
          pendingPos={pendingPos}
          onClose={() => { setSheet(null); setPendingPos(null) }}
          onAdded={handleAddLamp}
          editMode={editMode}
        />
      )}
      {sheet === 'edit' && selectedId && editMode && (
        <EditLampSheet
          lamp={editDraft.find((l) => l.id === selectedId)}
          onClose={() => { setSheet(null); setSelectedId(null) }}
          onSave={(updated) => {
            setEditDraft((d) => d.map((l) => l.id === updated.id ? updated : l))
            setSheet(null); setSelectedId(null)
          }}
          onDelete={handleDeleteInEdit}
        />
      )}
    </div>
  )
}
