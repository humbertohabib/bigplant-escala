package br.com.bigplant.escala.config;

import br.com.bigplant.escala.model.Especialidade;
import br.com.bigplant.escala.model.RegraConfiguracao;
import br.com.bigplant.escala.model.RegraEscalaParametro;
import br.com.bigplant.escala.repository.EspecialidadeRepository;
import br.com.bigplant.escala.repository.RegraConfiguracaoRepository;
import br.com.bigplant.escala.repository.RegraEscalaParametroRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initEspecialidades(EspecialidadeRepository especialidadeRepository) {
        return args -> {
            if (especialidadeRepository.count() == 0) {
                List<String> nomes = Arrays.asList(
                    "Clínico Geral",
                    "Pediatria",
                    "Cardiologia",
                    "Ortopedia",
                    "Anestesiologia",
                    "Ginecologia e Obstetrícia",
                    "Cirurgia Geral",
                    "Dermatologia",
                    "Neurologia",
                    "Psiquiatria",
                    "Oftalmologia",
                    "Otorrinolaringologia",
                    "Urologia",
                    "Endocrinologia",
                    "Infectologia"
                );

                for (String nome : nomes) {
                    Especialidade especialidade = new Especialidade();
                    especialidade.setNome(nome);
                    especialidadeRepository.save(especialidade);
                }
            }
        };
    }

    @Bean
    public CommandLineRunner initRegrasExemplo(RegraConfiguracaoRepository configRepo, RegraEscalaParametroRepository paramRepo) {
        return args -> {
            Long idHospital = 1L;
            
            // Garantir que existe a configuração "Padrão (Hospital)"
            if (configRepo.findByIdHospitalAndAtivoTrue(idHospital).stream()
                    .noneMatch(c -> c.getNome().equals("Padrão (Hospital)"))) {
                
                criarConfiguracao(configRepo, paramRepo, "Padrão (Hospital)", 
                    "Regras padrão aplicáveis a todo o hospital quando nenhuma outra for selecionada.", idHospital, 
                    10, // Max Noites (Padrão conservador)
                    11, // Min Descanso (Padrão CLT/Categoria)
                    2   // Max Consecutivos
                );
            }

            if (configRepo.count() <= 1) { // Se só tem a padrão (ou nenhuma antes), cria os exemplos
                // Exemplo 1: Escala Verão (Mais flexível com descansos)
                criarConfiguracao(configRepo, paramRepo, "Escala Verão", 
                    "Regras mais flexíveis para período de férias", idHospital, 
                    12, // Max Noites
                    10, // Min Descanso (reduzido para cobrir buracos)
                    3   // Max Consecutivos (aumentado)
                );

                // Exemplo 2: Plantão Extra / Emergência (Limites bem altos)
                criarConfiguracao(configRepo, paramRepo, "Plantão Extra / Emergência", 
                    "Para situações de alta demanda ou falta de pessoal", idHospital, 
                    15, // Max Noites
                    8,  // Min Descanso (mínimo legal absoluto)
                    4   // Max Consecutivos
                );

                // Exemplo 3: Escala Residente / Estrito (Regras rígidas)
                criarConfiguracao(configRepo, paramRepo, "Escala Residente / Estrito", 
                    "Seguindo estritamente as recomendações de bem-estar", idHospital, 
                    6,  // Max Noites
                    24, // Min Descanso (excelente)
                    2   // Max Consecutivos
                );
            }
        };
    }

    private void criarConfiguracao(RegraConfiguracaoRepository configRepo, RegraEscalaParametroRepository paramRepo,
                                   String nome, String descricao, Long idHospital,
                                   Integer maxNoites, Integer minDescanso, Integer maxConsecutivos) {
        
        RegraConfiguracao config = new RegraConfiguracao();
        config.setNome(nome);
        config.setDescricao(descricao);
        config.setIdHospital(idHospital);
        config.setAtivo(true);
        config = configRepo.save(config);

        criarParametro(paramRepo, config, "MAX_NOITES_MES", "Máximo de noites por mês", maxNoites, "PLANTOES");
        criarParametro(paramRepo, config, "MIN_DESCANSO_HORAS", "Descanso mínimo entre plantões", minDescanso, "HORAS");
        criarParametro(paramRepo, config, "MAX_PLANTOES_CONSECUTIVOS", "Máximo de plantões consecutivos", maxConsecutivos, "PLANTOES");
    }

    private void criarParametro(RegraEscalaParametroRepository paramRepo, RegraConfiguracao config,
                                String chave, String descricao, Integer valor, String unidade) {
        RegraEscalaParametro param = new RegraEscalaParametro();
        param.setChave(chave);
        param.setDescricao(descricao);
        param.setValorInteiro(valor);
        param.setUnidade(unidade);
        param.setEscopo("CONFIGURACAO");
        param.setRegraConfiguracao(config);
        param.setAtivo(true);
        param.setDataInicioVigencia(LocalDate.now());
        paramRepo.save(param);
    }
}
