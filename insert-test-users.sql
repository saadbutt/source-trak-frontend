-- Insert test users with correct MD5 hashes
-- MD5 hash of "password123" is: 482c811da5d5b4bc6d497ffa98491e38

INSERT INTO users (id, name, email, password, role) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Test Farmer', 'farmer@test.com', '482c811da5d5b4bc6d497ffa98491e38', 'Farmer'),
('550e8400-e29b-41d4-a716-446655440002', 'Test Producer', 'producer@test.com', '482c811da5d5b4bc6d497ffa98491e38', 'Producer'),
('550e8400-e29b-41d4-a716-446655440003', 'Test Logistics', 'logistics@test.com', '482c811da5d5b4bc6d497ffa98491e38', 'Logistics'),
('550e8400-e29b-41d4-a716-446655440004', 'Test Retailer', 'retailer@test.com', '482c811da5d5b4bc6d497ffa98491e38', 'Retailer')
ON CONFLICT (email) DO NOTHING;

-- Verify the users were inserted
SELECT id, name, email, role, created_at FROM users;
