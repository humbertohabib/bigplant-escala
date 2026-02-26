package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.InstituicaoOrganizacional;
import br.com.bigplant.escala.repository.InstituicaoOrganizacionalRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/instituicoes")
public class InstituicaoOrganizacionalController {

    private final InstituicaoOrganizacionalRepository instituicaoOrganizacionalRepository;

    public InstituicaoOrganizacionalController(InstituicaoOrganizacionalRepository instituicaoOrganizacionalRepository) {
        this.instituicaoOrganizacionalRepository = instituicaoOrganizacionalRepository;
    }

    @GetMapping
    public ResponseEntity<List<InstituicaoOrganizacional>> listarTodos() {
        return ResponseEntity.ok(instituicaoOrganizacionalRepository.findAll());
    }

    @GetMapping("/ativas")
    public ResponseEntity<List<InstituicaoOrganizacional>> listarAtivas() {
        return ResponseEntity.ok(instituicaoOrganizacionalRepository.findByAtivoTrue());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InstituicaoOrganizacional> buscarPorId(@PathVariable Long id) {
        return instituicaoOrganizacionalRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<InstituicaoOrganizacional> criar(@RequestBody InstituicaoOrganizacional instituicao) {
        if (instituicao.getAtivo() == null) {
            instituicao.setAtivo(true);
        }
        InstituicaoOrganizacional salvo = instituicaoOrganizacionalRepository.save(instituicao);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InstituicaoOrganizacional> atualizar(
            @PathVariable Long id, @RequestBody InstituicaoOrganizacional instituicao) {
        return instituicaoOrganizacionalRepository
                .findById(id)
                .map(existente -> {
                    existente.setNome(instituicao.getNome());
                    existente.setAtivo(instituicao.getAtivo());
                    InstituicaoOrganizacional salvo = instituicaoOrganizacionalRepository.save(existente);
                    return ResponseEntity.ok(salvo);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        if (!instituicaoOrganizacionalRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        instituicaoOrganizacionalRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
