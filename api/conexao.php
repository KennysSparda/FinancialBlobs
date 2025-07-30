<?php
$host = '';
$user = '';
$senha = '';
$banco = '';

// Conecta sem banco para poder criá-lo
$conn = new mysqli($host, $user, $senha);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['erro' => 'Erro de conexão inicial']));
}

// Cria o banco se não existir
$conn->query("CREATE DATABASE IF NOT EXISTS `$banco` DEFAULT CHARSET utf8mb4");

// Seleciona o banco
$conn->select_db($banco);

// Cria a tabela entidades
$conn->query("
    CREATE TABLE IF NOT EXISTS entidades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100),
        descricao TEXT,
        mes VARCHAR(20)
    )
");

// Cria a tabela itens com chave estrangeira
$conn->query("
    CREATE TABLE IF NOT EXISTS itens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entidade_id INT,
        descricao VARCHAR(100),
        tipo VARCHAR(20),
        valor DECIMAL(10,2),
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE
    )
");

$conn->set_charset('utf8');
?>
