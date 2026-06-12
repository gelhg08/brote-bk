-- AlterTable
ALTER TABLE `categories` ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `categories_slug_key` ON `categories`(`slug`);
