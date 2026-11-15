package com.skillbridge.servlet;

import com.google.gson.JsonObject;
import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
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

@WebServlet("/api/complaints/*")
public class ComplaintServlet extends HttpServlet {
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
        User user = ApiUtil.currentUser(request);
        if (user.getRole() != UserRole.ADMIN) {
            ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, "Administrator access is required.");
            return;
        }
        String sql = "SELECT c.id, c.booking_id, b.booking_reference, c.filed_by_user_id, "
                + "fu.full_name AS filed_by_name, c.against_user_id, au.full_name AS against_name, "
                + "c.subject, c.description, c.status, c.admin_resolution_notes, c.created_at, c.resolved_at "
                + "FROM complaints c JOIN bookings b ON b.id = c.booking_id "
                + "JOIN users fu ON fu.id = c.filed_by_user_id "
                + "JOIN users au ON au.id = c.against_user_id ORDER BY c.created_at DESC";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet rs = statement.executeQuery()) {
            List<Map<String, Object>> complaints = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> complaint = new LinkedHashMap<>();
                complaint.put("id", rs.getString("id"));
                complaint.put("bookingId", rs.getString("booking_id"));
                complaint.put("bookingReference", rs.getString("booking_reference"));
                complaint.put("filedByUserId", rs.getString("filed_by_user_id"));
                complaint.put("filedByName", rs.getString("filed_by_name"));
                complaint.put("againstUserId", rs.getString("against_user_id"));
                complaint.put("againstName", rs.getString("against_name"));
                complaint.put("subject", rs.getString("subject"));
                complaint.put("description", rs.getString("description"));
                complaint.put("status", rs.getString("status"));
                complaint.put("adminResolutionNotes", rs.getString("admin_resolution_notes"));
                complaint.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
                complaint.put("resolvedAt", rs.getTimestamp("resolved_at") == null
                        ? null : rs.getTimestamp("resolved_at").toInstant().toString());
                complaints.add(complaint);
            }
            ApiUtil.success(response, complaints);
        } catch (SQLException e) {
            throw new ServletException("Unable to load complaints.", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User customer = ApiUtil.currentUser(request);
        try {
            JsonObject body = ApiUtil.readObject(request);
            String bookingId = ApiUtil.requiredString(body, "bookingId");
            String subject = ApiUtil.requiredString(body, "subject");
            String description = ApiUtil.requiredString(body, "description");
            if (subject.length() > 200 || description.length() > 10000) {
                throw new IllegalArgumentException("Subject must be at most 200 characters and description at most 10000.");
            }
            Map<String, Object> complaint = create(customer, bookingId, subject, description);
            ApiUtil.json(response, HttpServletResponse.SC_CREATED,
                    Map.of("success", true, "data", complaint));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else if ("45000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            } else {
                throw new ServletException("Unable to create complaint.", e);
            }
        }
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if (path == null || !path.matches("/[^/]+")) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Complaint route not found.");
            return;
        }
        User admin = ApiUtil.currentUser(request);
        try {
            JsonObject body = ApiUtil.readObject(request);
            String status = ApiUtil.requiredString(body, "status");
            if (!List.of("RESOLVED", "DISMISSED").contains(status)) {
                throw new IllegalArgumentException("Status must be RESOLVED or DISMISSED.");
            }
            String notes = ApiUtil.requiredString(body, "adminResolutionNotes");
            resolve(path.substring(1), status, notes, admin, request.getRemoteAddr());
            ApiUtil.success(response, Map.of("message", "Complaint updated."));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else {
                throw new ServletException("Unable to resolve complaint.", e);
            }
        }
    }

    private Map<String, Object> create(User customer, String bookingId, String subject, String description)
            throws SQLException {
        String id = UUID.randomUUID().toString();
        String sql = "INSERT INTO complaints "
                + "(id, booking_id, filed_by_user_id, against_user_id, subject, description, status) "
                + "SELECT ?, b.id, ?, p.user_id, ?, ?, 'OPEN' FROM bookings b "
                + "JOIN provider_profiles p ON p.id = b.provider_id "
                + "WHERE b.id = ? AND b.customer_id = ?";
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(sql)) {
                    statement.setString(1, id);
                    statement.setString(2, customer.getId());
                    statement.setString(3, subject);
                    statement.setString(4, description);
                    statement.setString(5, bookingId);
                    statement.setString(6, customer.getId());
                    if (statement.executeUpdate() == 0) {
                        throw new SQLException("Booking not found for this customer.", "02000");
                    }
                }
                String notifyAdmins = "INSERT INTO notifications "
                        + "(id, user_id, title, message, type, related_booking_id) "
                        + "SELECT UUID(), id, 'New complaint filed', ?, 'SYSTEM', ? "
                        + "FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'";
                try (PreparedStatement statement = connection.prepareStatement(notifyAdmins)) {
                    statement.setString(1, "A new complaint was filed for booking " + bookingId + ".");
                    statement.setString(2, bookingId);
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
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id);
        result.put("bookingId", bookingId);
        result.put("filedByUserId", customer.getId());
        result.put("filedByName", customer.getFullName());
        result.put("subject", subject);
        result.put("description", description);
        result.put("status", "OPEN");
        result.put("createdAt", java.time.Instant.now().toString());
        return result;
    }

    private void resolve(String id, String status, String notes, User admin, String ip) throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String update = "UPDATE complaints SET status = ?, admin_resolution_notes = ?, "
                        + "resolved_at = NOW() WHERE id = ? AND status IN ('OPEN', 'INVESTIGATING')";
                try (PreparedStatement statement = connection.prepareStatement(update)) {
                    statement.setString(1, status);
                    statement.setString(2, notes);
                    statement.setString(3, id);
                    if (statement.executeUpdate() == 0) {
                        throw new SQLException("Open complaint not found.", "02000");
                    }
                }
                String audit = "INSERT INTO admin_audit_logs "
                        + "(admin_user_id, action_type, entity_name, entity_id, change_summary, ip_address) "
                        + "VALUES (?, ?, 'complaints', ?, ?, ?)";
                try (PreparedStatement statement = connection.prepareStatement(audit)) {
                    statement.setString(1, admin.getId());
                    statement.setString(2, "COMPLAINT_" + status);
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
