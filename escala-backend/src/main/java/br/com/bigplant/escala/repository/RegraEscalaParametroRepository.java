package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.RegraEscalaParametro;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegraEscalaParametroRepository extends JpaRepository<RegraEscalaParametro, Long> {

    List<RegraEscalaParametro> findByIdHospitalAndAtivoAndDataInicioVigenciaLessThanEqualAndDataFimVigenciaIsNullOrDataFimVigenciaGreaterThanEqual(
            Long idHospital, Boolean ativo, LocalDate dataInicioVigencia, LocalDate dataFimVigencia);
}

