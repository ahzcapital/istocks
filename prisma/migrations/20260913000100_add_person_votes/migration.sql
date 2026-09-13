CREATE TYPE "PersonVoteType" AS ENUM ('like', 'dislike');

CREATE TABLE "PersonVote" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "voterKey" TEXT NOT NULL,
  "vote" "PersonVoteType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonVote_personId_voterKey_key" ON "PersonVote"("personId", "voterKey");
CREATE INDEX "PersonVote_personId_vote_idx" ON "PersonVote"("personId", "vote");
CREATE INDEX "PersonVote_voterKey_idx" ON "PersonVote"("voterKey");
