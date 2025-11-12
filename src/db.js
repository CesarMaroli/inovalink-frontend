
// Simple localStorage DB + utilities, including a naive text similarity
const KEY = 'inovalink:v1'

export function all(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
export function save(items){
  localStorage.setItem(KEY, JSON.stringify(items))
}
export function create(doc){
  const now = new Date().toISOString()
  const item = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, views: 0, likes: 0, ...doc }
  const items = all()
  items.unshift(item)
  save(items)
  return item
}
export function view(id){
  const items = all()
  const i = items.findIndex(x=>x.id===id)
  if(i>-1){ items[i].views = (items[i].views||0)+1; items[i].updatedAt = new Date().toISOString(); save(items); return items[i] }
  return null
}
export function like(id){
  const items = all()
  const i = items.findIndex(x=>x.id===id)
  if(i>-1){ items[i].likes = (items[i].likes||0)+1; items[i].updatedAt = new Date().toISOString(); save(items); return items[i] }
  return null
}
export function seed(){
  if(all().length) return
  const demo = [
    {
      title: 'Semáforo Inteligente Adaptativo',
      summary: 'Otimiza o ciclo do sinal conforme fluxo por faixa.',
      description: 'Usa visão computacional para medir densidade e recalcular tempos em tempo real.',
      author: 'Equipe Fluxo+',
      contact: 'mailto:fluxo@inovalink.example',
      tags: ['Smart City','IA','Trânsito'],
      media: [],
    },
    {
      title: 'Purificador de Ar Modular',
      summary: 'Filtro HEPA + carvão ativado com módulos plugáveis.',
      description: 'Sistema escalável para ambientes domésticos e escritórios com monitoramento de qualidade do ar.',
      author: 'Lilia Tech',
      contact: 'https://t.me/liliatech',
      tags: ['Saúde','Hardware'],
      media: [],
    }
  ]
  demo.forEach(create)
}

// naive similarity: tokenize -> set of trigrams; Jaccard similarity
function trigrams(s){
  const t = s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()
  const arr = t.split(' ')
  const grams = new Set()
  for(const w of arr){
    if(w.length<3){ grams.add(w) }
    for(let i=0;i<w.length-2;i++){ grams.add(w.slice(i,i+3)) }
  }
  return grams
}
function jaccard(a,b){
  const A = trigrams(a), B = trigrams(b)
  let inter = 0
  for(const x of A) if(B.has(x)) inter++
  return inter / Math.max(1, A.size + B.size - inter)
}

export function findSimilar({title, description, threshold=0.34}){
  const items = all()
  let best = null, bestScore = 0
  for(const it of items){
    const s = Math.max(
      jaccard(title||'', it.title||''),
      jaccard(description||'', it.description||''),
    )
    if(s>bestScore){ best = it; bestScore = s }
  }
  return bestScore>=threshold ? { item: best, score: bestScore } : null
}

export function topTrends(limit=6){
  const items = [...all()]
  items.sort((a,b)=> (b.likes*2 + b.views) - (a.likes*2 + a.views))
  return items.slice(0,limit)
}
