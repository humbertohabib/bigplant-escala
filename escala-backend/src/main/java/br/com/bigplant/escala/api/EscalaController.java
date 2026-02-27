package br.com.bigplant.escala.api;

import br.com.bigplant.escala.dto.DadosGeracaoEscalaDTO;
import br.com.bigplant.escala.model.Escala;
import br.com.bigplant.escala.service.GeracaoEscalaService;
import org.springframework.http.ResponseEntity;
import br.com.bigplant.escala.audit.AuditLog;
import br.com.bigplant.escala.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
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
    private final AuditService auditService;
    private final HttpServletRequest request;

    public EscalaController(GeracaoEscalaService geracaoEscalaService, AuditService auditService, HttpServletRequest request) {
        this.geracaoEscalaService = geracaoEscalaService;
        this.auditService = auditService;
        this.request = request;
    }

    @GetMapping("/{idHospital}/atual")
    public ResponseEntity<Escala> buscarUltimaEscala(@PathVariable Long idHospital) {
        return geracaoEscalaService.buscarUltimaEscala(idHospital)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Escala> buscarPorId(@PathVariable Long id) {
        return geracaoEscalaService.buscarEscalaPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{idHospital}/listar")
    public ResponseEntity<List<Escala>> listarEscalas(@PathVariable Long idHospital) {
        return ResponseEntity.ok(geracaoEscalaService.listarEscalas(idHospital));
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
        return geracaoEscalaService.buscarEscalaPorId(id)
                .map(escala -> {
                    geracaoEscalaService.excluirEscala(id);

                    // Auditoria
                    try {
                        String usuarioId = (String) request.getAttribute("usuarioId");
                        String usuarioEmail = (String) request.getAttribute("usuarioEmail");
                        auditService.log(usuarioId, usuarioEmail, AuditLog.ActionType.DELETE, 
                                "Escala", id.toString(), escala, null, request.getRemoteAddr());
                    } catch (Exception e) {
                        // Log error but don't fail the request
                        e.printStackTrace();
                    }

                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

