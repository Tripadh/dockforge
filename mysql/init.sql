CREATE TABLE executions (
    id BINARY(16) NOT NULL,

    code LONGTEXT NOT NULL,
    language VARCHAR(50) NOT NULL,

    status ENUM('pending','running','completed','failed')
        NOT NULL DEFAULT 'pending',

    stdout LONGTEXT,
    stderr LONGTEXT,
    execution_ms INT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL DEFAULT NULL,
    finished_at TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id),

    INDEX idx_status_created (status, created_at),
    INDEX idx_finished_at (finished_at)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;