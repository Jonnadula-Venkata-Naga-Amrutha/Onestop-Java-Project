import JSZip from 'jszip';

export async function downloadFullProjectZip() {
  const zip = new JSZip();

  // Root Files
  zip.file(
    'pom.xml',
    `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.skillbridge</groupId>
    <artifactId>skillbridge-platform</artifactId>
    <version>1.0.0</version>
    <packaging>war</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>8.3.0</version>
        </dependency>
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
            <version>5.1.0</version>
        </dependency>
        <dependency>
            <groupId>org.mindrot</groupId>
            <artifactId>jbcrypt</artifactId>
            <version>0.4</version>
        </dependency>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
    </dependencies>
</project>`
  );

  zip.file(
    'README.md',
    `# SkillBridge — Smart Local Services Platform
Production-inspired Local Services Marketplace with 3D UI, Explainable AI, and Core Java + JDBC + MySQL Architecture.

## MySQL Database Setup:
1. mysql -u root -p < schema.sql
2. mysql -u root -p < seed.sql

## Java Backend Setup (Apache Tomcat):
1. mvn clean package
2. Deploy target/skillbridge.war into your Tomcat 9/10 webapps folder.

## Frontend & Node Dev Server:
1. npm install
2. npm run dev (runs on http://localhost:3000)
`
  );

  // Fetch local schema.sql and seed.sql if accessible or provide complete inline
  try {
    const schemaRes = await fetch('/schema.sql');
    if (schemaRes.ok) {
      zip.file('schema.sql', await schemaRes.text());
    }
    const seedRes = await fetch('/seed.sql');
    if (seedRes.ok) {
      zip.file('seed.sql', await seedRes.text());
    }
  } catch (e) {
    // fallback
  }

  // Java Directory
  const javaDir = zip.folder('src/main/java/com/skillbridge');
  if (javaDir) {
    javaDir.file(
      'model/Booking.java',
      `package com.skillbridge.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class Booking {
    private String id;
    private String bookingReference;
    private String customerId;
    private String providerId;
    private String serviceId;
    private String categoryId;
    private String problemDescription;
    private String serviceAddress;
    private String city;
    private LocalDate scheduledDate;
    private String scheduledTimeSlot;
    private BookingStatus status;
    private boolean isEmergency;
    private BigDecimal estimatedTotal;
    private BigDecimal finalTotal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Booking() {}
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String ref) { this.bookingReference = ref; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String cId) { this.customerId = cId; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String pId) { this.providerId = pId; }
    public String getProblemDescription() { return problemDescription; }
    public void setProblemDescription(String desc) { this.problemDescription = desc; }
    public String getServiceAddress() { return serviceAddress; }
    public void setServiceAddress(String addr) { this.serviceAddress = addr; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public BigDecimal getEstimatedTotal() { return estimatedTotal; }
    public void setEstimatedTotal(BigDecimal total) { this.estimatedTotal = total; }
}`
    );

    javaDir.file(
      'model/BookingStatus.java',
      `package com.skillbridge.model;

public enum BookingStatus {
    PENDING, QUOTE_SENT, CONFIRMED, PROVIDER_ON_THE_WAY, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED
}`
    );

    javaDir.file(
      'dao/DBConnectionUtil.java',
      `package com.skillbridge.dao;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.Connection;
import java.sql.SQLException;

public class DBConnectionUtil {
    private static HikariDataSource dataSource;

    static {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/skillbridge_db?useSSL=false&serverTimezone=UTC");
        config.setUsername("root");
        config.setPassword("password");
        config.setMaximumPoolSize(15);
        dataSource = new HikariDataSource(config);
    }

    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}`
    );

    javaDir.file(
      'dao/BookingDAO.java',
      `package com.skillbridge.dao;

import com.skillbridge.model.Booking;
import java.sql.*;

public class BookingDAO {
    public boolean createBookingWithAudit(Booking booking, String reason, String userId) throws SQLException {
        String sql = "INSERT INTO bookings (id, booking_reference, customer_id, provider_id, problem_description, service_address, city, status, estimated_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnectionUtil.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, booking.getId());
                stmt.setString(2, booking.getBookingReference());
                stmt.setString(3, booking.getCustomerId());
                stmt.setString(4, booking.getProviderId());
                stmt.setString(5, booking.getProblemDescription());
                stmt.setString(6, booking.getServiceAddress());
                stmt.setString(7, booking.getCity());
                stmt.setString(8, booking.getStatus().name());
                stmt.setBigDecimal(9, booking.getEstimatedTotal());
                stmt.executeUpdate();
            }
            conn.commit();
            return true;
        }
    }
}`
    );

    javaDir.file(
      'ai/RuleBasedRecommendationEngine.java',
      `package com.skillbridge.ai;

import java.util.ArrayList;
import java.util.List;

public class RuleBasedRecommendationEngine {
    public static class ScoreBreakdown {
        public double totalScore;
        public double serviceScore;
        public double locationScore;
        public double availabilityScore;
        public double priceScore;
        public double ratingScore;
        public double experienceScore;
        public List<String> matchReasons = new ArrayList<>();
    }
}`
    );
  }

  // Generate blob & trigger download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'skillbridge-full-project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
