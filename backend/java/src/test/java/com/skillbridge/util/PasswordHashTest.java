package com.skillbridge.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordHashTest {
    @Test
    void hashesPasswordsWithBcryptAndRejectsMismatches() {
        String hash = PasswordHash.hash("locally-tested-password");

        assertTrue(hash.startsWith("$2a$12$"));
        assertTrue(PasswordHash.matches("locally-tested-password", hash));
        assertFalse(PasswordHash.matches("wrong-password", hash));
    }
}
