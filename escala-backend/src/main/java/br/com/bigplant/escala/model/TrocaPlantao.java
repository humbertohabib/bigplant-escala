package br.com.bigplant.escala.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "troca_plantao")
public class TrocaPlantao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idHospital;

    private Long idTurno;

    private Long idProfissionalOrigem;

    private Long idProfissionalDestino;

    private String status;

    private LocalDateTime dataSolicitacao;

    private LocalDateTime dataResposta;

    private String motivo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdHospital() {
        return idHospital;
    }

    public void setIdHospital(Long idHospital) {
        this.idHospital = idHospital;
    }

    public Long getIdTurno() {
        return idTurno;
    }

    public void setIdTurno(Long idTurno) {
        this.idTurno = idTurno;
    }

    public Long getIdProfissionalOrigem() {
        return idProfissionalOrigem;
    }

    public void setIdProfissionalOrigem(Long idProfissionalOrigem) {
        this.idProfissionalOrigem = idProfissionalOrigem;
    }

    public Long getIdProfissionalDestino() {
        return idProfissionalDestino;
    }

    public void setIdProfissionalDestino(Long idProfissionalDestino) {
        this.idProfissionalDestino = idProfissionalDestino;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getDataSolicitacao() {
        return dataSolicitacao;
    }

    public void setDataSolicitacao(LocalDateTime dataSolicitacao) {
        this.dataSolicitacao = dataSolicitacao;
    }

    public LocalDateTime getDataResposta() {
        return dataResposta;
    }

    public void setDataResposta(LocalDateTime dataResposta) {
        this.dataResposta = dataResposta;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}

