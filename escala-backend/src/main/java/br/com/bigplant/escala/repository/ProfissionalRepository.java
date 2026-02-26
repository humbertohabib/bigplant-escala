package br.com.bigplant.escala.repository;

import br.com.bigplant.escala.model.Profissional;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfissionalRepository extends JpaRepository<Profissional, Long> {

    List<Profissional> findByIdHospitalAndAtivoTrue(Long idHospital);

    Optional<Profissional> findByEmail(String email);

    Optional<Profissional> findByEmailAndAtivoTrue(String email);
}
