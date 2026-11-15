package com.skillbridge.util;

import com.skillbridge.model.BookingStatus;
import com.skillbridge.model.UserRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BookingPolicyTest {
    @Test
    void customerMayOnlyCancelOwnPendingOrQuotedBooking() {
        assertTrue(BookingPolicy.canTransition(BookingStatus.PENDING, BookingStatus.CANCELLED,
                UserRole.CUSTOMER, "customer-1", "customer-1", "provider-1", null));
        assertFalse(BookingPolicy.canTransition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED,
                UserRole.CUSTOMER, "customer-1", "customer-1", "provider-1", null));
        assertFalse(BookingPolicy.canTransition(BookingStatus.PENDING, BookingStatus.CANCELLED,
                UserRole.CUSTOMER, "customer-2", "customer-1", "provider-1", null));
    }

    @Test
    void onlyAssignedProviderCanAdvanceAllowedTransitions() {
        assertTrue(BookingPolicy.canTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED,
                UserRole.PROVIDER, "provider-user", "customer-1", "provider-1", "provider-1"));
        assertFalse(BookingPolicy.canTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED,
                UserRole.PROVIDER, "provider-user", "customer-1", "provider-1", "provider-2"));
        assertTrue(BookingPolicy.canTransition(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED,
                UserRole.PROVIDER, "provider-user", "customer-1", "provider-1", "provider-1"));
        assertFalse(BookingPolicy.canTransition(BookingStatus.COMPLETED, BookingStatus.IN_PROGRESS,
                UserRole.PROVIDER, "provider-user", "customer-1", "provider-1", "provider-1"));
    }
}
