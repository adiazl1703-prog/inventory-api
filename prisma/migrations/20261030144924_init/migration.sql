-- CreateEnum
CREATE TYPE "Location" AS ENUM ('Bogota', 'Cartagena');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('available', 'assigned', 'in_repair', 'decommissioned');

-- CreateTable
CREATE TABLE "equipments" (
    "id" UUID NOT NULL,
    "serial_number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "location" "Location" NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'available',
    "decommissioned_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "id_document" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "location" "Location" NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL,
    "returned_at" TIMESTAMPTZ(3),
    "assignment_notes" TEXT,
    "return_notes" TEXT,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipments_serial_number_key" ON "equipments"("serial_number");

-- CreateIndex
CREATE INDEX "equipments_location_status_idx" ON "equipments"("location", "status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_id_document_key" ON "employees"("id_document");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "assignments_equipment_id_assigned_at_idx" ON "assignments"("equipment_id", "assigned_at");

-- CreateIndex
CREATE INDEX "assignments_employee_id_returned_at_idx" ON "assignments"("employee_id", "returned_at");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Written by hand: Prisma's schema language cannot express these rules.
-- A unit can have at most one open assignment, even under concurrent requests.
CREATE UNIQUE INDEX "assignments_one_open_per_equipment_idx" ON "assignments"("equipment_id") WHERE "returned_at" IS NULL;

-- A return can never be recorded before its assignment.
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_returned_after_assigned_check" CHECK ("returned_at" IS NULL OR "returned_at" >= "assigned_at");
