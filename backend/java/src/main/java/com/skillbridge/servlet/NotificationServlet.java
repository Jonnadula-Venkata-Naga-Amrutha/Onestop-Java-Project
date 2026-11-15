package com.skillbridge.servlet;

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

@WebServlet("/api/notifications/*")
public class NotificationServlet extends HttpServlet {
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
        String sql = "SELECT id, user_id, title, message, type, related_booking_id, is_read, created_at "
                + "FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
        List<Map<String, Object>> notifications = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, user.getId());
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> notification = new LinkedHashMap<>();
                    notification.put("id", rs.getString("id"));
                    notification.put("userId", rs.getString("user_id"));
                    notification.put("title", rs.getString("title"));
                    notification.put("message", rs.getString("message"));
                    notification.put("type", rs.getString("type"));
                    notification.put("relatedBookingId", rs.getString("related_booking_id"));
                    notification.put("isRead", rs.getBoolean("is_read"));
                    notification.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
                    notifications.add(notification);
                }
            }
            ApiUtil.success(response, notifications);
        } catch (SQLException e) {
            throw new ServletException("Unable to load notifications.", e);
        }
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        User user = ApiUtil.currentUser(request);
        String sql;
        if ("/read-all".equals(path)) {
            sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ?";
        } else if (path != null && path.matches("/[^/]+/read")) {
            sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id = ?";
        } else {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Notification route not found.");
            return;
        }
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, user.getId());
            if (!"/read-all".equals(path)) {
                statement.setString(2, path.split("/")[1]);
            }
            int changed = statement.executeUpdate();
            if (!"/read-all".equals(path) && changed == 0) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Notification not found.");
                return;
            }
            ApiUtil.success(response, Map.of("message", "Notifications updated."));
        } catch (SQLException e) {
            throw new ServletException("Unable to update notification.", e);
        }
    }
}
