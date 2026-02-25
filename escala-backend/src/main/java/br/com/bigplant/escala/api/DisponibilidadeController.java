package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.Disponibilidade;
import br.com.bigplant.escala.repository.DisponibilidadeRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/disponibilidades")
public class DisponibilidadeController {

    private final DisponibilidadeRepository disponibilidadeRepository;
    private final HttpServletRequest httpServletRequest;

    public DisponibilidadeController(
            DisponibilidadeRepository disponibilidadeRepository,
            HttpServletRequest httpServletRequest) {
        this.disponibilidadeRepository = disponibilidadeRepository;
        this.httpServletRequest = httpServletRequest;
    }

    @PostMapping
    public ResponseEntity<Disponibilidade> criar(@RequestBody Disponibilidade disponibilidade) {
        String perfil = (String) httpServletRequest.getAttribute("usuarioPerfil");
        String usuarioIdStr = (String) httpServletRequest.getAttribute("usuarioId");
        Long usuarioId = null;
        if (usuarioIdStr != null) {
            try {
                usuarioId = Long.parseLong(usuarioIdStr);
            } catch (NumberFormatException e) {
                usuarioId = null;
            }
        }
        if ("MEDICO".equals(perfil)) {
            if (usuarioId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            disponibilidade.setIdProfissional(usuarioId);
        }
        Disponibilidade salvo = disponibilidadeRepository.save(disponibilidade);
        return ResponseEntity.ok(salvo);
    }

    @GetMapping
    public ResponseEntity<List<Disponibilidade>> listarTodas() {
        return ResponseEntity.ok(disponibilidadeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Disponibilidade> buscarPorId(@PathVariable Long id) {
        return disponibilidadeRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/hospital/{idHospital}")
    public ResponseEntity<List<Disponibilidade>> listarPorHospitalEPeriodo(
            @PathVariable Long idHospital,
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        List<Disponibilidade> todas = disponibilidadeRepository.findAll();
        return ResponseEntity.ok(todas.stream()
                .filter(d -> d.getIdHospital().equals(idHospital)
                        && (d.getData().isEqual(inicio) || d.getData().isAfter(inicio))
                        && (d.getData().isEqual(fim) || d.getData().isBefore(fim)))
                .toList());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Disponibilidade> atualizar(
            @PathVariable Long id, @RequestBody Disponibilidade disponibilidade) {
        String perfil = (String) httpServletRequest.getAttribute("usuarioPerfil");
        String usuarioIdStr = (String) httpServletRequest.getAttribute("usuarioId");
        Long usuarioId = null;
        if (usuarioIdStr != null) {
            try {
                usuarioId = Long.parseLong(usuarioIdStr);
            } catch (NumberFormatException e) {
                usuarioId = null;
            }
        }
        final String perfilAtual = perfil;
        final Long usuarioIdAtual = usuarioId;
        return disponibilidadeRepository
                .findById(id)
                .map(existente -> {
                    if ("MEDICO".equals(perfilAtual)) {
                        if (usuarioIdAtual == null
                                || existente.getIdProfissional() == null
                                || !existente.getIdProfissional().equals(usuarioIdAtual)) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(existente);
                        }
                    }
                    existente.setIdHospital(disponibilidade.getIdHospital());
                    if (!"MEDICO".equals(perfilAtual)) {
                        existente.setIdProfissional(disponibilidade.getIdProfissional());
                    }
                    existente.setData(disponibilidade.getData());
                    existente.setTipoTurno(disponibilidade.getTipoTurno());
                    existente.setDisponivel(disponibilidade.getDisponivel());
                    Disponibilidade salvo = disponibilidadeRepository.save(existente);
                    return ResponseEntity.ok(salvo);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        String perfil = (String) httpServletRequest.getAttribute("usuarioPerfil");
        String usuarioIdStr = (String) httpServletRequest.getAttribute("usuarioId");
        Long usuarioId = null;
        if (usuarioIdStr != null) {
            try {
                usuarioId = Long.parseLong(usuarioIdStr);
            } catch (NumberFormatException e) {
                usuarioId = null;
            }
        }
        Disponibilidade existente =
                disponibilidadeRepository.findById(id).orElse(null);
        if (existente == null) {
            return ResponseEntity.notFound().build();
        }
        if ("MEDICO".equals(perfil)) {
            if (usuarioId == null
                    || existente.getIdProfissional() == null
                    || !existente.getIdProfissional().equals(usuarioId)) {
                return new ResponseEntity<Void>(HttpStatus.FORBIDDEN);
            }
        }
        disponibilidadeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
