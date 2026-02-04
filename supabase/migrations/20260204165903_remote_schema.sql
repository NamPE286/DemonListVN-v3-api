drop view if exists "public"."wikiTree";


  create table "public"."levelSubmissions" (
    "userId" uuid not null,
    "levelId" bigint not null,
    "created_at" timestamp with time zone not null default now(),
    "accepted" boolean not null default false,
    "comment" text
      );


alter table "public"."levelSubmissions" enable row level security;

alter table "public"."levels" add column "isChallenge" boolean not null default false;

alter table "public"."players" add column "clRating" bigint;

alter table "public"."players" add column "clrank" bigint;

alter table "public"."records" add column "clPt" double precision;

CREATE UNIQUE INDEX "levelSubmissions_pkey" ON public."levelSubmissions" USING btree ("userId", "levelId");

alter table "public"."levelSubmissions" add constraint "levelSubmissions_pkey" PRIMARY KEY using index "levelSubmissions_pkey";

alter table "public"."levelSubmissions" add constraint "levelSubmissions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES public.levels(id) not valid;

alter table "public"."levelSubmissions" validate constraint "levelSubmissions_levelId_fkey";

alter table "public"."levelSubmissions" add constraint "levelSubmissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.players(uid) not valid;

alter table "public"."levelSubmissions" validate constraint "levelSubmissions_userId_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.refresh_wiki_tree()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public."wikiTree";
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_list()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin
with
  v_table_name as (
    select
      id,
      (
        case
          when "flTop" is not null then RANK() over (
            order by
              "flTop" asc nulls last
          )
        end
      ) as ab
    from
      levels
  )
update levels
set
  "flTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id;

with
  v_table_name as (
    select
      id,
      "isPlatformer",
      (
        case
          when "rating" is not null then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      levels
    where
      "isPlatformer" = false
  )
update levels
set
  "dlTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id;

with
  v_table_name as (
    select
      id,
      "isPlatformer",
      (
        case
          when "rating" is not null then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      levels
    where
      "isPlatformer" = true
      and "isChallenge" = false
  )
update levels
set
  "dlTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id;

with
  v_table_name as (
    select
      id,
      "isChallenge",
      (
        case
          when "rating" is not null then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      levels
    where
      "isChallenge" = true
  )
update levels
set
  "dlTop" = v_table_name.ab
from
  v_table_name
where
  levels.id = v_table_name.id;

update levels
set
  "flPt" = cast(
    2250 / (0.4 * ("flTop") + 7) - 55 as decimal(16, 2)
  )
where
  "flTop" < 76;

update levels
set
  "flPt" = 1
where
  "flTop" > 75;

update clans
set
  "memberCount" = (
    select
      count(*)
    from
      players
    where
      players.clan = clans.id
  )
where
  true;

update levels
set
  "flPt" = null
where
  "flTop" is null;

update levels
set
  "dlTop" = null
where
  "rating" is null;
end$function$
;

CREATE OR REPLACE FUNCTION public.update_rank()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin

update players
set
  "isHidden" = true
where
  "isBanned" = true;

with
  v_table_a as (
    select
      records.userid,
      records.levelid,
      records."dlPt",
      levels.rating,
      rank() over (
        partition by
          userid
        order by
          case
            when records."isChecked" = false then null
            when records.progress = 100 then levels.rating
            else levels.rating * records.progress / 150
          end desc nulls last,
          levels.name
      ) as no
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isPlatformer" = false
      and levels."isChallenge" = false
  )
update records
set
  no = v_table_a.no
from
  v_table_a
where
  records.userid = v_table_a.userid
  and records.levelid = v_table_a.levelid
  and v_table_a.rating is not null;

with
  v_table_a as (
    select
      records.userid,
      records.levelid,
      records."dlPt",
      levels.rating,
      rank() over (
        partition by
          userid
        order by
          case
            when records."isChecked" = false then null
            when records.progress = 100 then levels.rating
            else null
          end desc nulls last,
          levels.name
      ) as no
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isChallenge" = true
  )
update records
set
  no = v_table_a.no
from
  v_table_a
where
  records.userid = v_table_a.userid
  and records.levelid = v_table_a.levelid
  and v_table_a.rating is not null;

update records
set
  "flPt" = cast(
    (
      select
        "flPt"
      from
        levels
      where
        levels.id = records.levelid
    ) as decimal(16, 2)
  )
where
  progress = 100;

with
  v_b as (
    select
      records.userid,
      records.levelid,
      case
        when records.no is null then null
        when records.no = 1 then levels.rating * 5 / 10
        when records.no = 2 then levels.rating * 3 / 10
        when records.no = 3 then levels.rating * 2 / 10
        when (
          records.no > 3
          and records.no <= 15
        ) then greatest(
          5,
          floor(levels.rating * (25.0 / records.no) / 100)
        )
        when (
          records.no > 15
          and records.no <= 25
        ) then 5
        else 1
      end as pt
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isPlatformer" = false
      and levels."isChallenge" = false
  )
update records
set
  "dlPt" = v_b.pt
from
  v_b
where
  records.userid = v_b.userid
  and records.levelid = v_b.levelid
  and records.progress = 100;

with
  v_b as (
    select
      records.userid,
      records.levelid,
      case
        when records.no is null then null
        when records.no = 1 then levels.rating * 5 / 10
        when records.no = 2 then levels.rating * 3 / 10
        when records.no = 3 then levels.rating * 2 / 10
        when (
          records.no > 1
          and records.no <= 15
        ) then greatest(
          5,
          floor(levels.rating * (25.0 / records.no) / 100)
        )
        when (
          records.no > 15
          and records.no <= 25
        ) then 5
        else 1
      end as pt
    from
      records,
      levels
    where
      levels.id = records.levelid
      and levels."isPlatformer" = false
      and levels."isChallenge" = false
  )
update records
set
  "dlPt" = v_b.pt * progress / 150
from
  v_b
where
  records.userid = v_b.userid
  and records.levelid = v_b.levelid
  and records.progress < 100;

update players
set
  "totalFLpt" = (
    select
      sum("flPt")
    from
      records
    where
      records.userid = players.uid
      and records."isChecked" = true
  )
where
  true;

update players
set
  "totalDLpt" = (
    select
      sum("dlPt")
    from
      records
    where
      records.userid = players.uid
      and records."isChecked" = true
  )
where
  true;

update players
set
  "dlMaxPt" = greatest(
    (
      select
        max("dlPt")
      from
        records
      where
        records.userid = players.uid
        and records."isChecked" = true
    ),
    -1
  )
where
  true;

update players
set
  "flMaxPt" = greatest(
    (
      select
        max("flPt")
      from
        records
      where
        records.userid = players.uid
        and records."isChecked" = true
    ),
    -1
  )
where
  true;

update players
set
  rating = cast(
    (
      select
        sum("dlPt")
      from
        records
      where
        records.userid = players.uid
        and records."isChecked" = true
    ) as integer
  )
where
  true;

update players
set
  rating = null
where
  "isHidden";

with
  v_table_name as (
    select
      uid,
      (
        case
          when "totalFLpt" is not null then RANK() over (
            order by
              "totalFLpt" desc nulls last
          )
        end
      ) as ab
    from
      players
  )
update players
set
  "flrank" = v_table_name.ab
from
  v_table_name
where
  players.uid = v_table_name.uid;

with
  v_table_name as (
    select
      uid,
      (
        case
          when "totalDLpt" is not null then RANK() over (
            order by
              "totalDLpt" desc nulls last
          )
        end
      ) as ab
    from
      players
  )
update players
set
  "dlrank" = v_table_name.ab
from
  v_table_name
where
  players.uid = v_table_name.uid;

with
  v_table_name as (
    select
      uid,
      (
        case
          when "rating" is not null
          and "rating" != 0 then RANK() over (
            order by
              "rating" desc nulls last
          )
        end
      ) as ab
    from
      players
  )
update players
set
  "overallRank" = v_table_name.ab
from
  v_table_name
where
  players.uid = v_table_name.uid;

with
  v_table_a as (
    select
      userid,
      count(*)
    from
      records
    where
      "isChecked" = true
    group by
      userid
  )
update players
set
  "recordCount" = v_table_a.count
from
  v_table_a
where
  players.uid = v_table_a.userid;

with
  v_table_a as (
    select
      records.userid,
      coalesce(sum(levels.rating), 0) as sum,
      count(*)
    from
      records,
      levels
    where
      levels.id = records.levelid
      and records."isChecked" = true
    group by
      records.userid
  )
update players
set
  exp = v_table_a.count * 50 + v_table_a.sum
from
  v_table_a
where
  uid = v_table_a.userid;

update players
set
  "extraExp" = 0
where
  true;

with
  v_table_a as (
    select
      "eventProofs".userid,
      sum(events.exp)
    from
      events,
      "eventProofs"
    where
      events.id = "eventProofs"."eventID"
      and "eventProofs".accepted = true
    group by
      "eventProofs".userid
  )
update players
set
  "extraExp" = v_table_a.sum
from
  v_table_a
where
  players.uid = v_table_a.userid;

update records
set
  "queueNo" = null
where
  true;

with
  RankedRecords as (
    select
      ROW_NUMBER() over (
        order by
          case
            when p."supporterUntil" is null then r.timestamp - r."prioritizedBy"
            when p."supporterUntil" > NOW() then (r.timestamp - 2592000000)::int8 - r."prioritizedBy"
            else r.timestamp - r."prioritizedBy"
          end
      ) as "queueNo",
      r.userid,
      r.levelid,
      r."isChecked",
      r."needMod",
      r."reviewer",
      p."supporterUntil"
    from
      public.records r
      join public.players p on r.userid = p.uid
    where
      r."isChecked" = false
      and r."needMod" = false
      and r."reviewer" is null
  )
update records
set
  "queueNo" = RankedRecords."queueNo"
from
  RankedRecords
where
  records.userid = RankedRecords.userid
  and records.levelid = RankedRecords.levelid;

update public.records r
set
  "plPt" = sub."plPt"
from
  (
    select
      r.userid,
      r.levelid,
      case
        when r.progress <= 0
        or l."minProgress" is null
        or l."minProgress" <= 0 then 0
        else GREATEST(
          0.3 * COALESCE(l.rating, 0),
          COALESCE(l.rating, 0) * POWER(
            l."minProgress"::double precision / r.progress,
            0.5849625
          )
        )
      end as "plPt"
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isPlatformer" = true
      and l."isChallenge" = false
  ) as sub
where
  r.userid = sub.userid
  and r.levelid = sub.levelid;

update public.records r
set
  "clPt" = sub."clPt"
from
  (
    select
      r.userid,
      r.levelid,
      case
        when r.progress < 100 or r.no > 75 then 0
        else (l.rating * greatest(0, ceil(- power((no - 42.21) / 10, 3) + 30) / 100)) / 12
        end as "clPt"
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isChallenge" = true
  ) as sub
where
  r.userid = sub.userid
  and r.levelid = sub.levelid;

with
  ranked_plays as (
    select
      r.userid,
      r.levelid,
      r."plPt",
      ROW_NUMBER() over (
        partition by
          r.userid
        order by
          r."plPt" desc
      ) as rn
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isPlatformer" = true
      and l."isChallenge" = false
  ),
  weighted as (
    select
      userid,
      "plPt",
      rn,
      case
        when rn = 1 then 0.5
        when rn = 2 then 0.3
        when rn = 3 then 0.15
        else GREATEST(0.01, 0.05 / POWER(rn - 3, 0.5))
      end as weight
    from
      ranked_plays
  ),
  sum_weighted as (
    select
      userid,
      SUM("plPt" * weight) as total_rating
    from
      weighted
    group by
      userid
  )
update public.players p
set
  "plRating" = case
    when sw.total_rating = 0 then null
    else sw.total_rating
  end
from
  sum_weighted sw
where
  p.uid = sw.userid;

with
  ranked_players as (
    select
      uid,
      RANK() over (
        order by
          "plRating" desc nulls last
      ) as rnk
    from
      public.players
  )
update public.players p
set
  "plrank" = rp.rnk
from
  ranked_players rp
where
  p.uid = rp.uid;

with
  ranked_plays as (
    select
      r.userid,
      r.levelid,
      r."clPt",
      ROW_NUMBER() over (
        partition by
          r.userid
        order by
          r."clPt" desc
      ) as rn
    from
      public.records r
      join public.levels l on l.id = r.levelid
    where
      r."isChecked" = true
      and l."isChallenge" = true
  ),
  sum_weighted as (
    select
      userid,
      SUM("clPt") as total_rating
    from
      ranked_plays
    group by
      userid
  )
update public.players p
set
  "clRating" = case
    when sw.total_rating = 0 then null
    else sw.total_rating
  end
from
  sum_weighted sw
where
  p.uid = sw.userid;

with
  ranked_players as (
    select
      uid,
      RANK() over (
        order by
          "clRating" desc nulls last
      ) as rnk
    from
      public.players
  )
update public.players p
set
  "clrank" = rp.rnk
from
  ranked_players rp
where
  p.uid = rp.uid;
end$function$
;

create materialized view "public"."wikiTree" as  WITH exploded AS (
         SELECT wiki.path,
            wiki.created_at,
            string_to_array(wiki.path, '/'::text) AS parts
           FROM public.wiki
        ), levels AS (
         SELECT e.path,
            e.created_at,
            generate_series(1, array_length(e.parts, 1)) AS level,
            e.parts
           FROM exploded e
        ), nodes AS (
         SELECT DISTINCT array_to_string(levels.parts[1:levels.level], '/'::text) AS path,
                CASE
                    WHEN (levels.level = array_length(levels.parts, 1)) THEN 'file'::text
                    ELSE 'folder'::text
                END AS type,
            array_to_string(levels.parts[1:(levels.level - 1)], '/'::text) AS parent,
            levels.level
           FROM levels
        ), node_created_at AS (
         SELECT n_1.path,
            n_1.type,
            min(w.created_at) AS created_at
           FROM (nodes n_1
             LEFT JOIN public.wiki w ON (((w.path = n_1.path) OR (w.path ~~ (n_1.path || '/%'::text)))))
          GROUP BY n_1.path, n_1.type
        )
 SELECT n.path,
    n.type,
    n.parent,
    n.level,
        CASE
            WHEN (n.type = 'folder'::text) THEN count(c.path)
            ELSE NULL::bigint
        END AS count,
    nc.created_at
   FROM ((nodes n
     LEFT JOIN nodes c ON (((c.parent = n.path) AND (c.level = (n.level + 1)))))
     LEFT JOIN node_created_at nc ON ((nc.path = n.path)))
  GROUP BY n.path, n.type, n.parent, n.level, nc.created_at;


CREATE UNIQUE INDEX wikitree_path_uidx ON public."wikiTree" USING btree (path);

grant delete on table "public"."levelSubmissions" to "anon";

grant insert on table "public"."levelSubmissions" to "anon";

grant references on table "public"."levelSubmissions" to "anon";

grant select on table "public"."levelSubmissions" to "anon";

grant trigger on table "public"."levelSubmissions" to "anon";

grant truncate on table "public"."levelSubmissions" to "anon";

grant update on table "public"."levelSubmissions" to "anon";

grant delete on table "public"."levelSubmissions" to "authenticated";

grant insert on table "public"."levelSubmissions" to "authenticated";

grant references on table "public"."levelSubmissions" to "authenticated";

grant select on table "public"."levelSubmissions" to "authenticated";

grant trigger on table "public"."levelSubmissions" to "authenticated";

grant truncate on table "public"."levelSubmissions" to "authenticated";

grant update on table "public"."levelSubmissions" to "authenticated";

grant delete on table "public"."levelSubmissions" to "service_role";

grant insert on table "public"."levelSubmissions" to "service_role";

grant references on table "public"."levelSubmissions" to "service_role";

grant select on table "public"."levelSubmissions" to "service_role";

grant trigger on table "public"."levelSubmissions" to "service_role";

grant truncate on table "public"."levelSubmissions" to "service_role";

grant update on table "public"."levelSubmissions" to "service_role";

CREATE TRIGGER trigger_refresh_wiki_tree AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON public.wiki FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_wiki_tree();


