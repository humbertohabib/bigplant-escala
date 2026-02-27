package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.RegraConfiguracao;
import br.com.bigplant.escala.repository.RegraConfiguracaoRepository;
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
@RequestMapping("/api/regras/configuracoes")
public class RegraConfiguracaoController {

    private final RegraConfiguracaoRepository repository;

    public RegraConfiguracaoController(RegraConfiguracaoRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/hospital/{idHospital}")
    public ResponseEntity<List<RegraConfiguracao>> listarPorHospital(@PathVariable Long idHospital) {
        return ResponseEntity.ok(repository.findByIdHospitalAndAtivoTrue(idHospital));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegraConfiguracao> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RegraConfiguracao> criar(@RequestBody RegraConfiguracao configuracao) {
        if (configuracao.getAtivo() == null) {
            configuracao.setAtivo(true);
        }
        return ResponseEntity.ok(repository.save(configuracao));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegraConfiguracao> atualizar(@PathVariable Long id, @RequestBody RegraConfiguracao atualizacao) {
        return repository.findById(id)
                .map(existente -> {
                    existente.setNome(atualizacao.getNome());
                    existente.setDescricao(atualizacao.getDescricao());
                    // Não permitimos mudar o hospital de uma configuração existente por segurança
                    // existente.setIdHospital(atualizacao.getIdHospital());
                    if (atualizacao.getAtivo() != null) {
                        existente.setAtivo(atualizacao.getAtivo());
                    }
                    return ResponseEntity.ok(repository.save(existente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        java.util.Optional<RegraConfiguracao> opt = repository.findById(id);
        if (opt.isPresent()) {
            RegraConfiguracao existente = opt.get();
            existente.setAtivo(false);
            repository.save(existente);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
