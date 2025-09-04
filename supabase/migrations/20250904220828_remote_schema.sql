drop policy "Enable update for users based on uid" on "public"."players";

drop function if exists "public"."getEventLeaderboard"(event_id integer);

CREATE UNIQUE INDEX players_discord_key ON public.players USING btree (discord);

alter table "public"."players" add constraint "players_discord_key" UNIQUE using index "players_discord_key";

set check_function_bodies = off;

create or replace view "public"."randomLevel" as  SELECT levels.id,
    levels.name,
    levels.creator,
    levels."videoID",
    levels."minProgress",
    levels."flTop",
    levels."dlTop",
    levels."flPt",
    levels.rating,
    levels.created_at,
    levels."isPlatformer",
    levels."insaneTier",
    levels.accepted,
    levels."isNonList"
   FROM levels
  ORDER BY (random());


CREATE OR REPLACE FUNCTION public.update_supporter_until()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_record RECORD;
    order_record RECORD;
    current_supporter_until TIMESTAMP;
BEGIN
    -- Lặp qua từng user có đơn hàng
    FOR user_record IN 
        SELECT DISTINCT COALESCE("giftTo", "userID") as target_uid
        FROM orders 
        WHERE "productID" = 1 AND delivered = true
    LOOP
        current_supporter_until := NULL;
        
        -- Xử lý từng đơn hàng theo thứ tự thời gian
        FOR order_record IN 
            SELECT created_at, quantity
            FROM orders 
            WHERE "productID" = 1 AND delivered = true
            AND COALESCE("giftTo", "userID") = user_record.target_uid
            ORDER BY created_at
        LOOP
            IF current_supporter_until IS NULL OR current_supporter_until < order_record.created_at THEN
                -- Nếu chưa có hoặc đã hết hạn supporter
                current_supporter_until := order_record.created_at + INTERVAL '1 month' * order_record.quantity;
            ELSE
                -- Nếu vẫn còn supporter, cộng thêm thời gian
                current_supporter_until := current_supporter_until + INTERVAL '1 month' * order_record.quantity;
            END IF;
        END LOOP;
        
        -- Cập nhật vào database
        UPDATE players 
        SET "supporterUntil" = current_supporter_until
        WHERE uid = user_record.target_uid;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public."getEventLeaderboard"(event_id integer)
 RETURNS TABLE("userID" uuid, elo bigint, "matchCount" bigint, point numeric, penalty numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    er."userID",
    p.elo,
    p."matchCount",
    COALESCE(SUM((er.progress::numeric * el.point::numeric) / 100), 0) AS point,
    SUM(
      EXTRACT(EPOCH FROM (er.created_at - e.start)) / 60
    ) AS penalty
  FROM
    "eventRecords" AS er
    JOIN "eventLevels" AS el ON er."levelID" = el.id
    JOIN events AS e ON e.id = el."eventID"
    JOIN players AS p ON p.uid = er."userID"
  WHERE
    el."eventID" = event_id
  GROUP BY
    er."userID",
    p."elo",
    p."matchCount"
  ORDER BY
    point DESC,
    penalty ASC;
END;
$function$
;


