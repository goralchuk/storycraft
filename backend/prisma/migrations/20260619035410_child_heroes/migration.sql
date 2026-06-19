-- CreateEnum
CREATE TYPE "HeroRole" AS ENUM ('MAIN', 'PET', 'SIBLING', 'FRIEND', 'MAGIC');

-- CreateEnum
CREATE TYPE "HeroStatus" AS ENUM ('IDLE', 'GENERATING', 'DONE');

-- CreateTable
CREATE TABLE "Hero" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "role" "HeroRole" NOT NULL,
    "name" TEXT NOT NULL,
    "style" TEXT,
    "description" TEXT,
    "imageKey" TEXT,
    "freeAttempts" INTEGER NOT NULL DEFAULT 3,
    "status" "HeroStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hero_childId_idx" ON "Hero"("childId");

-- AddForeignKey
ALTER TABLE "Hero" ADD CONSTRAINT "Hero_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
