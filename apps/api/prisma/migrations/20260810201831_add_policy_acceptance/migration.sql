-- AlterTable
ALTER TABLE "users" ADD COLUMN     "acceptedPolicyAt" TIMESTAMP(3),
ADD COLUMN     "acceptedPolicyVersion" TEXT;
