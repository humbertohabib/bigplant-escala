package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.Disponibilidade;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisponibilidadeRepository extends JpaRepository<Disponibilidade, Long> {

    List<Disponibilidade> findByIdHospitalAndDataAndTipoTurnoAndDisponivelTrue(
            Long idHospital, LocalDate data, String tipoTurno);
}

