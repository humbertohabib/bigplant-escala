package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.TrocaPlantao;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrocaPlantaoRepository extends JpaRepository<TrocaPlantao, Long> {

    List<TrocaPlantao> findByIdHospital(Long idHospital);

    List<TrocaPlantao> findByIdHospitalAndDataSolicitacaoBetween(
            Long idHospital, LocalDateTime inicio, LocalDateTime fim);
}
