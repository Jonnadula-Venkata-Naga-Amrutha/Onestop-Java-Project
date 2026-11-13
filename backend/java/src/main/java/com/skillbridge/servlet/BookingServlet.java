package com.skillbridge.servlet;

import com.google.gson.Gson;
import com.skillbridge.dao.BookingDAO;
import com.skillbridge.model.Booking;
import com.skillbridge.model.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/bookings/*")
public class BookingServlet extends HttpServlet {

    private final BookingDAO bookingDAO = new BookingDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("CURRENT_USER") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\": false, \"message\": \"Authentication session required.\"}");
            return;
        }

        User user = (User) session.getAttribute("CURRENT_USER");
        Booking booking = gson.fromJson(req.getReader(), Booking.class);

        try {
            boolean created = bookingDAO.createBookingWithAudit(booking, "Customer created booking request", user.getId());
            Map<String, Object> result = new HashMap<>();
            result.put("success", created);
            result.put("message", created ? "Booking created successfully" : "Failed to record booking");
            out.write(gson.toJson(result));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
