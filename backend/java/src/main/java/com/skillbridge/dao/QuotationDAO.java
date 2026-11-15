package com.skillbridge.dao;

import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import com.skillbridge.util.DBConnectionUtil;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class QuotationDAO {
    public List<Map<String, Object>> list(User user, String bookingId) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT q.id, q.booking_id, q.provider_id, pu.full_name AS provider_name, "
                        + "p.rating_avg, p.years_experience, q.labor_cost, q.material_cost, "
                        + "q.additional_charges, q.total_quoted_amount, q.estimated_duration_hours, "
                        + "q.validity_until, q.notes_exclusions, q.status, q.created_at "
                        + "FROM quotations q JOIN provider_profiles p ON p.id = q.provider_id "
                        + "JOIN users pu ON pu.id = p.user_id JOIN bookings b ON b.id = q.booking_id "
                        + "WHERE 1 = 1 ");
        List<String> parameters = new ArrayList<>();
        if (user.getRole() == UserRole.CUSTOMER) {
            sql.append("AND b.customer_id = ? ");
            parameters.add(user.getId());
        } else if (user.getRole() == UserRole.PROVIDER) {
            sql.append("AND q.provider_id = (SELECT id FROM provider_profiles WHERE user_id = ?) ");
            parameters.add(user.getId());
        }
        if (bookingId != null && !bookingId.isBlank()) {
            sql.append("AND q.booking_id = ? ");
            parameters.add(bookingId);
        }
        sql.append("ORDER BY q.created_at DESC");

        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < parameters.size(); i++) {
                statement.setString(i + 1, parameters.get(i));
            }
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> quote = new LinkedHashMap<>();
                    quote.put("id", rs.getString("id"));
                    quote.put("bookingId", rs.getString("booking_id"));
                    quote.put("providerId", rs.getString("provider_id"));
                    quote.put("providerName", rs.getString("provider_name"));
                    quote.put("providerRating", rs.getBigDecimal("rating_avg"));
                    quote.put("providerExperience", rs.getInt("years_experience"));
                    quote.put("laborCost", rs.getBigDecimal("labor_cost"));
                    quote.put("materialCost", rs.getBigDecimal("material_cost"));
                    quote.put("additionalCharges", rs.getBigDecimal("additional_charges"));
                    quote.put("totalQuotedAmount", rs.getBigDecimal("total_quoted_amount"));
                    quote.put("estimatedDurationHours", rs.getBigDecimal("estimated_duration_hours"));
                    quote.put("validityUntil", rs.getDate("validity_until").toLocalDate().toString());
                    quote.put("notesExclusions", rs.getString("notes_exclusions"));
                    quote.put("status", rs.getString("status"));
                    quote.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
                    result.add(quote);
                }
            }
        }
        return result;
    }

    public String create(String bookingId, String providerId, String providerUserId, BigDecimal labor,
                         BigDecimal materials, BigDecimal additional, BigDecimal duration, Date validity,
                         String notes) throws SQLException {
        String id = UUID.randomUUID().toString();
        BigDecimal total = labor.add(materials).add(additional);
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String bookingSql = "SELECT customer_id, provider_id, status FROM bookings WHERE id = ? FOR UPDATE";
                String customerId;
                String bookingStatus;
                String assignedProviderId;
                try (PreparedStatement statement = connection.prepareStatement(bookingSql)) {
                    statement.setString(1, bookingId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Booking not found.", "02000");
                        }
                        customerId = rs.getString("customer_id");
                        assignedProviderId = rs.getString("provider_id");
                        bookingStatus = rs.getString("status");
                    }
                }
                if (!providerId.equals(assignedProviderId)) {
                    throw new SQLException("You can only submit a quotation for a booking assigned to your provider profile.", "45000");
                }
                if (!List.of("PENDING", "QUOTE_SENT").contains(bookingStatus)) {
                    throw new SQLException("This booking is no longer accepting quotations.", "45000");
                }
                String exists = "SELECT id FROM quotations WHERE booking_id = ? AND provider_id = ? "
                        + "AND status IN ('PENDING', 'ACCEPTED') LIMIT 1";
                try (PreparedStatement statement = connection.prepareStatement(exists)) {
                    statement.setString(1, bookingId);
                    statement.setString(2, providerId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            throw new SQLException("You have already submitted a quotation for this booking.", "23000");
                        }
                    }
                }
                String insert = "INSERT INTO quotations "
                        + "(id, booking_id, provider_id, labor_cost, material_cost, additional_charges, "
                        + "total_quoted_amount, estimated_duration_hours, validity_until, notes_exclusions, status) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')";
                try (PreparedStatement statement = connection.prepareStatement(insert)) {
                    statement.setString(1, id);
                    statement.setString(2, bookingId);
                    statement.setString(3, providerId);
                    statement.setBigDecimal(4, labor);
                    statement.setBigDecimal(5, materials);
                    statement.setBigDecimal(6, additional);
                    statement.setBigDecimal(7, total);
                    statement.setBigDecimal(8, duration);
                    statement.setDate(9, validity);
                    statement.setString(10, notes);
                    statement.executeUpdate();
                }
                if ("PENDING".equals(bookingStatus)) {
                    try (PreparedStatement statement = connection.prepareStatement(
                            "UPDATE bookings SET status = 'QUOTE_SENT', updated_at = NOW() WHERE id = ?")) {
                        statement.setString(1, bookingId);
                        statement.executeUpdate();
                    }
                    insertHistory(connection, bookingId, "PENDING", "QUOTE_SENT",
                            "A provider submitted a quotation.", providerUserId);
                }
                insertNotification(connection, customerId, "QUOTATION", "New quotation received",
                        "A provider submitted a quotation for your booking.", bookingId);
                connection.commit();
            } catch (SQLException | RuntimeException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        }
        return id;
    }

    public void acceptAtomically(String quotationId, User customer) throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String select = "SELECT q.booking_id, q.provider_id, q.total_quoted_amount, q.status, "
                        + "b.customer_id, b.status AS booking_status, b.booking_reference "
                        + "FROM quotations q JOIN bookings b ON b.id = q.booking_id "
                        + "WHERE q.id = ? FOR UPDATE";
                String bookingId;
                String providerId;
                String bookingCustomer;
                String bookingReference;
                String quoteStatus;
                String bookingStatus;
                BigDecimal total;
                try (PreparedStatement statement = connection.prepareStatement(select)) {
                    statement.setString(1, quotationId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Quotation not found.", "02000");
                        }
                        bookingId = rs.getString("booking_id");
                        providerId = rs.getString("provider_id");
                        total = rs.getBigDecimal("total_quoted_amount");
                        quoteStatus = rs.getString("status");
                        bookingCustomer = rs.getString("customer_id");
                        bookingStatus = rs.getString("booking_status");
                        bookingReference = rs.getString("booking_reference");
                    }
                }
                if (!customer.getId().equals(bookingCustomer)) {
                    throw new SQLException("You cannot accept a quotation for another customer's booking.", "45000");
                }
                if (!"PENDING".equals(quoteStatus)
                        || !List.of("PENDING", "QUOTE_SENT").contains(bookingStatus)) {
                    throw new SQLException("This quotation is no longer available.", "45000");
                }
                String validityQuery = "SELECT validity_until >= CURRENT_DATE AS is_valid FROM quotations WHERE id = ?";
                try (PreparedStatement statement = connection.prepareStatement(validityQuery)) {
                    statement.setString(1, quotationId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next() || !rs.getBoolean("is_valid")) {
                            throw new SQLException("This quotation has expired.", "45000");
                        }
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE quotations SET status = CASE WHEN id = ? THEN 'ACCEPTED' "
                                + "ELSE 'DECLINED' END WHERE booking_id = ?")) {
                    statement.setString(1, quotationId);
                    statement.setString(2, bookingId);
                    statement.executeUpdate();
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE bookings SET provider_id = ?, status = 'CONFIRMED', estimated_total = ?, "
                                + "updated_at = NOW() WHERE id = ?")) {
                    statement.setString(1, providerId);
                    statement.setBigDecimal(2, total);
                    statement.setString(3, bookingId);
                    statement.executeUpdate();
                }
                insertHistory(connection, bookingId, bookingStatus, "CONFIRMED",
                        "Customer accepted quotation " + quotationId + ".", customer.getId());
                String providerUser = "SELECT user_id FROM provider_profiles WHERE id = ?";
                try (PreparedStatement statement = connection.prepareStatement(providerUser)) {
                    statement.setString(1, providerId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            insertNotification(connection, rs.getString("user_id"), "BOOKING",
                                    "Quotation accepted",
                                    "Your quotation for booking " + bookingReference + " was accepted.", bookingId);
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
    }

    public void declineAtomically(String quotationId, User customer) throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String select = "SELECT q.booking_id, q.provider_id, q.status, b.customer_id, b.status AS booking_status "
                        + "FROM quotations q JOIN bookings b ON b.id = q.booking_id "
                        + "WHERE q.id = ? FOR UPDATE";
                String bookingId;
                String providerId;
                String bookingCustomer;
                String quoteStatus;
                String bookingStatus;
                try (PreparedStatement statement = connection.prepareStatement(select)) {
                    statement.setString(1, quotationId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Quotation not found.", "02000");
                        }
                        bookingId = rs.getString("booking_id");
                        providerId = rs.getString("provider_id");
                        bookingCustomer = rs.getString("customer_id");
                        quoteStatus = rs.getString("status");
                        bookingStatus = rs.getString("booking_status");
                    }
                }
                if (!customer.getId().equals(bookingCustomer)) {
                    throw new SQLException("You cannot decline a quotation for another customer's booking.", "45000");
                }
                if (!"PENDING".equals(quoteStatus) || !"QUOTE_SENT".equals(bookingStatus)) {
                    throw new SQLException("This quotation is no longer available.", "45000");
                }

                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE quotations SET status = 'DECLINED' WHERE id = ? AND status = 'PENDING'")) {
                    statement.setString(1, quotationId);
                    if (statement.executeUpdate() != 1) {
                        throw new SQLException("This quotation is no longer available.", "45000");
                    }
                }
                boolean pendingQuotesRemain;
                try (PreparedStatement statement = connection.prepareStatement(
                        "SELECT 1 FROM quotations WHERE booking_id = ? AND status = 'PENDING' LIMIT 1")) {
                    statement.setString(1, bookingId);
                    try (ResultSet rs = statement.executeQuery()) {
                        pendingQuotesRemain = rs.next();
                    }
                }
                if (!pendingQuotesRemain) {
                    try (PreparedStatement statement = connection.prepareStatement(
                            "UPDATE bookings SET status = 'PENDING', updated_at = NOW() "
                                    + "WHERE id = ? AND status = 'QUOTE_SENT'")) {
                        statement.setString(1, bookingId);
                        statement.executeUpdate();
                    }
                    insertHistory(connection, bookingId, "QUOTE_SENT", "PENDING",
                            "Customer declined all submitted quotations.", customer.getId());
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO notifications (id, user_id, title, message, type, related_booking_id) "
                                + "SELECT ?, user_id, 'Quotation declined', "
                                + "'The customer declined your quotation.', 'QUOTATION', ? "
                                + "FROM provider_profiles WHERE id = ?")) {
                    statement.setString(1, UUID.randomUUID().toString());
                    statement.setString(2, bookingId);
                    statement.setString(3, providerId);
                    statement.executeUpdate();
                }
                connection.commit();
            } catch (SQLException | RuntimeException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    private void insertHistory(Connection connection, String bookingId, String fromStatus, String toStatus,
                               String reason, String actorId) throws SQLException {
        String sql = "INSERT INTO booking_status_history "
                + "(booking_id, from_status, to_status, change_reason, changed_by_user_id) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, bookingId);
            statement.setString(2, fromStatus);
            statement.setString(3, toStatus);
            statement.setString(4, reason);
            statement.setString(5, actorId);
            statement.executeUpdate();
        }
    }

    private void insertNotification(Connection connection, String userId, String type, String title,
                                    String message, String bookingId) throws SQLException {
        String sql = "INSERT INTO notifications "
                + "(id, user_id, title, message, type, related_booking_id) VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, UUID.randomUUID().toString());
            statement.setString(2, userId);
            statement.setString(3, title);
            statement.setString(4, message);
            statement.setString(5, type);
            statement.setString(6, bookingId);
            statement.executeUpdate();
        }
    }
}
