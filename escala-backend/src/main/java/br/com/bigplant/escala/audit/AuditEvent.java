package br.com.bigplant.escala.audit;

import org.springframework.context.ApplicationEvent;

public class AuditEvent extends ApplicationEvent {

    private final AuditLog auditLog;

    public AuditEvent(Object source, AuditLog auditLog) {
        super(source);
        this.auditLog = auditLog;
    }

    public AuditLog getAuditLog() {
        return auditLog;
    }
}
