package com.skillbridge.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;
import com.skillbridge.model.User;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.Reader;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class ApiUtil {
    public static final String USER_ATTRIBUTE = "CURRENT_USER";
    public static final Gson GSON = new GsonBuilder().disableHtmlEscaping().create();

    private ApiUtil() {}

    public static void json(HttpServletResponse response, int status, Object body) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        GSON.toJson(body, response.getWriter());
    }

    public static void success(HttpServletResponse response, Object data) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("data", data);
        json(response, HttpServletResponse.SC_OK, body);
    }

    public static void error(HttpServletResponse response, int status, String message) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", message);
        json(response, status, body);
    }

    public static JsonObject readObject(HttpServletRequest request) throws IOException {
        try {
            Reader reader = request.getReader();
            StringBuilder body = new StringBuilder();
            char[] buffer = new char[4096];
            int count;
            while ((count = reader.read(buffer)) != -1) {
                if (body.length() + count > 8 * 1024 * 1024) {
                    throw new IllegalArgumentException("Request body exceeds the 8 MB limit.");
                }
                body.append(buffer, 0, count);
            }
            return JsonParser.parseString(body.toString()).getAsJsonObject();
        } catch (JsonParseException | IllegalStateException e) {
            throw new IllegalArgumentException("Request body must be a valid JSON object.");
        }
    }

    public static String requiredString(JsonObject body, String key) {
        if (!body.has(key) || body.get(key).isJsonNull()) {
            throw new IllegalArgumentException(key + " is required.");
        }
        String value = body.get(key).getAsString().trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException(key + " is required.");
        }
        return value;
    }

    public static String string(JsonObject body, String key, String fallback) {
        return body.has(key) && !body.get(key).isJsonNull()
                ? body.get(key).getAsString().trim()
                : fallback;
    }

    public static User currentUser(HttpServletRequest request) {
        return (User) request.getAttribute(USER_ATTRIBUTE);
    }

    public static String newId() {
        return UUID.randomUUID().toString();
    }

    public static Map<String, Object> userView(User user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("email", user.getEmail());
        result.put("role", user.getRole().name());
        result.put("fullName", user.getFullName());
        result.put("phone", user.getPhone());
        result.put("status", user.getStatus());
        result.put("createdAt", user.getCreatedAt() == null ? null : user.getCreatedAt().toString());
        return result;
    }
}
