CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    actor_id VARCHAR(255),
    actor_email VARCHAR(255),
    action_type VARCHAR(20) NOT NULL,
    resource_name VARCHAR(255),
    resource_id VARCHAR(255),
    old_value LONGTEXT,
    new_value LONGTEXT,
    ip_address VARCHAR(45)
);