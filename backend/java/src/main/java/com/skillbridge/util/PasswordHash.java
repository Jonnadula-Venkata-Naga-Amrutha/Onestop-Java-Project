package com.skillbridge.util;

import org.mindrot.jbcrypt.BCrypt;

public final class PasswordHash {
    private PasswordHash() {}

    public static String hash(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt(12));
    }

    public static boolean matches(String password, String hash) {
        return hash != null && BCrypt.checkpw(password, hash);
    }
}
