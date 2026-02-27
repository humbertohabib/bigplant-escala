-- V5: Cria tabela de configurações de regras e vincula parametros
-- Permite agrupar regras em perfis diferentes

CREATE TABLE regra_configuracao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao VARCHAR(500),
    id_hospital BIGINT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

ALTER TABLE regra_escala_parametro ADD COLUMN id_regra_configuracao BIGINT;
ALTER TABLE regra_escala_parametro ADD CONSTRAINT fk_regra_parametro_configuracao FOREIGN KEY (id_regra_configuracao) REFERENCES regra_configuracao (id);
