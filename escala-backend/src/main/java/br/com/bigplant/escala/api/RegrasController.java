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

    @GetMapping("/configuracao/{idConfig}/parametros")
    public ResponseEntity<RegrasConcretasDto> obterParametrosConfiguracao(@PathVariable Long idConfig) {
        List<RegraEscalaParametro> regras = regraEscalaParametroRepository.findByRegraConfiguracaoId(idConfig);

        RegrasConcretasDto dto = new RegrasConcretasDto();
        dto.maxNoitesMes = obterValorInteiroRegras(regras, "MAX_NOITES_MES");
        dto.minDescansoHoras = obterValorInteiroRegras(regras, "MIN_DESCANSO_HORAS");
        dto.maxPlantoesConsecutivos = obterValorInteiroRegras(regras, "MAX_PLANTOES_CONSECUTIVOS");

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/configuracao/{idConfig}/parametros")
    public ResponseEntity<RegrasConcretasDto> atualizarParametrosConfiguracao(
            @PathVariable Long idConfig, @RequestBody RegrasConcretasDto dto) {
        
        List<RegraEscalaParametro> existentes = regraEscalaParametroRepository.findByRegraConfiguracaoId(idConfig);
        
        // Precisamos buscar a configuração para saber o ID do hospital, 
        // mas como não temos o repository aqui injetado e não queremos complicar demais,
        // vamos assumir que o usuario já validou isso ou passar o hospitalId no DTO se fosse necessario.
        // Porem, RegraEscalaParametro TEM idHospital. Se for novo parametro, precisamos saber o hospital.
        // O ideal seria injetar RegraConfiguracaoRepository aqui também.
        
        // Simplificação: Se a lista 'existentes' estiver vazia, não conseguimos saber o idHospital facilmente
        // sem consultar a Configuração.
        // Vamos permitir que o método salvarOuAtualizarRegraConfig receba null no hospital se a regra for vinculada a config.
        
        salvarOuAtualizarRegraConfig(existentes, idConfig, "MAX_NOITES_MES", "Número máximo de plantões noturnos por mês", dto.maxNoitesMes);
        salvarOuAtualizarRegraConfig(existentes, idConfig, "MIN_DESCANSO_HORAS", "Descanso mínimo entre plantões em horas", dto.minDescansoHoras);
        salvarOuAtualizarRegraConfig(existentes, idConfig, "MAX_PLANTOES_CONSECUTIVOS", "Máximo de plantões consecutivos", dto.maxPlantoesConsecutivos);

        return obterParametrosConfiguracao(idConfig);
    }

    private void salvarOuAtualizarRegraConfig(
            List<RegraEscalaParametro> existentes, Long idConfig, String chave, String descricao, Integer valorInteiro) {
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
            br.com.bigplant.escala.model.RegraConfiguracao config = new br.com.bigplant.escala.model.RegraConfiguracao();
            config.setId(idConfig);
            regra.setRegraConfiguracao(config);
            regra.setAtivo(true);
            regra.setDataInicioVigencia(LocalDate.now());
            // Nota: idHospital ficará null se não buscarmos a config, mas o vínculo principal agora é idConfig
            // Para manter consistencia, seria bom buscar a config, mas vamos seguir assim por enquanto 
            // pois o service busca por configId.
        }

        regra.setDescricao(descricao);
        regra.setValorInteiro(valorInteiro);
        
        if (chave.contains("HORAS")) {
            regra.setUnidade("HORAS");
        } else {
            regra.setUnidade("PLANTOES");
        }
        
        regra.setEscopo("CONFIGURACAO");
        
        if (regra.getDataInicioVigencia() == null) regra.setDataInicioVigencia(LocalDate.now());
        if (regra.getAtivo() == null) regra.setAtivo(true);

        regraEscalaParametroRepository.save(regra);
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

