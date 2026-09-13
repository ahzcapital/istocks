CREATE TABLE "ShareCountHistory" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "sharesOutstanding" DECIMAL(24,4) NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "source" TEXT NOT NULL,
  "confidence" TEXT NOT NULL,
  "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShareCountHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShareCountHistory_companyId_effectiveFrom_idx" ON "ShareCountHistory"("companyId", "effectiveFrom");
CREATE INDEX "ShareCountHistory_companyId_effectiveTo_idx" ON "ShareCountHistory"("companyId", "effectiveTo");
CREATE INDEX "ShareCountHistory_effectiveFrom_effectiveTo_idx" ON "ShareCountHistory"("effectiveFrom", "effectiveTo");

ALTER TABLE "ShareCountHistory"
ADD CONSTRAINT "ShareCountHistory_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShareCountHistory"
ADD CONSTRAINT "ShareCountHistory_sharesOutstanding_positive_chk"
CHECK ("sharesOutstanding" > 0);

ALTER TABLE "ShareCountHistory"
ADD CONSTRAINT "ShareCountHistory_effectiveRange_valid_chk"
CHECK ("effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom");
