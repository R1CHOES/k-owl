/*
  Warnings:

  - You are about to drop the column `fileHash` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileSizeBytes` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploaderId` on the `Document` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_uploaderId_fkey";

-- DropIndex
DROP INDEX "Document_fileHash_key";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileHash",
DROP COLUMN "filePath",
DROP COLUMN "fileSizeBytes",
DROP COLUMN "filename",
DROP COLUMN "link",
DROP COLUMN "mimeType",
DROP COLUMN "uploaderId",
ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" SERIAL NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "documentId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "documentVersionId" INTEGER NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "referenceCode" TEXT,
    "keywords" TEXT,
    "descriptionText" TEXT,
    "sourceUrl" TEXT,
    "socmedCardPath" TEXT,
    "languageCheckerStatus" TEXT,
    "dateProcessed" TIMESTAMP(3),
    "datePosted" TIMESTAMP(3),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" SERIAL NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "contentId" INTEGER NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "referenceCode" TEXT,
    "keywords" TEXT,
    "descriptionText" TEXT,
    "sourceUrl" TEXT,
    "socmedCardPath" TEXT,
    "languageCheckerStatus" TEXT,
    "dateProcessed" TIMESTAMP(3),
    "datePosted" TIMESTAMP(3),
    "editorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_fileHash_key" ON "DocumentVersion"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "Content_documentVersionId_key" ON "Content"("documentVersionId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
