package br.com.bigplant.escala.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuditEventListener {

    private static final Logger logger = LoggerFactory.getLogger(AuditEventListener.class);
    private final AuditLogRepository auditLogRepository;

    public AuditEventListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleAuditEvent(AuditEvent event) {
        try {
            AuditLog log = event.getAuditLog();
            logger.info("Processando evento de auditoria assíncrono: {} - {} por {}", 
                    log.getActionType(), log.getResourceName(), log.getActorEmail());
            auditLogRepository.save(log);
        } catch (Exception e) {
            logger.error("Erro ao salvar log de auditoria", e);
        }
    }
}
