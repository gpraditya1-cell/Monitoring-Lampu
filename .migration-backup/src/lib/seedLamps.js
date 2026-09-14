// Seed data for Lampu TL Gudang 1 & 2
// AC = Gudang 1 (baris A-F), AD = Gudang 2 (baris G-M)

const CX = { '8':5,'7':16,'6':27,'5':38,'4':49,'3':60,'2':71,'1':82,'0':93 }
const RY = { M:6,L:15,K:23,J:32,H:42,G:53,F:63,E:69,D:76,C:83,B:90,A:96 }

function areaOfRow(r) {
  return 'GHJKLM'.includes(r) ? 'AD' : 'AC'
}
function areaName(c) {
  return c === 'AC' ? 'Gudang 1' : 'Gudang 2'
}
function subX(col, i, total) {
  const base = CX[String(col)]
  if (total <= 1) return base
  const span = Math.min(8, total * 1.6)
  return base - span / 2 + (span / (total - 1)) * i
}
function mk(row, col, num, x, y) {
  const n = String(num).padStart(3, '0')
  const g = row + col
  const a = areaOfRow(row)
  return {
    lamp_code: `${a} LMD ${g} ${n}`,
    area_code: a,
    area_name: areaName(a),
    lamp_position: 'LMD',
    group_code: g,
    lamp_number: n,
    pos_x: Math.round(x * 100) / 100,
    pos_y: Math.round(y * 100) / 100,
  }
}
function wRow(out, row, colMap) {
  const y0 = RY[row]
  Object.entries(colMap).forEach(([col, total]) => {
    if (!total) return
    const top = Math.ceil(total / 2), bot = total - top
    for (let i = 0; i < top; i++) out.push(mk(row, col, top - i, subX(col, i, top), y0 - 2.2))
    for (let j = 0; j < bot; j++) out.push(mk(row, col, bot - j, subX(col, j, bot), y0 + 2.2))
  })
}

export function buildSeedLamps(mapId) {
  const out = []

  // Baris M
  out.push(mk('M','7',1, CX['7'], RY.M))
  ;[[5,4],[4,3],[3,3],[2,3]].forEach(([c,t]) => {
    for (let i = 0; i < t; i++) out.push(mk('M', String(c), i+1, subX(c,i,t), RY.M))
  })

  // L, K, J, H
  wRow(out,'L',{'8':4,'7':6,'6':6,'5':4,'4':6,'3':6,'2':6,'1':4})
  wRow(out,'K',{'8':4,'7':6,'6':6,'5':4,'4':5,'3':5,'2':6,'1':4})
  wRow(out,'J',{'8':6,'7':9,'6':9,'5':6,'4':6,'3':6,'2':9,'1':6})
  wRow(out,'H',{'8':4,'7':6,'6':6,'5':4,'4':4,'3':4,'2':6,'1':4})

  // G
  ;[1,2,3].forEach((n,i) => out.push(mk('G','0',n, subX(0,i,3), RY.G)))
  out.push(mk('G','1',1, subX(1,0,2), RY.G))
  out.push(mk('G','1',2, subX(1,1,2), RY.G))
  ;['2','3','4','5','6','7'].forEach(c => out.push(mk('G',c,1, CX[c], RY.G)))
  out.push(mk('G','8',1, subX(8,0,2), RY.G))
  out.push(mk('G','8',2, subX(8,1,2), RY.G))

  // F
  out.push(mk('F','8',1, CX['8'], RY.F))

  // E
  ;[[1,3,RY.E-1],[2,5,RY.E-1],[3,7,RY.E-1],[4,3,RY.E+1],[5,5,RY.E+1],[6,7,RY.E+1],[7,3,RY.E+3],[8,5,RY.E+3],[9,7,RY.E+3]]
    .forEach(([n,x,y]) => out.push(mk('E','8',n,x,y)))

  // D
  ;[[1,2.5,RY.D-3],[2,5,RY.D-3],[3,2.5,RY.D-1],[4,5,RY.D-1],[5,2.5,RY.D+1],[6,5,RY.D+1],[7,2.5,RY.D+3],[8,5,RY.D+3],[9,2.5,RY.D+5],[10,5,RY.D+5],[11,7,RY.D+5]]
    .forEach(([n,x,y]) => out.push(mk('D','8',n,x,y)))

  // C
  ;[[1,2,RY.C-1],[2,5,RY.C-1],[3,2,RY.C+1],[4,5,RY.C+1]]
    .forEach(([n,x,y]) => out.push(mk('C','8',n,x,y)))

  // B
  out.push(mk('B','8',1, subX(8,0,2), RY.B))
  out.push(mk('B','8',2, subX(8,1,2), RY.B))

  // A
  ;[[1,1.5,94],[2,4,94],[3,1.5,96],[4,4,96],[5,1.5,98],[6,4,98],[7,6.5,94],[8,6.5,96]]
    .forEach(([n,x,y]) => out.push(mk('A','8',n,x,y)))
  out.push(mk('A','7',1, subX(7,0,2), RY.A))
  out.push(mk('A','7',2, subX(7,1,2), RY.A))
  out.push(mk('A','6',1, subX(6,0,2), RY.A))
  out.push(mk('A','6',2, subX(6,1,2), RY.A))
  out.push(mk('A','5',1, subX(5,0,2), RY.A))
  out.push(mk('A','5',2, subX(5,1,2), RY.A))

  return out.map(l => ({ ...l, map_id: mapId }))
}
