package br.com.bigplant.escala.service;

import br.com.bigplant.escala.audit.AuditEvent;
import br.com.bigplant.escala.audit.AuditLog;
import br.com.bigplant.escala.audit.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuditService {

    private final ApplicationEventPublisher eventPublisher;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(ApplicationEventPublisher eventPublisher, AuditLogRepository auditLogRepository) {
        this.eventPublisher = eventPublisher;
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public void log(String actorId, String actorEmail, AuditLog.ActionType actionType, 
                    String resourceName, String resourceId, Object oldValue, Object newValue, String ipAddress) {
        
        AuditLog log = new AuditLog();
        log.setTimestamp(LocalDateTime.now());
        log.setActorId(actorId);
        log.setActorEmail(actorEmail);
        log.setActionType(actionType);
        log.setResourceName(resourceName);
        log.setResourceId(resourceId);
        log.setIpAddress(ipAddress);

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String latHeader = request.getHeader("X-Location-Lat");
                String longHeader = request.getHeader("X-Location-Long");
                
                if (latHeader != null && !latHeader.isBlank()) {
                    log.setLatitude(Double.valueOf(latHeader));
                }
                if (longHeader != null && !longHeader.isBlank()) {
                    log.setLongitude(Double.valueOf(longHeader));
                }
            }
        } catch (Exception e) {
            // Ignora erros ao obter localização para não falhar a auditoria
        }

        try {
            if (oldValue != null) {
                log.setOldValue(objectMapper.writeValueAsString(oldValue));
            }
            if (newValue != null) {
                log.setNewValue(objectMapper.writeValueAsString(newValue));
            }
        } catch (JsonProcessingException e) {
            log.setOldValue("Error serializing old value");
            log.setNewValue("Error serializing new value");
        }

        // Publica evento para processamento assíncrono
        eventPublisher.publishEvent(new AuditEvent(this, log));
    }

    public List<AuditLog> findAll() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> findByActor(String actorId) {
        return auditLogRepository.findByActorIdOrderByTimestampDesc(actorId);
    }
}
