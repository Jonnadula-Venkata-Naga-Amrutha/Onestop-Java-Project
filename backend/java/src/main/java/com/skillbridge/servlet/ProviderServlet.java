package com.skillbridge.servlet;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.skillbridge.model.User;
import com.skillbridge.util.ApiUtil;
import com.skillbridge.util.DBConnectionUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@WebServlet("/api/provider/*")
public class ProviderServlet extends HttpServlet {
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(request.getMethod())) {
            doPatch(request, response);
        } else if ("PUT".equalsIgnoreCase(request.getMethod())) {
            doPut(request, response);
        } else {
            super.service(request, response);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        if ("/availability".equals(path)) {
            try {
                ApiUtil.success(response, availability(ApiUtil.currentUser(request).getId()));
            } catch (SQLException e) {
                throw new ServletException("Unable to load provider availability.", e);
            }
            return;
        }
        if (!"/verifications".equals(path)) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Provider route not found.");
            return;
        }
        try {
            ApiUtil.success(response, verifications(ApiUtil.currentUser(request).getId()));
        } catch (SQLException e) {
            throw new ServletException("Unable to load provider verification requests.", e);
        }
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (!"/profile".equals(request.getPathInfo())) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Provider route not found.");
            return;
        }
        try {
            JsonObject body = ApiUtil.readObject(request);
            User user = ApiUtil.currentUser(request);
            String fullName = boundedString(body, "fullName", 120);
            String phone = boundedString(body, "phone", 32);
            String businessName = boundedString(body, "businessName", 160);
            String city = boundedString(body, "city", 64);
            String bio = ApiUtil.string(body, "bio", "");
            if (bio.length() > 2000) {
                throw new IllegalArgumentException("Profile description must be 2000 characters or fewer.");
            }
            int years = requiredInteger(body, "yearsExperience");
            BigDecimal rate = requiredDecimal(body, "baseHourlyRate");
            boolean emergencyAvailable = requiredBoolean(body, "emergencyAvailable");
            if (years < 0 || years > 60 || rate.signum() <= 0 || rate.compareTo(new BigDecimal("100000")) > 0) {
                throw new IllegalArgumentException("Experience or hourly rate is outside the allowed range.");
            }
            updateProfile(user.getId(), fullName, phone, businessName, bio, years, rate, city, emergencyAvailable);
            ApiUtil.success(response, Map.of("message", "Provider profile updated."));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else {
                throw new ServletException("Unable to update provider profile.", e);
            }
        }
    }

    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        try {
            JsonObject body = ApiUtil.readObject(request);
            String userId = ApiUtil.currentUser(request).getId();
            if ("/services".equals(path)) {
                saveServices(userId, requiredArray(body, "serviceCategories"));
            } else if ("/areas".equals(path)) {
                String city = boundedString(body, "city", 64);
                saveAreas(userId, city, requiredArray(body, "localities"));
            } else if ("/availability".equals(path)) {
                saveAvailability(userId, requiredArray(body, "availability"));
            } else {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Provider route not found.");
                return;
            }
            ApiUtil.success(response, Map.of("message", "Provider settings updated."));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else {
                throw new ServletException("Unable to update provider settings.", e);
            }
        }
    }

    private void updateProfile(String userId, String fullName, String phone, String businessName, String bio,
                               int years, BigDecimal rate, String city, boolean emergencyAvailable)
            throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE users SET full_name = ?, phone = ? WHERE id = ? AND role = 'PROVIDER'")) {
                    statement.setString(1, fullName);
                    statement.setString(2, phone);
                    statement.setString(3, userId);
                    if (statement.executeUpdate() != 1) {
                        throw new SQLException("Provider account not found.", "02000");
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE provider_profiles SET business_name = ?, bio = ?, years_experience = ?, "
                                + "base_hourly_rate = ?, city = ?, emergency_available = ? WHERE user_id = ?")) {
                    statement.setString(1, businessName);
                    statement.setString(2, bio);
                    statement.setInt(3, years);
                    statement.setBigDecimal(4, rate);
                    statement.setString(5, city);
                    statement.setBoolean(6, emergencyAvailable);
                    statement.setString(7, userId);
                    if (statement.executeUpdate() != 1) {
                        throw new SQLException("Provider profile not found.", "02000");
                    }
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

    private void saveServices(String userId, JsonArray categories) throws SQLException {
        List<String> codes = stringArray(categories, "serviceCategories", 20, false);
        if (codes.isEmpty()) {
            throw new IllegalArgumentException("At least one service category is required.");
        }
        if (new HashSet<>(codes).size() != codes.size()) {
            throw new IllegalArgumentException("Service categories must not be duplicated.");
        }
        String providerId = providerId(userId);
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE provider_services SET is_active = FALSE WHERE provider_id = ?")) {
                    statement.setString(1, providerId);
                    statement.executeUpdate();
                }
                for (String code : codes) {
                    String categoryId = null;
                    try (PreparedStatement statement = connection.prepareStatement(
                            "SELECT id FROM service_categories WHERE code = ?")) {
                        statement.setString(1, code);
                        try (ResultSet rs = statement.executeQuery()) {
                            if (rs.next()) {
                                categoryId = rs.getString("id");
                            }
                        }
                    }
                    if (categoryId == null) {
                        throw new IllegalArgumentException("Unknown service category: " + code);
                    }
                    int updated;
                    try (PreparedStatement statement = connection.prepareStatement(
                            "UPDATE provider_services SET is_active = TRUE WHERE provider_id = ? AND category_id = ?")) {
                        statement.setString(1, providerId);
                        statement.setString(2, categoryId);
                        updated = statement.executeUpdate();
                    }
                    if (updated == 0) {
                        try (PreparedStatement statement = connection.prepareStatement(
                                "INSERT INTO provider_services "
                                        + "(id, provider_id, category_id, service_title, description, price_type, price, is_active) "
                                        + "SELECT ?, ?, id, name_en, description, 'HOURLY', "
                                        + "(SELECT base_hourly_rate FROM provider_profiles WHERE id = ?), TRUE "
                                        + "FROM service_categories WHERE id = ?")) {
                            statement.setString(1, UUID.randomUUID().toString());
                            statement.setString(2, providerId);
                            statement.setString(3, providerId);
                            statement.setString(4, categoryId);
                            statement.executeUpdate();
                        }
                    }
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

    private void saveAreas(String userId, String city, JsonArray localities) throws SQLException {
        List<String> names = stringArray(localities, "localities", 30, true);
        if (names.stream().anyMatch(name -> name.length() > 100)) {
            throw new IllegalArgumentException("Each service locality must be 100 characters or fewer.");
        }
        if (new HashSet<>(names).size() != names.size()) {
            throw new IllegalArgumentException("Service localities must not be duplicated.");
        }
        String providerId = providerId(userId);
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(
                        "DELETE FROM service_areas WHERE provider_id = ?")) {
                    statement.setString(1, providerId);
                    statement.executeUpdate();
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO service_areas (id, provider_id, city, locality) VALUES (?, ?, ?, ?)")) {
                    for (String locality : names) {
                        statement.setString(1, UUID.randomUUID().toString());
                        statement.setString(2, providerId);
                        statement.setString(3, city);
                        statement.setString(4, locality);
                        statement.addBatch();
                    }
                    if (!names.isEmpty()) {
                        statement.executeBatch();
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE provider_profiles SET city = ? WHERE id = ?")) {
                    statement.setString(1, city);
                    statement.setString(2, providerId);
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

    private void saveAvailability(String userId, JsonArray schedule) throws SQLException {
        if (schedule == null || schedule.size() != 7) {
            throw new IllegalArgumentException("Provide one availability entry for each weekday.");
        }
        List<AvailabilityEntry> entries = new ArrayList<>();
        Set<Integer> days = new HashSet<>();
        for (JsonElement element : schedule) {
            if (!element.isJsonObject()) {
                throw new IllegalArgumentException("Availability entries must be JSON objects.");
            }
            JsonObject item = element.getAsJsonObject();
            int day = requiredInteger(item, "dayOfWeek");
            boolean available = requiredBoolean(item, "isAvailable");
            if (day < 0 || day > 6 || !days.add(day)) {
                throw new IllegalArgumentException("Availability must contain each day exactly once.");
            }
            LocalTime start;
            LocalTime end;
            try {
                String startText = ApiUtil.requiredString(item, "startTime");
                String endText = ApiUtil.requiredString(item, "endTime");
                if (!startText.matches("\\d{2}:\\d{2}") || !endText.matches("\\d{2}:\\d{2}")) {
                    throw new IllegalArgumentException();
                }
                start = LocalTime.parse(startText);
                end = LocalTime.parse(endText);
            } catch (RuntimeException e) {
                throw new IllegalArgumentException("Availability times must use HH:mm format.");
            }
            if (available && !start.isBefore(end)) {
                throw new IllegalArgumentException("Availability start time must be before end time.");
            }
            entries.add(new AvailabilityEntry(day, start, end, available));
        }
        String providerId = providerId(userId);
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                try (PreparedStatement statement = connection.prepareStatement(
                        "DELETE FROM provider_availability WHERE provider_id = ?")) {
                    statement.setString(1, providerId);
                    statement.executeUpdate();
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO provider_availability "
                                + "(id, provider_id, day_of_week, start_time, end_time, is_available) "
                                + "VALUES (?, ?, ?, ?, ?, ?)")) {
                    for (AvailabilityEntry entry : entries) {
                        statement.setString(1, UUID.randomUUID().toString());
                        statement.setString(2, providerId);
                        statement.setInt(3, entry.day());
                        statement.setTime(4, Time.valueOf(entry.start()));
                        statement.setTime(5, Time.valueOf(entry.end()));
                        statement.setBoolean(6, entry.available());
                        statement.addBatch();
                    }
                    statement.executeBatch();
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

    private List<Map<String, Object>> availability(String userId) throws SQLException {
        String sql = "SELECT a.id, a.provider_id, a.day_of_week, a.start_time, a.end_time, a.is_available "
                + "FROM provider_availability a JOIN provider_profiles p ON p.id = a.provider_id "
                + "WHERE p.user_id = ? ORDER BY a.day_of_week";
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("id", rs.getString("id"));
                    entry.put("providerId", rs.getString("provider_id"));
                    entry.put("dayOfWeek", rs.getInt("day_of_week"));
                    entry.put("startTime", rs.getTime("start_time").toLocalTime().toString());
                    entry.put("endTime", rs.getTime("end_time").toLocalTime().toString());
                    entry.put("isAvailable", rs.getBoolean("is_available"));
                    result.add(entry);
                }
            }
        }
        return result;
    }

    private String providerId(String userId) throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "SELECT id FROM provider_profiles WHERE user_id = ?")) {
            statement.setString(1, userId);
            try (ResultSet rs = statement.executeQuery()) {
                if (!rs.next()) {
                    throw new SQLException("Provider profile not found.", "02000");
                }
                return rs.getString("id");
            }
        }
    }

    private List<String> stringArray(JsonArray values, String field, int maximum, boolean allowEmpty) {
        if (values == null || values.size() > maximum || (!allowEmpty && values.isEmpty())) {
            throw new IllegalArgumentException(field + " must contain "
                    + (allowEmpty ? "at most " : "between 1 and ") + maximum + " entries.");
        }
        List<String> result = new ArrayList<>();
        for (JsonElement value : values) {
            if (!value.isJsonPrimitive() || !value.getAsJsonPrimitive().isString()) {
                throw new IllegalArgumentException(field + " entries must be strings.");
            }
            String entry = value.getAsString().trim();
            if (entry.isEmpty()) {
                throw new IllegalArgumentException(field + " entries cannot be blank.");
            }
            result.add(entry);
        }
        return result;
    }

    private String boundedString(JsonObject body, String key, int maximum) {
        String value = ApiUtil.requiredString(body, key);
        if (value.length() > maximum) {
            throw new IllegalArgumentException(key + " must be " + maximum + " characters or fewer.");
        }
        return value;
    }

    private JsonArray requiredArray(JsonObject body, String key) {
        if (!body.has(key) || !body.get(key).isJsonArray()) {
            throw new IllegalArgumentException(key + " must be an array.");
        }
        return body.getAsJsonArray(key);
    }

    private int requiredInteger(JsonObject body, String key) {
        if (!body.has(key) || !body.get(key).isJsonPrimitive()
                || !body.getAsJsonPrimitive(key).isNumber()) {
            throw new IllegalArgumentException(key + " must be an integer.");
        }
        try {
            return body.get(key).getAsBigDecimal().intValueExact();
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException(key + " must be an integer.");
        }
    }

    private BigDecimal requiredDecimal(JsonObject body, String key) {
        if (!body.has(key) || !body.get(key).isJsonPrimitive()
                || !body.getAsJsonPrimitive(key).isNumber()) {
            throw new IllegalArgumentException(key + " must be a number.");
        }
        try {
            return body.get(key).getAsBigDecimal();
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a valid number.");
        }
    }

    private boolean requiredBoolean(JsonObject body, String key) {
        if (!body.has(key) || !body.get(key).isJsonPrimitive()
                || !body.getAsJsonPrimitive(key).isBoolean()) {
            throw new IllegalArgumentException(key + " must be true or false.");
        }
        return body.get(key).getAsBoolean();
    }

    private record AvailabilityEntry(int day, LocalTime start, LocalTime end, boolean available) {}

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (!"/verifications".equals(request.getPathInfo())) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Provider route not found.");
            return;
        }
        try {
            JsonObject body = ApiUtil.readObject(request);
            String documentType = ApiUtil.requiredString(body, "documentType");
            if (!List.of("TRADE_LICENSE", "CERTIFICATE").contains(documentType)) {
                throw new IllegalArgumentException("Only business license and professional certificate numbers are accepted.");
            }
            String documentNumber = ApiUtil.requiredString(body, "documentNumber");
            if (documentNumber.length() > 100) {
                throw new IllegalArgumentException("Document number must be 100 characters or fewer.");
            }
            String id = createVerification(ApiUtil.currentUser(request), documentType, documentNumber);
            ApiUtil.json(response, HttpServletResponse.SC_CREATED,
                    Map.of("success", true, "data", verifications(ApiUtil.currentUser(request).getId())
                            .stream().filter(item -> id.equals(item.get("id"))).findFirst().orElse(Map.of("id", id))));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("45000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_CONFLICT, e.getMessage());
            } else {
                throw new ServletException("Unable to submit provider verification request.", e);
            }
        }
    }

    private String createVerification(User user, String documentType, String documentNumber)
            throws SQLException {
        String id = ApiUtil.newId();
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String profileSql = "SELECT id FROM provider_profiles WHERE user_id = ? FOR UPDATE";
                String providerId;
                try (PreparedStatement statement = connection.prepareStatement(profileSql)) {
                    statement.setString(1, user.getId());
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Provider profile not found.", "02000");
                        }
                        providerId = rs.getString("id");
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "SELECT id FROM verification_requests WHERE provider_id = ? AND status = 'PENDING' LIMIT 1")) {
                    statement.setString(1, providerId);
                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            throw new SQLException("A verification request is already pending.", "45000");
                        }
                    }
                }
                String insert = "INSERT INTO verification_requests "
                        + "(id, provider_id, document_type, document_number, status) VALUES (?, ?, ?, ?, 'PENDING')";
                try (PreparedStatement statement = connection.prepareStatement(insert)) {
                    statement.setString(1, id);
                    statement.setString(2, providerId);
                    statement.setString(3, documentType);
                    statement.setString(4, documentNumber);
                    statement.executeUpdate();
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE provider_profiles SET is_verified = FALSE WHERE id = ?")) {
                    statement.setString(1, providerId);
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
        return id;
    }

    private List<Map<String, Object>> verifications(String userId) throws SQLException {
        String sql = "SELECT v.id, v.provider_id, u.full_name AS provider_name, p.business_name, "
                + "v.document_type, v.document_number, v.document_file_url, v.status, v.reviewer_notes, "
                + "v.submitted_at, v.reviewed_at FROM verification_requests v "
                + "JOIN provider_profiles p ON p.id = v.provider_id "
                + "JOIN users u ON u.id = p.user_id WHERE u.id = ? ORDER BY v.submitted_at DESC";
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            try (ResultSet rs = statement.executeQuery()) {
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
        }
        return result;
    }
}
