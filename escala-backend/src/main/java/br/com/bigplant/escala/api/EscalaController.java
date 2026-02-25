package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.Escala;
import br.com.bigplant.escala.service.GeracaoEscalaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/escala")
public class EscalaController {

    private final GeracaoEscalaService geracaoEscalaService;

    public EscalaController(GeracaoEscalaService geracaoEscalaService) {
        this.geracaoEscalaService = geracaoEscalaService;
    }

    @PostMapping("/gerar/{idHospital}")
    public ResponseEntity<Escala> gerarEscalaProximosQuinzeDias(@PathVariable Long idHospital) {
        Escala escala = geracaoEscalaService.gerarEscalaProximosQuinzeDias(idHospital);
        return ResponseEntity.ok(escala);
    }
}

