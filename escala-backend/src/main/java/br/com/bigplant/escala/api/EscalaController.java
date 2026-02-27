package br.com.bigplant.escala.api;

import br.com.bigplant.escala.dto.DadosGeracaoEscalaDTO;
import br.com.bigplant.escala.model.Escala;
import br.com.bigplant.escala.service.GeracaoEscalaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/escala")
public class EscalaController {

    private final GeracaoEscalaService geracaoEscalaService;

    public EscalaController(GeracaoEscalaService geracaoEscalaService) {
        this.geracaoEscalaService = geracaoEscalaService;
    }

    @GetMapping("/{idHospital}/atual")
    public ResponseEntity<Escala> buscarUltimaEscala(@PathVariable Long idHospital) {
        return geracaoEscalaService.buscarUltimaEscala(idHospital)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/gerar/{idHospital}")
    public ResponseEntity<Escala> gerarEscalaProximosQuinzeDias(
            @PathVariable Long idHospital,
            @RequestBody DadosGeracaoEscalaDTO dados) {
        Escala escala = geracaoEscalaService.gerarEscalaProximosQuinzeDias(idHospital, dados);
        return ResponseEntity.ok(escala);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirEscala(@PathVariable Long id) {
        try {
            geracaoEscalaService.excluirEscala(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

