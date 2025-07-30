import renderizarTabela from './renderizarTabela.js';

export function abrirModal(entidade, mes) {
  document.querySelectorAll('.modal').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const conteudo = document.createElement('div');
  conteudo.classList.add('modal-conteudo');

  const titulo = document.createElement('h2');
  titulo.textContent = `${entidade.nome} - ${mes}`;
  conteudo.appendChild(titulo);

  renderizarTabela(entidade, conteudo);

  const botaoFechar = document.createElement('button');
  botaoFechar.textContent = 'Fechar';
  botaoFechar.onclick = () => modal.remove();
  conteudo.appendChild(botaoFechar);

  modal.appendChild(conteudo);
  modal.style.display = 'block'
  document.body.appendChild(modal);

}
