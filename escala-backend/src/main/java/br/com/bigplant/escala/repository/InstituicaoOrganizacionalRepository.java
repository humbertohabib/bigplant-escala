package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.InstituicaoOrganizacional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstituicaoOrganizacionalRepository extends JpaRepository<InstituicaoOrganizacional, Long> {

    List<InstituicaoOrganizacional> findByAtivoTrue();
}
