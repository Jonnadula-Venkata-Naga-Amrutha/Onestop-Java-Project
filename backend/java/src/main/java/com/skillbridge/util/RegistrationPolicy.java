package com.skillbridge.util;

import com.skillbridge.model.UserRole;

import java.util.Locale;

public final class RegistrationPolicy {
    private RegistrationPolicy() {}

    public static UserRole role(String requestedRole) {
        UserRole role;
        try {
            role = UserRole.valueOf(requestedRole.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Choose a customer or provider account.");
        }
        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Administrator accounts cannot be created through public registration.");
        }
        return role;
    }
}
