// /src/ui/dashboard/charts.js
function wipe(canvas){
  const prev = Chart.getChart(canvas)
  if (prev) prev.destroy()
}

export function renderDoughnut(canvas,data){
  wipe(canvas)
  new Chart(canvas,{type:'doughnut',data,options:{responsive:true,plugins:{legend:{position:'bottom'}}}})
}
export function renderBar(canvas,data){
  wipe(canvas)
  new Chart(canvas,{type:'bar',data,options:{responsive:true,plugins:{legend:{display:false}}}})
}
export function renderLine(canvas,data){
  wipe(canvas)
  new Chart(canvas,{type:'line',data,options:{responsive:true,plugins:{legend:{position:'bottom'}}}})
}
