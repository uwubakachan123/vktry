import gsap from 'gsap'
import scene from './data/hero-scene.json'
import './styles/hero-motion.css'

/** Keep the campaign backdrop fixed; cycle the actual photographic product layers. */
export async function mountHeroMotion(root: HTMLElement): Promise<() => void> {
  if (root.dataset.motionInitialized) return () => {}
  root.dataset.motionInitialized = 'true'
  const stage = document.createElement('div')
  stage.className = 'hero-motion-stage'
  stage.setAttribute('aria-hidden', 'true')
  const url = (file: string) => scene.baseUrl + file
  const image = (src: string, className: string) => {
    const img = document.createElement('img')
    img.src=url(src); img.alt=''; img.draggable=false; img.decoding='async'; img.className=className
    return img
  }
  const backdrop=image(scene.backdrop,'hero-motion-backdrop')
  stage.append(backdrop)
  const layers=scene.products.map(p=>{
    const shadow=image(scene.shadow,'hero-motion-shadow')
    Object.assign(shadow.style,{left:p.shadow.x+'px',top:p.shadow.y+'px',width:p.shadow.width+'px',height:p.shadow.height+'px',opacity:String(p.shadow.opacity)})
    stage.append(shadow)
    const reflection=image(p.reflectionSrc,'hero-motion-reflection')
    Object.assign(reflection.style,{left:p.reflection.x+'px',top:p.reflection.y+'px',width:p.reflection.width+'px',height:p.reflection.height+'px',opacity:String(p.reflection.opacity)})
    stage.append(reflection)
    const product=document.createElement('div')
    product.className='hero-motion-product';product.dataset.flavor=p.id;product.dataset.depth=String(p.depth)
    Object.assign(product.style,{left:p.x+'px',top:p.y+'px',width:p.width+'px',height:p.height+'px',transform:`rotate(${p.rotation}deg)`,zIndex:p.id==='original'?'3':p.id==='raspberry'?'2':'1'})
    const parallax=document.createElement('div');parallax.className='hero-motion-parallax'
    const float=document.createElement('div');float.className='hero-motion-float'
    const can=image(p.src,'hero-motion-can')
    const sheen=document.createElement('span');sheen.className='hero-motion-sheen'
    sheen.style.maskImage=`url("${url(p.mask)}")`;sheen.style.webkitMaskImage=`url("${url(p.mask)}")`
    float.append(can,sheen);parallax.append(float);product.append(parallax);stage.append(product)
    return {p,product,parallax,float,shadow,reflection,sheen}
  })
  const foreground=image(scene.foreground,'hero-motion-foreground');stage.append(foreground);root.prepend(stage)
  try { await Promise.all(Array.from(stage.querySelectorAll('img')).map(img=>img.decode())) }
  catch {stage.remove();delete root.dataset.motionInitialized;return()=>{}}
  if(!root.isConnected){stage.remove();delete root.dataset.motionInitialized;return()=>{}}
  const order=scene.flavorOrder
  let activeIndex=0
  let transition:gsap.core.Timeline|undefined
  const button=root.querySelector<HTMLButtonElement>('.hero-next-flavor')
  const label=root.querySelector<HTMLElement>('.hero-flavor-name')
  const indexLabel=root.querySelector<HTMLElement>('.hero-flavor-index')
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  const slots={front:scene.products.find(p=>p.id==='original')!,middle:scene.products.find(p=>p.id==='raspberry')!,back:scene.products.find(p=>p.id==='grape')!}
  const mobileSlots={
    front:{...slots.front,x:750,y:30,width:350,height:550,rotation:10,shadow:{x:780,y:645,width:210,height:30,opacity:.2},reflection:{x:780,y:660,width:210,height:60,opacity:.08}},
    middle:{...slots.middle,x:1100,y:260,width:230,height:430,rotation:20,shadow:{x:1040,y:690,width:170,height:28,opacity:.13},reflection:{x:1040,y:710,width:170,height:45,opacity:.06}},
    back:{...slots.back,x:580,y:120,width:155,height:330,rotation:-10,shadow:{x:600,y:540,width:120,height:25,opacity:.08},reflection:{x:600,y:560,width:120,height:35,opacity:.04}}
  }
  let mobileLayout:boolean|undefined
  const title=(id:string)=>id[0].toUpperCase()+id.slice(1)
  const refresh=()=>{
    root.dataset.heroFlavor=order[activeIndex]
    if(label)label.textContent=title(order[activeIndex])
    if(indexLabel)indexLabel.textContent=String(activeIndex+1).padStart(2,'0')+' — 03'
    if(button){button.disabled=false;button.setAttribute('aria-label','Next flavor: '+title(order[(activeIndex+1)%order.length]))}
    root.setAttribute('aria-busy','false')
  }
  const place=(animate:boolean)=>{
    transition?.kill()
    if(button)button.disabled=true
    root.setAttribute('aria-busy','true')
    const changes=layers.map(layer=>{
      const role=(order.indexOf(layer.p.id)-activeIndex+order.length)%order.length
      const layout=mobileLayout?mobileSlots:slots
      const slot=role===0?layout.front:role===1?layout.middle:layout.back
      layer.product.dataset.depth=String(slot.depth)
      layer.product.style.zIndex=String(3-role)
      return {...layer,slot,role}
    })
    if(!animate||reduced.matches){
      for(const {product,shadow,reflection,slot} of changes){
        gsap.set(product,{left:slot.x,top:slot.y,width:slot.width,height:slot.height,rotation:slot.rotation})
        gsap.set(shadow,{left:slot.shadow.x,top:slot.shadow.y,width:slot.shadow.width,height:slot.shadow.height,opacity:slot.shadow.opacity})
        gsap.set(reflection,{left:slot.reflection.x,top:slot.reflection.y,width:slot.reflection.width,height:slot.reflection.height,opacity:slot.reflection.opacity})
      }
      refresh();return
    }
    transition=gsap.timeline({defaults:{duration:.95,ease:'power3.inOut'},onComplete:refresh})
    for(const {product,shadow,reflection,sheen,slot,role} of changes){
      transition.to(product,{left:slot.x,top:slot.y,width:slot.width,height:slot.height,rotation:slot.rotation},0)
      transition.to(shadow,{left:slot.shadow.x,top:slot.shadow.y,width:slot.shadow.width,height:slot.shadow.height,opacity:slot.shadow.opacity},0)
      transition.to(reflection,{left:slot.reflection.x,top:slot.reflection.y,width:slot.reflection.width,height:slot.reflection.height,opacity:slot.reflection.opacity},0)
      if(role===0)transition.fromTo(sheen,{backgroundPosition:'140% 0%'},{backgroundPosition:'-40% 0%',duration:1.2},.35)
    }
  }
  const next=()=>{if(transition?.isActive())return;activeIndex=(activeIndex+1)%order.length;place(true)}
  const resize=()=>{
    const {width,height}=root.getBoundingClientRect()
    const scale=Math.max(width/scene.artboard.width,height/scene.artboard.height)
    const narrow=width<=760,offset=narrow?0.6:0.5
    stage.style.transform=`translate3d(${(width-scene.artboard.width*scale)*offset}px,${(height-scene.artboard.height*scale)*.5}px,0) scale(${scale})`
    if(mobileLayout!==narrow){mobileLayout=narrow;place(false)}
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);resize()
  root.classList.add('hero-is-layered')
  button?.addEventListener('click',next);refresh()
  const media=gsap.matchMedia()
  media.add({motion:'(prefers-reduced-motion: no-preference)',fine:'(pointer: fine)'},context=>{
    if(!context.conditions?.motion)return
    const loops:gsap.core.Timeline[]=[]
    for(const {p,float,shadow,reflection,sheen} of layers){
      const tl=gsap.timeline({repeat:-1,yoyo:true,defaults:{duration:p.duration,ease:'sine.inOut'}})
        .fromTo(float,{y:p.float/2,rotation:-.6},{y:-p.float/2,rotation:.6},0)
        .fromTo(shadow,{scaleX:1.07},{scaleX:.88},0)
        .fromTo(reflection,{y:-p.float/4},{y:p.float/4},0)
      tl.totalTime(p.phase);loops.push(tl)
      loops.push(gsap.timeline({repeat:-1,repeatDelay:8+p.phase}).fromTo(sheen,{backgroundPosition:'140% 0%'},{backgroundPosition:'-40% 0%',duration:1.6,delay:.5+p.phase,ease:'power2.inOut'}))
    }
    let visible=true
    const pause=()=>loops.forEach(tl=>visible&&!document.hidden?tl.resume():tl.pause())
    const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;pause()},{threshold:.03});intersection.observe(root)
    document.addEventListener('visibilitychange',pause)
    const resets:(()=>void)[]=[]
    if(context.conditions.fine){
      const controls=layers.map(({product,parallax})=>({product,x:gsap.quickTo(parallax,'x',{duration:1.1,ease:'power3.out'}),y:gsap.quickTo(parallax,'y',{duration:1.1,ease:'power3.out'}),r:gsap.quickTo(parallax,'rotation',{duration:1.2,ease:'power3.out'})}))
      const bgX=gsap.quickTo(backdrop,'x',{duration:1.5,ease:'power3.out'}),bgY=gsap.quickTo(backdrop,'y',{duration:1.5,ease:'power3.out'})
      const move=(e:PointerEvent)=>{
        if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return
        const r=root.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))
        controls.forEach(c=>{const depth=Number(c.product.dataset.depth);c.x(x*14*depth);c.y(y*8*depth);c.r(x*1.3*depth)});bgX(-x*3);bgY(-y*2)
      }
      const leave=()=>{controls.forEach(c=>{c.x(0);c.y(0);c.r(0)});bgX(0);bgY(0)}
      root.addEventListener('pointermove',move);root.addEventListener('pointerleave',leave)
      resets.push(()=>{root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',leave)})
    }
    return()=>{intersection.disconnect();document.removeEventListener('visibilitychange',pause);resets.forEach(reset=>reset());loops.forEach(tl=>tl.kill())}
  })
  return()=>{transition?.kill();button?.removeEventListener('click',next);media.revert();resizeObserver.disconnect();root.classList.remove('hero-is-layered');delete root.dataset.motionInitialized;stage.remove()}
}
