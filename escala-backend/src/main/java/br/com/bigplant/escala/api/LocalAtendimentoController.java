package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.LocalAtendimento;
import br.com.bigplant.escala.repository.LocalAtendimentoRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
@RequestMapping("/api/locais")
public class LocalAtendimentoController {

    private static final Logger logger = LoggerFactory.getLogger(LocalAtendimentoController.class);

    private final LocalAtendimentoRepository localAtendimentoRepository;

    public LocalAtendimentoController(LocalAtendimentoRepository localAtendimentoRepository) {
        this.localAtendimentoRepository = localAtendimentoRepository;
    }

    @GetMapping
    public ResponseEntity<List<LocalAtendimento>> listarTodos() {
        logger.info("Listando todos os locais de atendimento");
        try {
            return ResponseEntity.ok(localAtendimentoRepository.findAll());
        } catch (Exception e) {
            logger.error("Erro ao listar locais de atendimento", e);
            throw e;
        }
    }

    @GetMapping("/hospital/{idHospital}")
    public ResponseEntity<List<LocalAtendimento>> listarPorHospital(@PathVariable Long idHospital) {
        return ResponseEntity.ok(localAtendimentoRepository.findByIdHospitalAndAtivoTrue(idHospital));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocalAtendimento> buscarPorId(@PathVariable Long id) {
        return localAtendimentoRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LocalAtendimento> criar(@RequestBody LocalAtendimento localAtendimento) {
        if (localAtendimento.getAtivo() == null) {
            localAtendimento.setAtivo(true);
        }
        LocalAtendimento salvo = localAtendimentoRepository.save(localAtendimento);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocalAtendimento> atualizar(
            @PathVariable Long id, @RequestBody LocalAtendimento localAtendimento) {
        return localAtendimentoRepository
                .findById(id)
                .map(existente -> {
                    existente.setNome(localAtendimento.getNome());
                    existente.setIdHospital(localAtendimento.getIdHospital());
                    existente.setAtivo(localAtendimento.getAtivo());
                    existente.setLogradouro(localAtendimento.getLogradouro());
                    existente.setRua(localAtendimento.getRua());
                    existente.setCidade(localAtendimento.getCidade());
                    existente.setEstado(localAtendimento.getEstado());
                    existente.setPais(localAtendimento.getPais());
                    existente.setComplemento(localAtendimento.getComplemento());
                    existente.setTelefoneContato(localAtendimento.getTelefoneContato());
                    existente.setInstituicao(localAtendimento.getInstituicao());
                    existente.setSetor(localAtendimento.getSetor());
                    existente.setSala(localAtendimento.getSala());
                    LocalAtendimento salvo = localAtendimentoRepository.save(existente);
                    return ResponseEntity.ok(salvo);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        if (!localAtendimentoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        localAtendimentoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
