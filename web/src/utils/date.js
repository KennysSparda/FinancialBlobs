// /src/ui/utils/date.js
export function monthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
