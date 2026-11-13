package com.skillbridge.dao;

import com.skillbridge.util.DBConnectionUtil;
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
}
