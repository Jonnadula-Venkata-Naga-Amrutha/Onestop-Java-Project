# ONESTOP — Smart Local Services Platform

ONESTOP connects customers with local service providers. The active application architecture is:

**React + TypeScript + Vite → Core Java Servlets → JDBC/HikariCP → MySQL (`onestop_db`)**

The Node.js backend source is retained for reference but is not used by the root run or build scripts.

## Requirements

- Node.js and npm
- JDK 17
- Apache Maven
- MySQL 8.0+
- Apache Tomcat 10.1

## Database setup

Apply the canonical schema using a MySQL administrative account:

```powershell
& $env:ComSpec /c 'mysql -u root -p < backend\database\schema.sql'
```

For an existing installation, back up the database and apply the additive migrations in order:

```powershell
& $env:ComSpec /c 'mysql -u root -p onestop_db < backend\database\migrations\001_add_service_title_and_safe_invoice_defaults.sql'
& $env:ComSpec /c 'mysql -u root -p onestop_db < backend\database\migrations\002_add_attachment_data.sql'
```

Create a least-privilege application account using a unique local secret, then configure the Tomcat process environment. Do not grant the runtime account schema-administration privileges:

```sql
CREATE USER 'onestop_app'@'localhost' IDENTIFIED BY '<unique local secret>';
GRANT SELECT, INSERT, UPDATE, DELETE ON onestop_db.* TO 'onestop_app'@'localhost';
```

```powershell
$env:MYSQL_HOST = "127.0.0.1"
$env:MYSQL_PORT = "3306"
$env:MYSQL_DB = "onestop_db"
$env:MYSQL_USER = "onestop_app"
$env:MYSQL_PASSWORD = "<locally configured secret>"
$env:MYSQL_SSL_MODE = "DISABLED"
$env:SESSION_COOKIE_SECURE = "false"
```

`MYSQL_SSL_MODE` accepts `DISABLED`, `PREFERRED`, `REQUIRED`, `VERIFY_CA`, or `VERIFY_IDENTITY`. Use `VERIFY_IDENTITY` with a trusted server certificate in production. Set `SESSION_COOKIE_SECURE=true` when serving over HTTPS. Local HTTP development uses `DISABLED` and an insecure cookie by necessity.

The optional seed is for a disposable development database only. Every demo account uses the shared password `password123`; never load this seed or use these credentials in production:

```powershell
& $env:ComSpec /c 'mysql -u root -p onestop_db < backend\database\seed.sql'
```

Without seed data, users can register through the UI as customers or providers. Public registration cannot create administrators. Production administrator provisioning must be performed through a controlled DBA process using a unique BCrypt password hash; never reuse demo credentials.

## Build and run

Build and test the Java WAR:

```powershell
npm run test:java
npm run package:java
```

Set `CATALINA_HOME` to the installed Tomcat 10.1 directory. With the required `MYSQL_*` and `SESSION_COOKIE_SECURE` variables set in the Tomcat terminal:

```powershell
Copy-Item backend\java\target\onestop.war "$env:CATALINA_HOME\webapps\onestop.war"
& "$env:CATALINA_HOME\bin\catalina.bat" run
```

The application context is `/onestop`; confirm it is ready at `http://localhost:8080/onestop/api/health`.

In another terminal:

```powershell
npm --prefix frontend install
npm run typecheck
npm run dev
```

Vite runs at `http://localhost:3000` and proxies `/api` to Tomcat. For the complete production build:

```powershell
npm run build
```

The build performs a TypeScript check, creates the Vite frontend bundle, and packages the Java WAR.

## API overview

- Authentication: `/api/auth/{register,login,logout,me}`
- Public catalog: `/api/categories`, `/api/providers`, `/api/reviews`
- Customer/provider bookings: `/api/bookings`
- Quotations: `/api/quotations` (create, accept, decline)
- Provider profile, service categories, service areas, availability and verification: `/api/provider/*`
- Admin users, verification, audit log: `/api/admin/*`
- Complaints: `/api/complaints`
- Notifications and invoices: `/api/notifications`, `/api/invoices`
- Database health: `/api/health`

## Current scope notes

- Booking completion creates an invoice marked `UNPAID` / `NOT_RECORDED`. No payment gateway or manual payment-recording operation is implemented; the app never claims a payment succeeded.
- Provider revenue counts invoices explicitly marked `PAID`; completed-but-unpaid work is shown separately.
- Verification currently stores credential numbers, not uploaded credential documents.
- A provider can quote only on bookings assigned to that provider. Multi-provider bidding is not implemented.
- Database/Tomcat end-to-end testing requires a configured local MySQL account and Tomcat 10.1 deployment.
