package br.com.bigplant.escala.service;

import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.model.TrocaPlantao;
import br.com.bigplant.escala.model.Turno;

public interface NotificacaoService {

    void notificarTrocaSolicitada(TrocaPlantao troca, Profissional origem, Profissional destino, Turno turno);

    void notificarTrocaAtualizada(TrocaPlantao troca, Profissional origem, Profissional destino, Turno turno);
}

