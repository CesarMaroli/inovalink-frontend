
import React, { useEffect, useMemo, useState } from 'react'
import { all, seed, create, findSimilar, view, like, topTrends } from './db.js'

function useInventory(){
  const [items, setItems] = useState([])
  const refresh = ()=> setItems(all())
  useEffect(()=>{ seed(); refresh() }, [])
  return { items, refresh }
}

function PreviewMedia({ media }){
  if(!media || !media.length) return <div className="thumb"></div>
  const m = media[0]
  if(m.type.startsWith('video/')){
    return <video className="thumb" src={m.url} controls />
  }
  return <img className="thumb" src={m.url} alt="" />
}

function Card({ item, onOpen, onLike }){
  return (
    <div className="card">
      <button className="btn like" onClick={()=>onLike(item.id)}>❤️ {item.likes||0}</button>
      <PreviewMedia media={item.media} />
      <div className="body">
        <div className="tags">{(item.tags||[]).map(t=>(<span key={t} className="tag">{t}</span>))}</div>
        <h3>{item.title}</h3>
        <p>{item.summary||'Sem resumo.'}</p>
        <div className="toolbar" style={{marginTop:10}}>
          <button className="btn" onClick={()=>onOpen(item)}>Ver detalhes</button>
          {item.contact && <a className="btn" href={item.contact} target="_blank" rel="noreferrer">Contato</a>}
          <span className="pill">👁 {item.views||0}</span>
        </div>
      </div>
    </div>
  )
}

function Modal({open, onClose, children}){
  if(!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="toolbar" style={{justifyContent:'space-between'}}>
          <strong>Detalhes</strong>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
        <div style={{marginTop:12}}>{children}</div>
      </div>
    </div>
  )
}

function Creator({ onCreated }){
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [contact, setContact] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState([])
  const [similar, setSimilar] = useState(null)

  useEffect(()=>{
    if(title.trim().length + description.trim().length < 5){ setSimilar(null); return }
    const r = findSimilar({title, description})
    setSimilar(r)
  }, [title, description])

  async function onPick(e){
    const f = Array.from(e.target.files||[])
    const medias = []
    for(const file of f){
      const url = await new Promise(res=>{
        const reader = new FileReader()
        reader.onload = ()=> res(reader.result)
        reader.readAsDataURL(file)
      })
      medias.push({ name: file.name, type: file.type, url })
    }
    setFiles(medias)
  }

  function submit(e){
    e.preventDefault()
    if(!title.trim()) return
    const doc = create({
      title: title.trim(),
      summary: summary.trim(),
      description: description.trim(),
      author: author.trim() || 'Anônimo',
      contact: contact.trim(),
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
      media: files
    })
    onCreated?.(doc)
    setTitle(''); setSummary(''); setDescription(''); setAuthor(''); setContact(''); setTags(''); setFiles([]); setSimilar(null)
  }

  return (
    <form onSubmit={submit} className="panel">
      <div className="toolbar" style={{justifyContent:'space-between'}}>
        <strong>Cadastre sua invenção</strong>
        <span className="badge">InovaLink — beta</span>
      </div>
      {similar && (
        <div className="alert" style={{marginTop:10}}>
          <div><strong>Essa invenção já existe!</strong> Criada por <em>{similar.item.author||'Autor desconhecido'}</em>. Que tal entrar em contato e colaborar para aprimorar o projeto?</div>
          <div className="toolbar" style={{marginTop:8}}>
            <button className="btn" type="button" onClick={()=>window.alert('Abra a invenção similar na listagem para ver os detalhes.')}>Ver semelhante</button>
            {similar.item.contact && <a className="btn" href={similar.item.contact} target="_blank" rel="noreferrer">Contato do inventor</a>}
            <span className="pill">similaridade {(similar.score*100).toFixed(0)}%</span>
          </div>
        </div>
      )}
      <div className="form-row">
        <input className="input" placeholder="Título*" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="Resumo curto" value={summary} onChange={e=>setSummary(e.target.value)} />
      </div>
      <div className="form-row">
        <textarea className="textarea" placeholder="Como funciona / detalhes técnicos" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>
      <div className="form-row">
        <input className="input" placeholder="Autor/Equipe" value={author} onChange={e=>setAuthor(e.target.value)} />
        <input className="input" placeholder="Contato (email, @user, link ou mailto:)" value={contact} onChange={e=>setContact(e.target.value)} />
      </div>
      <div className="form-row">
        <input className="input" placeholder="Tags (separe por vírgulas)" value={tags} onChange={e=>setTags(e.target.value)} />
      </div>
      <div className="form-row">
        <input className="file" type="file" accept="image/*,video/*" multiple onChange={onPick} />
      </div>
      {files.length>0 && (
        <div className="toolbar" style={{flexWrap:'wrap'}}>
          {files.map((m,i)=>(<span key={i} className="pill">{m.name}</span>))}
        </div>
      )}
      <div className="toolbar" style={{marginTop:10}}>
        <button className="btn primary" type="submit">Publicar</button>
        <span className="kbd">Ctrl / ⌘ + Enter</span>
      </div>
    </form>
  )
}

export default function App(){
  const { items, refresh } = useInventory()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)

  useEffect(()=>{
    const onKey = (e)=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='enter'){
        const form = document.querySelector('form')
        form?.dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}))
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    if(!q) return items
    return items.filter(x =>
      [x.title, x.summary, x.description, x.author, x.contact, ...(x.tags||[])]
        .filter(Boolean).some(s => s.toLowerCase().includes(q))
    )
  }, [query, items])

  const trends = topTrends(8)

  return (
    <div className="container">
      <nav className="nav">
        <div className="brand">
          <span className="glow"></span> InovaLink
        </div>
        <div className="actions">
          <span className="badge">{items.length} invenções</span>
          <button className="btn" onClick={()=>{ localStorage.clear(); refresh() }}>Limpar dados</button>
        </div>
      </nav>

      <section className="hero">
        <div className="panel">
          <h1 className="h1">Conecte mentes, acelere <span>invenções</span>.</h1>
          <p className="lead">Compartilhe ideias, suba imagens, vídeos ou protótipos e encontre colaboradores. A busca inteligente alerta sobre invenções semelhantes para unir esforços.</p>
          <div className="toolbar" style={{marginTop:8}}>
            <input className="input" placeholder="Buscar por título, tag, autor..." value={query} onChange={e=>setQuery(e.target.value)} />
            <span className="pill">Dica: digite o título na criação para detectar semelhantes.</span>
          </div>
        </div>
        <div className="panel">
          <strong>Painel de tendências</strong>
          <div className="trends" style={{marginTop:10}}>
            {trends.length? trends.map(t => (
              <div key={t.id} className="trend">
                <span>🔥</span>
                <div style={{display:'grid'}}>
                  <small style={{opacity:.75}}>{t.title}</small>
                  <small style={{opacity:.6}}>👍 {t.likes||0} · 👁 {t.views||0}</small>
                </div>
              </div>
            )): <span className="muted">Sem dados ainda</span>}
          </div>
        </div>
      </section>

      <section style={{marginTop:10}}>
        <Creator onCreated={refresh} />
      </section>

      <section style={{marginTop:14}}>
        {filtered.length? (
          <div className="grid">
            {filtered.map(it => (
              <Card key={it.id} item={it} onOpen={(item)=>{ setOpen(view(item.id)); refresh() }} onLike={(id)=>{ like(id); refresh() }} />
            ))}
          </div>
        ): <div className="empty">Nada encontrado. Tente outras palavras‑chave ou cadastre a primeira invenção 👇</div>}
      </section>

      <footer style={{margin:'22px 0', color:'var(--muted)'}}>
        <small>🔒 Protótipo front‑end: dados ficam no seu navegador (localStorage). Para produção, conecte um back‑end/DB real.</small>
      </footer>

      <Modal open={!!open} onClose={()=>setOpen(null)}>
        {open && (
          <div style={{display:'grid', gap:8}}>
            <div className="tags">{(open.tags||[]).map(t=>(<span key={t} className="tag">{t}</span>))}</div>
            <h2 style={{margin:'4px 0 0 0'}}>{open.title}</h2>
            <p style={{color:'var(--muted)'}}>{open.summary}</p>
            <p>{open.description}</p>
            <div className="toolbar">
              {open.contact && <a className="btn" href={open.contact} target="_blank" rel="noreferrer">Contato do inventor</a>}
              <span className="pill">👍 {open.likes||0}</span>
              <span className="pill">👁 {open.views||0}</span>
              <span className="pill">Atualizado em {new Date(open.updatedAt).toLocaleString()}</span>
            </div>
            {open.media?.length>0 && (
              <div className="grid" style={{gridTemplateColumns:'repeat(2, minmax(0,1fr))'}}>
                {open.media.map((m,i)=> m.type.startsWith('video/')
                  ? <video key={i} src={m.url} controls style={{width:'100%', borderRadius:12, border:'1px solid var(--ring)'}}/>
                  : <img key={i} src={m.url} alt="" style={{width:'100%', borderRadius:12, border:'1px solid var(--ring)'}}/>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
