/*
  # Add sub_admin to user_role enum

  This migration adds the sub_admin value to the user_role enum type.
  This must be done in a separate migration to ensure proper transaction handling.
*/

-- Add new enum value in its own transaction
ALTER TYPE user_role ADD VALUE 'sub_admin';