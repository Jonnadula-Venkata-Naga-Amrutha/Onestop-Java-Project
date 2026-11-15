package com.skillbridge.util;

import com.skillbridge.model.UserRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RegistrationPolicyTest {
    @Test
    void publicRegistrationAllowsOnlyCustomerAndProviderRoles() {
        assertEquals(UserRole.CUSTOMER, RegistrationPolicy.role("customer"));
        assertEquals(UserRole.PROVIDER, RegistrationPolicy.role("PROVIDER"));
        assertThrows(IllegalArgumentException.class, () -> RegistrationPolicy.role("ADMIN"));
        assertThrows(IllegalArgumentException.class, () -> RegistrationPolicy.role("unknown"));
    }
}
