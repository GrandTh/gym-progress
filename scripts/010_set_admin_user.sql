-- Set user as admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = '4d3408c3-9609-45a6-9fc8-619c7a954412';

-- Verify the update
SELECT id, display_name, first_name, last_name, role 
FROM profiles 
WHERE id = '4d3408c3-9609-45a6-9fc8-619c7a954412';
