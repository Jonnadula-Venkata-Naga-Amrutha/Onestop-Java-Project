package com.skillbridge.util;

import com.skillbridge.model.UserRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ApiRolePolicyTest {
    @Test
    void administrativeAndProviderRoutesRequireTheirRoles() {
        assertEquals(UserRole.ADMIN, ApiRolePolicy.requiredRole("/api/complaints/complaint-1", "PATCH"));
        assertEquals(UserRole.ADMIN, ApiRolePolicy.requiredRole("/api/admin/users", "GET"));
        assertEquals(UserRole.PROVIDER, ApiRolePolicy.requiredRole("/api/provider/profile", "PATCH"));
    }

    @Test
    void bookingAndQuotationMutationsRequireTheCorrectRoles() {
        assertEquals(UserRole.CUSTOMER, ApiRolePolicy.requiredRole("/api/bookings", "POST"));
        assertEquals(UserRole.CUSTOMER, ApiRolePolicy.requiredRole("/api/quotations/quote-1/decline", "POST"));
        assertEquals(UserRole.PROVIDER, ApiRolePolicy.requiredRole("/api/quotations", "POST"));
        assertNull(ApiRolePolicy.requiredRole("/api/bookings", "GET"));
    }
}
