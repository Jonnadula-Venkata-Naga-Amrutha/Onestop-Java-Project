package com.skillbridge.util;

import com.skillbridge.dao.UserDAO;
import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class UserDaoIntegrationTest extends JdbcTestSupport {
    @Test
    void registersCustomerAndAuthenticatesOnlyWithTheCorrectPassword() throws SQLException {
        UserDAO userDAO = new UserDAO();

        User registered = userDAO.register("PERSON@example.com", "local-test-password",
                UserRole.CUSTOMER, "Test Customer", "555-0101", null, "Vijayawada", List.of());

        assertEquals(UserRole.CUSTOMER, registered.getRole());
        assertEquals("person@example.com", registered.getEmail());
        assertEquals(registered.getId(), userDAO.authenticate("person@example.com", "local-test-password").getId());
        assertNull(userDAO.authenticate("person@example.com", "incorrect-password"));
        assertEquals(1, intValue("SELECT COUNT(*) FROM customer_profiles WHERE user_id = ?", registered.getId()));
        assertNotEquals("local-test-password",
                stringValue("SELECT password_hash FROM users WHERE id = ?", registered.getId()));

        assertTrue(userDAO.isActive(registered.getId()));
        execute("UPDATE users SET status = 'SUSPENDED' WHERE id = '" + registered.getId() + "'");
        assertFalse(userDAO.isActive(registered.getId()));
    }
}
