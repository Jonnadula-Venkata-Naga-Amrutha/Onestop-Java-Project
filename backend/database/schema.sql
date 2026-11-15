-- ====================================================================
-- ONESTOP — Smart Local Services Platform
-- Database: onestop_db
-- Dialect: MySQL 8.0+ (InnoDB Engine)
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Architecture: Core Java + JDBC (Zero Spring Boot / JPA)
-- ====================================================================

-- 1. Database Creation & Environment Setting
CREATE DATABASE IF NOT EXISTS onestop_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE onestop_db;

-- ====================================================================
-- Table 1: users
-- Core authentication credentials, access roles, and account status
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER', 'PROVIDER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB COMMENT='Platform user identity and credentials';

-- ====================================================================
-- Table 2: customer_profiles
-- Regional address, municipal ward, and localization preferences
-- ====================================================================
CREATE TABLE IF NOT EXISTS customer_profiles (
    id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    address_line VARCHAR(255) NULL,
    city VARCHAR(64) NOT NULL DEFAULT 'Vijayawada',
    state VARCHAR(64) NOT NULL DEFAULT 'Andhra Pradesh',
    postal_code VARCHAR(16) NULL,
    preferred_language ENUM('en', 'te') NOT NULL DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cust_user (user_id),
    INDEX idx_cust_city (city),
    CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Extended customer residential and language profile';

-- ====================================================================
-- Table 3: provider_profiles
-- Trade business name, experience, rating, emergency dispatch readiness
-- ====================================================================
CREATE TABLE IF NOT EXISTS provider_profiles (
    id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    business_name VARCHAR(160) NOT NULL,
    bio TEXT NULL,
    years_experience INT NOT NULL DEFAULT 1,
    rating_avg DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    review_count INT NOT NULL DEFAULT 0,
    completed_jobs_count INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_available BOOLEAN NOT NULL DEFAULT FALSE,
    base_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 400.00,
    profile_image_url VARCHAR(500) NULL,
    city VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_prov_user (user_id),
    INDEX idx_prov_city (city),
    INDEX idx_prov_rating (rating_avg),
    INDEX idx_prov_verified (is_verified),
    INDEX idx_prov_emergency (emergency_available),
    CONSTRAINT fk_prov_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Service provider professional business and rating records';

-- ====================================================================
-- Table 4: service_categories
-- Standardized trade service categories with baseline pricing
-- ====================================================================
CREATE TABLE IF NOT EXISTS service_categories (
    id VARCHAR(64) NOT NULL,
    code VARCHAR(32) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_te VARCHAR(100) NOT NULL,
    description TEXT NULL,
    icon_name VARCHAR(50) NOT NULL,
    base_estimate DECIMAL(10,2) NOT NULL DEFAULT 350.00,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_category_code (code)
) ENGINE=InnoDB COMMENT='Taxonomy of 8 trade service categories';

-- ====================================================================
-- Table 5: provider_services
-- Specific skills, hourly or fixed offerings listed by providers
-- ====================================================================
CREATE TABLE IF NOT EXISTS provider_services (
    id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    category_id VARCHAR(64) NOT NULL,
    service_title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    price_type ENUM('FIXED', 'HOURLY') NOT NULL DEFAULT 'HOURLY',
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ps_provider (provider_id),
    INDEX idx_ps_category (category_id),
    CONSTRAINT fk_ps_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Provider catalog offerings and pricing models';

-- ====================================================================
-- Table 6: service_areas
-- Geographic coverage, municipal localities, and delivery radii
-- ====================================================================
CREATE TABLE IF NOT EXISTS service_areas (
    id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    postal_code VARCHAR(16) NULL,
    radius_km INT NOT NULL DEFAULT 15,
    PRIMARY KEY (id),
    INDEX idx_sa_city_locality (city, locality),
    CONSTRAINT fk_sa_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Locality and travel service boundary definitions';

-- ====================================================================
-- Table 7: provider_availability
-- Weekly schedule and working hours for calendar slot bookings
-- ====================================================================
CREATE TABLE IF NOT EXISTS provider_availability (
    id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sun, 1=Mon, ..., 6=Sat',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    INDEX idx_pa_provider_day (provider_id, day_of_week),
    CONSTRAINT fk_pa_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Weekly operating hours schedule per provider';

-- ====================================================================
-- Table 8: bookings
-- Complete transactional service booking lifecycle
-- ====================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) NOT NULL,
    booking_reference VARCHAR(32) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    service_id VARCHAR(64) NULL,
    service_title VARCHAR(150) NOT NULL DEFAULT 'General Service',
    category_id VARCHAR(64) NOT NULL,
    problem_description TEXT NOT NULL,
    service_address VARCHAR(255) NOT NULL,
    city VARCHAR(64) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time_slot VARCHAR(64) NOT NULL,
    status ENUM(
        'PENDING',
        'QUOTE_SENT',
        'CONFIRMED',
        'PROVIDER_ON_THE_WAY',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',
    is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_total DECIMAL(10,2) NOT NULL,
    final_total DECIMAL(10,2) NULL,
    photo_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_bookings_reference (booking_reference),
    INDEX idx_bookings_customer (customer_id),
    INDEX idx_bookings_provider (provider_id),
    INDEX idx_bookings_status (status),
    INDEX idx_bookings_date (scheduled_date),
    INDEX idx_bookings_emergency (is_emergency),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Service booking lifecycle records and state tracking';

-- ====================================================================
-- Table 9: booking_status_history
-- Immutable audit log of every booking transition
-- ====================================================================
CREATE TABLE IF NOT EXISTS booking_status_history (
    id BIGINT AUTO_INCREMENT NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    from_status VARCHAR(32) NOT NULL,
    to_status VARCHAR(32) NOT NULL,
    change_reason VARCHAR(255) NULL,
    changed_by_user_id VARCHAR(64) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bsh_booking (booking_id),
    INDEX idx_bsh_user (changed_by_user_id),
    CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bsh_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Immutable audit trail of booking state machine transitions';

-- ====================================================================
-- Table 10: quotations
-- Itemized estimates submitted by providers for customer comparison
-- ====================================================================
CREATE TABLE IF NOT EXISTS quotations (
    id VARCHAR(64) NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL,
    material_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    additional_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_quoted_amount DECIMAL(10,2) NOT NULL,
    estimated_duration_hours DECIMAL(4,1) NOT NULL DEFAULT 2.0,
    validity_until DATE NOT NULL,
    notes_exclusions TEXT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_quote_booking (booking_id),
    INDEX idx_quote_provider (provider_id),
    INDEX idx_quote_status (status),
    CONSTRAINT fk_quote_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_quote_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Itemized quotations and bidding records';

-- ====================================================================
-- Table 11: reviews
-- Customer feedback restricted to completed bookings (1 per booking)
-- ====================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    punctuality_rating INT NOT NULL DEFAULT 5 CHECK (punctuality_rating BETWEEN 1 AND 5),
    quality_rating INT NOT NULL DEFAULT 5 CHECK (quality_rating BETWEEN 1 AND 5),
    value_rating INT NOT NULL DEFAULT 5 CHECK (value_rating BETWEEN 1 AND 5),
    provider_response TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_review_booking (booking_id),
    INDEX idx_review_provider (provider_id),
    INDEX idx_review_customer (customer_id),
    INDEX idx_review_rating (rating),
    CONSTRAINT fk_rev_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Verified customer ratings and sentiment records';

-- ====================================================================
-- Table 12: favorites
-- Customer bookmarks for preferred technicians
-- ====================================================================
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_favorite (customer_id, provider_id),
    CONSTRAINT fk_fav_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Customer bookmarked favorites';

-- ====================================================================
-- Table 13: notifications
-- In-app alert queue with unread status tracking
-- ====================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL COMMENT 'BOOKING, QUOTATION, STATUS_CHANGE, VERIFICATION, SYSTEM',
    related_booking_id VARCHAR(64) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notif_user_read (user_id, is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='In-app notification message queue';

-- ====================================================================
-- Table 14: verification_requests
-- Government trade licenses & identity review documents
-- ====================================================================
CREATE TABLE IF NOT EXISTS verification_requests (
    id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    document_type ENUM('TRADE_LICENSE', 'AADHAAR', 'GOVT_ID', 'CERTIFICATE') NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    document_file_url VARCHAR(500) NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewer_notes TEXT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    INDEX idx_verif_provider (provider_id),
    INDEX idx_verif_status (status),
    CONSTRAINT fk_verif_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Trade license and compliance verification queue';

-- ====================================================================
-- Table 15: complaints
-- Dispute management and administrative resolution records
-- ====================================================================
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(64) NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    filed_by_user_id VARCHAR(64) NOT NULL,
    against_user_id VARCHAR(64) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    admin_resolution_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    INDEX idx_comp_booking (booking_id),
    INDEX idx_comp_status (status),
    CONSTRAINT fk_comp_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    CONSTRAINT fk_comp_filed_by FOREIGN KEY (filed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_comp_against FOREIGN KEY (against_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Customer dispute arbitration and mediation tickets';

-- ====================================================================
-- Table 16: invoices
-- Final itemized financial billing statements
-- ====================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) NOT NULL,
    invoice_number VARCHAR(64) NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'NOT_RECORDED',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_invoice_number (invoice_number),
    INDEX idx_invoice_booking (booking_id),
    INDEX idx_invoice_customer (customer_id),
    INDEX idx_invoice_provider (provider_id),
    CONSTRAINT fk_inv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Financial invoice header records';

-- ====================================================================
-- Table 17: invoice_items
-- Itemized line breakdown of labor and materials
-- ====================================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(64) NOT NULL,
    invoice_id VARCHAR(64) NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_ii_invoice (invoice_id),
    CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Itemized billing line items';

-- ====================================================================
-- Table 18: service_attachments
-- Problem photographs, blueprints, and proof documents
-- ====================================================================
CREATE TABLE IF NOT EXISTS service_attachments (
    id VARCHAR(64) NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    file_data LONGBLOB NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_by_user_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_att_booking (booking_id),
    CONSTRAINT fk_att_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Supporting damage and diagnostic photographs';

-- ====================================================================
-- Table 19: admin_audit_logs
-- Immutable platform administrative action trail
-- ====================================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT AUTO_INCREMENT NOT NULL,
    admin_user_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    entity_name VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    change_summary TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_admin (admin_user_id),
    INDEX idx_audit_entity (entity_name, entity_id),
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Administrative governance and moderation audit logs';
