-- V5: Adiciona colunas divulgar_dados e data_nascimento na tabela profissional
-- Permite que usuários controlem a privacidade de seus dados e informem data de nascimento

ALTER TABLE profissional ADD COLUMN divulgar_dados BOOLEAN DEFAULT TRUE;
ALTER TABLE profissional ADD COLUMN data_nascimento DATE;
