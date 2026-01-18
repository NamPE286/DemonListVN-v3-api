alter table "public"."eventRecords" drop constraint "eventRecords_levelID_fkey";


  create table "public"."subscriptions" (
    "type" text not null,
    "userID" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "expireAt" timestamp with time zone
      );


alter table "public"."subscriptions" enable row level security;

alter table "public"."orders" add column "data" jsonb;

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (type, "userID");

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_userID_fkey";

alter table "public"."eventRecords" add constraint "eventRecords_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES public."eventLevels"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."eventRecords" validate constraint "eventRecords_levelID_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_top_buyers(interval_ms bigint, limit_count integer, offset_count integer)
 RETURNS TABLE(uid uuid, "totalAmount" double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$BEGIN
  RETURN QUERY
  SELECT 
    p.uid,
    SUM(o.amount) AS "totalAmount"
  FROM orders o
  JOIN players p ON p.uid = o."userID"
  WHERE o.created_at >= NOW() - (interval '1 millisecond' * interval_ms)
    AND p.uid != '3e788ac1-989c-4d2b-bfaf-f99059d258cf'
    AND o.delivered = true
    AND o.amount > 0
  GROUP BY p.uid
  ORDER BY "totalAmount" DESC
  LIMIT limit_count
  OFFSET offset_count;
END;$function$
;

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";


