package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.Turno;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {

    List<Turno> findByIdHospitalAndDataBetween(Long idHospital, LocalDate inicio, LocalDate fim);
}

