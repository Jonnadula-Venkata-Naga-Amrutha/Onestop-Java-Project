package com.skillbridge.dao;

import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import com.skillbridge.util.DBConnectionUtil;
import com.skillbridge.util.PasswordHash;

import java.sql.*;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public class UserDAO {

    public User authenticate(String email, String plaintextPassword) throws SQLException {
        String sql = "SELECT id, email, password_hash, role, full_name, phone, status, created_at " +
                     "FROM users WHERE email = ? AND status = 'ACTIVE'";

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim().toLowerCase(Locale.ROOT));
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password_hash");
                    if (PasswordHash.matches(plaintextPassword, storedHash)) {
                        return readUser(rs);
                    }
                }
            }
        }
        return null;
    }

    public User register(String email, String plaintextPassword, UserRole role, String fullName,
                         String phone, String businessName, String city, List<String> categories)
            throws SQLException {
        String userId = UUID.randomUUID().toString();
        String profileId = UUID.randomUUID().toString();
        String passwordHash = PasswordHash.hash(plaintextPassword);

        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String insertUser = "INSERT INTO users (id, email, password_hash, role, full_name, phone, status) "
                        + "VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')";
                try (PreparedStatement statement = connection.prepareStatement(insertUser)) {
                    statement.setString(1, userId);
                    statement.setString(2, email.trim().toLowerCase(Locale.ROOT));
                    statement.setString(3, passwordHash);
                    statement.setString(4, role.name());
                    statement.setString(5, fullName.trim());
                    statement.setString(6, phone.trim());
                    statement.executeUpdate();
                }

                if (role == UserRole.CUSTOMER) {
                    String insertProfile = "INSERT INTO customer_profiles (id, user_id, city) VALUES (?, ?, ?)";
                    try (PreparedStatement statement = connection.prepareStatement(insertProfile)) {
                        statement.setString(1, profileId);
                        statement.setString(2, userId);
                        statement.setString(3, city);
                        statement.executeUpdate();
                    }
                } else {
                    String insertProfile = "INSERT INTO provider_profiles "
                            + "(id, user_id, business_name, years_experience, city) VALUES (?, ?, ?, 1, ?)";
                    try (PreparedStatement statement = connection.prepareStatement(insertProfile)) {
                        statement.setString(1, profileId);
                        statement.setString(2, userId);
                        statement.setString(3, businessName);
                        statement.setString(4, city);
                        statement.executeUpdate();
                    }

                    String insertService = "INSERT INTO provider_services "
                            + "(id, provider_id, category_id, service_title, price_type, price, is_active) "
                            + "SELECT ?, ?, id, name_en, 'HOURLY', 400.00, TRUE "
                            + "FROM service_categories WHERE code = ?";
                    try (PreparedStatement statement = connection.prepareStatement(insertService)) {
                        for (String category : categories) {
                            statement.setString(1, UUID.randomUUID().toString());
                            statement.setString(2, profileId);
                            statement.setString(3, category);
                            if (statement.executeUpdate() == 0) {
                                throw new SQLException("Unknown service category: " + category, "22023");
                            }
                        }
                    }
                }

                connection.commit();
            } catch (SQLException | RuntimeException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        }
        return findByEmail(email);
    }

    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT id, email, password_hash, role, full_name, phone, status, created_at "
                + "FROM users WHERE email = ?";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, email.trim().toLowerCase(Locale.ROOT));
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? readUser(rs) : null;
            }
        }
    }

    public boolean isActive(String userId) throws SQLException {
        String sql = "SELECT status = 'ACTIVE' AS is_active FROM users WHERE id = ?";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() && rs.getBoolean("is_active");
            }
        }
    }

    private User readUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getString("id"));
        user.setEmail(rs.getString("email"));
        user.setRole(UserRole.valueOf(rs.getString("role")));
        user.setFullName(rs.getString("full_name"));
        user.setPhone(rs.getString("phone"));
        user.setStatus(rs.getString("status"));
        Timestamp createdAt = rs.getTimestamp("created_at");
        user.setCreatedAt(createdAt == null ? null : createdAt.toLocalDateTime());
        return user;
    }
}
