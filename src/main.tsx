import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import './styles/globals.css'
import '../style.css'
import Demo from '@/components/demo'
import '../brand.css'
import { flavors, packs, products, readCart, CART_KEY } from './data/catalog'
import type { SneakerVariant } from '@/components/ui/sneaker-product-hero'

const money=(n:number)=>'$'+n.toFixed(2)
function ShopApp(){
  const [cart,setCart]=React.useState(readCart)
  const [bagOpen,setBagOpen]=React.useState(false)
  const bagRef=React.useRef<HTMLDialogElement>(null)
  const openRef=React.useRef<HTMLButtonElement>(null)
  const count=Object.values(cart).reduce((a,b)=>a+b,0)
  const items=products.filter(p=>cart[p.id])
  React.useEffect(()=>{try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}catch{}},[cart])
  React.useEffect(()=>{
    const update=()=>setCart(readCart());window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update)
  },[])
  React.useEffect(()=>{
    const el=bagRef.current;if(!el)return
    if(bagOpen){el.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;el.close()}}
  },[bagOpen])
  const closeBag=()=>{setBagOpen(false);openRef.current?.focus()}
  const change=(id:string,delta:number)=>setCart(current=>{const next={...current};next[id]=Math.max(0,Math.min(99,(next[id]||0)+delta));if(!next[id])delete next[id];return next})
  const add=({variant,size,quantity=1}:{variant:SneakerVariant;size:string;price:number;quantity?:number})=>{
    const f=flavors.find(f=>f.name===variant.name),p=packs.find(p=>p.label===size)
    if(f&&p)change(`${f.slug}-${p.count}`,quantity)
  }
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header><nav className="nav-left" aria-label="Main"><a href="shop.html" aria-current="page">Shop</a><a href="about.html">About</a></nav><a href="index.html" className="wordmark" aria-label="VKTRY home">VKTRY</a><div className="nav-right"><a href="focus-rush.html" className="rush-nav">Focus Rush</a><button className="bag-button header-mark" ref={openRef} onClick={()=>setBagOpen(true)} aria-label={`Open shopping bag, ${count} items`}><ShoppingBag size={15}/><span>Bag ({count})</span></button></div></header>
    <main id="main"><Demo onAddToCart={add}/><section className="flavor-notes" id="flavor-notes"><div><div><div className="eyebrow">One formula. Three perspectives.</div><h2>Pick a feeling.</h2></div><span className="eyebrow">80mg caffeine + L-theanine / Every can</span></div><div className="flavor-grid">{flavors.map(f=><article className="flavor-note" key={f.name}><div><i style={{background:f.swatch}}/>{f.code}</div><h3>{f.name}</h3><p>{f.description}</p></article>)}</div></section><section className="shop-bottom"><div><h2>A lift. Not a launch.</h2><p>Considered energy. For your own rhythm.</p></div><a href="about.html">The VKTRY perspective ↗</a></section></main>
    <footer><div className="footer-row"><nav aria-label="Footer"><a href="index.html">Home</a><a href="shop.html">Shop</a><a href="about.html">About</a><a href="focus-rush.html">Focus Rush</a></nav><span>© 2026 VKTRY</span></div><p>Not recommended for children under 16, pregnant or breastfeeding women, or people sensitive to caffeine.</p></footer>
    <dialog ref={bagRef} className="store-bag" aria-label="Your shopping bag" onCancel={e=>{e.preventDefault();closeBag()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeBag()}}}><div className="bag-top"><h2>Your bag ({count})</h2><button autoFocus aria-label="Close bag" onClick={closeBag}><X size={20}/></button></div>{items.length? <>{items.map(p=><div className="bag-item" key={p.id}><div className="bag-thumb"><img src={`images/${p.image}`} alt={p.name}/></div><div><span>{p.name}</span><p>{p.detail}</p><div className="bag-edit"><button aria-label={`Decrease ${p.name} ${p.detail}`} onClick={()=>change(p.id,-1)}><Minus size={11}/></button><span>{cart[p.id]}</span><button aria-label={`Increase ${p.name} ${p.detail}`} disabled={cart[p.id]>=99} onClick={()=>change(p.id,1)}><Plus size={11}/></button></div></div><div><p>{money(p.price*cart[p.id])}</p><button aria-label={`Remove ${p.name} ${p.detail}`} onClick={()=>setCart(c=>{const next={...c};delete next[p.id];return next})}>Remove</button></div></div>)}<div className="bag-total"><strong>Subtotal</strong><span>{money(items.reduce((s,p)=>s+p.price*cart[p.id],0))}</span></div><p className="bag-note">Concept store · Illustrative prices. Your bag is saved on this device. Payments and fulfillment are not connected.</p><button className="cart-control text-link" onClick={closeBag}>Continue exploring <ArrowUpRight size={13} className="inline"/></button></>:<div className="empty-bag"><p>Your bag is quiet. Let’s change that.</p><button className="cart-control text-link" onClick={closeBag}>Explore the flavors ↗</button></div>}</dialog>
  </>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ShopApp/></React.StrictMode>)
