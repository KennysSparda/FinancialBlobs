export default function renderizarTabela(entidadeFinanceira, modal) {
  const root = document.createElement('div');
  root.id = 'root';

  const titulo = document.createElement('h2');
  titulo.textContent = entidadeFinanceira.nome;

  const descricao = document.createElement('p');
  descricao.textContent = entidadeFinanceira.descricao;

  const tabela = document.createElement('table');

  const thead = document.createElement('thead');
  const cabecalho = document.createElement('tr');
  ['Descrição Item', 'Parcela', 'Tipo', 'Valor'].forEach(texto => {
    const th = document.createElement('th');
    th.textContent = texto;
    cabecalho.appendChild(th);
  });
  thead.appendChild(cabecalho);

  const tbody = document.createElement('tbody');
  entidadeFinanceira.itens.forEach(item => {
    const linha = document.createElement('tr');

    const tdDescricao = document.createElement('td');
    tdDescricao.textContent = item.descricao || '';
    linha.appendChild(tdDescricao);

    const tdParcela = document.createElement('td');
    tdParcela.textContent = item.parcela || 'Recorrente';
    linha.appendChild(tdParcela);

    const tdTipo = document.createElement('td');
    tdTipo.textContent = item.tipo || '';
    linha.appendChild(tdTipo);

    const tdValor = document.createElement('td');
    tdValor.textContent = item.valor != null ? item.valor : '';
    linha.appendChild(tdValor);

    tbody.appendChild(linha);
  });

  const tfoot = document.createElement('tfoot');
  const linhaTotal = document.createElement('tr');
  const tdLabel = document.createElement('td');
  tdLabel.colSpan = 3;
  tdLabel.textContent = 'Total';
  const tdTotal = document.createElement('td');
  tdTotal.textContent = entidadeFinanceira.total();
  linhaTotal.appendChild(tdLabel);
  linhaTotal.appendChild(tdTotal);
  tfoot.appendChild(linhaTotal);

  tabela.appendChild(thead);
  tabela.appendChild(tbody);
  tabela.appendChild(tfoot);

  root.appendChild(titulo);
  root.appendChild(descricao);
  root.appendChild(tabela);

  modal.appendChild(root);
}