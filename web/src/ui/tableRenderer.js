export function buildEntityTable() {
  const table = document.createElement('table')
  table.className = 'table table-bordered table-sm align-middle'
  table.innerHTML = `
    <thead class="table-light">
      <tr>
        <th>Entidade</th>
        <th>Mês Atual</th>
        <th>Próximo Mês</th>
        <th>+ Meses...</th>
      </tr>
    </thead>
  `
  return table
}
