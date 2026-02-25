package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.RegraEscalaParametro;
import br.com.bigplant.escala.repository.RegraEscalaParametroRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/regras")
public class RegrasController {

    private final RegraEscalaParametroRepository regraEscalaParametroRepository;

    public RegrasController(RegraEscalaParametroRepository regraEscalaParametroRepository) {
        this.regraEscalaParametroRepository = regraEscalaParametroRepository;
    }

    public static class RegrasConcretasDto {

        public Integer maxNoitesMes;
        public Integer minDescansoHoras;
        public Integer maxPlantoesConsecutivos;
    }

    @GetMapping("/concretas/{idHospital}")
    public ResponseEntity<RegrasConcretasDto> obterRegrasConcretas(@PathVariable Long idHospital) {
        LocalDate hoje = LocalDate.now();
        List<RegraEscalaParametro> regras = regraEscalaParametroRepository
                .findByIdHospitalAndAtivoAndDataInicioVigenciaLessThanEqualAndDataFimVigenciaIsNullOrDataFimVigenciaGreaterThanEqual(
                        idHospital, true, hoje, hoje);

        RegrasConcretasDto dto = new RegrasConcretasDto();
        dto.maxNoitesMes = obterValorInteiroRegras(regras, "MAX_NOITES_MES");
        dto.minDescansoHoras = obterValorInteiroRegras(regras, "MIN_DESCANSO_HORAS");
        dto.maxPlantoesConsecutivos = obterValorInteiroRegras(regras, "MAX_PLANTOES_CONSECUTIVOS");

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/concretas/{idHospital}")
    public ResponseEntity<RegrasConcretasDto> atualizarRegrasConcretas(
            @PathVariable Long idHospital, @RequestBody RegrasConcretasDto dto) {
        LocalDate hoje = LocalDate.now();
        salvarOuAtualizarRegra(idHospital, "MAX_NOITES_MES", "Número máximo de plantões noturnos por mês", dto.maxNoitesMes, hoje);
        salvarOuAtualizarRegra(idHospital, "MIN_DESCANSO_HORAS", "Descanso mínimo entre plantões em horas", dto.minDescansoHoras, hoje);
        salvarOuAtualizarRegra(
                idHospital, "MAX_PLANTOES_CONSECUTIVOS", "Máximo de plantões consecutivos", dto.maxPlantoesConsecutivos, hoje);
        return obterRegrasConcretas(idHospital);
    }

    private Integer obterValorInteiroRegras(List<RegraEscalaParametro> regras, String chave) {
        return regras.stream()
                .filter(r -> chave.equalsIgnoreCase(r.getChave()))
                .map(RegraEscalaParametro::getValorInteiro)
                .filter(v -> v != null && v > 0)
                .findFirst()
                .orElse(null);
    }

    private void salvarOuAtualizarRegra(
            Long idHospital, String chave, String descricao, Integer valorInteiro, LocalDate hoje) {
        if (valorInteiro == null || valorInteiro <= 0) {
            return;
        }
        List<RegraEscalaParametro> existentes = regraEscalaParametroRepository
                .findByIdHospitalAndAtivoAndDataInicioVigenciaLessThanEqualAndDataFimVigenciaIsNullOrDataFimVigenciaGreaterThanEqual(
                        idHospital, true, hoje, hoje);

        RegraEscalaParametro regra = existentes.stream()
                .filter(r -> chave.equalsIgnoreCase(r.getChave()))
                .findFirst()
                .orElseGet(RegraEscalaParametro::new);

        regra.setChave(chave);
        regra.setDescricao(descricao);
        regra.setValorInteiro(valorInteiro);
        regra.setUnidade("PLANTOES");
        regra.setEscopo("HOSPITAL");
        regra.setIdHospital(idHospital);
        regra.setDataInicioVigencia(hoje);
        regra.setAtivo(true);

        regraEscalaParametroRepository.save(regra);
    }
}

