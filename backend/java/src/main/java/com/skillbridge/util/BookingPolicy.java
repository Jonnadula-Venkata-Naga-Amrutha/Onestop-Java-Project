package com.skillbridge.util;

import com.skillbridge.model.BookingStatus;
import com.skillbridge.model.UserRole;

public final class BookingPolicy {
    private BookingPolicy() {}

    public static boolean canTransition(BookingStatus current, BookingStatus next, UserRole role,
                                        String actorId, String customerId, String providerId,
                                        String actorProviderId) {
        if (role == UserRole.CUSTOMER) {
            return actorId.equals(customerId)
                    && next == BookingStatus.CANCELLED
                    && (current == BookingStatus.PENDING || current == BookingStatus.QUOTE_SENT);
        }
        if (role != UserRole.PROVIDER || !providerId.equals(actorProviderId)) {
            return false;
        }
        return switch (current) {
            case PENDING -> next == BookingStatus.CONFIRMED || next == BookingStatus.REJECTED;
            case CONFIRMED -> next == BookingStatus.PROVIDER_ON_THE_WAY;
            case PROVIDER_ON_THE_WAY -> next == BookingStatus.IN_PROGRESS;
            case IN_PROGRESS -> next == BookingStatus.COMPLETED;
            default -> false;
        };
    }
}
