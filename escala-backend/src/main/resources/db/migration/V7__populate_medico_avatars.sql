UPDATE profissional 
SET foto_perfil = CONCAT('https://ui-avatars.com/api/?background=random&color=fff&name=', REPLACE(nome, ' ', '+')) 
WHERE (foto_perfil IS NULL OR foto_perfil = '') AND perfil = 'MEDICO';