package com.skillbridge.servlet;

import com.google.gson.JsonObject;
import com.skillbridge.dao.QuotationDAO;
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
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;

@WebServlet("/api/quotations/*")
public class QuotationServlet extends HttpServlet {
    private final QuotationDAO quotationDAO = new QuotationDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String bookingId = request.getParameter("bookingId");
        try {
            ApiUtil.success(response, quotationDAO.list(ApiUtil.currentUser(request), bookingId));
        } catch (SQLException e) {
            throw new ServletException("Unable to load quotations.", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        User user = ApiUtil.currentUser(request);
        try {
            if (path != null && path.matches("/[^/]+/(accept|decline)")) {
                if (user.getRole() != UserRole.CUSTOMER) {
                    ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, "Only customers can decide on quotations.");
                    return;
                }
                String quotationId = path.split("/")[1];
                boolean accept = path.endsWith("/accept");
                if (accept) {
                    quotationDAO.acceptAtomically(quotationId, user);
                } else {
                    quotationDAO.declineAtomically(quotationId, user);
                }
                ApiUtil.success(response, Map.of("message", accept ? "Quotation accepted." : "Quotation declined."));
                return;
            }
            if (path != null && !"/".equals(path)) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Quotation route not found.");
                return;
            }
            create(request, response, user);
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("02000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else if ("45000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            } else if ("23000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_CONFLICT, e.getMessage());
            } else {
                throw new ServletException("Unable to process quotation.", e);
            }
        }
    }

    private void create(HttpServletRequest request, HttpServletResponse response, User user)
            throws IOException, SQLException {
        if (user.getRole() != UserRole.PROVIDER) {
            ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, "Only providers can submit quotations.");
            return;
        }
        JsonObject body = ApiUtil.readObject(request);
        String bookingId = ApiUtil.requiredString(body, "bookingId");
        BigDecimal labor = amount(body, "laborCost");
        BigDecimal materials = amount(body, "materialCost");
        BigDecimal additional = optionalAmount(body, "additionalCharges", BigDecimal.ZERO);
        BigDecimal duration = optionalAmount(body, "estimatedDurationHours", new BigDecimal("2"));
        BigDecimal maxAmount = new BigDecimal("99999999.99");
        if (labor.signum() < 0 || materials.signum() < 0 || additional.signum() < 0
                || labor.compareTo(maxAmount) > 0 || materials.compareTo(maxAmount) > 0
                || additional.compareTo(maxAmount) > 0 || duration.signum() <= 0
                || duration.compareTo(new BigDecimal("999.9")) > 0
                || labor.stripTrailingZeros().scale() > 2
                || materials.stripTrailingZeros().scale() > 2
                || additional.stripTrailingZeros().scale() > 2
                || duration.stripTrailingZeros().scale() > 1) {
            throw new IllegalArgumentException("Quotation amounts must be non-negative and duration must be positive.");
        }
        LocalDate validUntil;
        try {
            validUntil = LocalDate.parse(ApiUtil.requiredString(body, "validityUntil"));
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Quotation validity must use YYYY-MM-DD format.");
        }
        if (validUntil.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Quotation validity cannot be in the past.");
        }
        String notes = ApiUtil.string(body, "notesExclusions", "");
        String providerId = findProviderId(user.getId());
        if (providerId == null) {
            ApiUtil.error(response, HttpServletResponse.SC_FORBIDDEN, "Provider profile is not available.");
            return;
        }
        String id = quotationDAO.create(bookingId, providerId, user.getId(), labor, materials,
                additional, duration, Date.valueOf(validUntil), notes);
        ApiUtil.json(response, HttpServletResponse.SC_CREATED,
                Map.of("success", true, "data", quotationDAO.list(user, bookingId)
                        .stream().filter(quote -> id.equals(quote.get("id"))).findFirst().orElse(Map.of("id", id))));
    }

    private BigDecimal amount(JsonObject body, String key) {
        if (!body.has(key) || body.get(key).isJsonNull()) {
            throw new IllegalArgumentException(key + " is required.");
        }
        return body.get(key).getAsBigDecimal();
    }

    private BigDecimal optionalAmount(JsonObject body, String key, BigDecimal fallback) {
        return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsBigDecimal() : fallback;
    }

    private String findProviderId(String userId) throws SQLException {
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "SELECT id FROM provider_profiles WHERE user_id = ?")) {
            statement.setString(1, userId);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? rs.getString("id") : null;
            }
        }
    }
}
