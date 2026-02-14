-- DEBUG SCRIPT: Test Login Database Update
-- Run this to see the REAL error message hiding behind the "500 Internal Server Error"

BEGIN;
    UPDATE auth.users 
    SET last_sign_in_at = NOW() 
    WHERE email = 'farmer1@sadec.local';
COMMIT;

SELECT 'Login Simulation Successful' as status;
