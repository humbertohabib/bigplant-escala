-- Adiciona colunas id_instituicao, setor e sala na tabela local_atendimento

ALTER TABLE local_atendimento ADD COLUMN id_instituicao BIGINT;
ALTER TABLE local_atendimento ADD CONSTRAINT fk_local_atendimento_instituicao FOREIGN KEY (id_instituicao) REFERENCES instituicao_organizacional (id);
ALTER TABLE local_atendimento ADD COLUMN setor VARCHAR(255);
ALTER TABLE local_atendimento ADD COLUMN sala VARCHAR(255);
