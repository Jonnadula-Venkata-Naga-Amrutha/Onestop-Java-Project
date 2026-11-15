package com.skillbridge.util;

import com.skillbridge.model.User;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

public final class AuthSession {
    private AuthSession() {}

    public static void start(HttpServletRequest request, User user) {
        HttpSession previous = request.getSession(false);
        if (previous != null) {
            previous.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(8 * 60 * 60);
        session.setAttribute(ApiUtil.USER_ATTRIBUTE, user);
        request.changeSessionId();
    }
}
