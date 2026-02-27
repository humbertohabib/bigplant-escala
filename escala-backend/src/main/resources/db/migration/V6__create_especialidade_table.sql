CREATE TABLE especialidade (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

ALTER TABLE profissional ADD COLUMN id_especialidade BIGINT;
ALTER TABLE profissional ADD CONSTRAINT fk_profissional_especialidade FOREIGN KEY (id_especialidade) REFERENCES especialidade(id);
