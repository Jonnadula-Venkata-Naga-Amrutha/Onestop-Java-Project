package com.skillbridge.servlet;

import com.google.gson.JsonObject;
import com.skillbridge.model.User;
import com.skillbridge.util.ApiUtil;
import com.skillbridge.util.DBConnectionUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@WebServlet("/api/admin/*")
public class AdminServlet extends HttpServlet {
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(request.getMethod())) {
            doPatch(request, response);
        } else {
            super.service(request, response);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        try {
            if ("/users".equals(path)) {
                ApiUtil.success(response, users());
            } else if ("/verifications".equals(path)) {
                ApiUtil.success(response, verifications());
            } else if ("/audit-logs".equals(path)) {
                ApiUtil.success(response, auditLogs());
            } else {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Administrator route not found.");
            }
        } catch (SQLException e) {
            throw new ServletException("Unable to load administrator data.", e);
        }
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if (path == null || !(path.matches("/verifications/[^/]+") || path.matches("/users/[^/]+"))) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Administrator route not found.");
            return;
        }
        try {
            JsonObject body = ApiUtil.readObject(request);
            if (path.startsWith("/users/")) {
                String status = ApiUtil.requiredString(body, "status");
                if (!List.of("ACTIVE", "SUSPENDED").contains(status)) {
                    throw new IllegalArgumentException("User status must be ACTIVE or SUSPENDED.");
                }
                updateUserStatus(path.substring("/users/".length()), status,
                        ApiUtil.currentUser(request), request.getRemoteAddr());
                ApiUtil.success(response, Map.of("message", "User status updated."));
                return;
            }
            String status = ApiUtil.requiredString(body, "status");
            if (!List.of("APPROVED", "REJECTED").contains(status)) {
                throw new IllegalArgumentException("Verification status must be APPROVED or REJECTED.");
            }
            String notes = ApiUtil.requiredString(body, "reviewerNotes");
            updateVerification(path.substring("/verifications/".length()), status, notes,
                    ApiUtil.currentUser(request), request.getRemoteAddr());
            ApiUtil.success(response, Map.of("message", "Verification status updated."));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else if ("45000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            } else {
                throw new ServletException("Unable to update administrator data.", e);
            }
        }
    }

    private List<Map<String, Object>> users() throws SQLException {
        String sql = "SELECT id, email, role, full_name, phone, status, created_at FROM users ORDER BY created_at DESC";
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet rs = statement.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> user = new LinkedHashMap<>();
                user.put("id", rs.getString("id"));
                user.put("email", rs.getString("email"));
                user.put("role", rs.getString("role"));
                user.put("fullName", rs.getString("full_name"));
                user.put("phone", rs.getString("phone"));
                user.put("status", rs.getString("status"));
                user.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
                result.add(user);
            }
        }
        return result;
    }

    private List<Map<String, Object>> verifications() throws SQLException {
        String sql = "SELECT v.id, v.provider_id, u.full_name AS provider_name, p.business_name, "
                + "v.document_type, v.document_number, v.document_file_url, v.status, v.reviewer_notes, "
                + "v.submitted_at, v.reviewed_at FROM verification_requests v "
                + "JOIN provider_profiles p ON p.id = v.provider_id "
                + "JOIN users u ON u.id = p.user_id ORDER BY v.submitted_at DESC";
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet rs = statement.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> verification = new LinkedHashMap<>();
                verification.put("id", rs.getString("id"));
                verification.put("providerId", rs.getString("provider_id"));
                verification.put("providerName", rs.getString("provider_name"));
                verification.put("businessName", rs.getString("business_name"));
                verification.put("documentType", rs.getString("document_type"));
                verification.put("documentNumber", rs.getString("document_number"));
                verification.put("documentFileUrl", rs.getString("document_file_url"));
                verification.put("status", rs.getString("status"));
                verification.put("reviewerNotes", rs.getString("reviewer_notes"));
                verification.put("submittedAt", rs.getTimestamp("submitted_at").toInstant().toString());
                verification.put("reviewedAt", rs.getTimestamp("reviewed_at") == null
                        ? null : rs.getTimestamp("reviewed_at").toInstant().toString());
                result.add(verification);
            }
        }
        return result;
    }

    private List<Map<String, Object>> auditLogs() throws SQLException {
        String sql = "SELECT a.id, a.admin_user_id, u.full_name AS admin_name, a.action_type, "
                + "a.entity_name, a.entity_id, a.change_summary, a.ip_address, a.created_at "
                + "FROM admin_audit_logs a JOIN users u ON u.id = a.admin_user_id "
                + "ORDER BY a.created_at DESC LIMIT 200";
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet rs = statement.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> log = new LinkedHashMap<>();
                log.put("id", Long.toString(rs.getLong("id")));
                log.put("adminUserId", rs.getString("admin_user_id"));
                log.put("adminName", rs.getString("admin_name"));
                log.put("actionType", rs.getString("action_type"));
                log.put("entityName", rs.getString("entity_name"));
                log.put("entityId", rs.getString("entity_id"));
                log.put("changeSummary", rs.getString("change_summary"));
                log.put("ipAddress", rs.getString("ip_address"));
                log.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
                result.add(log);
            }
        }
        return result;
    }

    private void updateUserStatus(String id, String status, User admin, String ip) throws SQLException {
        if (admin.getId().equals(id) && "SUSPENDED".equals(status)) {
            throw new SQLException("You cannot suspend your own administrator account.", "45000");
        }
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String update = "UPDATE users SET status = ? WHERE id = ?";
                try (PreparedStatement statement = connection.prepareStatement(update)) {
                    statement.setString(1, status);
                    statement.setString(2, id);
                    if (statement.executeUpdate() != 1) {
                        throw new SQLException("User not found.", "02000");
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO admin_audit_logs "
                                + "(admin_user_id, action_type, entity_name, entity_id, change_summary, ip_address) "
                                + "VALUES (?, ?, 'users', ?, ?, ?)")) {
                    statement.setString(1, admin.getId());
                    statement.setString(2, "USER_" + status);
                    statement.setString(3, id);
                    statement.setString(4, "User account status changed to " + status + ".");
                    statement.setString(5, ip);
                    statement.executeUpdate();
                }
                connection.commit();
            } catch (SQLException | RuntimeException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    private void updateVerification(String id, String status, String notes, User admin, String ip)
            throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String select = "SELECT provider_id FROM verification_requests WHERE id = ? AND status = 'PENDING' FOR UPDATE";
                String providerId;
                try (PreparedStatement statement = connection.prepareStatement(select)) {
                    statement.setString(1, id);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Pending verification request not found.", "02000");
                        }
                        providerId = rs.getString("provider_id");
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE verification_requests SET status = ?, reviewer_notes = ?, reviewed_at = NOW() WHERE id = ?")) {
                    statement.setString(1, status);
                    statement.setString(2, notes);
                    statement.setString(3, id);
                    statement.executeUpdate();
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE provider_profiles SET is_verified = ? WHERE id = ?")) {
                    statement.setBoolean(1, "APPROVED".equals(status));
                    statement.setString(2, providerId);
                    statement.executeUpdate();
                }
                String notification = "INSERT INTO notifications "
                        + "(id, user_id, title, message, type) "
                        + "SELECT ?, user_id, ?, ?, 'VERIFICATION' FROM provider_profiles WHERE id = ?";
                try (PreparedStatement statement = connection.prepareStatement(notification)) {
                    statement.setString(1, UUID.randomUUID().toString());
                    statement.setString(2, "APPROVED".equals(status)
                            ? "Professional verification approved" : "Verification request rejected");
                    statement.setString(3, notes);
                    statement.setString(4, providerId);
                    statement.executeUpdate();
                }
                String audit = "INSERT INTO admin_audit_logs "
                        + "(admin_user_id, action_type, entity_name, entity_id, change_summary, ip_address) "
                        + "VALUES (?, ?, 'verification_requests', ?, ?, ?)";
                try (PreparedStatement statement = connection.prepareStatement(audit)) {
                    statement.setString(1, admin.getId());
                    statement.setString(2, "VERIFICATION_" + status);
                    statement.setString(3, id);
                    statement.setString(4, notes);
                    statement.setString(5, ip);
                    statement.executeUpdate();
                }
                connection.commit();
            } catch (SQLException | RuntimeException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }
}
