/*
  Warnings:

  - Added the required column `weather` to the `Metric` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Metric" ADD COLUMN     "weather" TEXT NOT NULL;
