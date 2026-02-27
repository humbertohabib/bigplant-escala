package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.model.TrocaPlantao;
import br.com.bigplant.escala.repository.ProfissionalRepository;
import br.com.bigplant.escala.service.TrocaPlantaoService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/trocas")
public class TrocaPlantaoController {

    private final TrocaPlantaoService trocaPlantaoService;
    private final ProfissionalRepository profissionalRepository;

    public TrocaPlantaoController(TrocaPlantaoService trocaPlantaoService, ProfissionalRepository profissionalRepository) {
        this.trocaPlantaoService = trocaPlantaoService;
        this.profissionalRepository = profissionalRepository;
    }

    @GetMapping
    public ResponseEntity<List<TrocaPlantao>> listarTodas() {
        return ResponseEntity.ok(trocaPlantaoService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<TrocaPlantao> solicitarTroca(@RequestBody SolicitarTrocaRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Profissional solicitante = profissionalRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profissional não encontrado"));

        TrocaPlantao troca =
                trocaPlantaoService.solicitarTroca(
                        request.idTurno, request.idProfissionalDestino, request.motivo, solicitante);
        return ResponseEntity.ok(troca);
    }

    @PutMapping("/{id}/aprovar")
    public ResponseEntity<TrocaPlantao> aprovar(@PathVariable Long id) {
        TrocaPlantao troca = trocaPlantaoService.aprovarTroca(id);
        return ResponseEntity.ok(troca);
    }

    @PutMapping("/{id}/rejeitar")
    public ResponseEntity<TrocaPlantao> rejeitar(@PathVariable Long id) {
        TrocaPlantao troca = trocaPlantaoService.rejeitarTroca(id);
        return ResponseEntity.ok(troca);
    }

    public static class SolicitarTrocaRequest {

        public Long idTurno;
        public Long idProfissionalDestino;
        public String motivo;
    }
}

