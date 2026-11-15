package com.skillbridge.servlet;

import com.skillbridge.util.ApiUtil;
import com.skillbridge.util.DBConnectionUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

@WebServlet("/api/health")
public class HealthServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try (Connection connection = DBConnectionUtil.getConnection()) {
            if (!connection.isValid(2)) {
                ApiUtil.error(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                        "Database connection is unavailable.");
                return;
            }
            ApiUtil.success(response, Map.of("status", "ok", "database", "connected"));
        } catch (SQLException e) {
            throw new ServletException("Database health check failed.", e);
        }
    }
}
