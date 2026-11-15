# ONESTOP Cursor Handoff

## Current status

- Work remains on `mysql-integration`; no branch switch, commit, or push was performed.
- The active runtime architecture is React + TypeScript + Vite → Core Java Servlets → JDBC/HikariCP → MySQL (`onestop_db`). The existing Node backend source remains in the repository but is not used by the root run/build scripts.
- The final frontend typecheck and production build passed. `mvn clean package` passed all 12 Java tests and produced `backend/java/target/onestop.war`.
- MySQL/Tomcat end-to-end testing is still outstanding. The local MySQL80 service is running, but no MySQL CLI or configured database credentials were available; Tomcat is not available in the environment.

## Implemented functionality

- HikariCP and MySQL Connector/J configuration uses `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_SSL_MODE`. The canonical DB name is `onestop_db`; credentials are not hardcoded. Database initialization is explicit and repeatable; no destructive `DROP` statements were added.
- Tomcat 10.1/Jakarta Servlet REST APIs implement BCrypt authentication, session rotation and expiry, current-session lookup, logout, role-based access, active-account checks, ownership checks, request validation, and JSON errors. Session cookies are HttpOnly/SameSite=Lax; `SESSION_COOKIE_SECURE` controls the Secure flag.
- Customer and provider registration, login/session restoration, public categories/provider search/provider details/reviews, customer booking creation/history/status, emergency requests, protected booking photos, quotations with accept/decline, complaints, notifications, reviews, and invoice reads are database-backed.
- Provider self-service updates profile, offered categories, service localities, weekly availability, and verification requests. Standard bookings are checked against configured provider availability; emergency bookings require emergency availability.
- Admin APIs provide user activation/suspension, verification approval/rejection, and audit-log reads. Complaint status updates are admin-only. Booking, quotation, verification, and admin user-status writes are transactionally handled where related records change.
- Frontend business data uses asynchronous REST operations instead of localStorage as its source of truth. Vite proxies `/api` to Tomcat's `/onestop` context. Login/session expiry, loading/error states, customer/provider/admin screens, and invoice status are integrated without replacing the existing design.
- Completion creates an invoice marked `UNPAID` / `NOT_RECORDED`. No payment gateway or manual payment recording is implemented; the UI does not claim that a payment succeeded. Provider revenue counts only invoices actually marked `PAID`.
- Seed data is explicitly development-only; seeded demo accounts use `password123`. Public registration cannot create admin accounts.

## Files created and modified

- Documentation/configuration: `README.md`, `CURSOR_HANDOFF.md`, root and frontend `package.json`, `frontend/vite.config.ts`, `backend/java/pom.xml`.
- Database: `backend/database/schema.sql`, `backend/database/seed.sql`, matching public SQL copies, and additive migrations `001_add_service_title_and_safe_invoice_defaults.sql` and `002_add_attachment_data.sql`.
- Java changes: booking, quotation, and user DAOs; booking model/servlet; DB connection utility; new REST servlets for auth, catalog, provider, admin, complaints, notifications, invoices, reviews, quotations, and health; API filter/lifecycle listener; auth/session, role, booking, password, rating, registration, and JSON utilities.
- Java tests: H2-backed DAO workflow tests and focused auth/session, role, password, booking policy, rating, and registration tests under `backend/java/src/test/`.
- Frontend changes: API service and storage integration, app/session bootstrap, auth modal, customer/provider/admin dashboards, booking/emergency/quotation/notification UI, architecture modal, main entrypoint, and project exporter.

## Schema and setup

1. Use `backend/database/schema.sql` for a new database. For existing installations, back up first and apply migrations `001` then `002`; both are additive. `backend/database/seed.sql` is optional and only for a disposable development DB.
2. Create a least-privilege MySQL runtime account with `SELECT, INSERT, UPDATE, DELETE` on `onestop_db.*`; perform schema/migration work with a separate administrative account.
3. Configure the Tomcat process environment: `MYSQL_HOST=127.0.0.1`, `MYSQL_PORT=3306`, `MYSQL_DB=onestop_db`, `MYSQL_USER=onestop_app`, `MYSQL_PASSWORD=<local secret>`, `MYSQL_SSL_MODE=DISABLED`, `SESSION_COOKIE_SECURE=false` for local HTTP. Use `VERIFY_IDENTITY` and HTTPS in production.
4. Set `CATALINA_HOME` to an installed Tomcat 10.1 directory. Deploy `backend/java/target/onestop.war` as `webapps/onestop.war`; the application context is `/onestop`.
5. From the repository root, install frontend dependencies with `npm --prefix frontend install`. Start Vite using `npm run dev`; it proxies `/api` to `http://localhost:8080/onestop`.

## API inventory

- Public: `GET /api/health`, `/api/categories`, `/api/providers`, `/api/providers/{id}`, `/api/reviews`.
- Auth: `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me`.
- Bookings: `GET/POST /api/bookings`, `GET /api/bookings/{id}`, `PATCH /api/bookings/{id}/status`, and authorized `GET /api/bookings/{id}/attachments/{attachmentId}`.
- Quotations: `GET /api/quotations?bookingId=...`, `POST /api/quotations`, `POST /api/quotations/{id}/accept`, `/decline`.
- Provider: `PATCH /api/provider/profile`; `PUT /api/provider/services`, `/areas`, `/availability`; `GET /api/provider/availability`, `/verifications`; `POST /api/provider/verifications`.
- Admin: `GET /api/admin/users`, `/verifications`, `/audit-logs`; `PATCH /api/admin/users/{id}`, `/verifications/{id}`.
- Other workflows: `GET/POST /api/complaints`, admin-only `PATCH /api/complaints/{id}`; `GET /api/notifications`, `PATCH /api/notifications/{id}/read`, `/api/notifications/read-all`; `GET /api/invoices`; `GET/POST /api/reviews`.

## Validation performed

- `npm run build` — passed TypeScript `tsc --noEmit`, Vite production build, and Maven `clean package`.
- Maven result: 12 tests, 0 failures/errors/skips; H2-backed DAO tests cover user registration/authentication, booking lifecycle/invoices, and quotation acceptance/decline, plus focused policy/security tests. WAR created at `backend/java/target/onestop.war`.
- Vite emitted a non-fatal advisory that the minified JavaScript chunk exceeds 500 kB.
- `git diff --check` — passed. Git emitted only expected Windows LF/CRLF conversion notices.
- Confirmed `backend/database/schema.sql` matches `frontend/public/schema.sql`, and the corresponding seed files match.
- Tests use H2 in MySQL compatibility mode; they do not prove compatibility with a live MySQL instance or exercise deployed Tomcat/HTTP sessions.

## Known gaps and pending verification

- Configure MySQL credentials and Tomcat 10.1, apply the schema/migrations to a disposable or backed-up database, deploy the WAR, verify `/onestop/api/health`, and run browser/API checks across customer, provider, and admin flows. Persistence across application restarts has not been live-tested.
- Provider verification stores credential numbers but does not upload or securely display verification documents.
- Providers can quote only on bookings assigned to them; multi-provider bidding/discovery is not implemented.
- No payment processor or manual payment recording is supported; invoices remain unpaid absent a real verified payment event.
- Production admin bootstrap remains an operator/DBA task. Never use seeded demo accounts or passwords in production.
- The Vite bundle-size advisory remains. No other claim of live database/Tomcat validation should be made.

## Commands

From the repository root:

```powershell
npm --prefix frontend install
npm run typecheck
npm run test:java
npm run package:java
npm run build
npm run dev
```

Apply the schema with MySQL CLI from the repository root:

```powershell
& $env:ComSpec /c 'mysql -u root -p < backend\database\schema.sql'
```

For an existing database, take a backup, then apply `backend\database\migrations\001_add_service_title_and_safe_invoice_defaults.sql` followed by `backend\database\migrations\002_add_attachment_data.sql`. Seed only a disposable development database.

Set the MySQL and session-cookie environment variables in the Tomcat terminal, set `CATALINA_HOME`, then deploy and start Tomcat:

```powershell
Copy-Item backend\java\target\onestop.war "$env:CATALINA_HOME\webapps\onestop.war"
& "$env:CATALINA_HOME\bin\catalina.bat" run
```

Confirm `http://localhost:8080/onestop/api/health`, then launch Vite in another terminal with `npm run dev` and open `http://localhost:3000`.
