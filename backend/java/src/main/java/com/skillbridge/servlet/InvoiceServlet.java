package com.skillbridge.servlet;

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
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/invoices")
public class InvoiceServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User user = ApiUtil.currentUser(request);
        StringBuilder sql = new StringBuilder(
                "SELECT i.id, i.invoice_number, i.booking_id, i.customer_id, cu.full_name AS customer_name, "
                        + "i.provider_id, p.business_name AS provider_business, i.subtotal, i.tax_amount, "
                        + "i.discount_amount, i.total_amount, i.payment_status, i.payment_method, i.issued_at "
                        + "FROM invoices i JOIN users cu ON cu.id = i.customer_id "
                        + "JOIN provider_profiles p ON p.id = i.provider_id WHERE 1 = 1 ");
        if (user.getRole() == UserRole.CUSTOMER) {
            sql.append("AND i.customer_id = ? ");
        } else if (user.getRole() == UserRole.PROVIDER) {
            sql.append("AND p.user_id = ? ");
        }
        sql.append("ORDER BY i.issued_at DESC");
        List<Map<String, Object>> invoices = new ArrayList<>();
        try (Connection connection = DBConnectionUtil.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            if (user.getRole() != UserRole.ADMIN) {
                statement.setString(1, user.getId());
            }
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> invoice = new LinkedHashMap<>();
                    String id = rs.getString("id");
                    invoice.put("id", id);
                    invoice.put("invoiceNumber", rs.getString("invoice_number"));
                    invoice.put("bookingId", rs.getString("booking_id"));
                    invoice.put("customerId", rs.getString("customer_id"));
                    invoice.put("customerName", rs.getString("customer_name"));
                    invoice.put("providerId", rs.getString("provider_id"));
                    invoice.put("providerBusiness", rs.getString("provider_business"));
                    invoice.put("subtotal", rs.getBigDecimal("subtotal"));
                    invoice.put("taxAmount", rs.getBigDecimal("tax_amount"));
                    invoice.put("discountAmount", rs.getBigDecimal("discount_amount"));
                    invoice.put("totalAmount", rs.getBigDecimal("total_amount"));
                    invoice.put("paymentStatus", rs.getString("payment_status"));
                    invoice.put("paymentMethod", rs.getString("payment_method"));
                    invoice.put("issuedAt", rs.getTimestamp("issued_at").toInstant().toString());
                    invoice.put("items", invoiceItems(connection, id));
                    invoices.add(invoice);
                }
            }
            ApiUtil.success(response, invoices);
        } catch (SQLException e) {
            throw new ServletException("Unable to load invoices.", e);
        }
    }

    private List<Map<String, Object>> invoiceItems(Connection connection, String invoiceId) throws SQLException {
        String sql = "SELECT id, invoice_id, item_description, quantity, unit_price, total_price "
                + "FROM invoice_items WHERE invoice_id = ? ORDER BY id";
        List<Map<String, Object>> items = new ArrayList<>();
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, invoiceId);
            try (ResultSet rs = statement.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getString("id"));
                    item.put("invoiceId", rs.getString("invoice_id"));
                    item.put("itemDescription", rs.getString("item_description"));
                    item.put("quantity", rs.getBigDecimal("quantity"));
                    item.put("unitPrice", rs.getBigDecimal("unit_price"));
                    item.put("totalPrice", rs.getBigDecimal("total_price"));
                    items.add(item);
                }
            }
        }
        return items;
    }
}
