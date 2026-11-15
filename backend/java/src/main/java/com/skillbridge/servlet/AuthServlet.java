package com.skillbridge.servlet;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.skillbridge.dao.UserDAO;
import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import com.skillbridge.util.ApiUtil;
import com.skillbridge.util.AuthSession;
import com.skillbridge.util.RegistrationPolicy;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@WebServlet("/api/auth/*")
public class AuthServlet extends HttpServlet {
    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (!"/me".equals(request.getPathInfo())) {
            ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Authentication route not found.");
            return;
        }
        HttpSession session = request.getSession(false);
        User user = session == null ? null : (User) session.getAttribute(ApiUtil.USER_ATTRIBUTE);
        if (user == null) {
            ApiUtil.error(response, HttpServletResponse.SC_UNAUTHORIZED, "Not signed in.");
            return;
        }
        ApiUtil.success(response, ApiUtil.userView(user));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getPathInfo();
        try {
            if ("/register".equals(path)) {
                register(request, response);
            } else if ("/login".equals(path)) {
                login(request, response);
            } else if ("/logout".equals(path)) {
                logout(request, response);
            } else {
                ApiUtil.error(response, HttpServletResponse.SC_NOT_FOUND, "Authentication route not found.");
            }
        } catch (IllegalArgumentException e) {
            ApiUtil.error(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (SQLException e) {
            if ("23000".equals(e.getSQLState())) {
                ApiUtil.error(response, HttpServletResponse.SC_CONFLICT, "That email address is already registered.");
            } else {
                throw new ServletException("Authentication database operation failed.", e);
            }
        }
    }

    private void register(HttpServletRequest request, HttpServletResponse response)
            throws IOException, SQLException {
        JsonObject body = ApiUtil.readObject(request);
        String email = ApiUtil.requiredString(body, "email").toLowerCase(Locale.ROOT);
        String password = body.has("password") && !body.get("password").isJsonNull()
                ? body.get("password").getAsString()
                : "";
        String fullName = ApiUtil.requiredString(body, "fullName");
        String phone = ApiUtil.requiredString(body, "phone");
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Enter a valid email address.");
        }
        if (email.length() > 191) {
            throw new IllegalArgumentException("Email address must be 191 characters or fewer.");
        }
        int passwordBytes = password.getBytes(StandardCharsets.UTF_8).length;
        if (passwordBytes < 8 || passwordBytes > 72) {
            throw new IllegalArgumentException("Password must contain 8 to 72 UTF-8 bytes.");
        }
        validateLength(fullName, "Full name", 120);
        validateLength(phone, "Phone number", 32);

        UserRole role = RegistrationPolicy.role(ApiUtil.requiredString(body, "role"));

        String city = ApiUtil.string(body, "city", "Vijayawada");
        validateLength(city, "City", 64);
        String businessName = role == UserRole.PROVIDER
                ? ApiUtil.requiredString(body, "businessName")
                : null;
        if (businessName != null) {
            validateLength(businessName, "Business name", 160);
        }
        List<String> categories = new ArrayList<>();
        if (role == UserRole.PROVIDER && body.has("serviceCategories") && body.get("serviceCategories").isJsonArray()) {
            JsonArray values = body.getAsJsonArray("serviceCategories");
            values.forEach(value -> categories.add(value.getAsString()));
        }
        if (role == UserRole.PROVIDER && categories.isEmpty()) {
            throw new IllegalArgumentException("Select at least one service category.");
        }
        if (categories.size() > 20 || categories.stream().anyMatch(String::isBlank)) {
            throw new IllegalArgumentException("Select between 1 and 20 valid service categories.");
        }

        User user = userDAO.register(email, password, role, fullName, phone, businessName, city, categories);
        startSession(request, user);
        ApiUtil.json(response, HttpServletResponse.SC_CREATED, Map.of(
                "success", true,
                "data", ApiUtil.userView(user)));
    }

    private void login(HttpServletRequest request, HttpServletResponse response)
            throws IOException, SQLException {
        JsonObject body = ApiUtil.readObject(request);
        String email = ApiUtil.requiredString(body, "email");
        if (!body.has("password") || body.get("password").isJsonNull()) {
            throw new IllegalArgumentException("Password is required.");
        }
        User user = userDAO.authenticate(email, body.get("password").getAsString());
        if (user == null) {
            ApiUtil.error(response, HttpServletResponse.SC_UNAUTHORIZED, "Email or password is incorrect.");
            return;
        }
        startSession(request, user);
        ApiUtil.success(response, ApiUtil.userView(user));
    }

    private void logout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        ApiUtil.json(response, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    private void startSession(HttpServletRequest request, User user) {
        AuthSession.start(request, user);
    }

    private void validateLength(String value, String label, int maxLength) {
        if (value.isBlank() || value.length() > maxLength) {
            throw new IllegalArgumentException(label + " must contain between 1 and " + maxLength + " characters.");
        }
    }
}
