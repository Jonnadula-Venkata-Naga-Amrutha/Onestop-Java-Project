package com.skillbridge.util;

import com.skillbridge.dao.QuotationDAO;
import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class QuotationDaoIntegrationTest extends JdbcTestSupport {
    @Test
    void providerQuotationCanBeAcceptedOnlyForTheOwningCustomer() throws SQLException {
        fixtureBooking();
        QuotationDAO quotationDAO = new QuotationDAO();
        String quoteId = quotationDAO.create("booking-1", "provider-1", "provider-user-1",
                new BigDecimal("80.00"), new BigDecimal("20.00"), new BigDecimal("5.00"),
                new BigDecimal("2.0"), Date.valueOf(LocalDate.now().plusDays(3)), "Test scope");

        assertEquals("QUOTE_SENT", stringValue("SELECT status FROM bookings WHERE id = ?", "booking-1"));
        assertEquals(1, quotationDAO.list(user("customer-1", UserRole.CUSTOMER), "booking-1").size());
        assertThrows(SQLException.class,
                () -> quotationDAO.acceptAtomically(quoteId, user("other-customer", UserRole.CUSTOMER)));
        quotationDAO.acceptAtomically(quoteId, user("customer-1", UserRole.CUSTOMER));

        assertEquals("ACCEPTED", stringValue("SELECT status FROM quotations WHERE id = ?", quoteId));
        assertEquals("CONFIRMED", stringValue("SELECT status FROM bookings WHERE id = ?", "booking-1"));
        assertEquals(new BigDecimal("105.00"),
                new BigDecimal(stringValue("SELECT estimated_total FROM bookings WHERE id = ?", "booking-1")));
        assertEquals(1, intValue("SELECT COUNT(*) FROM notifications WHERE user_id = ?", "provider-user-1"));
    }

    @Test
    void decliningTheLastQuotationReturnsTheBookingToPending() throws SQLException {
        fixtureBooking();
        QuotationDAO quotationDAO = new QuotationDAO();
        String quoteId = quotationDAO.create("booking-1", "provider-1", "provider-user-1",
                new BigDecimal("80.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                new BigDecimal("1.0"), Date.valueOf(LocalDate.now().plusDays(3)), "");

        quotationDAO.declineAtomically(quoteId, user("customer-1", UserRole.CUSTOMER));

        assertEquals("DECLINED", stringValue("SELECT status FROM quotations WHERE id = ?", quoteId));
        assertEquals("PENDING", stringValue("SELECT status FROM bookings WHERE id = ?", "booking-1"));
        assertEquals(2, intValue("SELECT COUNT(*) FROM booking_status_history WHERE booking_id = ?", "booking-1"));
    }

    private void fixtureBooking() throws SQLException {
        execute("INSERT INTO users (id, email, password_hash, role, full_name, phone) "
                + "VALUES ('customer-1', 'customer@test.local', 'hash', 'CUSTOMER', 'Customer', '555-0101')");
        execute("INSERT INTO users (id, email, password_hash, role, full_name, phone) "
                + "VALUES ('provider-user-1', 'provider@test.local', 'hash', 'PROVIDER', 'Provider', '555-0102')");
        execute("INSERT INTO provider_profiles (id, user_id, business_name, rating_avg, years_experience) "
                + "VALUES ('provider-1', 'provider-user-1', 'Test Services', 5.00, 3)");
        execute("INSERT INTO bookings "
                + "(id, booking_reference, customer_id, provider_id, service_title, category_id, "
                + "problem_description, service_address, city, scheduled_date, scheduled_time_slot, "
                + "status, is_emergency, estimated_total) "
                + "VALUES ('booking-1', 'OS-TEST-1', 'customer-1', 'provider-1', 'Repair', 'category-1', "
                + "'Description', 'Address', 'City', CURRENT_DATE, '09:00 AM - 11:00 AM', 'PENDING', FALSE, 100.00)");
    }

    private User user(String id, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setStatus("ACTIVE");
        return user;
    }
}
