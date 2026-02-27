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
        List<RegraEscalaParametro> existentes = regraEscalaParametroRepository
                .findByIdHospitalAndAtivoAndDataInicioVigenciaLessThanEqualAndDataFimVigenciaIsNullOrDataFimVigenciaGreaterThanEqual(
                        idHospital, true, hoje, hoje);

        salvarOuAtualizarRegra(existentes, idHospital, "MAX_NOITES_MES", "Número máximo de plantões noturnos por mês", dto.maxNoitesMes, hoje);
        salvarOuAtualizarRegra(existentes, idHospital, "MIN_DESCANSO_HORAS", "Descanso mínimo entre plantões em horas", dto.minDescansoHoras, hoje);
        salvarOuAtualizarRegra(existentes, idHospital, "MAX_PLANTOES_CONSECUTIVOS", "Máximo de plantões consecutivos", dto.maxPlantoesConsecutivos, hoje);

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
            List<RegraEscalaParametro> existentes, Long idHospital, String chave, String descricao, Integer valorInteiro, LocalDate hoje) {
        if (valorInteiro == null || valorInteiro <= 0) {
            return;
        }

        RegraEscalaParametro regra = existentes.stream()
                .filter(r -> chave.equalsIgnoreCase(r.getChave()))
                .findFirst()
                .orElse(null);

        if (regra == null) {
            regra = new RegraEscalaParametro();
            regra.setChave(chave);
            regra.setIdHospital(idHospital);
            regra.setAtivo(true);
            regra.setDataInicioVigencia(hoje);
            // We don't add to 'existentes' because we are saving immediately and returning a fresh fetch at the end of the controller method isn't using 'existentes' anyway (it calls obterRegrasConcretas which fetches again).
            // Actually, obterRegrasConcretas fetches again. That's fine.
        }

        regra.setDescricao(descricao);
        regra.setValorInteiro(valorInteiro);
        
        if (chave.contains("HORAS")) {
            regra.setUnidade("HORAS");
        } else {
            regra.setUnidade("PLANTOES");
        }
        
        regra.setEscopo("HOSPITAL");
        // We ensure these are set for new records; for existing ones they are already set but setting them again is harmless/correct.
        if (regra.getIdHospital() == null) regra.setIdHospital(idHospital);
        if (regra.getDataInicioVigencia() == null) regra.setDataInicioVigencia(hoje);
        if (regra.getAtivo() == null) regra.setAtivo(true);

        regraEscalaParametroRepository.save(regra);
    }
}

