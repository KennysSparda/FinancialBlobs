export default function calcularResumoMensal(entidades) {
  let receita = 0;
  let despesa = 0;

  entidades.forEach(ef => {
    ef.itens.forEach(item => {
      const valor = item.valor || 0;
      if (item.tipo === 'Receita') receita += valor;
      if (item.tipo === 'Despesa') despesa += valor;
    });
  });

  return {
    receita,
    despesa,
    saldo: receita - despesa
  };
}
