package br.com.bigplant.escala.service;

import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.model.TrocaPlantao;
import br.com.bigplant.escala.model.Turno;
import br.com.bigplant.escala.repository.ProfissionalRepository;
import br.com.bigplant.escala.repository.TrocaPlantaoRepository;
import br.com.bigplant.escala.repository.TurnoRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TrocaPlantaoService {

    private final TrocaPlantaoRepository trocaPlantaoRepository;
    private final TurnoRepository turnoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final NotificacaoService notificacaoService;

    public TrocaPlantaoService(
            TrocaPlantaoRepository trocaPlantaoRepository,
            TurnoRepository turnoRepository,
            ProfissionalRepository profissionalRepository,
            NotificacaoService notificacaoService) {
        this.trocaPlantaoRepository = trocaPlantaoRepository;
        this.turnoRepository = turnoRepository;
        this.profissionalRepository = profissionalRepository;
        this.notificacaoService = notificacaoService;
    }

    public List<TrocaPlantao> listarTodas() {
        return trocaPlantaoRepository.findAll();
    }

    @Transactional
    public TrocaPlantao solicitarTroca(Long idTurno, Long idProfissionalDestino, String motivo) {
        Turno turno =
                turnoRepository
                        .findById(idTurno)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno não encontrado"));
        if (turno.getIdProfissional() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turno sem profissional de origem");
        }
        Profissional origem =
                profissionalRepository
                        .findById(turno.getIdProfissional())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Profissional de origem não encontrado"));
        Profissional destino =
                profissionalRepository
                        .findById(idProfissionalDestino)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Profissional de destino não encontrado"));

        TrocaPlantao troca = new TrocaPlantao();
        troca.setIdHospital(turno.getIdHospital());
        troca.setIdTurno(turno.getId());
        troca.setIdProfissionalOrigem(origem.getId());
        troca.setIdProfissionalDestino(destino.getId());
        troca.setStatus("SOLICITADA");
        troca.setDataSolicitacao(LocalDateTime.now());
        troca.setMotivo(motivo);

        TrocaPlantao salva = trocaPlantaoRepository.save(troca);
        notificacaoService.notificarTrocaSolicitada(salva, origem, destino, turno);
        return salva;
    }

    @Transactional
    public TrocaPlantao aprovarTroca(Long idTroca) {
        TrocaPlantao troca =
                trocaPlantaoRepository
                        .findById(idTroca)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Troca de plantão não encontrada"));
        Turno turno =
                turnoRepository
                        .findById(troca.getIdTurno())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno não encontrado"));

        Profissional origem =
                profissionalRepository
                        .findById(troca.getIdProfissionalOrigem())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Profissional de origem não encontrado"));
        Profissional destino =
                profissionalRepository
                        .findById(troca.getIdProfissionalDestino())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Profissional de destino não encontrado"));

        turno.setIdProfissional(destino.getId());
        turnoRepository.save(turno);

        troca.setStatus("APROVADA");
        troca.setDataResposta(LocalDateTime.now());
        TrocaPlantao salva = trocaPlantaoRepository.save(troca);

        notificacaoService.notificarTrocaAtualizada(salva, origem, destino, turno);
        return salva;
    }

    @Transactional
    public TrocaPlantao rejeitarTroca(Long idTroca) {
        TrocaPlantao troca =
                trocaPlantaoRepository
                        .findById(idTroca)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Troca de plantão não encontrada"));
        Turno turno =
                turnoRepository
                        .findById(troca.getIdTurno())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno não encontrado"));

        Profissional origem =
                profissionalRepository
                        .findById(troca.getIdProfissionalOrigem())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Profissional de origem não encontrado"));
        Profissional destino =
            profissionalRepository
                        .findById(troca.getIdProfissionalDestino())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Profissional de destino não encontrado"));

        troca.setStatus("REJEITADA");
        troca.setDataResposta(LocalDateTime.now());
        TrocaPlantao salva = trocaPlantaoRepository.save(troca);

        notificacaoService.notificarTrocaAtualizada(salva, origem, destino, turno);
        return salva;
    }
}

