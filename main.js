import loadCSS from './utils/loadCSS.js';
import renderizarAno from './ui/renderizarAno.js';
import { carregarDadosPorMes } from './dados/entidadesPorMes.js';

loadCSS('style.css');

carregarDadosPorMes().then(dados => {
  renderizarAno(dados);
}).catch(erro => {
  console.error("Erro ao carregar dados:", erro);
});
