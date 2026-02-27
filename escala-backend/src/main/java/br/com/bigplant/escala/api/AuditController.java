package br.com.bigplant.escala.api;

import br.com.bigplant.escala.audit.AuditLog;
import br.com.bigplant.escala.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> listar(HttpServletRequest request, @RequestParam(required = false) String usuarioIdFiltro) {
        String usuarioPerfil = (String) request.getAttribute("usuarioPerfil");
        String usuarioId = (String) request.getAttribute("usuarioId");
        
        boolean isAdmin = "ADMIN".equalsIgnoreCase(usuarioPerfil);
        boolean isAuditor = "AUDIT".equalsIgnoreCase(usuarioPerfil);

        // Se for ADMIN ou AUDIT, pode ver tudo ou filtrar por usuário específico
        if (isAdmin || isAuditor) {
            if (usuarioIdFiltro != null && !usuarioIdFiltro.isBlank()) {
                return ResponseEntity.ok(auditService.findByActor(usuarioIdFiltro));
            }
            return ResponseEntity.ok(auditService.findAll());
        }

        // Usuário comum só vê suas próprias ações
        return ResponseEntity.ok(auditService.findByActor(usuarioId));
    }
}
