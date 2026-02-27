package br.com.bigplant.escala.audit;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorIdOrderByTimestampDesc(String actorId);
    List<AuditLog> findByResourceIdOrderByTimestampDesc(String resourceId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
