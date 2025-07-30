export async function carregarDadosPorMes() {
  const resposta = await fetch('/api/entidades.php');
  const dados = await resposta.json();

  // Adiciona método total() para cada entidade
  dados.forEach(mes => {
    mes.entidades.forEach(e => {
      e.total = function () {
        return this.itens.reduce((soma, item) => soma + parseFloat(item.valor), 0).toFixed(2);
      };
    });
  });

  return dados;
}
