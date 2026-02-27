package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.model.TrocaPlantao;
import br.com.bigplant.escala.repository.ProfissionalRepository;
import br.com.bigplant.escala.service.TrocaPlantaoService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private final HttpServletRequest request;

    public TrocaPlantaoController(TrocaPlantaoService trocaPlantaoService, ProfissionalRepository profissionalRepository, HttpServletRequest request) {
        this.trocaPlantaoService = trocaPlantaoService;
        this.profissionalRepository = profissionalRepository;
        this.request = request;
    }

    @GetMapping
    public ResponseEntity<List<TrocaPlantao>> listarTodas() {
        return ResponseEntity.ok(trocaPlantaoService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<TrocaPlantao> solicitarTroca(@RequestBody SolicitarTrocaRequest body) {
        String email = (String) request.getAttribute("usuarioEmail");
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        
        Profissional solicitante = profissionalRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profissional não encontrado"));

        TrocaPlantao troca =
                trocaPlantaoService.solicitarTroca(
                        body.idTurno, body.idProfissionalDestino, body.motivo, solicitante);
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

