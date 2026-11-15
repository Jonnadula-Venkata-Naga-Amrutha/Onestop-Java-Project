package com.skillbridge.util;

import com.skillbridge.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class AuthSessionTest {
    @Test
    void invalidatesOldSessionAndRotatesTheAuthenticatedSessionId() {
        SessionState oldState = new SessionState();
        SessionState newState = new SessionState();
        HttpSession oldSession = session(oldState);
        HttpSession newSession = session(newState);
        AtomicInteger rotations = new AtomicInteger();
        HttpServletRequest request = (HttpServletRequest) Proxy.newProxyInstance(
                HttpServletRequest.class.getClassLoader(),
                new Class<?>[]{HttpServletRequest.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "getSession" -> (boolean) args[0] ? newSession : oldSession;
                    case "changeSessionId" -> {
                        rotations.incrementAndGet();
                        yield "new-session-id";
                    }
                    default -> defaultValue(method.getReturnType());
                });
        User user = new User();

        AuthSession.start(request, user);

        assertTrue(oldState.invalidated);
        assertEquals(8 * 60 * 60, newState.maxInactiveInterval);
        assertSame(user, newState.attributes.get(ApiUtil.USER_ATTRIBUTE));
        assertEquals(1, rotations.get());
    }

    private HttpSession session(SessionState state) {
        return (HttpSession) Proxy.newProxyInstance(HttpSession.class.getClassLoader(),
                new Class<?>[]{HttpSession.class}, (proxy, method, args) -> switch (method.getName()) {
                    case "invalidate" -> {
                        state.invalidated = true;
                        yield null;
                    }
                    case "setMaxInactiveInterval" -> {
                        state.maxInactiveInterval = (int) args[0];
                        yield null;
                    }
                    case "setAttribute" -> {
                        state.attributes.put((String) args[0], args[1]);
                        yield null;
                    }
                    default -> defaultValue(method.getReturnType());
                });
    }

    private Object defaultValue(Class<?> returnType) {
        if (!returnType.isPrimitive() || returnType == void.class) {
            return null;
        }
        if (returnType == boolean.class) return false;
        if (returnType == char.class) return '\0';
        return 0;
    }

    private static class SessionState {
        private boolean invalidated;
        private int maxInactiveInterval;
        private final Map<String, Object> attributes = new HashMap<>();
    }
}
