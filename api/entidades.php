<?php
header('Content-Type: application/json');
require_once 'conexao.php';

$dadosPorMes = [];

$meses = $conn->query("SELECT DISTINCT mes FROM entidades");
while ($rowMes = $meses->fetch_assoc()) {
    $mes = $rowMes['mes'];
    $entidadesMes = [];

    $resEnt = $conn->prepare("SELECT * FROM entidades WHERE mes = ?");
    $resEnt->bind_param("s", $mes);
    $resEnt->execute();
    $result = $resEnt->get_result();

    while ($entidade = $result->fetch_assoc()) {
        $id = $entidade['id'];
        $resItens = $conn->prepare("SELECT descricao, tipo, valor FROM itens WHERE entidade_id = ?");
        $resItens->bind_param("i", $id);
        $resItens->execute();
        $itens = $resItens->get_result()->fetch_all(MYSQLI_ASSOC);

        $entidadesMes[] = [
            'nome' => $entidade['nome'],
            'descricao' => $entidade['descricao'],
            'itens' => $itens
        ];
    }

    $dadosPorMes[] = [
        'mes' => $mes,
        'entidades' => $entidadesMes
    ];
}

echo json_encode($dadosPorMes);
