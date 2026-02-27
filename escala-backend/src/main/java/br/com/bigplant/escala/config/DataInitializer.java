package br.com.bigplant.escala.config;

import br.com.bigplant.escala.model.Especialidade;
import br.com.bigplant.escala.repository.EspecialidadeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
}
