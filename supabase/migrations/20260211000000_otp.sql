-- Create OTP table for OTP sign-in flow
CREATE TABLE IF NOT EXISTS "public"."otp" (
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expired_at" timestamp with time zone NOT NULL,
    "granted_by" "uuid",
    "is_expired" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."otp" OWNER TO "postgres";

ALTER TABLE ONLY "public"."otp"
    ADD CONSTRAINT "otp_pkey" PRIMARY KEY ("code");

ALTER TABLE ONLY "public"."otp"
    ADD CONSTRAINT "otp_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."players"("uid") ON DELETE SET NULL;

ALTER TABLE "public"."otp" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "public"."otp" TO "anon";
GRANT ALL ON TABLE "public"."otp" TO "authenticated";
GRANT ALL ON TABLE "public"."otp" TO "service_role";
