package com.skillbridge.util;

import com.skillbridge.model.UserRole;

public final class ApiRolePolicy {
    private ApiRolePolicy() {}

    public static UserRole requiredRole(String path, String method) {
        if (path.startsWith("/api/admin/")) {
            return UserRole.ADMIN;
        }
        if (path.startsWith("/api/provider/")) {
            return UserRole.PROVIDER;
        }
        if (path.startsWith("/api/complaints/") && "PATCH".equals(method)) {
            return UserRole.ADMIN;
        }
        if (path.equals("/api/bookings") && "POST".equals(method)) {
            return UserRole.CUSTOMER;
        }
        if (path.startsWith("/api/quotations/")
                && (path.endsWith("/accept") || path.endsWith("/decline"))) {
            return UserRole.CUSTOMER;
        }
        if (path.equals("/api/quotations") && "POST".equals(method)) {
            return UserRole.PROVIDER;
        }
        if ((path.equals("/api/reviews") || path.equals("/api/complaints"))
                && "POST".equals(method)) {
            return UserRole.CUSTOMER;
        }
        return null;
    }
}
