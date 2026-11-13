import { useState } from 'react';
import { X, Database, Code, CheckCircle, Terminal, Copy, FileText, Download } from 'lucide-react';
import { downloadFullProjectZip } from '../services/projectExporter';

interface JavaArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JavaArchitectureModal({
  isOpen,
  onClose,
}: JavaArchitectureModalProps) {
  const [activeFile, setActiveFile] = useState<
    | 'DBConnectionUtil.java'
    | 'BookingDAO.java'
    | 'UserDAO.java'
    | 'QuotationDAO.java'
    | 'BookingServlet.java'
    | 'RuleBasedRecommendationEngine.java'
    | 'schema.sql'
    | 'pom.xml'
  >('BookingDAO.java');

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeFiles: Record<string, string> = {
    'BookingDAO.java': `package com.onestop.dao;

import com.onestop.model.Booking;
import com.onestop.model.BookingStatus;
import com.onestop.util.DBConnectionUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Booking entity.
 * Uses JDBC PreparedStatements and ACID Transactions.
 * Strictly Core Java + JDBC — Zero ORM / Hibernate overhead.
 */
public class BookingDAO {

    private static final String INSERT_BOOKING_SQL =
        "INSERT INTO bookings (booking_reference, customer_id, provider_id, service_id, " +
        "category_id, problem_description, service_address, city, scheduled_date, scheduled_time_slot, " +
        "status, is_emergency, estimated_total, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

    private static final String INSERT_HISTORY_SQL =
        "INSERT INTO booking_status_history (booking_id, from_status, to_status, change_reason, " +
        "changed_by_user_id, changed_at) VALUES (?, ?, ?, ?, ?, NOW())";

    /**
     * Creates a new booking and logs initial audit history within a single ACID transaction.
     */
    public boolean createBookingWithAudit(Booking booking, String auditReason, String userId) throws SQLException {
        Connection conn = null;
        PreparedStatement bookingStmt = null;
        PreparedStatement historyStmt = null;
        ResultSet generatedKeys = null;

        try {
            conn = DBConnectionUtil.getConnection();
            conn.setAutoCommit(false); // Begin ACID Transaction

            bookingStmt = conn.prepareStatement(INSERT_BOOKING_SQL, Statement.RETURN_GENERATED_KEYS);
            bookingStmt.setString(1, booking.getBookingReference());
            bookingStmt.setString(2, booking.getCustomerId());
            bookingStmt.setString(3, booking.getProviderId());
            bookingStmt.setString(4, booking.getServiceId());
            bookingStmt.setString(5, booking.getCategoryId());
            bookingStmt.setString(6, booking.getProblemDescription());
            bookingStmt.setString(7, booking.getServiceAddress());
            bookingStmt.setString(8, booking.getCity());
            bookingStmt.setDate(9, java.sql.Date.valueOf(booking.getScheduledDate()));
            bookingStmt.setString(10, booking.getScheduledTimeSlot());
            bookingStmt.setString(11, booking.getStatus().name());
            bookingStmt.setBoolean(12, booking.isEmergency());
            bookingStmt.setBigDecimal(13, booking.getEstimatedTotal());

            int affectedRows = bookingStmt.executeUpdate();
            if (affectedRows == 0) {
                conn.rollback();
                return false;
            }

            generatedKeys = bookingStmt.getGeneratedKeys();
            long newBookingId = 0;
            if (generatedKeys.next()) {
                newBookingId = generatedKeys.getLong(1);
            }

            // Insert into booking_status_history
            historyStmt = conn.prepareStatement(INSERT_HISTORY_SQL);
            historyStmt.setLong(1, newBookingId);
            historyStmt.setString(2, "INITIAL");
            historyStmt.setString(3, booking.getStatus().name());
            historyStmt.setString(4, auditReason);
            historyStmt.setString(5, userId);

            historyStmt.executeUpdate();

            conn.commit(); // Commit Transaction
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback(); // Rollback on any failure
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            throw e;
        } finally {
            DBConnectionUtil.closeQuietly(generatedKeys);
            DBConnectionUtil.closeQuietly(bookingStmt);
            DBConnectionUtil.closeQuietly(historyStmt);
            DBConnectionUtil.closeQuietly(conn);
        }
    }
}`,

    'DBConnectionUtil.java': `package com.onestop.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * JDBC Connection Manager using HikariCP for high-throughput connection pooling.
 * Protects database credentials through environment variables or secure configuration.
 */
public class DBConnectionUtil {

    private static HikariDataSource dataSource;

    static {
        try {
            HikariConfig config = new HikariConfig();
            String host = System.getenv().getOrDefault("MYSQL_HOST", "localhost");
            String port = System.getenv().getOrDefault("MYSQL_PORT", "3306");
            String db = System.getenv().getOrDefault("MYSQL_DB", "onestop_db");
            String user = System.getenv().getOrDefault("MYSQL_USER", "onestop_user");
            String pass = System.getenv().getOrDefault("MYSQL_PASSWORD", "secret");

            config.setJdbcUrl("jdbc:mysql://" + host + ":" + port + "/" + db + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
            config.setUsername(user);
            config.setPassword(pass);
            config.setMaximumPoolSize(15);
            config.setMinimumIdle(5);
            config.setConnectionTimeout(30000);
            config.setIdleTimeout(600000);
            config.setMaxLifetime(1800000);

            dataSource = new HikariDataSource(config);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to initialize JDBC Connection Pool", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    public static void closeQuietly(AutoCloseable resource) {
        if (resource != null) {
            try {
                resource.close();
            } catch (Exception ignored) {
            }
        }
    }
}`,

    'UserDAO.java': `package com.onestop.dao;

import com.onestop.model.User;
import com.onestop.model.UserRole;
import com.onestop.util.DBConnectionUtil;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.*;

public class UserDAO {

    public User authenticate(String email, String plaintextPassword) throws SQLException {
        String sql = "SELECT id, email, password_hash, role, full_name, phone, status, created_at " +
                     "FROM users WHERE email = ? AND status = 'ACTIVE'";

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password_hash");
                    if (BCrypt.checkpw(plaintextPassword, storedHash)) {
                        User user = new User();
                        user.setId(rs.getString("id"));
                        user.setEmail(rs.getString("email"));
                        user.setRole(UserRole.valueOf(rs.getString("role")));
                        user.setFullName(rs.getString("full_name"));
                        user.setPhone(rs.getString("phone"));
                        user.setStatus(rs.getString("status"));
                        return user;
                    }
                }
            }
        }
        return null;
    }
}`,

    'QuotationDAO.java': `package com.onestop.dao;

import com.onestop.util.DBConnectionUtil;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class QuotationDAO {

    /**
     * Atomically marks the target quotation as ACCEPTED, sets competing quotes to DECLINED,
     * and updates the booking status to CONFIRMED.
     */
    public boolean acceptQuotationAtomically(long quotationId, long bookingId) throws SQLException {
        Connection conn = null;
        try {
            conn = DBConnectionUtil.getConnection();
            conn.setAutoCommit(false);

            // 1. Accept target quote
            String acceptSql = "UPDATE quotations SET status = 'ACCEPTED' WHERE id = ?";
            try (PreparedStatement stmt1 = conn.prepareStatement(acceptSql)) {
                stmt1.setLong(1, quotationId);
                stmt1.executeUpdate();
            }

            // 2. Decline sibling quotes
            String declineSql = "UPDATE quotations SET status = 'DECLINED' WHERE booking_id = ? AND id != ?";
            try (PreparedStatement stmt2 = conn.prepareStatement(declineSql)) {
                stmt2.setLong(1, bookingId);
                stmt2.setLong(2, quotationId);
                stmt2.executeUpdate();
            }

            // 3. Confirm booking
            String updateBookingSql = "UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE id = ?";
            try (PreparedStatement stmt3 = conn.prepareStatement(updateBookingSql)) {
                stmt3.setLong(1, bookingId);
                stmt3.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) conn.rollback();
            throw e;
        } finally {
            DBConnectionUtil.closeQuietly(conn);
        }
    }
}`,

    'BookingServlet.java': `package com.onestop.servlet;

import com.google.gson.Gson;
import com.onestop.dao.BookingDAO;
import com.onestop.model.Booking;
import com.onestop.model.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/bookings/*")
public class BookingServlet extends HttpServlet {

    private final BookingDAO bookingDAO = new BookingDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("CURRENT_USER") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\\"success\\": false, \\"message\\": \\"Authentication session required.\\"}");
            return;
        }

        User user = (User) session.getAttribute("CURRENT_USER");
        Booking booking = gson.fromJson(req.getReader(), Booking.class);

        try {
            boolean created = bookingDAO.createBookingWithAudit(booking, "Customer created booking request", user.getId());
            Map<String, Object> result = new HashMap<>();
            result.put("success", created);
            result.put("message", created ? "Booking created successfully" : "Failed to record booking");
            out.write(gson.toJson(result));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\\"success\\": false, \\"error\\": \\"" + e.getMessage() + "\\"}");
        }
    }
}`,

    'RuleBasedRecommendationEngine.java': `package com.onestop.ai;

import com.onestop.model.ProviderProfile;
import java.util.ArrayList;
import java.util.List;

/**
 * Transparent explainable scoring engine written in Core Java.
 * Weights:
 * - Service Relevance (30%)
 * - Location (20%)
 * - Availability (20%)
 * - Price Compatibility (15%)
 * - Ratings & Review Confidence (10%)
 * - Experience Seniority (5%)
 */
public class RuleBasedRecommendationEngine {

    public static class ScoreBreakdown {
        public double totalScore;
        public double serviceScore;
        public double locationScore;
        public double availabilityScore;
        public double priceScore;
        public double ratingScore;
        public double experienceScore;
        public List<String> factors = new ArrayList<>();
    }

    public ScoreBreakdown evaluateProvider(ProviderProfile p, String targetCategory, String targetCity, double maxBudget, boolean isUrgent) {
        ScoreBreakdown sb = new ScoreBreakdown();

        // 1. Service Match (30 pts)
        if (p.getServiceCategories().contains(targetCategory)) {
            sb.serviceScore = 30.0;
            sb.factors.add("Direct specialty in " + targetCategory + " (+30 pts)");
        } else {
            sb.serviceScore = 5.0;
        }

        // 2. Location (20 pts)
        if (targetCity != null && p.getCity().equalsIgnoreCase(targetCity)) {
            sb.locationScore = 20.0;
            sb.factors.add("Locally established within " + targetCity + " (+20 pts)");
        } else {
            sb.locationScore = 5.0;
        }

        // 3. Availability (20 pts)
        if (isUrgent) {
            sb.availabilityScore = p.isEmergencyAvailable() ? 20.0 : 4.0;
            if (p.isEmergencyAvailable()) sb.factors.add("Emergency Response certified (+20 pts)");
        } else {
            sb.availabilityScore = 18.0;
        }

        // 4. Price (15 pts)
        if (maxBudget > 0) {
            if (p.getBaseHourlyRate() <= maxBudget) {
                sb.priceScore = 15.0;
                sb.factors.add("Hourly rate within budget threshold (+15 pts)");
            } else {
                sb.priceScore = Math.max(3.0, (maxBudget / p.getBaseHourlyRate()) * 12.0);
            }
        } else {
            sb.priceScore = 13.0;
        }

        // 5. Rating & Review volume dampener (10 pts)
        double ratingNorm = (p.getRatingAvg() / 5.0) * 7.0;
        double volumeBonus = Math.min(3.0, Math.log10(p.getReviewCount() + 1));
        sb.ratingScore = Math.min(10.0, ratingNorm + volumeBonus);
        sb.factors.add(p.getRatingAvg() + "★ from " + p.getReviewCount() + " reviews (+ " + Math.round(sb.ratingScore) + " pts)");

        // 6. Experience (5 pts)
        sb.experienceScore = Math.min(5.0, (p.getYearsExperience() / 15.0) * 5.0);

        sb.totalScore = Math.min(100.0, sb.serviceScore + sb.locationScore + sb.availabilityScore + sb.priceScore + sb.ratingScore + sb.experienceScore);
        return sb;
    }
}`,

    'schema.sql': `-- OneStop Comprehensive MySQL Database Schema
-- Database: onestop_db
-- Dialect: MySQL 8.0+ (InnoDB Engine)
-- Architecture: Core Java + JDBC (Zero Spring Boot / JPA)

CREATE DATABASE IF NOT EXISTS onestop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE onestop_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS admin_audit_logs, service_attachments, invoice_items, invoices, complaints,
                     verification_requests, notifications, favorites, reviews, quotations,
                     booking_status_history, bookings, provider_availability, service_areas,
                     provider_services, service_categories, provider_profiles, customer_profiles, users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER', 'PROVIDER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- 2. Customer Profiles
CREATE TABLE customer_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    address_line VARCHAR(255),
    city VARCHAR(64) NOT NULL DEFAULT 'Vijayawada',
    state VARCHAR(64) NOT NULL DEFAULT 'Andhra Pradesh',
    postal_code VARCHAR(16),
    preferred_language ENUM('en', 'te') DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Provider Profiles
CREATE TABLE provider_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    business_name VARCHAR(160) NOT NULL,
    bio TEXT,
    years_experience INT DEFAULT 1,
    rating_avg DECIMAL(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    completed_jobs_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    emergency_available BOOLEAN DEFAULT FALSE,
    base_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 400.00,
    profile_image_url VARCHAR(500),
    city VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prov_city (city),
    INDEX idx_prov_verified (is_verified),
    CONSTRAINT fk_prov_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Service Categories
CREATE TABLE service_categories (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name_en VARCHAR(100) NOT NULL,
    name_te VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) NOT NULL,
    base_estimate DECIMAL(10,2) NOT NULL DEFAULT 350.00,
    image_url VARCHAR(500)
) ENGINE=InnoDB;

-- 5. Provider Services
CREATE TABLE provider_services (
    id VARCHAR(64) PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    category_id VARCHAR(64) NOT NULL,
    service_title VARCHAR(150) NOT NULL,
    description TEXT,
    price_type ENUM('FIXED', 'HOURLY') DEFAULT 'HOURLY',
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_ps_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_category FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Service Areas
CREATE TABLE service_areas (
    id VARCHAR(64) PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    postal_code VARCHAR(16),
    radius_km INT DEFAULT 15,
    CONSTRAINT fk_sa_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Provider Availability
CREATE TABLE provider_availability (
    id VARCHAR(64) PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sun..6=Sat',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_pa_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Bookings
CREATE TABLE bookings (
    id VARCHAR(64) PRIMARY KEY,
    booking_reference VARCHAR(32) NOT NULL UNIQUE,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    service_id VARCHAR(64),
    category_id VARCHAR(64) NOT NULL,
    problem_description TEXT NOT NULL,
    service_address VARCHAR(255) NOT NULL,
    city VARCHAR(64) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time_slot VARCHAR(64) NOT NULL,
    status ENUM('PENDING', 'QUOTE_SENT', 'CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED') DEFAULT 'PENDING',
    is_emergency BOOLEAN DEFAULT FALSE,
    estimated_total DECIMAL(10,2) NOT NULL,
    final_total DECIMAL(10,2),
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_status (status),
    INDEX idx_customer_booking (customer_id),
    INDEX idx_provider_booking (provider_id),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
    CONSTRAINT fk_bookings_category FOREIGN KEY (category_id) REFERENCES service_categories(id)
) ENGINE=InnoDB;

-- 9. Booking Status History (Audit Trail)
CREATE TABLE booking_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL,
    from_status VARCHAR(32) NOT NULL,
    to_status VARCHAR(32) NOT NULL,
    change_reason VARCHAR(255),
    changed_by_user_id VARCHAR(64) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bsh_booking (booking_id),
    CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bsh_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 10. Quotations
CREATE TABLE quotations (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL,
    material_cost DECIMAL(10,2) DEFAULT 0.00,
    additional_charges DECIMAL(10,2) DEFAULT 0.00,
    total_quoted_amount DECIMAL(10,2) NOT NULL,
    estimated_duration_hours DECIMAL(4,1) NOT NULL,
    validity_until DATE NOT NULL,
    notes_exclusions TEXT,
    status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quote_booking (booking_id),
    CONSTRAINT fk_quote_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_quote_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id)
) ENGINE=InnoDB;

-- 11. Reviews (Unique per completed booking constraint)
CREATE TABLE reviews (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL UNIQUE,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    punctuality_rating INT DEFAULT 5,
    quality_rating INT DEFAULT 5,
    value_rating INT DEFAULT 5,
    provider_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_review_provider (provider_id),
    CONSTRAINT fk_rev_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_rev_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id)
) ENGINE=InnoDB;

-- 12. Favorites
CREATE TABLE favorites (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_favorite (customer_id, provider_id),
    CONSTRAINT fk_fav_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Notifications
CREATE TABLE notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    related_booking_id VARCHAR(64),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_user_read (user_id, is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Verification Requests
CREATE TABLE verification_requests (
    id VARCHAR(64) PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    document_type ENUM('TRADE_LICENSE', 'AADHAAR', 'GOVT_ID', 'CERTIFICATE') NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    document_file_url VARCHAR(500),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    reviewer_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    CONSTRAINT fk_verif_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Complaints
CREATE TABLE complaints (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL,
    filed_by_user_id VARCHAR(64) NOT NULL,
    against_user_id VARCHAR(64) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED') DEFAULT 'OPEN',
    admin_resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_comp_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_comp_filed_by FOREIGN KEY (filed_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_comp_against FOREIGN KEY (against_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 16. Invoices
CREATE TABLE invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    booking_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('UNPAID', 'PAID', 'REFUNDED') DEFAULT 'PAID',
    payment_method VARCHAR(50) DEFAULT 'UPI',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_inv_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id)
) ENGINE=InnoDB;

-- 17. Invoice Items
CREATE TABLE invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_ii_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. Service Attachments
CREATE TABLE service_attachments (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_by_user_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 19. Admin Audit Logs
CREATE TABLE admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    entity_name VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    change_summary TEXT NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users(id)
) ENGINE=InnoDB;`,

    'pom.xml': `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.onestop</groupId>
    <artifactId>onestop-platform</artifactId>
    <version>1.0.0</version>
    <packaging>war</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- Strict Core Java + JDBC Dependencies (Zero Spring Boot) -->
    <dependencies>
        <!-- Java Servlet API -->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
            <scope>provided</scope>
        </dependency>

        <!-- MySQL JDBC Connector -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>8.3.0</version>
        </dependency>

        <!-- HikariCP High Performance Connection Pooling -->
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
            <version>5.1.0</version>
        </dependency>

        <!-- BCrypt Password Hashing -->
        <dependency>
            <groupId>org.mindrot</groupId>
            <artifactId>jbcrypt</artifactId>
            <version>0.4</version>
        </dependency>

        <!-- Fast JSON Serialization -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>

        <!-- JUnit 5 Testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.1</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <finalName>onestop</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-war-plugin</artifactId>
                <version>3.4.0</version>
            </plugin>
        </plugins>
    </build>
</project>`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeFiles[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#102B25] text-stone-100 rounded-3xl max-w-5xl w-full h-[85vh] flex flex-col shadow-2xl border border-[#D6B779]/30 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 bg-[#0B1E19] border-b border-[#D6B779]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173D32] border border-[#D6B779]/40 flex items-center justify-center text-[#D6B779]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-brand text-white tracking-wide">
                Core Java + JDBC Architecture Explorer
              </h2>
              <p className="text-[11px] text-stone-400">
                Pure Java Servlets · PreparedStatement Transactions · Zero Spring Boot / ORM overhead
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono-code transition-colors"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D6B779]" />}
              <span>{copied ? 'Copied' : 'Copy Source'}</span>
            </button>
            <button
              onClick={() => downloadFullProjectZip()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D6B779] hover:bg-[#c4a465] text-[#102B25] text-xs font-bold font-mono-code transition-colors shadow-sm"
              title="Download full project source code as a ZIP file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project ZIP</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body: File Sidebar + Code View */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Sidebar */}
          <div className="w-64 bg-[#0B1E19]/60 border-r border-white/10 p-3 space-y-1 overflow-y-auto text-xs font-mono-code">
            <div className="text-[10px] uppercase font-bold text-stone-500 px-2 py-1 tracking-wider">
              Java DAOs & Servlets
            </div>
            {(
              [
                'BookingDAO.java',
                'DBConnectionUtil.java',
                'UserDAO.java',
                'QuotationDAO.java',
                'BookingServlet.java',
                'RuleBasedRecommendationEngine.java',
              ] as const
            ).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeFile === filename
                    ? 'bg-[#173D32] text-[#D6B779] font-bold border border-[#D6B779]/30'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-[#D6B779]" />
                <span className="truncate">{filename}</span>
              </button>
            ))}

            <div className="text-[10px] uppercase font-bold text-stone-500 px-2 pt-4 pb-1 tracking-wider">
              Database & Build
            </div>
            {(['schema.sql', 'pom.xml'] as const).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeFile === filename
                    ? 'bg-[#173D32] text-[#D6B779] font-bold border border-[#D6B779]/30'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#D6B779]" />
                <span className="truncate">{filename}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 p-4 bg-[#071310] overflow-y-auto font-mono-code text-xs text-stone-300 leading-relaxed">
            <pre className="whitespace-pre">
              <code>{codeFiles[activeFile]}</code>
            </pre>
          </div>
        </div>

        {/* Footer Audit Bar */}
        <div className="p-3 px-6 bg-[#0B1E19] border-t border-white/10 flex items-center justify-between text-xs text-stone-400 font-mono-code">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#D6B779]" />
            <span>Target Container: Apache Tomcat 9/10 · JDBC Driver: mysql-connector-j-8.3.0</span>
          </div>
          <span className="text-[#D6B779]">All PreparedStatements Bound with Parameterized Queries</span>
        </div>
      </div>
    </div>
  );
}
