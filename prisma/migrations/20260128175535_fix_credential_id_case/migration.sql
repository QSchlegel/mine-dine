-- Ensure the column is named credentialID (with uppercase ID) to match Better Auth's expectation
-- First check if column exists with different case and rename if needed
DO $$
BEGIN
  -- Check if column exists as credentialId (lowercase d)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Passkey' AND column_name = 'credentialId'
  ) THEN
    ALTER TABLE "Passkey" RENAME COLUMN "credentialId" TO "credentialID";
  END IF;
  
  -- Check if column exists as credentialid (all lowercase)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Passkey' AND column_name = 'credentialid'
  ) THEN
    ALTER TABLE "Passkey" RENAME COLUMN "credentialid" TO "credentialID";
  END IF;
END $$;
