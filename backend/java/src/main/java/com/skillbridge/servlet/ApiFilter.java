package com.skillbridge.servlet;

import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import com.skillbridge.dao.UserDAO;
import com.skillbridge.util.ApiUtil;
import com.skillbridge.util.ApiRolePolicy;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.SQLException;

@WebFilter("/api/*")
public class ApiFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String path = httpRequest.getRequestURI().substring(httpRequest.getContextPath().length());
        String method = httpRequest.getMethod();
        try {
            if ("OPTIONS".equals(method) || isPublic(path, method)) {
                chain.doFilter(request, response);
                return;
            }

            HttpSession session = httpRequest.getSession(false);
            User user = session == null ? null : (User) session.getAttribute(ApiUtil.USER_ATTRIBUTE);
            boolean active;
            try {
                active = user != null && new UserDAO().isActive(user.getId());
            } catch (SQLException e) {
                throw new ServletException("Unable to verify the authenticated account.", e);
            }
            if (!active) {
                if (session != null) {
                    session.invalidate();
                }
                ApiUtil.error(httpResponse, HttpServletResponse.SC_UNAUTHORIZED, "Sign in to continue.");
                return;
            }

            UserRole requiredRole = ApiRolePolicy.requiredRole(path, method);
            if (requiredRole != null && user.getRole() != requiredRole) {
                ApiUtil.error(httpResponse, HttpServletResponse.SC_FORBIDDEN,
                        "This action is not available for your account.");
                return;
            }

            httpRequest.setAttribute(ApiUtil.USER_ATTRIBUTE, user);
            chain.doFilter(request, response);
        } catch (ServletException e) {
            httpRequest.getServletContext().log("ONESTOP API request failed.", e);
            if (httpResponse.isCommitted()) {
                throw e;
            }
            SQLException sqlException = findSqlException(e);
            boolean unavailable = sqlException != null
                    && ((sqlException.getSQLState() != null && sqlException.getSQLState().startsWith("08"))
                    || (sqlException.getMessage() != null
                    && sqlException.getMessage().contains("MYSQL_PASSWORD must be configured")));
            ApiUtil.error(httpResponse,
                    unavailable ? HttpServletResponse.SC_SERVICE_UNAVAILABLE : HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    unavailable
                            ? "The database is temporarily unavailable. Please retry."
                            : "The request could not be completed.");
        }
    }

    private SQLException findSqlException(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof SQLException sqlException) {
                return sqlException;
            }
            current = current.getCause();
        }
        return null;
    }

    private boolean isPublic(String path, String method) {
        return path.equals("/api/health")
                || path.equals("/api/categories") && "GET".equals(method)
                || path.equals("/api/providers") && "GET".equals(method)
                || path.matches("/api/providers/[^/]+") && "GET".equals(method)
                || path.equals("/api/reviews") && "GET".equals(method)
                || path.equals("/api/auth/login") && "POST".equals(method)
                || path.equals("/api/auth/register") && "POST".equals(method)
                || path.equals("/api/auth/me") && "GET".equals(method)
                || path.equals("/api/auth/logout") && "POST".equals(method);
    }

}
