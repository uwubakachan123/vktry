"use client"
import SneakerProductHero, { type SneakerProductHeroProps, type SneakerVariant, type SneakerView } from '@/components/ui/sneaker-product-hero'
import { flavors, packs } from '@/src/data/catalog'
const gallery=(src:string):SneakerView[]=>[
  {src,label:'Full can'},
  {src,label:'Wordmark',focus:[.5,.45],zoom:1.65},
  {src,label:'Flavor label',focus:[.5,.76],zoom:2},
  {src,label:'Pull tab & finish',focus:[.5,.13],zoom:2.3},
]
export const variants:SneakerVariant[]=flavors.map(f=>({
  name:f.name,burst:`images/${f.burst}`,swatch:f.swatch,tint:f.tint,src:`images/${f.image}`,gallery:gallery(`images/${f.image}`),note:f.note,description:f.description,code:f.code,
}))
export default function Demo({onAddToCart}:Pick<SneakerProductHeroProps,'onAddToCart'>){
  return <SneakerProductHero variants={variants} sizes={packs.map(p=>({label:p.label,price:p.price}))} onAddToCart={onAddToCart}/>
}
