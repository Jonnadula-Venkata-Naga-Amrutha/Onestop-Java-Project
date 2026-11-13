package com.skillbridge.dao;

import com.skillbridge.model.Booking;
import com.skillbridge.util.DBConnectionUtil;

import java.sql.*;

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
            bookingStmt.setString(11, booking.getStatus() != null ? booking.getStatus().name() : "PENDING");
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
            historyStmt.setString(3, booking.getStatus() != null ? booking.getStatus().name() : "PENDING");
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
}
