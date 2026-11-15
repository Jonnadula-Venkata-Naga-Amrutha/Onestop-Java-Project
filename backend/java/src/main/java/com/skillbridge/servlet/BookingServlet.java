package com.skillbridge.servlet;

import com.google.gson.JsonObject;
import com.skillbridge.dao.BookingDAO;
import com.skillbridge.model.Booking;
import com.skillbridge.model.BookingStatus;
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
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.LocalTime;
import java.util.Base64;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@WebServlet("/api/bookings/*")
public class BookingServlet extends HttpServlet {
    private final BookingDAO bookingDAO = new BookingDAO();

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
        String pathInfo = request.getPathInfo();
        try {
            if (pathInfo == null || "/".equals(pathInfo)) {
                ApiUtil.success(response, listBookings(request, user));
            } else if (pathInfo.matches("/[^/]+/attachments/[^/]+")) {
                serveAttachment(pathInfo, user, response);
            } else {
                Map<String, Object> booking = loadBooking(pathInfo.substring(1));
                if (booking == null) {
                    ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Booking not found.");
                } else if (!canView(booking, user)) {
                    ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, "You cannot view this booking.");
                } else {
                    ApiUtil.success(response, booking);
                }
            }
        } catch (SQLException e) {
            throw new ServletException("Unable to load bookings.", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User customer = ApiUtil.currentUser(request);
        try {
            JsonObject body = ApiUtil.readObject(request);
            Booking booking = new Booking();
            booking.setId(ApiUtil.newId());
            booking.setBookingReference(newReference());
            booking.setProviderId(ApiUtil.requiredString(body, "providerId"));
            String serviceTitle = ApiUtil.requiredString(body, "serviceTitle");
            validateLength(serviceTitle, "Service title", 150);
            booking.setServiceTitle(serviceTitle);
            booking.setCategoryId(resolveCategoryId(ApiUtil.requiredString(body, "categoryId")));
            String problemDescription = ApiUtil.requiredString(body, "problemDescription");
            validateLength(problemDescription, "Problem description", 10000);
            booking.setProblemDescription(problemDescription);
            String serviceAddress = ApiUtil.requiredString(body, "serviceAddress");
            validateLength(serviceAddress, "Service address", 255);
            booking.setServiceAddress(serviceAddress);
            String city = ApiUtil.requiredString(body, "city");
            validateLength(city, "City", 64);
            booking.setCity(city);

            boolean emergency = body.has("isEmergency") && body.get("isEmergency").getAsBoolean();
            LocalDate scheduledDate;
            try {
                scheduledDate = emergency ? LocalDate.now()
                        : LocalDate.parse(ApiUtil.requiredString(body, "scheduledDate"));
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Scheduled date must use YYYY-MM-DD format.");
            }
            if (scheduledDate.isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Scheduled date cannot be in the past.");
            }
            booking.setScheduledDate(scheduledDate);
            String timeSlot = emergency
                    ? "Immediate Emergency Dispatch"
                    : ApiUtil.requiredString(body, "scheduledTimeSlot");
            validateLength(timeSlot, "Scheduled time slot", 64);
            booking.setScheduledTimeSlot(timeSlot);
            booking.setEmergency(emergency);
            booking.setEstimatedTotal(estimate(booking.getProviderId(), emergency));

            if (!providerOffersCategory(booking.getProviderId(), booking.getCategoryId())) {
                throw new IllegalArgumentException("The selected provider does not offer this category.");
            }
            if (!emergency) {
                ensureProviderAvailability(booking.getProviderId(), scheduledDate, booking.getScheduledTimeSlot());
            }

            AttachmentData photo = parsePhoto(ApiUtil.string(body, "photoUrl", ""));

            bookingDAO.createBookingWithAudit(booking,
                    emergency ? "Emergency request submitted" : "Customer submitted booking request", customer,
                    photo == null ? null : photo.bytes, photo == null ? null : photo.contentType);
            ApiUtil.json(response, HttpServletResponse.SC_CREATED,
                    Map.of("success", true, "data", loadBooking(booking.getId())));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else if ("45000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            } else {
                throw new ServletException("Unable to create booking.", e);
            }
        }
    }

    protected void doPatch(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || !pathInfo.matches("/[^/]+/status")) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Booking route not found.");
            return;
        }

        User actor = ApiUtil.currentUser(request);
        String bookingId = pathInfo.split("/")[1];
        try {
            JsonObject body = ApiUtil.readObject(request);
            BookingStatus next = BookingStatus.valueOf(ApiUtil.requiredString(body, "status"));
            String reason = ApiUtil.string(body, "reason", "Booking status updated.");
            String actorProviderId = actor.getRole() == UserRole.PROVIDER
                    ? findProviderId(actor.getId())
                    : null;
            bookingDAO.updateStatus(bookingId, next, reason, actor, actorProviderId);
            ApiUtil.success(response, loadBooking(bookingId));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid booking status.");
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else if ("45000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            } else {
                throw new ServletException("Unable to update booking status.", e);
            }
        }
    }

    private List<Map<String, Object>> listBookings(HttpServletRequest request, User user) throws SQLException {
        StringBuilder sql = new StringBuilder(selectBooking())
                .append("WHERE 1 = 1 ");
        List<String> parameters = new ArrayList<>();
        if (user.getRole() == UserRole.CUSTOMER) {
            sql.append("AND b.customer_id = ? ");
            parameters.add(user.getId());
        } else if (user.getRole() == UserRole.PROVIDER) {
            sql.append("AND b.provider_id = (SELECT id FROM provider_profiles WHERE user_id = ?) ");
            parameters.add(user.getId());
        }
        String status = request.getParameter("status");
        if (status != null && !status.isBlank()) {
            sql.append("AND b.status = ? ");
            parameters.add(status);
        }
        sql.append("ORDER BY b.created_at DESC");
        List<Map<String, Object>> bookings = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < parameters.size(); i++) {
                statement.setString(i + 1, parameters.get(i));
            }
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    bookings.add(bookingMap(connection, rs));
                }
            }
        }
        return bookings;
    }

    private Map<String, Object> loadBooking(String bookingId) throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(selectBooking() + "WHERE b.id = ?")) {
            statement.setString(1, bookingId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? bookingMap(connection, rs) : null;
            }
        }
    }

    private Map<String, Object> bookingMap(Connection connection, ResultSet rs) throws SQLException {
        Map<String, Object> booking = new LinkedHashMap<>();
        String id = rs.getString("id");
        booking.put("id", id);
        booking.put("bookingReference", rs.getString("booking_reference"));
        booking.put("customerId", rs.getString("customer_id"));
        booking.put("customerName", rs.getString("customer_name"));
        booking.put("customerPhone", rs.getString("customer_phone"));
        booking.put("providerId", rs.getString("provider_id"));
        booking.put("providerName", rs.getString("provider_name"));
        booking.put("providerBusiness", rs.getString("provider_business"));
        booking.put("serviceId", rs.getString("service_id"));
        booking.put("serviceTitle", rs.getString("service_title"));
        booking.put("categoryId", rs.getString("category_id"));
        booking.put("categoryName", rs.getString("category_name"));
        booking.put("problemDescription", rs.getString("problem_description"));
        booking.put("serviceAddress", rs.getString("service_address"));
        booking.put("city", rs.getString("city"));
        booking.put("scheduledDate", rs.getDate("scheduled_date").toLocalDate().toString());
        booking.put("scheduledTimeSlot", rs.getString("scheduled_time_slot"));
        booking.put("status", rs.getString("status"));
        booking.put("isEmergency", rs.getBoolean("is_emergency"));
        booking.put("estimatedTotal", rs.getBigDecimal("estimated_total"));
        booking.put("finalTotal", rs.getBigDecimal("final_total"));
        booking.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
        booking.put("updatedAt", rs.getTimestamp("updated_at").toInstant().toString());
        booking.put("photoUrl", attachmentUrl(connection, id));
        booking.put("statusHistory", loadHistory(connection, id));
        return booking;
    }

    private String attachmentUrl(Connection connection, String bookingId) throws SQLException {
        String sql = "SELECT file_url FROM service_attachments WHERE booking_id = ? ORDER BY created_at LIMIT 1";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, bookingId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? rs.getString("file_url") : null;
            }
        }
    }

    private void serveAttachment(String pathInfo, User user, HttpServletResponse response)
            throws SQLException, IOException {
        String[] parts = pathInfo.split("/");
        String bookingId = parts[1];
        String attachmentId = parts[3];
        Map<String, Object> booking = loadBooking(bookingId);
        if (booking == null) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Booking not found.");
            return;
        }
        if (!canView(booking, user)) {
            ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, "You cannot view this attachment.");
            return;
        }
        String sql = "SELECT content_type, file_data FROM service_attachments WHERE id = ? AND booking_id = ?";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, attachmentId);
            statement.setString(2, bookingId);
            try (ResultSet rs = statement.executeQuery()) {
                if (!rs.next() || rs.getBytes("file_data") == null) {
                    ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Attachment not found.");
                    return;
                }
                response.setContentType(rs.getString("content_type"));
                response.setHeader("X-Content-Type-Options", "nosniff");
                response.setHeader("Cache-Control", "private, no-store");
                response.setContentLength(rs.getBytes("file_data").length);
                response.getOutputStream().write(rs.getBytes("file_data"));
            }
        }
    }

    private AttachmentData parsePhoto(String dataUrl) {
        if (dataUrl.isBlank()) {
            return null;
        }
        Matcher matcher = Pattern.compile("^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$")
                .matcher(dataUrl);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Upload a valid JPEG, PNG, or WebP image.");
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(matcher.group(2));
            if (bytes.length == 0 || bytes.length > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("Images must be smaller than 5 MB.");
            }
            if (!hasImageSignature(bytes, matcher.group(1))) {
                throw new IllegalArgumentException("The selected file is not a valid image.");
            }
            return new AttachmentData(matcher.group(1), bytes);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("Images must")) {
                throw e;
            }
            throw new IllegalArgumentException("Upload a valid image smaller than 5 MB.");
        }
    }

    private boolean hasImageSignature(byte[] bytes, String contentType) {
        if ("image/png".equals(contentType)) {
            return bytes.length >= 8 && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50
                    && bytes[2] == 0x4E && bytes[3] == 0x47 && bytes[4] == 0x0D
                    && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
        }
        if ("image/jpeg".equals(contentType)) {
            return bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF
                    && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
        }
        return "image/webp".equals(contentType) && bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
    }

    private static class AttachmentData {
        private final String contentType;
        private final byte[] bytes;

        private AttachmentData(String contentType, byte[] bytes) {
            this.contentType = contentType;
            this.bytes = bytes;
        }
    }

    private List<Map<String, Object>> loadHistory(Connection connection, String bookingId) throws SQLException {
        String sql = "SELECT h.id, h.from_status, h.to_status, h.change_reason, h.changed_by_user_id, "
                + "u.full_name AS changed_by_name, h.changed_at FROM booking_status_history h "
                + "JOIN users u ON u.id = h.changed_by_user_id WHERE h.booking_id = ? ORDER BY h.id";
        List<Map<String, Object>> history = new ArrayList<>();
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, bookingId);
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", Long.toString(rs.getLong("id")));
                    item.put("bookingId", bookingId);
                    item.put("fromStatus", rs.getString("from_status"));
                    item.put("toStatus", rs.getString("to_status"));
                    item.put("changeReason", rs.getString("change_reason"));
                    item.put("changedByUserId", rs.getString("changed_by_user_id"));
                    item.put("changedByName", rs.getString("changed_by_name"));
                    item.put("changedAt", rs.getTimestamp("changed_at").toInstant().toString());
                    history.add(item);
                }
            }
        }
        return history;
    }

    private String selectBooking() {
        return "SELECT b.*, c.full_name AS customer_name, c.phone AS customer_phone, "
                + "pu.full_name AS provider_name, p.business_name AS provider_business, "
                + "sc.name_en AS category_name FROM bookings b "
                + "JOIN users c ON c.id = b.customer_id "
                + "JOIN provider_profiles p ON p.id = b.provider_id "
                + "JOIN users pu ON pu.id = p.user_id "
                + "JOIN service_categories sc ON sc.id = b.category_id ";
    }

    private boolean canView(Map<String, Object> booking, User user) throws SQLException {
        if (user.getRole() == UserRole.ADMIN || user.getId().equals(booking.get("customerId"))) {
            return true;
        }
        return user.getRole() == UserRole.PROVIDER
                && booking.get("providerId").equals(findProviderId(user.getId()));
    }

    private String resolveCategoryId(String categoryIdOrCode) throws SQLException {
        String sql = "SELECT id FROM service_categories WHERE id = ? OR code = ? LIMIT 1";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, categoryIdOrCode);
            statement.setString(2, categoryIdOrCode);
            try (ResultSet rs = statement.executeQuery()) {
                if (!rs.next()) {
                    throw new IllegalArgumentException("Select a valid service category.");
                }
                return rs.getString("id");
            }
        }
    }

    private boolean providerOffersCategory(String providerId, String categoryId) throws SQLException {
        String sql = "SELECT 1 FROM provider_services WHERE provider_id = ? AND category_id = ? AND is_active = TRUE";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, providerId);
            statement.setString(2, categoryId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next();
            }
        }
    }

    private BigDecimal estimate(String providerId, boolean emergency) throws SQLException {
        String sql = "SELECT base_hourly_rate, emergency_available FROM provider_profiles WHERE id = ?";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, providerId);
            try (ResultSet rs = statement.executeQuery()) {
                if (!rs.next()) {
                    throw new IllegalArgumentException("Selected provider was not found.");
                }
                if (emergency && !rs.getBoolean("emergency_available")) {
                    throw new IllegalArgumentException("The selected provider is not available for emergency dispatch.");
                }
                BigDecimal estimate = rs.getBigDecimal("base_hourly_rate").multiply(new BigDecimal("1.5"));
                return emergency ? estimate.add(new BigDecimal("350.00")) : estimate;
            }
        }
    }

    private void ensureProviderAvailability(String providerId, LocalDate date, String timeSlot) throws SQLException {
        Matcher matcher = Pattern.compile(
                "^(\\d{1,2}):(\\d{2})\\s*(AM|PM)\\s*-\\s*(\\d{1,2}):(\\d{2})\\s*(AM|PM)$",
                Pattern.CASE_INSENSITIVE).matcher(timeSlot.trim());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Select a valid preferred time window.");
        }
        LocalTime requestedStart = parseTime(matcher.group(1), matcher.group(2), matcher.group(3));
        LocalTime requestedEnd = parseTime(matcher.group(4), matcher.group(5), matcher.group(6));
        if (!requestedStart.isBefore(requestedEnd)) {
            throw new IllegalArgumentException("Preferred time window must end after it starts.");
        }
        int dayOfWeek = date.getDayOfWeek().getValue() % 7;
        try (Connection connection = DBConnectionUtil.getConnection()) {
            int configured;
            try (PreparedStatement statement = connection.prepareStatement(
                    "SELECT COUNT(*) FROM provider_availability WHERE provider_id = ? AND day_of_week = ?")) {
                statement.setString(1, providerId);
                statement.setInt(2, dayOfWeek);
                try (ResultSet rs = statement.executeQuery()) {
                    rs.next();
                    configured = rs.getInt(1);
                }
            }
            if (configured == 0) {
                return;
            }
            String sql = "SELECT 1 FROM provider_availability WHERE provider_id = ? AND day_of_week = ? "
                    + "AND is_available = TRUE AND start_time <= ? AND end_time >= ? LIMIT 1";
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setString(1, providerId);
                statement.setInt(2, dayOfWeek);
                statement.setTime(3, java.sql.Time.valueOf(requestedStart));
                statement.setTime(4, java.sql.Time.valueOf(requestedEnd));
                try (ResultSet rs = statement.executeQuery()) {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("The provider is not available during this time window.");
                    }
                }
            }
        }
    }

    private LocalTime parseTime(String hourText, String minuteText, String meridiem) {
        int hour = Integer.parseInt(hourText);
        int minute = Integer.parseInt(minuteText);
        if (hour < 1 || hour > 12 || minute > 59) {
            throw new IllegalArgumentException("Select a valid preferred time window.");
        }
        if (hour == 12) {
            hour = 0;
        }
        if ("PM".equalsIgnoreCase(meridiem)) {
            hour += 12;
        }
        return LocalTime.of(hour, minute);
    }

    private String findProviderId(String userId) throws SQLException {
        String sql = "SELECT id FROM provider_profiles WHERE user_id = ?";
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? rs.getString("id") : null;
            }
        }
    }

    private String newReference() {
        return "OS-" + LocalDate.now().getYear() + "-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private void validateLength(String value, String label, int maximum) {
        if (value.isBlank() || value.length() > maximum) {
            throw new IllegalArgumentException(label + " must contain between 1 and " + maximum + " characters.");
        }
    }
}
