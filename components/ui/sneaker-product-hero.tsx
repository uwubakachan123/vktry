"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import gsap from "gsap"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Heart, Loader2, Minus, Plus, X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import "./sneaker-product-hero.css"

export type StockBySize = { [size: string]: number }
export type SneakerView = { src: string; label?: string; focus?: [number, number]; zoom?: number; mirror?: boolean }
export type SneakerVariant = {
  name: string; burst?: string; swatch: string; tint?: string; src: string; gallery?: SneakerView[];
  soldOut?: string[]; stock?: StockBySize;
  description?: string; note?: string; code?: string;
}
export type SneakerSize = { label: string; soldOut?: boolean; price?: number; rating?: number; reviews?: number; stock?: number }
export type SneakerProductHeroProps = {
  variants: SneakerVariant[]; defaultVariant?: number; eyebrow?: string; title?: string; description?: string;
  sizes?: SneakerSize[]; price?: number; rating?: number; reviews?: number; currency?: string; lowStock?: number;
  toast?: string; likeColor?: string;
  onAddToCart?: (info: { variant: SneakerVariant; size: string; price: number; quantity?: number }) => void;
  onLikeChange?: (liked: boolean) => void;
  height?: number | string; className?: string; style?: React.CSSProperties;
}
export function focusPosition(f: number, z: number) {
  if (z <= 1) return 50
  return Math.round(Math.min(1, Math.max(0, (f * z - 0.5) / (z - 1))) * 1000) / 10
}
export function sizeStats(size: { price?: number; rating?: number; reviews?: number } | undefined, base: { price: number; rating: number; reviews: number }) {
  return { price: size?.price ?? base.price, rating: Math.min(5, Math.max(0, size?.rating ?? base.rating)), reviews: size?.reviews ?? base.reviews }
}
export function availability(size: { label: string; soldOut?: boolean; stock?: number } | undefined, variant: { soldOut?: string[]; stock?: StockBySize } | undefined) {
  if (!size) return { soldOut: true, stock: 0 }
  const stock = variant?.stock?.[size.label] ?? size.stock
  const soldOut = !!size.soldOut || !!variant?.soldOut?.includes(size.label) || stock === 0
  return { soldOut, stock: soldOut ? 0 : stock }
}
function viewStyle(v: SneakerView): React.CSSProperties {
  const z = v.zoom ?? 1
  const [fx, fy] = v.focus ?? [0.5, 0.5]
  return { backgroundImage: `url("${v.src}")`, backgroundSize: z <= 1 ? "contain" : `${z * 100}% auto`, backgroundPosition: `${focusPosition(fx, z)}% ${focusPosition(fy, z)}%`, transform: v.mirror ? "scaleX(-1)" : undefined }
}
function useReducedMotion() {
  const [reduced, setReduced] = React.useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}
const DEFAULT_PACKS: SneakerSize[] = [{label:'1 can',price:4},{label:'6 pack',price:22},{label:'12 pack',price:36}]

/** The supplied sneaker hero, adapted to VKTRY: colorways become flavors and sizes become packs. */
export default function SneakerProductHero({
  variants, defaultVariant = 0, eyebrow = 'THE DAILY ESSENTIAL / COLLECTION 001', title = 'Find your\nfrequency.',
  description = 'A little less noise. A lot more you. Meet your daily dose of considered energy.',
  sizes = DEFAULT_PACKS, price = 4, rating, reviews = 0, currency = '$', lowStock = 3,
  toast = 'Added to your bag', likeColor = '#b82454', onAddToCart, onLikeChange,
  height = 'min(850px, calc(100svh - 112px))', className, style,
}: SneakerProductHeroProps) {
  const firstIndex = Math.max(0, Math.min(defaultVariant, variants.length - 1))
  const firstFree = (i: number) => sizes.find(s => !availability(s, variants[i]).soldOut)?.label ?? ''
  const [active, setActive] = React.useState(firstIndex)
  const [size, setSize] = React.useState(() => firstFree(firstIndex))
  const [quantity, setQuantity] = React.useState(1)
  const [liked, setLiked] = React.useState(false)
  const [cartState, setCartState] = React.useState<'idle'|'busy'|'done'>('idle')
  const [message, setMessage] = React.useState('')
  const [viewer, setViewer] = React.useState<number | null>(null)
  const [viewerZoom, setViewerZoom] = React.useState(false)
  const reduced = useReducedMotion()
  const rootRef = React.useRef<HTMLElement>(null)
  const floatRef = React.useRef<HTMLDivElement>(null)
  const tiltRef = React.useRef<HTMLDivElement>(null)
  const floorRef = React.useRef<HTMLSpanElement>(null)
  const burstRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const imageRefs = React.useRef<(HTMLImageElement | null)[]>([])
  const reflectRefs = React.useRef<(HTMLImageElement | null)[]>([])
  const sheenRef = React.useRef<HTMLSpanElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const loupeRef = React.useRef<HTMLSpanElement>(null)
  const loupeImageRef = React.useRef<HTMLSpanElement>(null)
  const heartRef = React.useRef<HTMLButtonElement>(null)
  const burstRef = React.useRef<HTMLSpanElement>(null)
  const priceRef = React.useRef<HTMLSpanElement>(null)
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const shown = React.useRef(firstIndex)
  const holding = React.useRef(false)
  const busy = React.useRef(false)
  const timers = React.useRef<number[]>([])
  const noticeTimer = React.useRef<number | undefined>(undefined)
  const v = variants[active]
  const selectedSize = sizes.find(s => s.label === size)
  const stats = sizeStats(selectedSize, {price,rating:rating ?? 0,reviews})
  const here = availability(selectedSize, v)
  const views: SneakerView[] = v?.gallery?.length ? v.gallery : v ? [{src:v.src,label:'Full view'},{src:v.src,label:'Label detail',focus:[.5,.55],zoom:1.7},{src:v.src,label:'Aluminum detail',focus:[.5,.22],zoom:2.1}] : []
  const selectedView = views[viewer ?? 0]
  const fmt = React.useCallback((n:number) => currency+n.toFixed(2),[currency])
  const announce = React.useCallback((text: string) => {
    clearTimeout(noticeTimer.current)
    setMessage(text)
    noticeTimer.current = window.setTimeout(() => setMessage(''),3500)
  },[])
  React.useEffect(() => {
    try { setLiked(localStorage.getItem('vktry-favorite-'+v?.name) === 'true') } catch {}
  },[v?.name])
  React.useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(noticeTimer.current) },[])
  React.useLayoutEffect(() => {
    imageRefs.current.forEach((el,i) => el && gsap.set(el,{autoAlpha:i===shown.current?1:0,yPercent:0,rotation:0}))
    burstRefs.current.forEach((el,i) => el && gsap.set(el,{autoAlpha:i===shown.current?1:0,x:0,y:0,xPercent:-50,yPercent:-50}))
    reflectRefs.current.forEach((el,i) => el && gsap.set(el,{autoAlpha:i === shown.current ? 0.16 : 0}))
    return () => { [...imageRefs.current,...burstRefs.current,...reflectRefs.current].forEach(el => el && gsap.killTweensOf(el)) }
  },[variants.length])
  React.useEffect(() => {
    if (!floatRef.current || !floorRef.current || !rootRef.current || reduced) { gsap.set(floatRef.current,{y:0}); return }
    const tl = gsap.timeline({repeat:-1,yoyo:true,defaults:{duration:2.8,ease:'sine.inOut'}})
      .to(floatRef.current,{y:-15},0).to(floorRef.current,{scaleX:.85,opacity:.5},0)
    const observer = new IntersectionObserver(([entry]) => { if(entry.isIntersecting)tl.resume();else tl.pause() })
    observer.observe(rootRef.current)
    return () => { observer.disconnect();tl.kill() }
  },[reduced])
  React.useEffect(() => {
    const tilt=tiltRef.current, stage=stageRef.current
    if(!tilt || !stage || reduced || !matchMedia('(pointer:fine)').matches)return
    gsap.set(tilt,{transformPerspective:1100})
    const x=gsap.quickTo(tilt,'rotationX',{duration:.7,ease:'power3.out'})
    const y=gsap.quickTo(tilt,'rotationY',{duration:.7,ease:'power3.out'})
    const move=(e:PointerEvent)=>{if(holding.current)return;const r=stage.getBoundingClientRect();x(-((e.clientY-r.top)/r.height-.5)*12);y(((e.clientX-r.left)/r.width-.5)*18)}
    const leave=()=>{x(0);y(0)}
    stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',leave)
    return()=>{stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);gsap.killTweensOf(tilt);gsap.set(tilt,{rotationX:0,rotationY:0})}
  },[reduced])
  React.useEffect(()=>{
    if(!priceRef.current)return
    const node=priceRef.current
    const state={n:Number(node.dataset.price ?? stats.price)}
    const tween=gsap.to(state,{n:stats.price,duration:reduced?0:.5,ease:'power2.out',onUpdate:()=>{node.textContent=fmt(state.n);node.dataset.price=String(state.n)}})
    return()=>{tween.kill()}
  },[stats.price,reduced,fmt])
  function sweep(delay=0){if(sheenRef.current&&!reduced)gsap.fromTo(sheenRef.current,{backgroundPosition:'140% 0%'},{backgroundPosition:'-40% 0%',duration:1.1,delay,ease:'power2.inOut',overwrite:true})}
  React.useEffect(()=>{sweep(.5)},[reduced])
  const pick=(next:number)=>{
    if(next===shown.current||busy.current)return
    const prev=shown.current;shown.current=next;setActive(next);setQuantity(1)
    if(availability(sizes.find(s=>s.label===size),variants[next]).soldOut)setSize(firstFree(next))
    const images=imageRefs.current,words=burstRefs.current
    ;[images,words].forEach(list=>list.forEach((el,i)=>{if(!el)return;gsap.killTweensOf(el);if(i!==prev&&i!==next)gsap.set(el,{autoAlpha:0,yPercent:0,rotation:0})}))
    reflectRefs.current.forEach((el,i)=>el&&gsap.to(el,{autoAlpha:i === next ? 0.16 : 0,duration:reduced?0:.5,overwrite:true}))
    if(reduced){[images,words].forEach(list=>{const yPercent=list===words?-50:0;if(list[prev])gsap.set(list[prev],{autoAlpha:0,yPercent,rotation:0});if(list[next])gsap.set(list[next],{autoAlpha:1,yPercent,rotation:0,scale:1})});return}
    gsap.to(images[prev],{yPercent:-115,rotation:-12,autoAlpha:0,duration:.4,ease:'power2.in'})
    gsap.fromTo(images[next],{yPercent:100,rotation:13,autoAlpha:0},{yPercent:0,rotation:0,autoAlpha:1,duration:.85,ease:'back.out(1.15)',delay:.06})
    gsap.to(words[prev],{scale:1.12,rotation:6,autoAlpha:0,duration:.4,ease:'power2.in'})
    gsap.fromTo(words[next],{xPercent:-50,yPercent:-50,scale:.65,rotation:-6,autoAlpha:0},{xPercent:-50,yPercent:-50,scale:1,rotation:0,autoAlpha:1,duration:.9,ease:'power3.out',delay:.05})
    sweep(.45)
  }
  const like=()=>{
    const next=!liked;setLiked(next)
    try{localStorage.setItem('vktry-favorite-'+v.name,String(next))}catch{}
    onLikeChange?.(next);announce(next?`${v.name} saved to favorites`:`${v.name} removed from favorites`)
    if(reduced)return
    gsap.fromTo(heartRef.current,{scale:.7},{scale:1,duration:.5,ease:'back.out(3)'})
    if(next)Array.from(burstRef.current?.children??[]).forEach((el,i)=>{const angle=(-160+i*24)*Math.PI/180;gsap.fromTo(el,{x:0,y:0,scale:.5,autoAlpha:1},{x:Math.cos(angle)*45,y:Math.sin(angle)*45,scale:.8,autoAlpha:0,duration:.8,ease:'power2.out'})})
  }
  const add=()=>{
    if(busy.current||here.soldOut||!v)return
    busy.current=true;setCartState(reduced?'done':'busy')
    const snapshot={variant:v,size,price:stats.price,quantity}
    timers.current.push(window.setTimeout(()=>{onAddToCart?.(snapshot);setCartState('done');announce(`${toast} · ${v.name} / ${size}${quantity>1?' × '+quantity:''}`)},reduced?0:550))
    timers.current.push(window.setTimeout(()=>{busy.current=false;setCartState('idle')},reduced?1400:1900))
  }
  function placeLoupe(e:React.PointerEvent){
    const stage=stageRef.current,img=imageRefs.current[shown.current],lp=loupeRef.current,li=loupeImageRef.current
    if(!stage||!img||!lp||!li)return
    const st=stage.getBoundingClientRect(),r=img.getBoundingClientRect(),L=lp.offsetWidth,Z=2.2
    gsap.set(lp,{x:e.clientX-st.left-L/2,y:e.clientY-st.top-L/2})
    li.style.backgroundSize=`${r.width*Z}px ${r.height*Z}px`
    li.style.backgroundPosition=`${-((e.clientX-r.left)*Z-L/2)}px ${-((e.clientY-r.top)*Z-L/2)}px`
  }
  const openViewer=(i:number)=>{opener.current=document.activeElement as HTMLElement;setViewerZoom(false);setViewer(i)}
  const closeViewer=React.useCallback(()=>{setViewer(null);setViewerZoom(false);opener.current?.focus()},[])
  React.useEffect(()=>{
    if(viewer===null)return
    const dialog=dialogRef.current
    if(!dialog)return
    dialog.showModal()
    const previous=document.body.style.overflow;document.body.style.overflow='hidden'
    const key=(e:KeyboardEvent)=>{if(e.key==='ArrowRight'){e.preventDefault();setViewer(i=>i===null?null:(i+1)%views.length);setViewerZoom(false)}if(e.key==='ArrowLeft'){e.preventDefault();setViewer(i=>i===null?null:(i-1+views.length)%views.length);setViewerZoom(false)}}
    dialog.addEventListener('keydown',key)
    return()=>{dialog.removeEventListener('keydown',key);dialog.close();document.body.style.overflow=previous}
  },[viewer!==null,views.length])
  if(!v)return <section className="snp-empty">The collection is coming soon.</section>
  const tone=here.soldOut?'out':here.stock!==undefined&&here.stock<=lowStock?'low':'ok'
  const stockText=here.soldOut?'This pack is sold out':tone==='low'?`Only ${here.stock} packs left`:'Explore the collection'
  return <section ref={rootRef} className={cn('snp-root',className)} style={{minHeight:height,'--snp-like':likeColor,'--snp-tint':v.tint??v.swatch,...style} as React.CSSProperties} aria-label="VKTRY flavor collection">
    {variants.map((vv,i)=><span className="snp-bg" key={vv.name} data-on={i===active} style={{'--t':vv.tint??vv.swatch} as React.CSSProperties} aria-hidden="true"/>)}
    <div className="snp-topline"><a href="index.html">Home</a><span>/</span><span>Shop the collection</span><span className="snp-edition">VKTRY / VOL. 001</span></div>
    <div className="snp-body">
      <div className="snp-info"><p className="snp-eyebrow">{eyebrow}</p><h1 className="snp-title">{title.split('\n').map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}{line}</React.Fragment>)}</h1><p className="snp-desc">{description}</p><div className="snp-formula"><span>80<span>mg</span></span><p>CAFFEINE<br/>WITH L-THEANINE</p></div><div className="snp-thumbs" aria-label="Product photos">{views.slice(0,3).map((view,i)=><button key={i} className="snp-thumb" onClick={()=>openViewer(i)} aria-label={`View ${view.label??'photo '+(i+1)}`}><span className="snp-view" style={viewStyle(view)}/><ZoomIn size={12}/></button>)}{views.length>3&&<button className="snp-more" onClick={()=>openViewer(3)} aria-label={`View all ${views.length} photos`}>+{views.length-3}</button>}</div></div>
      <div className="snp-stage" ref={stageRef} onPointerDown={e=>{if(e.pointerType==='touch'||e.button!==0)return;holding.current=true;e.currentTarget.setPointerCapture(e.pointerId);if(loupeImageRef.current)loupeImageRef.current.style.backgroundImage=`url("${v.src}")`;if(tiltRef.current)gsap.set(tiltRef.current,{rotationX:0,rotationY:0});placeLoupe(e);gsap.to(loupeRef.current,{autoAlpha:1,scale:1,duration:reduced?0:.2})}} onPointerMove={e=>{if(holding.current)placeLoupe(e)}} onPointerUp={e=>{if(e.pointerType==='touch')openViewer(0);holding.current=false;gsap.to(loupeRef.current,{autoAlpha:0,scale:.8,duration:reduced?0:.2})}} onPointerCancel={()=>{holding.current=false;gsap.set(loupeRef.current,{autoAlpha:0})}}>
        {variants.map((vv,i)=><span key={vv.name} ref={el=>{burstRefs.current[i]=el}} className="snp-fruit-burst" style={{visibility:i===firstIndex?'visible':'hidden'}} aria-hidden="true"><img src={vv.burst} alt="" draggable={false}/></span>)}
        <span className="snp-floor" ref={floorRef} aria-hidden="true"/>
        <div className="snp-reflects" aria-hidden="true">{variants.map((vv,i)=><img key={vv.name} ref={el=>{reflectRefs.current[i]=el}} className="snp-can snp-reflect" src={vv.src} alt="" draggable={false} style={{visibility:i===firstIndex?'visible':'hidden'}}/>)}</div>
        <div className="snp-float" ref={floatRef}><div className="snp-tilt" ref={tiltRef}>{variants.map((vv,i)=><img key={vv.name} ref={el=>{imageRefs.current[i]=el}} className="snp-can" src={vv.src} alt={i===active?`Silver VKTRY ${vv.name} energy drink can`:''} aria-hidden={i!==active} draggable={false} style={{visibility:i===firstIndex?'visible':'hidden'}}/>)}<span className="snp-can snp-sheen" ref={sheenRef} aria-hidden="true" style={{maskImage:`url("${v.src}")`,WebkitMaskImage:`url("${v.src}")`}}/></div></div>
        <span className="snp-loupe" ref={loupeRef} aria-hidden="true"><span ref={loupeImageRef}/></span>
        <button className="snp-hint" onClick={()=>openViewer(0)}><ZoomIn size={13}/><span className="fine-hint">Hold to zoom · </span>View gallery</button>
        <span className="snp-stage-index" aria-hidden="true">{String(active+1).padStart(2,'0')} / {String(variants.length).padStart(2,'0')}</span>
      </div>
      <div className="snp-buy"><div className="snp-flavor-heading"><div><span className="snp-label">YOUR FLAVOR</span><h2>{v.name}</h2></div><span className="snp-code">{v.code??'V / 01'}</span></div><p className="snp-flavor-note">{v.note??'Fresh perspective. Familiar ritual.'}</p><div className="snp-swatches" role="group" aria-label="Flavor">{variants.map((vv,i)=><button key={vv.name} className="snp-swatch" aria-pressed={i===active} aria-label={vv.name} disabled={cartState!=='idle'} style={{'--sw':vv.swatch} as React.CSSProperties} onClick={()=>pick(i)}><span/>{i===active&&<Check size={14} strokeWidth={2}/>}</button>)}</div><div className="snp-divider"/>
        <span className="snp-label">CHOOSE YOUR PACK</span><div className="snp-sizes" role="group" aria-label="Pack size">{sizes.map(s=><button key={s.label} className="snp-size" aria-pressed={size===s.label} disabled={cartState!=='idle'||availability(s,v).soldOut} aria-label={availability(s,v).soldOut?`${s.label}, sold out`:s.label} onClick={()=>{setSize(s.label);setQuantity(1)}}>{s.label}</button>)}</div>
        <div className="snp-price-row"><span className="snp-price" ref={priceRef}>{fmt(stats.price)}</span><span>250ml / can</span></div>
        {rating!==undefined&&<div className="snp-review" aria-label={`${stats.rating.toFixed(1)} out of 5 stars`}>{'★'.repeat(Math.round(stats.rating))}<span> {stats.rating.toFixed(1)} ({stats.reviews})</span></div>}
        <div className="snp-actions"><div className="snp-quantity"><button aria-label="Decrease quantity" disabled={quantity===1||cartState!=='idle'} onClick={()=>setQuantity(n=>n-1)}><Minus size={13}/></button><span aria-label={`Quantity ${quantity}`}>{quantity}</span><button aria-label="Increase quantity" disabled={quantity>=Math.min(here.stock??12,12)||cartState!=='idle'} onClick={()=>setQuantity(n=>n+1)}><Plus size={13}/></button></div><button ref={heartRef} className="snp-like" aria-label={`Save ${v.name} to favorites`} aria-pressed={liked} onClick={like}><Heart size={19} fill={liked?'currentColor':'none'}/><span ref={burstRef} className="snp-burst" aria-hidden="true">{Array.from({length:7},(_,i)=><Heart key={i} size={10} fill="currentColor"/>)}</span></button></div>
        <button className="snp-cta" onClick={add} disabled={here.soldOut||cartState!=='idle'} data-state={cartState} aria-live="polite">{cartState==='busy'?<><Loader2 className="snp-spinner" size={17}/> Adding</>:cartState==='done'?<><Check size={17}/> Added to bag</>:<>{here.soldOut?'Sold out':'Add to bag'}<ArrowUpRight size={17}/></>}</button><span className="snp-stock" data-tone={tone}>{stockText}</span><p className="snp-concept">Concept collection. Illustrative prices.<br/>Checkout is not connected.</p>
      </div>
    </div>
    <div className="snp-bottomline"><span>ENERGY, WITHOUT THE NOISE.</span><a href="#flavor-notes">Discover the flavors <ArrowDown size={13}/></a><span>THREE FLAVORS. ONE STATE OF MIND.</span></div>
    <div className="snp-toast" role="status" aria-live="polite" data-visible={!!message}><Check size={15}/>{message}</div>
    {viewer!==null&&selectedView&&createPortal(<dialog className="snp-viewer" ref={dialogRef} onCancel={e=>{e.preventDefault();closeViewer()}} onClick={e=>{if(e.target===e.currentTarget)closeViewer()}} aria-label={`${v.name} product gallery`}><div className="snp-box"><div className="snp-vbar"><strong>{v.name} / {selectedView.label}</strong><span>{viewer+1} — {views.length}</span><button autoFocus className="snp-vbtn" aria-label="Close photos" onClick={closeViewer}><X size={20}/></button></div><button className="snp-frame" data-zoom={viewerZoom} aria-label={viewerZoom?'Zoom out of photo':'Zoom into photo'} onClick={()=>setViewerZoom(z=>!z)} onPointerMove={e=>{if(viewerZoom){const r=e.currentTarget.getBoundingClientRect();const node=e.currentTarget.firstElementChild as HTMLElement;node.style.transformOrigin=`${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`}}}><span className="snp-view" style={{...viewStyle(selectedView),transform:`${selectedView.mirror?'scaleX(-1) ':''}scale(${viewerZoom?2.1:1})`}}/></button><div className="snp-vcontrols"><button className="snp-vbtn" aria-label="Previous photo" onClick={()=>{setViewer(i=>i===null?null:(i-1+views.length)%views.length);setViewerZoom(false)}}><ArrowLeft size={20}/></button><div className="snp-rail">{views.map((vw,i)=><button key={i} aria-label={`Show ${vw.label}`} aria-current={i===viewer?'true':undefined} onClick={()=>{setViewer(i);setViewerZoom(false)}}><span className="snp-view" style={viewStyle(vw)}/></button>)}</div><button className="snp-vbtn" aria-label="Next photo" onClick={()=>{setViewer(i=>i===null?null:(i+1)%views.length);setViewerZoom(false)}}><ArrowRight size={20}/></button></div></div></dialog>,document.body)}
  </section>
}
