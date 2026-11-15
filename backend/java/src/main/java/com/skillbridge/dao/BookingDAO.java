package com.skillbridge.dao;

import com.skillbridge.model.Booking;
import com.skillbridge.model.BookingStatus;
import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import com.skillbridge.util.DBConnectionUtil;
import com.skillbridge.util.BookingPolicy;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class BookingDAO {
    public void createBookingWithAudit(Booking booking, String auditReason, User customer,
                                       byte[] photoData, String photoContentType) throws SQLException {
        String insertBooking = "INSERT INTO bookings "
                + "(id, booking_reference, customer_id, provider_id, service_id, service_title, category_id, "
                + "problem_description, service_address, city, scheduled_date, scheduled_time_slot, "
                + "status, is_emergency, estimated_total) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)";
        String insertHistory = "INSERT INTO booking_status_history "
                + "(booking_id, from_status, to_status, change_reason, changed_by_user_id) "
                + "VALUES (?, 'INITIAL', 'PENDING', ?, ?)";

        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(insertBooking)) {
                    statement.setString(1, booking.getId());
                    statement.setString(2, booking.getBookingReference());
                    statement.setString(3, customer.getId());
                    statement.setString(4, booking.getProviderId());
                    statement.setString(5, booking.getServiceId());
                    statement.setString(6, booking.getServiceTitle());
                    statement.setString(7, booking.getCategoryId());
                    statement.setString(8, booking.getProblemDescription());
                    statement.setString(9, booking.getServiceAddress());
                    statement.setString(10, booking.getCity());
                    statement.setDate(11, java.sql.Date.valueOf(booking.getScheduledDate()));
                    statement.setString(12, booking.getScheduledTimeSlot());
                    statement.setBoolean(13, booking.isEmergency());
                    statement.setBigDecimal(14, booking.getEstimatedTotal());
                    statement.executeUpdate();
                }
                try (PreparedStatement statement = connection.prepareStatement(insertHistory)) {
                    statement.setString(1, booking.getId());
                    statement.setString(2, auditReason);
                    statement.setString(3, customer.getId());
                    statement.executeUpdate();
                }
                if (photoData != null) {
                    insertAttachment(connection, booking, customer, photoData, photoContentType);
                }
                notifyProvider(connection, booking);
                connection.commit();
            } catch (SQLException | RuntimeException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    private void insertAttachment(Connection connection, Booking booking, User customer,
                                  byte[] photoData, String contentType) throws SQLException {
        String id = UUID.randomUUID().toString();
        String fileName = "booking-photo." + ("image/png".equals(contentType) ? "png"
                : "image/webp".equals(contentType) ? "webp" : "jpg");
        String sql = "INSERT INTO service_attachments "
                + "(id, booking_id, file_name, file_url, content_type, file_data, file_size_bytes, uploaded_by_user_id) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, id);
            statement.setString(2, booking.getId());
            statement.setString(3, fileName);
            statement.setString(4, "/api/bookings/" + booking.getId() + "/attachments/" + id);
            statement.setString(5, contentType);
            statement.setBytes(6, photoData);
            statement.setLong(7, photoData.length);
            statement.setString(8, customer.getId());
            statement.executeUpdate();
        }
    }

    public void updateStatus(String bookingId, BookingStatus nextStatus, String reason, User actor,
                             String actorProviderId) throws SQLException {
        String select = "SELECT customer_id, provider_id, status, estimated_total, final_total, "
                + "booking_reference FROM bookings WHERE id = ? FOR UPDATE";
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String customerId;
                String providerId;
                BookingStatus current;
                java.math.BigDecimal estimated;
                java.math.BigDecimal finalTotal;
                String reference;
                try (PreparedStatement statement = connection.prepareStatement(select)) {
                    statement.setString(1, bookingId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Booking not found.", "02000");
                        }
                        customerId = rs.getString("customer_id");
                        providerId = rs.getString("provider_id");
                        current = BookingStatus.valueOf(rs.getString("status"));
                        estimated = rs.getBigDecimal("estimated_total");
                        finalTotal = rs.getBigDecimal("final_total");
                        reference = rs.getString("booking_reference");
                    }
                }

                if (!BookingPolicy.canTransition(current, nextStatus, actor.getRole(), actor.getId(),
                        customerId, providerId, actorProviderId)) {
                    throw new SQLException("This booking status transition is not allowed.", "45000");
                }

                java.math.BigDecimal total = finalTotal;
                if (nextStatus == BookingStatus.COMPLETED && total == null) {
                    total = estimated;
                }
                String update = "UPDATE bookings SET status = ?, final_total = ?, updated_at = NOW() WHERE id = ?";
                try (PreparedStatement statement = connection.prepareStatement(update)) {
                    statement.setString(1, nextStatus.name());
                    statement.setBigDecimal(2, total);
                    statement.setString(3, bookingId);
                    statement.executeUpdate();
                }
                insertHistory(connection, bookingId, current.name(), nextStatus.name(), reason, actor.getId());
                if (actor.getRole() == UserRole.CUSTOMER) {
                    notifyProviderOfStatusChange(connection, providerId, nextStatus, reference, bookingId);
                } else {
                    insertNotification(connection, customerId, "STATUS_CHANGE",
                            "Booking Update: " + nextStatus.name().replace('_', ' '),
                            "Booking " + reference + " status changed to " + nextStatus.name().replace('_', ' ') + ".",
                            bookingId);
                }
                if (nextStatus == BookingStatus.COMPLETED) {
                    createInvoiceIfMissing(connection, bookingId, customerId, providerId, reference, total);
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

    private void notifyProvider(Connection connection, Booking booking) throws SQLException {
        String findProviderUser = "SELECT user_id FROM provider_profiles WHERE id = ?";
        String insert = "INSERT INTO notifications "
                + "(id, user_id, title, message, type, related_booking_id) VALUES (?, ?, ?, ?, 'BOOKING', ?)";
        try (PreparedStatement find = connection.prepareStatement(findProviderUser)) {
            find.setString(1, booking.getProviderId());
            try (ResultSet rs = find.executeQuery()) {
                if (!rs.next()) {
                    throw new SQLException("Provider not found.", "02000");
                }
                String providerUserId = rs.getString("user_id");
                try (PreparedStatement statement = connection.prepareStatement(insert)) {
                    statement.setString(1, UUID.randomUUID().toString());
                    statement.setString(2, providerUserId);
                    statement.setString(3, booking.isEmergency() ? "Emergency service request" : "New service request");
                    statement.setString(4, "A new booking request was submitted: " + booking.getBookingReference());
                    statement.setString(5, booking.getId());
                    statement.executeUpdate();
                }
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

    private void notifyProviderOfStatusChange(Connection connection, String providerId, BookingStatus status,
                                              String reference, String bookingId) throws SQLException {
        String sql = "INSERT INTO notifications (id, user_id, title, message, type, related_booking_id) "
                + "SELECT ?, user_id, ?, ?, 'STATUS_CHANGE', ? FROM provider_profiles WHERE id = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, UUID.randomUUID().toString());
            statement.setString(2, "Booking Update: " + status.name().replace('_', ' '));
            statement.setString(3, "Booking " + reference + " was updated to "
                    + status.name().replace('_', ' ') + ".");
            statement.setString(4, bookingId);
            statement.setString(5, providerId);
            statement.executeUpdate();
        }
    }

    private void createInvoiceIfMissing(Connection connection, String bookingId, String customerId,
                                        String providerId, String reference, java.math.BigDecimal total)
            throws SQLException {
        String existsSql = "SELECT id FROM invoices WHERE booking_id = ? LIMIT 1";
        try (PreparedStatement statement = connection.prepareStatement(existsSql)) {
            statement.setString(1, bookingId);
            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return;
                }
            }
        }
        String invoiceId = UUID.randomUUID().toString();
        String invoiceSql = "INSERT INTO invoices "
                + "(id, invoice_number, booking_id, customer_id, provider_id, subtotal, tax_amount, "
                + "discount_amount, total_amount, payment_status, payment_method) "
                + "VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 'UNPAID', 'NOT_RECORDED')";
        try (PreparedStatement statement = connection.prepareStatement(invoiceSql)) {
            statement.setString(1, invoiceId);
            statement.setString(2, "INV-" + reference);
            statement.setString(3, bookingId);
            statement.setString(4, customerId);
            statement.setString(5, providerId);
            statement.setBigDecimal(6, total);
            statement.setBigDecimal(7, total);
            statement.executeUpdate();
        }
        String itemSql = "INSERT INTO invoice_items "
                + "(id, invoice_id, item_description, quantity, unit_price, total_price) VALUES (?, ?, ?, 1, ?, ?)";
        try (PreparedStatement statement = connection.prepareStatement(itemSql)) {
            statement.setString(1, UUID.randomUUID().toString());
            statement.setString(2, invoiceId);
            statement.setString(3, "Completed service");
            statement.setBigDecimal(4, total);
            statement.setBigDecimal(5, total);
            statement.executeUpdate();
        }
    }
}
