package br.com.bigplant.escala.dto;

import java.util.List;

public class DadosGeracaoEscalaDTO {

    private Long idRegraConfiguracao;
    private List<Long> idsEspecialidades;
    private List<Long> idsProfissionais;

    public Long getIdRegraConfiguracao() {
        return idRegraConfiguracao;
    }

    public void setIdRegraConfiguracao(Long idRegraConfiguracao) {
        this.idRegraConfiguracao = idRegraConfiguracao;
    }

    public List<Long> getIdsEspecialidades() {
        return idsEspecialidades;
    }

    public void setIdsEspecialidades(List<Long> idsEspecialidades) {
        this.idsEspecialidades = idsEspecialidades;
    }

    public List<Long> getIdsProfissionais() {
        return idsProfissionais;
    }

    public void setIdsProfissionais(List<Long> idsProfissionais) {
        this.idsProfissionais = idsProfissionais;
    }
}
