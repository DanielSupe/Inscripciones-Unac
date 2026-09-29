-- CreateTable
CREATE TABLE "faculty_enrollment_goals" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_enrollment_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculty_enrollment_goals_facultyId_key" ON "faculty_enrollment_goals"("facultyId");

-- AddForeignKey
ALTER TABLE "faculty_enrollment_goals" ADD CONSTRAINT "faculty_enrollment_goals_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
