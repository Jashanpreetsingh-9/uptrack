-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "check_interval_seconds" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checks" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_code" INTEGER,
    "latency_ms" INTEGER NOT NULL,
    "is_up" BOOLEAN NOT NULL,

    CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "cause" TEXT,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uptime_rollups" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "total_checks" INTEGER NOT NULL,
    "up_checks" INTEGER NOT NULL,

    CONSTRAINT "uptime_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checks_target_id_checked_at_idx" ON "checks"("target_id", "checked_at");

-- CreateIndex
CREATE INDEX "incidents_target_id_started_at_idx" ON "incidents"("target_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "uptime_rollups_target_id_period_start_key" ON "uptime_rollups"("target_id", "period_start");

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uptime_rollups" ADD CONSTRAINT "uptime_rollups_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
