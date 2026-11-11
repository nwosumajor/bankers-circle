-- citext gives case-insensitive uniqueness on email.
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "waitlist_signups" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "first_name" VARCHAR(50),
    "sub_sector" VARCHAR(40) NOT NULL,
    "area" VARCHAR(40) NOT NULL,
    "interests" TEXT[],
    "consent_policy_version" VARCHAR(20) NOT NULL,
    "consented_at" TIMESTAMPTZ(3) NOT NULL,
    "email_confirmed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_signups_email_key" ON "waitlist_signups"("email");

