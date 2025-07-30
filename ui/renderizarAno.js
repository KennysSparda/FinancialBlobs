import calcularResumoMensal from '../core/calculosMensais.js';
import { abrirModal } from './modal.js';

export default function renderizarResumoAnual(dadosPorMes) {
  const tabela = document.createElement('table');
  const thead = document.createElement('thead');
  const cabecalho = document.createElement('tr');

  // Cabeçalho: entidade + meses
  cabecalho.innerHTML = `<th>Entidade</th>`;
  dadosPorMes.forEach(({ mes }) => {
    cabecalho.innerHTML += `<th>${mes}</th>`;
  });
  thead.appendChild(cabecalho);
  tabela.appendChild(thead);

  // Agrupar por nome de entidade
  const nomesEntidades = new Set();
  dadosPorMes.forEach(({ entidades }) => {
    entidades.forEach(e => nomesEntidades.add(e.nome));
  });

  const tbody = document.createElement('tbody');
  nomesEntidades.forEach(nome => {
    const linha = document.createElement('tr');
    linha.innerHTML = `<td>${nome}</td>`;

    dadosPorMes.forEach(({ mes, entidades }) => {
      const entidade = entidades.find(e => e.nome === nome);
      const valor = entidade ? entidade.total() : '';
      const td = document.createElement('td');
      td.textContent = valor;
      td.classList.add('clicavel');
      td.onclick = () => abrirModal(entidade, mes);
      linha.appendChild(td);
    });

    tbody.appendChild(linha);
  });

  tabela.appendChild(tbody);
  document.body.appendChild(tabela);
}
