package com.skillbridge.servlet;

import com.skillbridge.util.DBConnectionUtil;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

@WebListener
public class DatabaseLifecycleListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent event) {
        event.getServletContext().getSessionCookieConfig().setHttpOnly(true);
        event.getServletContext().getSessionCookieConfig().setSecure(
                Boolean.parseBoolean(System.getenv().getOrDefault("SESSION_COOKIE_SECURE", "false")));
        event.getServletContext().getSessionCookieConfig().setAttribute("SameSite", "Lax");
    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
        DBConnectionUtil.shutdown();
    }
}
