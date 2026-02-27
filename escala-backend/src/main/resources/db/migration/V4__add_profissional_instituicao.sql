-- V4: Adiciona coluna id_instituicao na tabela profissional
-- Permite vincular usuários a uma instituição

ALTER TABLE profissional ADD COLUMN id_instituicao BIGINT;
ALTER TABLE profissional ADD CONSTRAINT fk_profissional_instituicao FOREIGN KEY (id_instituicao) REFERENCES instituicao_organizacional (id);
