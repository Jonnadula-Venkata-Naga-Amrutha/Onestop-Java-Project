package com.skillbridge.servlet;

import com.google.gson.JsonObject;
import com.skillbridge.model.User;
import com.skillbridge.util.ApiUtil;
import com.skillbridge.util.DBConnectionUtil;
import com.skillbridge.util.RatingValidator;

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

@WebServlet("/api/reviews")
public class ReviewServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String providerId = request.getParameter("providerId");
        String sql = "SELECT r.id, r.booking_id, r.customer_id, cu.full_name AS customer_name, "
                + "r.provider_id, r.rating, r.comment, r.punctuality_rating, r.quality_rating, "
                + "r.value_rating, r.provider_response, r.created_at FROM reviews r "
                + "JOIN users cu ON cu.id = r.customer_id "
                + (providerId == null || providerId.isBlank() ? "" : "WHERE r.provider_id = ? ")
                + "ORDER BY r.created_at DESC";
        List<Map<String, Object>> reviews = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            if (providerId != null && !providerId.isBlank()) {
                statement.setString(1, providerId);
            }
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> review = new LinkedHashMap<>();
                    review.put("id", rs.getString("id"));
                    review.put("bookingId", rs.getString("booking_id"));
                    review.put("customerId", rs.getString("customer_id"));
                    review.put("customerName", rs.getString("customer_name"));
                    review.put("providerId", rs.getString("provider_id"));
                    review.put("rating", rs.getInt("rating"));
                    review.put("comment", rs.getString("comment"));
                    review.put("punctualityRating", rs.getInt("punctuality_rating"));
                    review.put("qualityRating", rs.getInt("quality_rating"));
                    review.put("valueRating", rs.getInt("value_rating"));
                    review.put("providerResponse", rs.getString("provider_response"));
                    review.put("createdAt", rs.getTimestamp("created_at").toInstant().toString());
                    reviews.add(review);
                }
            }
            ApiUtil.success(response, reviews);
        } catch (SQLException e) {
            throw new ServletException("Unable to load reviews.", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User customer = ApiUtil.currentUser(request);
        try {
            JsonObject body = ApiUtil.readObject(request);
            String bookingId = ApiUtil.requiredString(body, "bookingId");
            int rating = requiredRating(body, "rating");
            int punctuality = optionalRating(body, "punctualityRating", rating);
            int quality = optionalRating(body, "qualityRating", rating);
            int value = optionalRating(body, "valueRating", rating);
            String comment = ApiUtil.requiredString(body, "comment");
            Map<String, Object> review = createReview(customer, bookingId, rating, punctuality, quality, value, comment);
            ApiUtil.json(response, HttpServletResponse.SC_CREATED, Map.of("success", true, "data", review));
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else if ("45000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            } else if ("23000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_CONFLICT, "A review already exists for this booking.");
            } else {
                throw new ServletException("Unable to save review.", e);
            }
        }
    }

    private Map<String, Object> createReview(User customer, String bookingId, int rating, int punctuality,
                                             int quality, int value, String comment) throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String bookingSql = "SELECT provider_id, status FROM bookings WHERE id = ? AND customer_id = ? FOR UPDATE";
                String providerId;
                try (PreparedStatement statement = connection.prepareStatement(bookingSql)) {
                    statement.setString(1, bookingId);
                    statement.setString(2, customer.getId());
                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            throw new SQLException("Completed booking not found for this customer.", "02000");
                        }
                        if (!"COMPLETED".equals(rs.getString("status"))) {
                            throw new SQLException("Only completed bookings can be reviewed.", "45000");
                        }
                        providerId = rs.getString("provider_id");
                    }
                }
                String id = UUID.randomUUID().toString();
                String insert = "INSERT INTO reviews (id, booking_id, customer_id, provider_id, rating, comment, "
                        + "punctuality_rating, quality_rating, value_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                try (PreparedStatement statement = connection.prepareStatement(insert)) {
                    statement.setString(1, id);
                    statement.setString(2, bookingId);
                    statement.setString(3, customer.getId());
                    statement.setString(4, providerId);
                    statement.setInt(5, rating);
                    statement.setString(6, comment);
                    statement.setInt(7, punctuality);
                    statement.setInt(8, quality);
                    statement.setInt(9, value);
                    statement.executeUpdate();
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE provider_profiles SET rating_avg = "
                                + "(SELECT AVG(rating) FROM reviews WHERE provider_id = ?), "
                                + "review_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = ?) "
                                + "WHERE id = ?")) {
                    statement.setString(1, providerId);
                    statement.setString(2, providerId);
                    statement.setString(3, providerId);
                    statement.executeUpdate();
                }
                notifyProvider(connection, providerId, bookingId);
                connection.commit();
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("id", id);
                result.put("bookingId", bookingId);
                result.put("customerId", customer.getId());
                result.put("customerName", customer.getFullName());
                result.put("providerId", providerId);
                result.put("rating", rating);
                result.put("comment", comment);
                result.put("punctualityRating", punctuality);
                result.put("qualityRating", quality);
                result.put("valueRating", value);
                result.put("createdAt", java.time.Instant.now().toString());
                return result;
            } catch (SQLException | RuntimeException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    private void notifyProvider(Connection connection, String providerId, String bookingId) throws SQLException {
        String sql = "INSERT INTO notifications (id, user_id, title, message, type, related_booking_id) "
                + "SELECT ?, user_id, 'New customer review', 'A customer left a review for your service.', "
                + "'REVIEW', ? FROM provider_profiles WHERE id = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, UUID.randomUUID().toString());
            statement.setString(2, bookingId);
            statement.setString(3, providerId);
            statement.executeUpdate();
        }
    }

    private int requiredRating(JsonObject body, String key) {
        int value = body.has(key) ? body.get(key).getAsInt() : 0;
        return RatingValidator.validate(value, key);
    }

    private int optionalRating(JsonObject body, String key, int fallback) {
        return body.has(key) ? requiredRating(body, key) : fallback;
    }
}
