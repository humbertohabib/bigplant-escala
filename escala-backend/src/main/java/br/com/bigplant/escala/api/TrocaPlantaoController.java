package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.TrocaPlantao;
import br.com.bigplant.escala.service.TrocaPlantaoService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trocas")
public class TrocaPlantaoController {

    private final TrocaPlantaoService trocaPlantaoService;

    public TrocaPlantaoController(TrocaPlantaoService trocaPlantaoService) {
        this.trocaPlantaoService = trocaPlantaoService;
    }

    @GetMapping
    public ResponseEntity<List<TrocaPlantao>> listarTodas() {
        return ResponseEntity.ok(trocaPlantaoService.listarTodas());
    }

    @PostMapping
    public ResponseEntity<TrocaPlantao> solicitarTroca(@RequestBody SolicitarTrocaRequest request) {
        TrocaPlantao troca =
                trocaPlantaoService.solicitarTroca(
                        request.idTurno, request.idProfissionalDestino, request.motivo);
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

