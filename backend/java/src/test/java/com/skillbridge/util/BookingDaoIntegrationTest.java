package com.skillbridge.util;

import com.skillbridge.dao.BookingDAO;
import com.skillbridge.model.Booking;
import com.skillbridge.model.BookingStatus;
import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class BookingDaoIntegrationTest extends JdbcTestSupport {
    @Test
    void createsBookingAuditsTransitionsAndLeavesInvoiceUnpaid() throws SQLException {
        execute("INSERT INTO users (id, email, password_hash, role, full_name, phone) "
                + "VALUES ('customer-1', 'customer@test.local', 'hash', 'CUSTOMER', 'Customer', '555-0101')");
        execute("INSERT INTO users (id, email, password_hash, role, full_name, phone) "
                + "VALUES ('provider-user-1', 'provider@test.local', 'hash', 'PROVIDER', 'Provider', '555-0102')");
        execute("INSERT INTO provider_profiles (id, user_id, business_name) "
                + "VALUES ('provider-1', 'provider-user-1', 'Test Services')");
        Booking booking = new Booking();
        booking.setId("booking-1");
        booking.setBookingReference("OS-TEST-1");
        booking.setProviderId("provider-1");
        booking.setServiceTitle("Electrical repair");
        booking.setCategoryId("category-1");
        booking.setProblemDescription("A test booking");
        booking.setServiceAddress("1 Test Street");
        booking.setCity("Test City");
        booking.setScheduledDate(LocalDate.now().plusDays(1));
        booking.setScheduledTimeSlot("09:00 AM - 11:00 AM");
        booking.setEstimatedTotal(new BigDecimal("125.00"));
        User customer = user("customer-1", UserRole.CUSTOMER);
        User provider = user("provider-user-1", UserRole.PROVIDER);
        BookingDAO bookingDAO = new BookingDAO();

        bookingDAO.createBookingWithAudit(booking, "Created for test", customer, null, null);
        bookingDAO.updateStatus(booking.getId(), BookingStatus.CONFIRMED, "Accepted", provider, "provider-1");
        bookingDAO.updateStatus(booking.getId(), BookingStatus.PROVIDER_ON_THE_WAY, "En route", provider, "provider-1");
        bookingDAO.updateStatus(booking.getId(), BookingStatus.IN_PROGRESS, "Started", provider, "provider-1");
        bookingDAO.updateStatus(booking.getId(), BookingStatus.COMPLETED, "Finished", provider, "provider-1");

        assertEquals("COMPLETED", stringValue("SELECT status FROM bookings WHERE id = ?", booking.getId()));
        assertEquals(5, intValue("SELECT COUNT(*) FROM booking_status_history WHERE booking_id = ?", booking.getId()));
        assertEquals("UNPAID", stringValue("SELECT payment_status FROM invoices WHERE booking_id = ?", booking.getId()));
        assertEquals("NOT_RECORDED", stringValue("SELECT payment_method FROM invoices WHERE booking_id = ?", booking.getId()));
        assertEquals(1, intValue("SELECT COUNT(*) FROM invoice_items WHERE invoice_id = "
                + "(SELECT id FROM invoices WHERE booking_id = ?)", booking.getId()));
        assertEquals(5, intValue("SELECT COUNT(*) FROM notifications WHERE related_booking_id = ?", booking.getId()));
    }

    private User user(String id, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setStatus("ACTIVE");
        return user;
    }
}
