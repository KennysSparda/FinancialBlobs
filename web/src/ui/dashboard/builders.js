import { getAmount, getDate, isIncome, getEntityKey, getEntityNameFromCache } from './data.js'

export function computeByEntity(entities, items) {
  const sums = new Map()
  entities.forEach(e => sums.set(e.id, 0))
  items.forEach(it => {
    const key = getEntityKey(it)
    sums.set(key, (sums.get(key) ?? 0) + Math.abs(getAmount(it)))
  })
  const total = [...sums.values()].reduce((a,b)=>a+b,0)
  if (total===0) {
    sums.clear()
    items.forEach(it=>{
      const key=getEntityKey(it)
      sums.set(key,(sums.get(key)??0)+1)
    })
  }
  return {
    labels: [...sums.keys()].map(k => getEntityNameFromCache(entities,k)),
    datasets: [{ data: [...sums.values()] }]
  }
}

export function buildKinds(items) {
  let income=0, expense=0, unknown=0
  items.forEach(it=>{
    const v=getAmount(it)
    const inc=isIncome(it)
    if (inc===true) income+=Math.abs(v)
    else if (inc===false) expense+=Math.abs(v)
    else unknown+=Math.abs(v)
  })
  if (income+expense+unknown===0){
    income=items.filter(isIncome).length
    expense=items.filter(it=>!isIncome(it)).length
    unknown=0
  }
  return { labels:['Receitas','Despesas','Indefinido'], datasets:[{data:[income,expense,unknown]}] }
}

export function buildThisMonth(items, { year, month } = {}) {
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? now.getMonth()

  let inc=0, exp=0
  items.forEach(it=>{
    const d=getDate(it)
    if (!d) return
    if (d.getFullYear()!==targetYear || d.getMonth()!==targetMonth) return
    const v=Math.abs(getAmount(it))
    if (isIncome(it)) inc+=v
    else exp+=v
  })

  if (inc+exp===0) {
    const cur = items.filter(it=>{
      const d=getDate(it)
      return d && d.getFullYear()===targetYear && d.getMonth()===targetMonth
    })
    inc = cur.filter(isIncome).length
    exp = cur.filter(it=>!isIncome(it)).length
  }

  return {
    labels:['Receitas','Despesas'],
    datasets:[{ data:[inc,exp], label:`${targetMonth+1}/${targetYear}` }]
  }
}


export function buildTimeline(items, { monthsBack = 12 } = {}) {
  const now=new Date()
  const months=[]
  const idx=new Map()

  for (let i=monthsBack-1; i>=0; i--){
    const d=new Date(now.getFullYear(), now.getMonth()-i,1)
    const label=d.toLocaleDateString(undefined,{month:'short',year:'2-digit'})
    months.push({y:d.getFullYear(), m:d.getMonth(), label, inc:0, exp:0})
    idx.set(`${d.getFullYear()}-${d.getMonth()}`, months.length-1)
  }

  items.forEach(it=>{
    const d=getDate(it)
    if(!d) return
    const key=`${d.getFullYear()}-${d.getMonth()}`
    if(!idx.has(key)) return
    const i=idx.get(key)
    const v=Math.abs(getAmount(it))
    if(isIncome(it)) months[i].inc+=v
    else months[i].exp+=v
  })

  return {
    labels:months.map(x=>x.label),
    datasets:[
      {label:'Receitas',data:months.map(x=>x.inc)},
      {label:'Despesas',data:months.map(x=>x.exp)}
    ]
  }
}
