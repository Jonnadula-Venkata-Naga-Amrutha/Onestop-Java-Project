USE onestop_db;

SET @add_content_type = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE service_attachments ADD COLUMN content_type VARCHAR(100) NOT NULL DEFAULT ''application/octet-stream'' AFTER file_url',
        'SELECT 1')
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'service_attachments'
      AND column_name = 'content_type'
);
PREPARE stmt FROM @add_content_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_file_data = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE service_attachments ADD COLUMN file_data LONGBLOB NULL AFTER content_type',
        'SELECT 1')
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'service_attachments'
      AND column_name = 'file_data'
);
PREPARE stmt FROM @add_file_data;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
