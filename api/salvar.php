<?php
header('Content-Type: application/json');
require_once 'conexao.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados inválidos']);
    exit;
}

$nome = $data['nome'];
$descricao = $data['descricao'];
$mes = $data['mes'];
$itens = $data['itens']; // array de {descricao, tipo, valor}

$stmt = $conn->prepare("INSERT INTO entidades (nome, descricao, mes) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $nome, $descricao, $mes);
$stmt->execute();
$entidade_id = $stmt->insert_id;

foreach ($itens as $item) {
    $stmt = $conn->prepare("INSERT INTO itens (entidade_id, descricao, tipo, valor) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $entidade_id, $item['descricao'], $item['tipo'], $item['valor']);
    $stmt->execute();
}

echo json_encode(['sucesso' => true]);
