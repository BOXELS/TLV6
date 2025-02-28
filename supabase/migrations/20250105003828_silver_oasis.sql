/*
  # Clear Database Tables
  
  1. Changes
    - Clear data from design_files and related tables
    - Preserve categories, keywords, user_info, and user_roles
  
  2. Security
    - Maintain RLS policies
    - Keep user data intact
*/

-- Clear design-related tables in correct order to handle foreign keys
TRUNCATE TABLE design_mockups CASCADE;
TRUNCATE TABLE design_keyword_links CASCADE;
TRUNCATE TABLE design_categories CASCADE;
TRUNCATE TABLE design_files CASCADE;

-- Clear DTF print lists
TRUNCATE TABLE dtf_print_lists CASCADE;

-- Clear integration credentials
TRUNCATE TABLE integration_credentials CASCADE;