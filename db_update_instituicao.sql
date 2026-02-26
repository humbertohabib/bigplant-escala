CREATE TABLE instituicao_organizacional (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    ativo BIT(1) DEFAULT 1
);

INSERT INTO instituicao_organizacional (nome, ativo) VALUES ('Hospital Geral', 1);
