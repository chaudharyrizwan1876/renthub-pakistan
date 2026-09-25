-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "authorName" SET DEFAULT 'Pakistan Rents Team';

-- Rename the brand inside existing blog data
UPDATE "Post" SET "authorName" = 'Pakistan Rents Team' WHERE "authorName" = 'RentHub Team';
UPDATE "Post" SET "content" = REPLACE("content", 'RentHub', 'Pakistan Rents') WHERE "content" LIKE '%RentHub%';
UPDATE "Post" SET "metaTitle" = REPLACE("metaTitle", 'RentHub', 'Pakistan Rents') WHERE "metaTitle" LIKE '%RentHub%';
UPDATE "Post" SET "metaDescription" = REPLACE("metaDescription", 'RentHub', 'Pakistan Rents') WHERE "metaDescription" LIKE '%RentHub%';
