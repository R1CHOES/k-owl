-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_EXTRACTION', 'DRAFT', 'IN_QA', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "fileHash" TEXT NOT NULL,
    "link" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_EXTRACTION',
    "agencyId" INTEGER NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_fileHash_key" ON "Document"("fileHash");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
