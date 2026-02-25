package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.LocalAtendimento;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocalAtendimentoRepository extends JpaRepository<LocalAtendimento, Long> {

    List<LocalAtendimento> findByIdHospitalAndAtivoTrue(Long idHospital);
}

