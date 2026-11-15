package com.skillbridge.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Locale;
import java.util.Set;

/**
 * JDBC Connection Manager using HikariCP for high-throughput connection pooling.
 * Protects database credentials through environment variables or secure configuration.
 */
public class DBConnectionUtil {

    private static volatile HikariDataSource dataSource;


    public static Connection getConnection() throws SQLException {
        HikariDataSource current = dataSource;
        if (current == null) {
            synchronized (DBConnectionUtil.class) {
                current = dataSource;
                if (current == null) {
                    current = createDataSource();
                    dataSource = current;
                }
            }
        }
        return current.getConnection();
    }

    private static HikariDataSource createDataSource() throws SQLException {
        String host = System.getenv().getOrDefault("MYSQL_HOST", "127.0.0.1");
        String port = System.getenv().getOrDefault("MYSQL_PORT", "3306");
        String database = System.getenv().getOrDefault("MYSQL_DB", "onestop_db");
        String username = System.getenv().getOrDefault("MYSQL_USER", "onestop_app");
        String password = System.getenv("MYSQL_PASSWORD");
        String sslMode = System.getenv().getOrDefault("MYSQL_SSL_MODE", "DISABLED").toUpperCase(Locale.ROOT);
        int portNumber;
        try {
            portNumber = Integer.parseInt(port);
        } catch (NumberFormatException e) {
            throw new SQLException("MYSQL_PORT must be a valid TCP port.", e);
        }
        if (portNumber < 1 || portNumber > 65535) {
            throw new SQLException("MYSQL_PORT must be between 1 and 65535.");
        }
        if (!host.matches("[A-Za-z0-9][A-Za-z0-9.-]*|\\[[0-9A-Fa-f:]+\\]")) {
            throw new SQLException("MYSQL_HOST must be a hostname, IPv4 address, or bracketed IPv6 address.");
        }
        if (!database.matches("[A-Za-z0-9_]+")) {
            throw new SQLException("MYSQL_DB may contain only letters, numbers, and underscores.");
        }
        if (!Set.of("DISABLED", "PREFERRED", "REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY").contains(sslMode)) {
            throw new SQLException("MYSQL_SSL_MODE must be a supported MySQL SSL mode.");
        }
        if (password == null || password.isBlank()) {
            throw new SQLException("MYSQL_PASSWORD must be configured before connecting to MySQL.");
        }

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setJdbcUrl("jdbc:mysql://" + host + ":" + port + "/" + database
                + "?sslMode=" + sslMode + "&serverTimezone=UTC"
                + ("DISABLED".equals(sslMode) ? "&allowPublicKeyRetrieval=true" : ""));
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(10000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setPoolName("ONESTOP-MySQL");
        try {
            return new HikariDataSource(config);
        } catch (RuntimeException e) {
            throw new SQLException("Unable to initialize the ONESTOP MySQL connection pool.", e);
        }
    }

    public static void shutdown() {
        HikariDataSource current = dataSource;
        if (current != null) {
            current.close();
            dataSource = null;
        }
    }

    static synchronized void setTestDataSource(HikariDataSource testDataSource) {
        shutdown();
        dataSource = testDataSource;
    }

}
