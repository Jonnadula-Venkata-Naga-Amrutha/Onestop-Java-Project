-- ====================================================================
-- OneStop — Demonstration Seed Data
-- Database: onestop_db
-- Note: These records are demonstration seed data for local testing.
-- ====================================================================

USE onestop_db;

-- 1. Insert Service Categories
INSERT INTO service_categories (id, code, name_en, name_te, description, icon_name, base_estimate, image_url) VALUES
('cat-1', 'ELECTRICIAN', 'Electrician & Wiring', 'ఎలక్ట్రీషియన్ & వైరింగ్', 'Circuit breakers, short circuits, architectural fixtures, inverter wiring, and load balancing.', 'Zap', 350.00, '/src/assets/images/category_electrician_1792931706112.jpg'),
('cat-2', 'PLUMBER', 'Plumbing & Water Systems', 'ప్లంబింగ్ & నీటి వ్యవస్థలు', 'Leak detection, copper piping, geyser installation, brass fittings, and sump pumps.', 'Wrench', 300.00, '/src/assets/images/category_plumber_1792931707010.jpg'),
('cat-3', 'TUTOR', 'Academic Tutoring', 'విద్యా ట్యూటరింగ్', 'CBSE/ICSE math, physics, coding, standardized test prep, and customized 1-on-1 coaching.', 'GraduationCap', 600.00, '/src/assets/images/category_tutor_1792931708022.jpg'),
('cat-4', 'CARPENTER', 'Custom Carpentry & Woodcraft', 'కార్పెంట్రీ & కలప పని', 'Modular kitchen repair, teak door alignment, bespoke storage cabinets, and lock installations.', 'Hammer', 450.00, '/src/assets/images/hero_craftsman_service_1792931705892.jpg'),
('cat-5', 'APPLIANCE_REPAIR', 'Appliance Repair', 'గృహోపకరణాల మరమ్మత్తు', 'Inverter AC gas charging, refrigerator PCB diagnostics, washing motor repair, and microwave repair.', 'Tv', 400.00, '/src/assets/images/category_electrician_1792931706112.jpg'),
('cat-6', 'CLEANER', 'Deep Cleaning & Sanitization', 'డీప్ క్లీనింగ్ & శానిటైజేషన్', 'Industrial vacuuming, kitchen degreasing, bathroom descaling, sofa shampooing, and water tank cleaning.', 'Sparkles', 800.00, '/src/assets/images/category_plumber_1792931707010.jpg'),
('cat-7', 'PAINTER', 'Precision Painting', 'పెయింటింగ్ సేవలు', 'Waterproofing putty, anti-fungal exterior coats, stencil textures, and smooth PU wood polish.', 'Paintbrush', 500.00, '/src/assets/images/hero_craftsman_service_1792931705892.jpg'),
('cat-8', 'MECHANIC', 'Automotive & 2-Wheeler Mechanic', 'ఆటో మెకానిక్ సేవలు', 'Doorstep brake tuning, battery jump-start, spark plug service, clutch cable replacement, and oil flush.', 'Car', 350.00, '/src/assets/images/hero_craftsman_service_1792931705892.jpg');

-- 2. Insert Users (BCrypt hashes for 'password123')
INSERT INTO users (id, email, password_hash, role, full_name, phone, status, created_at) VALUES
('user-cust-1', 'ramesh.sharma@example.com', '$2a$12$e8Y6bF4pQ5e/XkQp7gT3Q.5m7VzJ8Z8Hq6t/x6aXoGq1PzT9wL8bK', 'CUSTOMER', 'Ramesh Sharma', '+91 98480 12345', 'ACTIVE', NOW()),
('user-cust-2', 'priya.nair@example.com', '$2a$12$e8Y6bF4pQ5e/XkQp7gT3Q.5m7VzJ8Z8Hq6t/x6aXoGq1PzT9wL8bK', 'CUSTOMER', 'Priya Nair', '+91 98480 54321', 'ACTIVE', NOW()),
('user-prov-1', 'rajesh.electric@example.com', '$2a$12$e8Y6bF4pQ5e/XkQp7gT3Q.5m7VzJ8Z8Hq6t/x6aXoGq1PzT9wL8bK', 'PROVIDER', 'Rajesh Kumar', '+91 98491 11223', 'ACTIVE', NOW()),
('user-prov-2', 'anitha.tutor@example.com', '$2a$12$e8Y6bF4pQ5e/XkQp7gT3Q.5m7VzJ8Z8Hq6t/x6aXoGq1PzT9wL8bK', 'PROVIDER', 'Anitha Reddy, M.Sc.', '+91 98492 33445', 'ACTIVE', NOW()),
('user-prov-3', 'srinivas.plumb@example.com', '$2a$12$e8Y6bF4pQ5e/XkQp7gT3Q.5m7VzJ8Z8Hq6t/x6aXoGq1PzT9wL8bK', 'PROVIDER', 'Srinivas Rao', '+91 98493 55667', 'ACTIVE', NOW()),
('user-prov-4', 'mohan.carpenter@example.com', '$2a$12$e8Y6bF4pQ5e/XkQp7gT3Q.5m7VzJ8Z8Hq6t/x6aXoGq1PzT9wL8bK', 'PROVIDER', 'Mohan Varma', '+91 98494 77889', 'ACTIVE', NOW()),
('user-admin-1', 'admin@onestop.org', '$2a$12$e8Y6bF4pQ5e/XkQp7gT3Q.5m7VzJ8Z8Hq6t/x6aXoGq1PzT9wL8bK', 'ADMIN', 'Super Administrator', '+91 90000 00001', 'ACTIVE', NOW());

-- 3. Customer Profiles
INSERT INTO customer_profiles (id, user_id, address_line, city, state, postal_code, preferred_language) VALUES
('cp-1', 'user-cust-1', 'Flat 402, Sai Residency, Benz Circle', 'Vijayawada', 'Andhra Pradesh', '520010', 'en'),
('cp-2', 'user-cust-2', 'Plot 88, Jubilee Hills Road 36', 'Hyderabad', 'Telangana', '500033', 'en');

-- 4. Provider Profiles
INSERT INTO provider_profiles (id, user_id, business_name, bio, years_experience, rating_avg, review_count, completed_jobs_count, is_verified, emergency_available, base_hourly_rate, profile_image_url, city) VALUES
('prov-1', 'user-prov-1', 'Apex Electrical Solutions & Automation', 'Government Licensed Grade-A Electrical Contractor with 12+ years expertise in residential rewiring, distribution boards, load stabilization, and emergency fault isolation.', 12, 4.90, 148, 312, TRUE, TRUE, 450.00, '/src/assets/images/category_electrician_1792931706112.jpg', 'Vijayawada'),
('prov-2', 'user-prov-2', 'Vedic Math & STEM Learning Academy', 'Post-graduate in Applied Physics with 8 years of personalized coaching. Specialized in CBSE/ICSE grades 8-12 mathematics, physics fundamentals, and competitive Olympiads.', 8, 4.95, 92, 185, TRUE, FALSE, 650.00, '/src/assets/images/category_tutor_1792931708022.jpg', 'Hyderabad'),
('prov-3', 'user-prov-3', 'Krishna HydroTech Plumbing & Leak Detection', 'Certified plumbing master with acoustic water leak detection tools, concealed pipe repair, pressure pump fitting, and water softener installation.', 15, 4.85, 210, 480, TRUE, TRUE, 400.00, '/src/assets/images/category_plumber_1792931707010.jpg', 'Vijayawada'),
('prov-4', 'user-prov-4', 'Varma Teak Craft & Modular Joinery', 'Master carpenter specializing in solid teak wood restorations, modular kitchen drawer mechanisms, concealed wardrobe fittings, and emergency lock changes.', 14, 4.80, 84, 160, TRUE, TRUE, 500.00, '/src/assets/images/hero_craftsman_service_1792931705892.jpg', 'Visakhapatnam');

-- 5. Bookings
INSERT INTO bookings (id, booking_reference, customer_id, provider_id, service_id, category_id, problem_description, service_address, city, scheduled_date, scheduled_time_slot, status, is_emergency, estimated_total, created_at) VALUES
('book-101', 'SB-2026-9041', 'user-cust-1', 'prov-1', 'srv-1', 'cat-1', 'Frequent main breaker tripping whenever high-load air conditioner turns on.', 'Flat 402, Sai Residency, Benz Circle', 'Vijayawada', '2026-10-26', '10:00 AM - 12:00 PM', 'CONFIRMED', FALSE, 850.00, NOW()),
('book-102', 'SB-2026-8812', 'user-cust-1', 'prov-3', 'srv-2', 'cat-2', 'Motor running continuously without filling overhead tank. Cracked joint near inlet.', 'Plot 18, Road No. 4, Patamata', 'Vijayawada', '2026-10-22', '02:00 PM - 04:00 PM', 'COMPLETED', FALSE, 1200.00, NOW());

-- 6. Quotations
INSERT INTO quotations (id, booking_id, provider_id, labor_cost, material_cost, additional_charges, total_quoted_amount, estimated_duration_hours, validity_until, notes_exclusions, status) VALUES
('quote-201', 'book-101', 'prov-1', 500.00, 350.00, 0.00, 850.00, 2.5, '2026-10-28', 'Includes replacement of faulty 32A C-curve breaker and thermal scanning.', 'ACCEPTED'),
('quote-202', 'book-101', 'prov-3', 600.00, 400.00, 50.00, 1050.00, 3.0, '2026-10-28', 'Comprehensive electrical diagnostics with auxiliary grounding check.', 'DECLINED');

-- 7. Reviews
INSERT INTO reviews (id, booking_id, customer_id, provider_id, rating, comment, punctuality_rating, quality_rating, value_rating, provider_response) VALUES
('rev-301', 'book-102', 'user-cust-1', 'prov-3', 5, 'Srinivas Rao arrived punctually with diagnostic gear. Detected the underground joint hairline fracture within 15 minutes. Highly recommended!', 5, 5, 5, 'Thank you Ramesh garu! Pleased that your water line is running smoothly now.');

-- 8. Verification Requests
INSERT INTO verification_requests (id, provider_id, document_type, document_number, document_file_url, status, reviewer_notes, submitted_at, reviewed_at) VALUES
('verif-1', 'prov-1', 'TRADE_LICENSE', 'AP-ELEC-LIC-98442', '/docs/trade_lic_98442.pdf', 'APPROVED', 'Verified with Andhra Pradesh Electrical Inspectorate register.', NOW(), NOW());
