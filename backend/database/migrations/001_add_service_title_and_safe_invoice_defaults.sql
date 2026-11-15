USE onestop_db;

SET @add_service_title = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE bookings ADD COLUMN service_title VARCHAR(150) NOT NULL DEFAULT ''General Service'' AFTER service_id',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'bookings'
      AND column_name = 'service_title'
);
PREPARE migration_statement FROM @add_service_title;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

ALTER TABLE invoices
    MODIFY payment_status ENUM('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    MODIFY payment_method VARCHAR(50) NOT NULL DEFAULT 'NOT_RECORDED';
