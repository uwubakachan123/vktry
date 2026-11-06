export const flavors = [
  {name:'Raspberry',slug:'raspberry',swatch:'#b82454',tint:'#d8a9b5',image:'raspberry.webp',burst:'raspberry-burst.webp',code:'V / 01',note:'Bright raspberry. A softer kind of rush.',description:'Tart, bright, and a little unexpected. A fresh perspective on your everyday energy.'},
  {name:'Grape',slug:'grape',swatch:'#7651b8',tint:'#b6a5d4',image:'grape.webp',burst:'grape-burst.webp',code:'V / 02',note:'Deep grape. Find a different kind of flow.',description:'Rich grape with a crisp finish. For getting lost in the things you actually love.'},
  {name:'Original',slug:'original',swatch:'#234df0',tint:'#a8bcda',image:'original-can.webp',burst:'original-burst.webp',code:'V / 03',note:'The original. A clean start to whatever’s next.',description:'The one that started the frequency. Clean, refreshing, and quietly ready for anything.'},
]
export const packs = [{label:'1 can',count:1,price:4},{label:'6 pack',count:6,price:22},{label:'12 pack',count:12,price:36}]
export const products = flavors.flatMap(f=>packs.map(p=>({id:`${f.slug}-${p.count}`,name:`VKTRY / ${f.name}`,detail:`${p.label} · 250ml per can`,price:p.price,image:f.image})))
export const CART_KEY='vktry-bag-v1'
export function readCart(): Record<string,number>{
  try{const input=JSON.parse(localStorage.getItem(CART_KEY)||'{}');const result:Record<string,number>={};for(const p of products)if(Number.isInteger(input[p.id])&&input[p.id]>0)result[p.id]=Math.min(99,input[p.id]);if(Number.isInteger(input.original)&&input.original>0)result['original-1']=Math.min(99,(result['original-1']||0)+input.original);if(Number.isInteger(input.collection)&&input.collection>0)result['original-12']=Math.min(99,(result['original-12']||0)+input.collection);return result}catch{return {}}
}
