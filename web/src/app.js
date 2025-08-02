import { entityAPI, itemAPI } from './api.js'

const entitySelect = document.getElementById('entitySelect')
const btnAddEntity = document.getElementById('btnAddEntity')
const entityForm = document.getElementById('entityForm')
const entityName = document.getElementById('entityName')
const entityDescription = document.getElementById('entityDescription')
const entityMonthRef = document.getElementById('entityMonthRef')
const btnSaveEntity = document.getElementById('btnSaveEntity')
const btnCancelEntity = document.getElementById('btnCancelEntity')
const entityActions = document.getElementById('entityActions')
const btnEditEntity = document.getElementById('btnEditEntity')
const btnDeleteEntity = document.getElementById('btnDeleteEntity')

const itemsList = document.getElementById('itemsList')
const btnAddItem = document.getElementById('btnAddItem')
const itemForm = document.getElementById('itemForm')
const itemDescription = document.getElementById('itemDescription')
const itemType = document.getElementById('itemType')
const itemValue = document.getElementById('itemValue')
const itemRecurring = document.getElementById('itemRecurring')
const itemInstallmentNow = document.getElementById('itemInstallmentNow')
const itemInstallmentMax = document.getElementById('itemInstallmentMax')
const btnSaveItem = document.getElementById('btnSaveItem')
const btnCancelItem = document.getElementById('btnCancelItem')

let editingEntityId = null
let editingItemId = null

// CARREGA ENTIDADES NO SELECT
async function loadEntities() {
  try {
    const entities = await entityAPI.list()
    entitySelect.innerHTML = `<option selected disabled>Selecione uma entidade</option>`
    entities.forEach(ent => {
      const option = document.createElement('option')
      option.value = ent.id
      option.textContent = `${ent.id} ${ent.name} (${ent.month_ref})`
      entitySelect.appendChild(option)
    })
  } catch {
    entitySelect.innerHTML = `<option>Erro ao carregar entidades</option>`
  }
  btnAddItem.disabled = true
  clearItems()
}

// LIMPA LISTAGEM DE ITENS
function clearItems() {
  itemsList.innerHTML = '<li class="list-group-item">Nenhuma entidade selecionada.</li>'
}

// CARREGA ITENS DA ENTIDADE SELECIONADA
async function loadItems(entityId) {
  try {
    const items = await entityAPI.getItems(entityId)
    console.log(items)
    if (items.length === 0) {
      itemsList.innerHTML = '<li class="list-group-item">Nenhum item encontrado.</li>'
      return
    }
    itemsList.innerHTML = ''
    items.forEach(item => {
      const li = document.createElement('li')
      li.className = 'list-group-item d-flex justify-content-between align-items-center'
      li.innerHTML = `
        <div>
          <strong>${item.description}</strong> (${item.type}) - R$ ${parseFloat(item.value).toFixed(2)} 
          ${item.recurring ? '🔁' : ''}
          - Parcelas: ${item.installment_now}/${item.installment_max}
        </div>
        <div>
          <button class="btn btn-sm btn-warning btn-edit-item" data-id="${item.id}">Editar</button>
          <button class="btn btn-sm btn-danger btn-del-item" data-id="${item.id}">Excluir</button>
        </div>
      `
      itemsList.appendChild(li)
    })

    // Habilita botão adicionar item
    btnAddItem.disabled = false

    // Adiciona eventos de editar e excluir item
    document.querySelectorAll('.btn-edit-item').forEach(btn =>
      btn.addEventListener('click', e => {
        const id = e.target.dataset.id
        startEditItem(id, entityId)
      })
    )
    document.querySelectorAll('.btn-del-item').forEach(btn =>
      btn.addEventListener('click', async e => {
        const id = e.target.dataset.id
        if (confirm('Confirma exclusão do item?')) {
          await itemAPI.remove(id)
          loadItems(entityId)
        }
      })
    )
  } catch {
    itemsList.innerHTML = '<li class="list-group-item text-danger">Erro ao carregar itens.</li>'
  }
}

// EVENTO ALTERAÇÃO DO SELECT ENTIDADES
entitySelect.addEventListener('change', () => {
  const id = entitySelect.value
  if (id) loadItems(id)
  entityActions.classList.remove('d-none')
})

// MOSTRAR FORMULÁRIO DE NOVA ENTIDADE
btnAddEntity.addEventListener('click', () => {
  editingEntityId = null
  entityName.value = ''
  entityDescription.value = ''
  entityMonthRef.value = ''
  entityForm.style.display = 'block'
})

// CANCELAR FORM ENTIDADE
btnCancelEntity.addEventListener('click', () => {
  entityForm.style.display = 'none'
})

// SALVAR ENTIDADE (CRIAR OU ATUALIZAR)
btnSaveEntity.addEventListener('click', async () => {
  const data = {
    name: entityName.value.trim(),
    description: entityDescription.value.trim(),
    month_ref: entityMonthRef.value
  }
  try {
    if (editingEntityId) {
      await entityAPI.update(editingEntityId, data)
      alert('Entidade atualizada!')
    } else {
      await entityAPI.create(data)
      alert('Entidade criada!')
    }
    entityForm.style.display = 'none'
    await loadEntities()
  } catch (e) {
    alert('Erro ao salvar entidade: ' + e.message)
  }
})

btnEditEntity.addEventListener('click', async () => {
  const id = entitySelect.value
  try {
    const entity = await entityAPI.get(id)
    editingEntityId = id
    entityName.value = entity.name
    entityDescription.value = entity.description
    entityMonthRef.value = entity.month_ref
    entityForm.style.display = 'block'
  } catch {
    alert('Erro ao carregar entidade para edição.')
  }
})

btnDeleteEntity.addEventListener('click', async () => {
  const id = entitySelect.value
  if (!id) return

  if (confirm('Tem certeza que deseja excluir esta entidade e todos os seus itens?')) {
    try {
      await entityAPI.remove(id)
      alert('Entidade excluída com sucesso!')
      entityForm.style.display = 'none'
      entityActions.classList.add('d-none')
      await loadEntities()
      clearItems()
    } catch {
      alert('Erro ao excluir entidade.')
    }
  }
})

// LIMPA FORMULÁRIO DE ITEM
function clearItemForm() {
  itemDescription.value = ''
  itemType.value = 'entrada'
  itemValue.value = ''
  itemRecurring.checked = false
  itemInstallmentNow.value = ''
  itemInstallmentMax.value = ''
}

// MOSTRAR FORMULÁRIO DE NOVO ITEM
btnAddItem.addEventListener('click', () => {
  editingItemId = null
  clearItemForm()
  itemForm.style.display = 'block'
})

// CANCELAR FORM ITEM
btnCancelItem.addEventListener('click', () => {
  itemForm.style.display = 'none'
})

// SALVAR ITEM (CRIAR OU ATUALIZAR)
btnSaveItem.addEventListener('click', async () => {
  const entityId = entitySelect.value
  if (!entityId) {
    alert('Selecione uma entidade primeiro.')
    return
  }

  const data = {
    entity_id: entityId,
    description: itemDescription.value.trim(),
    type: itemType.value,
    value: parseFloat(itemValue.value),
    recurring: itemRecurring.checked,
    installment_now: parseInt(itemInstallmentNow.value) || 0,
    installment_max: parseInt(itemInstallmentMax.value) || 0
  }

  try {
    if (editingItemId) {
      await itemAPI.update(editingItemId, data)
      alert('Item atualizado!')
    } else {
      await itemAPI.create(data)
      alert('Item criado!')
    }
    itemForm.style.display = 'none'
    loadItems(entityId)
  } catch (e) {
    alert('Erro ao salvar item: ' + e.message)
  }
})

// INICIAR EDIÇÃO DE ITEM
async function startEditItem(id, entityId) {
  try {
    const item = await itemAPI.get(id)
    editingItemId = id

    itemDescription.value = item.description
    itemType.value = item.type
    itemValue.value = item.value
    itemRecurring.checked = !!item.recurring
    itemInstallmentNow.value = item.installment_now
    itemInstallmentMax.value = item.installment_max

    itemForm.style.display = 'block'
  } catch {
    alert('Erro ao carregar item')
  }
}

loadEntities()
