package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.Turno;
import br.com.bigplant.escala.repository.TurnoRepository;
import br.com.bigplant.escala.audit.AuditLog;
import br.com.bigplant.escala.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    private final TurnoRepository turnoRepository;
    private final AuditService auditService;
    private final HttpServletRequest request;

    public TurnoController(TurnoRepository turnoRepository, AuditService auditService, HttpServletRequest request) {
        this.turnoRepository = turnoRepository;
        this.auditService = auditService;
        this.request = request;
    }

    @GetMapping
    public ResponseEntity<List<Turno>> listarTodos() {
        return ResponseEntity.ok(turnoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Turno> buscarPorId(@PathVariable Long id) {
        return turnoRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/hospital/{idHospital}")
    public ResponseEntity<List<Turno>> listarPorHospitalEPeriodo(
            @PathVariable Long idHospital,
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(turnoRepository.findByIdHospitalAndDataBetween(idHospital, inicio, fim));
    }

    @PostMapping
    public ResponseEntity<Turno> criar(@RequestBody Turno turno) {
        Turno salvo = turnoRepository.save(turno);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Turno> atualizar(@PathVariable Long id, @RequestBody Turno turno) {
        return turnoRepository
                .findById(id)
                .map(existente -> {
                    existente.setData(turno.getData());
                    existente.setHoraInicio(turno.getHoraInicio());
                    existente.setHoraFim(turno.getHoraFim());
                    existente.setTipo(turno.getTipo());
                    existente.setLocal(turno.getLocal());
                    existente.setIdHospital(turno.getIdHospital());
                    existente.setIdProfissional(turno.getIdProfissional());
                    existente.setIdLocalAtendimento(turno.getIdLocalAtendimento());
                    Turno salvo = turnoRepository.save(existente);
                    return ResponseEntity.ok(salvo);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        return turnoRepository.findById(id)
            .map(turno -> {
                turnoRepository.delete(turno);
                
                // Auditoria
                try {
                    String usuarioId = (String) request.getAttribute("usuarioId");
                    String usuarioEmail = (String) request.getAttribute("usuarioEmail");
                    auditService.log(usuarioId, usuarioEmail, AuditLog.ActionType.DELETE, 
                        "Turno", id.toString(), turno, null, request.getRemoteAddr());
                } catch (Exception e) {
                    // Log error but don't fail the request
                    e.printStackTrace();
                }

                return ResponseEntity.noContent().<Void>build();
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
