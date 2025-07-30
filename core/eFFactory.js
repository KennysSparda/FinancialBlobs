// entrada < nome, descrição, lista itens (opcional)
// saida > objeto com atributos e comportamentos

export default function eFFactory (
    nomeEntrada,
    descricaoEntrada,
    listaItens = []
  ) {

  function total() {
    return listaItens.reduce((soma, item) => soma + (item.valor || 0), 0);
  }

  const entidadeFinanceira = {
    'nome': nomeEntrada,
    'descricao': descricaoEntrada,
    'itens': listaItens,
    total
  }

  return entidadeFinanceira;
}