package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.RegraConfiguracao;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegraConfiguracaoRepository extends JpaRepository<RegraConfiguracao, Long> {

    List<RegraConfiguracao> findByIdHospitalAndAtivoTrue(Long idHospital);
}
