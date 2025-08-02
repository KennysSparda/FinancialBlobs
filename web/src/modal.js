export function showModal(items) {
  const itemsList = document.getElementById('itemsList')
  itemsList.innerHTML = ''
  if (!items.length) {
    itemsList.innerHTML = '<li class="list-group-item">Nenhum item encontrado.</li>'
  }
  items.forEach(item => {
    const li = document.createElement('li')
    li.className = 'list-group-item'
    li.textContent = `${item.description} - R$ ${parseFloat(item.value).toFixed(2)}`
    itemsList.appendChild(li)
  })

  new bootstrap.Modal('#entityModal').show()
}
