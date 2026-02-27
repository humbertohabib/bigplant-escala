package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.Especialidade;
import br.com.bigplant.escala.repository.EspecialidadeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/especialidades")
public class EspecialidadeController {

    private final EspecialidadeRepository especialidadeRepository;

    public EspecialidadeController(EspecialidadeRepository especialidadeRepository) {
        this.especialidadeRepository = especialidadeRepository;
    }

    @GetMapping
    public ResponseEntity<List<Especialidade>> listarTodas() {
        return ResponseEntity.ok(especialidadeRepository.findAll());
    }
}
