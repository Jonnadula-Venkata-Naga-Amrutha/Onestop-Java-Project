package com.skillbridge.servlet;

import com.skillbridge.util.ApiUtil;
import com.skillbridge.util.DBConnectionUtil;
import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;

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

@WebServlet(urlPatterns = {"/api/categories", "/api/providers", "/api/providers/*"})
public class CatalogServlet extends HttpServlet {
    private static final String PROVIDER_SELECT =
            "SELECT p.id, p.user_id, u.full_name, u.email, u.phone, p.business_name, COALESCE(p.bio, '') AS bio, "
                    + "p.years_experience, p.rating_avg, p.review_count, p.completed_jobs_count, "
                    + "p.is_verified, p.emergency_available, p.base_hourly_rate, "
                    + "COALESCE(p.profile_image_url, '/src/assets/images/hero_craftsman_service_1792931705892.jpg') AS profile_image_url, p.city, "
                    + "(SELECT GROUP_CONCAT(DISTINCT sc.code ORDER BY sc.code SEPARATOR ',') "
                    + "FROM provider_services ps JOIN service_categories sc ON sc.id = ps.category_id "
                    + "WHERE ps.provider_id = p.id AND ps.is_active = TRUE) AS categories, "
                    + "(SELECT GROUP_CONCAT(DISTINCT sa.locality ORDER BY sa.locality SEPARATOR ',') "
                    + "FROM service_areas sa WHERE sa.provider_id = p.id) AS localities "
                    + "FROM provider_profiles p JOIN users u ON u.id = p.user_id ";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getServletPath();
        try {
            if ("/api/categories".equals(path)) {
                ApiUtil.success(response, getCategories());
            } else if ("/api/providers".equals(path)) {
                ApiUtil.success(response, getProviders(request));
            } else {
                String pathInfo = request.getPathInfo();
                if (pathInfo == null || "/".equals(pathInfo)) {
                    ApiUtil.success(response, getProviders(request));
                } else if (pathInfo.matches("/[^/]+/history")) {
                    String providerId = pathInfo.split("/")[1];
                    User user = ApiUtil.currentUser(request);
                    if (user.getRole() != UserRole.ADMIN && !user.getId().equals(providerUserId(providerId))) {
                        ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN,
                                "Provider history is visible only to that provider and administrators.");
                        return;
                    }
                    ApiUtil.success(response, getProviderHistory(providerId));
                } else {
                    String providerId = pathInfo.substring(1);
                    Map<String, Object> provider = findProvider(providerId);
                    if (provider == null) {
                        ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Provider not found.");
                    } else {
                        ApiUtil.success(response, provider);
                    }
                }
            }
        } catch (SQLException e) {
            throw new ServletException("Unable to load platform catalog.", e);
        }
    }

    private List<Map<String, Object>> getCategories() throws SQLException {
        String sql = "SELECT id, code, name_en, name_te, description, icon_name, base_estimate, image_url "
                + "FROM service_categories ORDER BY name_en";
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet rs = statement.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> category = new LinkedHashMap<>();
                category.put("id", rs.getString("id"));
                category.put("code", rs.getString("code"));
                category.put("nameEn", rs.getString("name_en"));
                category.put("nameTe", rs.getString("name_te"));
                category.put("description", rs.getString("description"));
                category.put("iconName", rs.getString("icon_name"));
                category.put("baseEstimate", rs.getBigDecimal("base_estimate"));
                category.put("imageUrl", rs.getString("image_url"));
                result.add(category);
            }
        }
        return result;
    }

    private List<Map<String, Object>> getProviders(HttpServletRequest request) throws SQLException {
        String category = request.getParameter("category");
        String city = request.getParameter("city");
        String maxPrice = request.getParameter("maxPrice");
        String urgent = request.getParameter("isUrgent");
        StringBuilder sql = new StringBuilder(PROVIDER_SELECT).append("WHERE u.status = 'ACTIVE' ");
        List<Object> parameters = new ArrayList<>();
        if (category != null && !category.isBlank()) {
            sql.append("AND EXISTS (SELECT 1 FROM provider_services ps JOIN service_categories sc ")
                    .append("ON sc.id = ps.category_id WHERE ps.provider_id = p.id AND ps.is_active = TRUE ")
                    .append("AND sc.code = ?) ");
            parameters.add(category);
        }
        if (city != null && !city.isBlank()) {
            sql.append("AND LOWER(p.city) = LOWER(?) ");
            parameters.add(city.trim());
        }
        if (maxPrice != null && !maxPrice.isBlank()) {
            try {
                sql.append("AND p.base_hourly_rate <= ? ");
                parameters.add(Double.parseDouble(maxPrice));
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("maxPrice must be a number.");
            }
        }
        if ("true".equalsIgnoreCase(urgent)) {
            sql.append("AND p.emergency_available = TRUE ");
        }
        sql.append("ORDER BY p.rating_avg DESC, p.completed_jobs_count DESC");
        return queryProviders(sql.toString(), parameters);
    }

    private Map<String, Object> findProvider(String providerId) throws SQLException {
        List<Map<String, Object>> result = queryProviders(PROVIDER_SELECT + "WHERE p.id = ?", List.of(providerId));
        return result.isEmpty() ? null : result.get(0);
    }

    private String providerUserId(String providerId) throws SQLException {
        String sql = "SELECT user_id FROM provider_profiles WHERE id = ?";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, providerId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? rs.getString("user_id") : null;
            }
        }
    }

    private List<Map<String, Object>> queryProviders(String sql, List<Object> parameters) throws SQLException {
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < parameters.size(); i++) {
                statement.setObject(i + 1, parameters.get(i));
            }
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    result.add(providerMap(rs));
                }
            }
        }
        return result;
    }

    private Map<String, Object> providerMap(ResultSet rs) throws SQLException {
        Map<String, Object> provider = new LinkedHashMap<>();
        provider.put("id", rs.getString("id"));
        provider.put("userId", rs.getString("user_id"));
        provider.put("fullName", rs.getString("full_name"));
        provider.put("email", rs.getString("email"));
        provider.put("phone", rs.getString("phone"));
        provider.put("businessName", rs.getString("business_name"));
        provider.put("bio", rs.getString("bio"));
        provider.put("yearsExperience", rs.getInt("years_experience"));
        provider.put("ratingAvg", rs.getBigDecimal("rating_avg"));
        provider.put("reviewCount", rs.getInt("review_count"));
        provider.put("completedJobsCount", rs.getInt("completed_jobs_count"));
        provider.put("isVerified", rs.getBoolean("is_verified"));
        provider.put("emergencyAvailable", rs.getBoolean("emergency_available"));
        provider.put("baseHourlyRate", rs.getBigDecimal("base_hourly_rate"));
        provider.put("profileImageUrl", rs.getString("profile_image_url"));
        provider.put("city", rs.getString("city"));
        provider.put("serviceCategories", splitCsv(rs.getString("categories")));
        provider.put("localities", splitCsv(rs.getString("localities")));
        return provider;
    }

    private List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split(","));
    }

    private Map<String, Object> getProviderHistory(String providerId) throws SQLException {
        Map<String, Object> provider = findProvider(providerId);
        if (provider == null) {
            return null;
        }
        List<Map<String, Object>> history = new ArrayList<>();
        String sql = "SELECT b.id, b.booking_reference, COALESCE(ps.service_title, sc.name_en) AS service_title, "
                + "u.full_name AS customer_name, b.problem_description, "
                + "b.service_address, b.city, b.scheduled_date, b.scheduled_time_slot, b.status, "
                + "b.is_emergency, COALESCE(b.final_total, b.estimated_total) AS amount, b.updated_at "
                + "FROM bookings b JOIN users u ON u.id = b.customer_id "
                + "LEFT JOIN provider_services ps ON ps.id = b.service_id "
                + "LEFT JOIN service_categories sc ON sc.id = b.category_id "
                + "WHERE b.provider_id = ? ORDER BY b.scheduled_date DESC";
        Map<String, Object> metrics = new LinkedHashMap<>();
        int completed = 0;
        int active = 0;
        int pending = 0;
        java.math.BigDecimal earnings = java.math.BigDecimal.ZERO;
        java.math.BigDecimal unpaidInvoices = java.math.BigDecimal.ZERO;
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, providerId);
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    String status = rs.getString("status");
                    if ("COMPLETED".equals(status)) {
                        completed++;
                    } else if (List.of("CONFIRMED", "PROVIDER_ON_THE_WAY", "IN_PROGRESS").contains(status)) {
                        active++;
                    } else if ("PENDING".equals(status)) {
                        pending++;
                    }
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("bookingId", rs.getString("id"));
                    item.put("bookingReference", rs.getString("booking_reference"));
                    item.put("serviceTitle", rs.getString("service_title"));
                    item.put("customerName", rs.getString("customer_name"));
                    item.put("serviceAddress", rs.getString("service_address"));
                    item.put("city", rs.getString("city"));
                    item.put("scheduledDate", rs.getDate("scheduled_date").toString());
                    item.put("scheduledTimeSlot", rs.getString("scheduled_time_slot"));
                    item.put("status", status);
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("isEmergency", rs.getBoolean("is_emergency"));
                    item.put("problemDescription", rs.getString("problem_description"));
                    item.put("updatedAt", rs.getTimestamp("updated_at").toInstant().toString());
                    history.add(item);
                }
            }
            String invoiceTotals = "SELECT "
                    + "COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END), 0) AS paid_total, "
                    + "COALESCE(SUM(CASE WHEN payment_status = 'UNPAID' THEN total_amount ELSE 0 END), 0) AS unpaid_total "
                    + "FROM invoices WHERE provider_id = ?";
            try (PreparedStatement invoiceStatement = connection.prepareStatement(invoiceTotals)) {
                invoiceStatement.setString(1, providerId);
                try (ResultSet rs = invoiceStatement.executeQuery()) {
                    if (rs.next()) {
                        earnings = rs.getBigDecimal("paid_total");
                        unpaidInvoices = rs.getBigDecimal("unpaid_total");
                    }
                }
            }
        }
        metrics.put("totalAssignedTasks", history.size());
        metrics.put("completedJobsCount", completed);
        metrics.put("activeJobsCount", active);
        metrics.put("pendingJobsCount", pending);
        metrics.put("totalEarnings", earnings);
        metrics.put("unpaidInvoiceTotal", unpaidInvoices);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("providerId", providerId);
        response.put("providerName", provider.get("fullName"));
        response.put("businessName", provider.get("businessName"));
        response.put("metrics", metrics);
        response.put("workerHistory", history);
        response.put("assignedBookings", history);
        return response;
    }
}
