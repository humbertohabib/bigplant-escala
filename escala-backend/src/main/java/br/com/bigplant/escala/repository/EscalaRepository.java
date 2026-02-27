package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.Escala;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EscalaRepository extends JpaRepository<Escala, Long> {

    List<Escala> findByIdHospitalAndDataInicioGreaterThanEqualAndDataFimLessThanEqual(
            Long idHospital, LocalDate inicio, LocalDate fim);

    Optional<Escala> findTopByIdHospitalOrderByDataInicioDesc(Long idHospital);

    List<Escala> findAllByIdHospitalOrderByDataInicioDesc(Long idHospital);
}

