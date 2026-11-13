package com.skillbridge.dao;

import com.skillbridge.model.User;
import com.skillbridge.model.UserRole;
import com.skillbridge.util.DBConnectionUtil;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.*;

public class UserDAO {

    public User authenticate(String email, String plaintextPassword) throws SQLException {
        String sql = "SELECT id, email, password_hash, role, full_name, phone, status, created_at " +
                     "FROM users WHERE email = ? AND status = 'ACTIVE'";

        try (Connection conn = DBConnectionUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password_hash");
                    if (BCrypt.checkpw(plaintextPassword, storedHash)) {
                        User user = new User();
                        user.setId(rs.getString("id"));
                        user.setEmail(rs.getString("email"));
                        user.setRole(UserRole.valueOf(rs.getString("role")));
                        user.setFullName(rs.getString("full_name"));
                        user.setPhone(rs.getString("phone"));
                        user.setStatus(rs.getString("status"));
                        return user;
                    }
                }
            }
        }
        return null;
    }
}
