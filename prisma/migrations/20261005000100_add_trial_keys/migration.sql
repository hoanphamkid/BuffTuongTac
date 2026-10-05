CREATE TABLE "TrialKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrialKey_key_key" ON "TrialKey"("key");
CREATE UNIQUE INDEX "TrialKey_usedByUserId_key" ON "TrialKey"("usedByUserId");

ALTER TABLE "TrialKey" ADD CONSTRAINT "TrialKey_usedByUserId_fkey"
  FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "TrialKey" ("id", "key") VALUES
  ('trialkey01', 'KID-TRIAL-7F4K-9M2Q'),
  ('trialkey02', 'KID-TRIAL-8H6P-3R1X'),
  ('trialkey03', 'KID-TRIAL-5N9T-4V7A'),
  ('trialkey04', 'KID-TRIAL-2C8L-6W3D'),
  ('trialkey05', 'KID-TRIAL-9Q1B-5K7Z'),
  ('trialkey06', 'KID-TRIAL-3M6X-8P4H'),
  ('trialkey07', 'KID-TRIAL-1R7V-2N9C'),
  ('trialkey08', 'KID-TRIAL-6D4J-3T8Y'),
  ('trialkey09', 'KID-TRIAL-8W2G-5L1P'),
  ('trialkey10', 'KID-TRIAL-4Z9S-7H6M'),
  ('trialkey11', 'KID-TRIAL-2K5F-8R3N'),
  ('trialkey12', 'KID-TRIAL-7P1C-4V9X'),
  ('trialkey13', 'KID-TRIAL-3T8M-6Q2B'),
  ('trialkey14', 'KID-TRIAL-9L4D-1W7K'),
  ('trialkey15', 'KID-TRIAL-5X6H-2N8R'),
  ('trialkey16', 'KID-TRIAL-1V3Q-9C7T'),
  ('trialkey17', 'KID-TRIAL-6M2A-5P8L'),
  ('trialkey18', 'KID-TRIAL-8R7N-3D4F'),
  ('trialkey19', 'KID-TRIAL-4H1Y-6K9S'),
  ('trialkey20', 'KID-TRIAL-2B5W-7X3M');
