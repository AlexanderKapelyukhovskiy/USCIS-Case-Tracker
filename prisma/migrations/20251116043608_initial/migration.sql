-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('AP', 'EAD', 'I485', 'I485J');

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" SERIAL NOT NULL,
    "receipt" TEXT NOT NULL,
    "type" "CaseType" NOT NULL,
    "memberId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseResponse" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "json" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_name_key" ON "Member"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Case_memberId_receipt_key" ON "Case"("memberId", "receipt");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseResponse" ADD CONSTRAINT "CaseResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
