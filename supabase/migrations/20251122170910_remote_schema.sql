alter table "public"."caseResult" add column "caseId" bigint not null;

alter table "public"."caseResult" add constraint "caseResult_caseId_fkey1" FOREIGN KEY ("caseId") REFERENCES items(id) not valid;

alter table "public"."caseResult" validate constraint "caseResult_caseId_fkey1";

grant delete on table "public"."APIKey" to "anon";

grant insert on table "public"."APIKey" to "anon";

grant references on table "public"."APIKey" to "anon";

grant select on table "public"."APIKey" to "anon";

grant trigger on table "public"."APIKey" to "anon";

grant truncate on table "public"."APIKey" to "anon";

grant update on table "public"."APIKey" to "anon";

grant delete on table "public"."APIKey" to "authenticated";

grant insert on table "public"."APIKey" to "authenticated";

grant references on table "public"."APIKey" to "authenticated";

grant select on table "public"."APIKey" to "authenticated";

grant trigger on table "public"."APIKey" to "authenticated";

grant truncate on table "public"."APIKey" to "authenticated";

grant update on table "public"."APIKey" to "authenticated";

grant delete on table "public"."APIKey" to "service_role";

grant insert on table "public"."APIKey" to "service_role";

grant references on table "public"."APIKey" to "service_role";

grant select on table "public"."APIKey" to "service_role";

grant trigger on table "public"."APIKey" to "service_role";

grant truncate on table "public"."APIKey" to "service_role";

grant update on table "public"."APIKey" to "service_role";

grant delete on table "public"."PVPPlayers" to "anon";

grant insert on table "public"."PVPPlayers" to "anon";

grant references on table "public"."PVPPlayers" to "anon";

grant select on table "public"."PVPPlayers" to "anon";

grant trigger on table "public"."PVPPlayers" to "anon";

grant truncate on table "public"."PVPPlayers" to "anon";

grant update on table "public"."PVPPlayers" to "anon";

grant delete on table "public"."PVPPlayers" to "authenticated";

grant insert on table "public"."PVPPlayers" to "authenticated";

grant references on table "public"."PVPPlayers" to "authenticated";

grant select on table "public"."PVPPlayers" to "authenticated";

grant trigger on table "public"."PVPPlayers" to "authenticated";

grant truncate on table "public"."PVPPlayers" to "authenticated";

grant update on table "public"."PVPPlayers" to "authenticated";

grant delete on table "public"."PVPPlayers" to "service_role";

grant insert on table "public"."PVPPlayers" to "service_role";

grant references on table "public"."PVPPlayers" to "service_role";

grant select on table "public"."PVPPlayers" to "service_role";

grant trigger on table "public"."PVPPlayers" to "service_role";

grant truncate on table "public"."PVPPlayers" to "service_role";

grant update on table "public"."PVPPlayers" to "service_role";

grant delete on table "public"."PVPRooms" to "anon";

grant insert on table "public"."PVPRooms" to "anon";

grant references on table "public"."PVPRooms" to "anon";

grant select on table "public"."PVPRooms" to "anon";

grant trigger on table "public"."PVPRooms" to "anon";

grant truncate on table "public"."PVPRooms" to "anon";

grant update on table "public"."PVPRooms" to "anon";

grant delete on table "public"."PVPRooms" to "authenticated";

grant insert on table "public"."PVPRooms" to "authenticated";

grant references on table "public"."PVPRooms" to "authenticated";

grant select on table "public"."PVPRooms" to "authenticated";

grant trigger on table "public"."PVPRooms" to "authenticated";

grant truncate on table "public"."PVPRooms" to "authenticated";

grant update on table "public"."PVPRooms" to "authenticated";

grant delete on table "public"."PVPRooms" to "service_role";

grant insert on table "public"."PVPRooms" to "service_role";

grant references on table "public"."PVPRooms" to "service_role";

grant select on table "public"."PVPRooms" to "service_role";

grant trigger on table "public"."PVPRooms" to "service_role";

grant truncate on table "public"."PVPRooms" to "service_role";

grant update on table "public"."PVPRooms" to "service_role";

grant delete on table "public"."cards" to "anon";

grant insert on table "public"."cards" to "anon";

grant references on table "public"."cards" to "anon";

grant select on table "public"."cards" to "anon";

grant trigger on table "public"."cards" to "anon";

grant truncate on table "public"."cards" to "anon";

grant update on table "public"."cards" to "anon";

grant delete on table "public"."cards" to "authenticated";

grant insert on table "public"."cards" to "authenticated";

grant references on table "public"."cards" to "authenticated";

grant select on table "public"."cards" to "authenticated";

grant trigger on table "public"."cards" to "authenticated";

grant truncate on table "public"."cards" to "authenticated";

grant update on table "public"."cards" to "authenticated";

grant delete on table "public"."cards" to "service_role";

grant insert on table "public"."cards" to "service_role";

grant references on table "public"."cards" to "service_role";

grant select on table "public"."cards" to "service_role";

grant trigger on table "public"."cards" to "service_role";

grant truncate on table "public"."cards" to "service_role";

grant update on table "public"."cards" to "service_role";

grant delete on table "public"."caseItems" to "anon";

grant insert on table "public"."caseItems" to "anon";

grant references on table "public"."caseItems" to "anon";

grant select on table "public"."caseItems" to "anon";

grant trigger on table "public"."caseItems" to "anon";

grant truncate on table "public"."caseItems" to "anon";

grant update on table "public"."caseItems" to "anon";

grant delete on table "public"."caseItems" to "authenticated";

grant insert on table "public"."caseItems" to "authenticated";

grant references on table "public"."caseItems" to "authenticated";

grant select on table "public"."caseItems" to "authenticated";

grant trigger on table "public"."caseItems" to "authenticated";

grant truncate on table "public"."caseItems" to "authenticated";

grant update on table "public"."caseItems" to "authenticated";

grant delete on table "public"."caseItems" to "service_role";

grant insert on table "public"."caseItems" to "service_role";

grant references on table "public"."caseItems" to "service_role";

grant select on table "public"."caseItems" to "service_role";

grant trigger on table "public"."caseItems" to "service_role";

grant truncate on table "public"."caseItems" to "service_role";

grant update on table "public"."caseItems" to "service_role";

grant delete on table "public"."caseResult" to "anon";

grant insert on table "public"."caseResult" to "anon";

grant references on table "public"."caseResult" to "anon";

grant select on table "public"."caseResult" to "anon";

grant trigger on table "public"."caseResult" to "anon";

grant truncate on table "public"."caseResult" to "anon";

grant update on table "public"."caseResult" to "anon";

grant delete on table "public"."caseResult" to "authenticated";

grant insert on table "public"."caseResult" to "authenticated";

grant references on table "public"."caseResult" to "authenticated";

grant select on table "public"."caseResult" to "authenticated";

grant trigger on table "public"."caseResult" to "authenticated";

grant truncate on table "public"."caseResult" to "authenticated";

grant update on table "public"."caseResult" to "authenticated";

grant delete on table "public"."caseResult" to "service_role";

grant insert on table "public"."caseResult" to "service_role";

grant references on table "public"."caseResult" to "service_role";

grant select on table "public"."caseResult" to "service_role";

grant trigger on table "public"."caseResult" to "service_role";

grant truncate on table "public"."caseResult" to "service_role";

grant update on table "public"."caseResult" to "service_role";

grant delete on table "public"."changelogs" to "anon";

grant insert on table "public"."changelogs" to "anon";

grant references on table "public"."changelogs" to "anon";

grant select on table "public"."changelogs" to "anon";

grant trigger on table "public"."changelogs" to "anon";

grant truncate on table "public"."changelogs" to "anon";

grant update on table "public"."changelogs" to "anon";

grant delete on table "public"."changelogs" to "authenticated";

grant insert on table "public"."changelogs" to "authenticated";

grant references on table "public"."changelogs" to "authenticated";

grant select on table "public"."changelogs" to "authenticated";

grant trigger on table "public"."changelogs" to "authenticated";

grant truncate on table "public"."changelogs" to "authenticated";

grant update on table "public"."changelogs" to "authenticated";

grant delete on table "public"."changelogs" to "service_role";

grant insert on table "public"."changelogs" to "service_role";

grant references on table "public"."changelogs" to "service_role";

grant select on table "public"."changelogs" to "service_role";

grant trigger on table "public"."changelogs" to "service_role";

grant truncate on table "public"."changelogs" to "service_role";

grant update on table "public"."changelogs" to "service_role";

grant delete on table "public"."clanBan" to "anon";

grant insert on table "public"."clanBan" to "anon";

grant references on table "public"."clanBan" to "anon";

grant select on table "public"."clanBan" to "anon";

grant trigger on table "public"."clanBan" to "anon";

grant truncate on table "public"."clanBan" to "anon";

grant update on table "public"."clanBan" to "anon";

grant delete on table "public"."clanBan" to "authenticated";

grant insert on table "public"."clanBan" to "authenticated";

grant references on table "public"."clanBan" to "authenticated";

grant select on table "public"."clanBan" to "authenticated";

grant trigger on table "public"."clanBan" to "authenticated";

grant truncate on table "public"."clanBan" to "authenticated";

grant update on table "public"."clanBan" to "authenticated";

grant delete on table "public"."clanBan" to "service_role";

grant insert on table "public"."clanBan" to "service_role";

grant references on table "public"."clanBan" to "service_role";

grant select on table "public"."clanBan" to "service_role";

grant trigger on table "public"."clanBan" to "service_role";

grant truncate on table "public"."clanBan" to "service_role";

grant update on table "public"."clanBan" to "service_role";

grant delete on table "public"."clanInvitations" to "anon";

grant insert on table "public"."clanInvitations" to "anon";

grant references on table "public"."clanInvitations" to "anon";

grant select on table "public"."clanInvitations" to "anon";

grant trigger on table "public"."clanInvitations" to "anon";

grant truncate on table "public"."clanInvitations" to "anon";

grant update on table "public"."clanInvitations" to "anon";

grant delete on table "public"."clanInvitations" to "authenticated";

grant insert on table "public"."clanInvitations" to "authenticated";

grant references on table "public"."clanInvitations" to "authenticated";

grant select on table "public"."clanInvitations" to "authenticated";

grant trigger on table "public"."clanInvitations" to "authenticated";

grant truncate on table "public"."clanInvitations" to "authenticated";

grant update on table "public"."clanInvitations" to "authenticated";

grant delete on table "public"."clanInvitations" to "service_role";

grant insert on table "public"."clanInvitations" to "service_role";

grant references on table "public"."clanInvitations" to "service_role";

grant select on table "public"."clanInvitations" to "service_role";

grant trigger on table "public"."clanInvitations" to "service_role";

grant truncate on table "public"."clanInvitations" to "service_role";

grant update on table "public"."clanInvitations" to "service_role";

grant delete on table "public"."clans" to "anon";

grant insert on table "public"."clans" to "anon";

grant references on table "public"."clans" to "anon";

grant select on table "public"."clans" to "anon";

grant trigger on table "public"."clans" to "anon";

grant truncate on table "public"."clans" to "anon";

grant update on table "public"."clans" to "anon";

grant delete on table "public"."clans" to "authenticated";

grant insert on table "public"."clans" to "authenticated";

grant references on table "public"."clans" to "authenticated";

grant select on table "public"."clans" to "authenticated";

grant trigger on table "public"."clans" to "authenticated";

grant truncate on table "public"."clans" to "authenticated";

grant update on table "public"."clans" to "authenticated";

grant delete on table "public"."clans" to "service_role";

grant insert on table "public"."clans" to "service_role";

grant references on table "public"."clans" to "service_role";

grant select on table "public"."clans" to "service_role";

grant trigger on table "public"."clans" to "service_role";

grant truncate on table "public"."clans" to "service_role";

grant update on table "public"."clans" to "service_role";

grant delete on table "public"."coupons" to "anon";

grant insert on table "public"."coupons" to "anon";

grant references on table "public"."coupons" to "anon";

grant select on table "public"."coupons" to "anon";

grant trigger on table "public"."coupons" to "anon";

grant truncate on table "public"."coupons" to "anon";

grant update on table "public"."coupons" to "anon";

grant delete on table "public"."coupons" to "authenticated";

grant insert on table "public"."coupons" to "authenticated";

grant references on table "public"."coupons" to "authenticated";

grant select on table "public"."coupons" to "authenticated";

grant trigger on table "public"."coupons" to "authenticated";

grant truncate on table "public"."coupons" to "authenticated";

grant update on table "public"."coupons" to "authenticated";

grant delete on table "public"."coupons" to "service_role";

grant insert on table "public"."coupons" to "service_role";

grant references on table "public"."coupons" to "service_role";

grant select on table "public"."coupons" to "service_role";

grant trigger on table "public"."coupons" to "service_role";

grant truncate on table "public"."coupons" to "service_role";

grant update on table "public"."coupons" to "service_role";

grant delete on table "public"."deathCount" to "anon";

grant insert on table "public"."deathCount" to "anon";

grant references on table "public"."deathCount" to "anon";

grant select on table "public"."deathCount" to "anon";

grant trigger on table "public"."deathCount" to "anon";

grant truncate on table "public"."deathCount" to "anon";

grant update on table "public"."deathCount" to "anon";

grant delete on table "public"."deathCount" to "authenticated";

grant insert on table "public"."deathCount" to "authenticated";

grant references on table "public"."deathCount" to "authenticated";

grant select on table "public"."deathCount" to "authenticated";

grant trigger on table "public"."deathCount" to "authenticated";

grant truncate on table "public"."deathCount" to "authenticated";

grant update on table "public"."deathCount" to "authenticated";

grant delete on table "public"."deathCount" to "service_role";

grant insert on table "public"."deathCount" to "service_role";

grant references on table "public"."deathCount" to "service_role";

grant select on table "public"."deathCount" to "service_role";

grant trigger on table "public"."deathCount" to "service_role";

grant truncate on table "public"."deathCount" to "service_role";

grant update on table "public"."deathCount" to "service_role";

grant delete on table "public"."eventLevels" to "anon";

grant insert on table "public"."eventLevels" to "anon";

grant references on table "public"."eventLevels" to "anon";

grant select on table "public"."eventLevels" to "anon";

grant trigger on table "public"."eventLevels" to "anon";

grant truncate on table "public"."eventLevels" to "anon";

grant update on table "public"."eventLevels" to "anon";

grant delete on table "public"."eventLevels" to "authenticated";

grant insert on table "public"."eventLevels" to "authenticated";

grant references on table "public"."eventLevels" to "authenticated";

grant select on table "public"."eventLevels" to "authenticated";

grant trigger on table "public"."eventLevels" to "authenticated";

grant truncate on table "public"."eventLevels" to "authenticated";

grant update on table "public"."eventLevels" to "authenticated";

grant delete on table "public"."eventLevels" to "service_role";

grant insert on table "public"."eventLevels" to "service_role";

grant references on table "public"."eventLevels" to "service_role";

grant select on table "public"."eventLevels" to "service_role";

grant trigger on table "public"."eventLevels" to "service_role";

grant truncate on table "public"."eventLevels" to "service_role";

grant update on table "public"."eventLevels" to "service_role";

grant delete on table "public"."eventProofs" to "anon";

grant insert on table "public"."eventProofs" to "anon";

grant references on table "public"."eventProofs" to "anon";

grant select on table "public"."eventProofs" to "anon";

grant trigger on table "public"."eventProofs" to "anon";

grant truncate on table "public"."eventProofs" to "anon";

grant update on table "public"."eventProofs" to "anon";

grant delete on table "public"."eventProofs" to "authenticated";

grant insert on table "public"."eventProofs" to "authenticated";

grant references on table "public"."eventProofs" to "authenticated";

grant select on table "public"."eventProofs" to "authenticated";

grant trigger on table "public"."eventProofs" to "authenticated";

grant truncate on table "public"."eventProofs" to "authenticated";

grant update on table "public"."eventProofs" to "authenticated";

grant delete on table "public"."eventProofs" to "service_role";

grant insert on table "public"."eventProofs" to "service_role";

grant references on table "public"."eventProofs" to "service_role";

grant select on table "public"."eventProofs" to "service_role";

grant trigger on table "public"."eventProofs" to "service_role";

grant truncate on table "public"."eventProofs" to "service_role";

grant update on table "public"."eventProofs" to "service_role";

grant delete on table "public"."eventRecords" to "anon";

grant insert on table "public"."eventRecords" to "anon";

grant references on table "public"."eventRecords" to "anon";

grant select on table "public"."eventRecords" to "anon";

grant trigger on table "public"."eventRecords" to "anon";

grant truncate on table "public"."eventRecords" to "anon";

grant update on table "public"."eventRecords" to "anon";

grant delete on table "public"."eventRecords" to "authenticated";

grant insert on table "public"."eventRecords" to "authenticated";

grant references on table "public"."eventRecords" to "authenticated";

grant select on table "public"."eventRecords" to "authenticated";

grant trigger on table "public"."eventRecords" to "authenticated";

grant truncate on table "public"."eventRecords" to "authenticated";

grant update on table "public"."eventRecords" to "authenticated";

grant delete on table "public"."eventRecords" to "service_role";

grant insert on table "public"."eventRecords" to "service_role";

grant references on table "public"."eventRecords" to "service_role";

grant select on table "public"."eventRecords" to "service_role";

grant trigger on table "public"."eventRecords" to "service_role";

grant truncate on table "public"."eventRecords" to "service_role";

grant update on table "public"."eventRecords" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."heatmap" to "anon";

grant insert on table "public"."heatmap" to "anon";

grant references on table "public"."heatmap" to "anon";

grant select on table "public"."heatmap" to "anon";

grant trigger on table "public"."heatmap" to "anon";

grant truncate on table "public"."heatmap" to "anon";

grant update on table "public"."heatmap" to "anon";

grant delete on table "public"."heatmap" to "authenticated";

grant insert on table "public"."heatmap" to "authenticated";

grant references on table "public"."heatmap" to "authenticated";

grant select on table "public"."heatmap" to "authenticated";

grant trigger on table "public"."heatmap" to "authenticated";

grant truncate on table "public"."heatmap" to "authenticated";

grant update on table "public"."heatmap" to "authenticated";

grant delete on table "public"."heatmap" to "service_role";

grant insert on table "public"."heatmap" to "service_role";

grant references on table "public"."heatmap" to "service_role";

grant select on table "public"."heatmap" to "service_role";

grant trigger on table "public"."heatmap" to "service_role";

grant truncate on table "public"."heatmap" to "service_role";

grant update on table "public"."heatmap" to "service_role";

grant delete on table "public"."inventory" to "anon";

grant insert on table "public"."inventory" to "anon";

grant references on table "public"."inventory" to "anon";

grant select on table "public"."inventory" to "anon";

grant trigger on table "public"."inventory" to "anon";

grant truncate on table "public"."inventory" to "anon";

grant update on table "public"."inventory" to "anon";

grant delete on table "public"."inventory" to "authenticated";

grant insert on table "public"."inventory" to "authenticated";

grant references on table "public"."inventory" to "authenticated";

grant select on table "public"."inventory" to "authenticated";

grant trigger on table "public"."inventory" to "authenticated";

grant truncate on table "public"."inventory" to "authenticated";

grant update on table "public"."inventory" to "authenticated";

grant delete on table "public"."inventory" to "service_role";

grant insert on table "public"."inventory" to "service_role";

grant references on table "public"."inventory" to "service_role";

grant select on table "public"."inventory" to "service_role";

grant trigger on table "public"."inventory" to "service_role";

grant truncate on table "public"."inventory" to "service_role";

grant update on table "public"."inventory" to "service_role";

grant delete on table "public"."items" to "anon";

grant insert on table "public"."items" to "anon";

grant references on table "public"."items" to "anon";

grant select on table "public"."items" to "anon";

grant trigger on table "public"."items" to "anon";

grant truncate on table "public"."items" to "anon";

grant update on table "public"."items" to "anon";

grant delete on table "public"."items" to "authenticated";

grant insert on table "public"."items" to "authenticated";

grant references on table "public"."items" to "authenticated";

grant select on table "public"."items" to "authenticated";

grant trigger on table "public"."items" to "authenticated";

grant truncate on table "public"."items" to "authenticated";

grant update on table "public"."items" to "authenticated";

grant delete on table "public"."items" to "service_role";

grant insert on table "public"."items" to "service_role";

grant references on table "public"."items" to "service_role";

grant select on table "public"."items" to "service_role";

grant trigger on table "public"."items" to "service_role";

grant truncate on table "public"."items" to "service_role";

grant update on table "public"."items" to "service_role";

grant delete on table "public"."levelDeathCount" to "anon";

grant insert on table "public"."levelDeathCount" to "anon";

grant references on table "public"."levelDeathCount" to "anon";

grant select on table "public"."levelDeathCount" to "anon";

grant trigger on table "public"."levelDeathCount" to "anon";

grant truncate on table "public"."levelDeathCount" to "anon";

grant update on table "public"."levelDeathCount" to "anon";

grant delete on table "public"."levelDeathCount" to "authenticated";

grant insert on table "public"."levelDeathCount" to "authenticated";

grant references on table "public"."levelDeathCount" to "authenticated";

grant select on table "public"."levelDeathCount" to "authenticated";

grant trigger on table "public"."levelDeathCount" to "authenticated";

grant truncate on table "public"."levelDeathCount" to "authenticated";

grant update on table "public"."levelDeathCount" to "authenticated";

grant delete on table "public"."levelDeathCount" to "service_role";

grant insert on table "public"."levelDeathCount" to "service_role";

grant references on table "public"."levelDeathCount" to "service_role";

grant select on table "public"."levelDeathCount" to "service_role";

grant trigger on table "public"."levelDeathCount" to "service_role";

grant truncate on table "public"."levelDeathCount" to "service_role";

grant update on table "public"."levelDeathCount" to "service_role";

grant delete on table "public"."levels" to "anon";

grant insert on table "public"."levels" to "anon";

grant references on table "public"."levels" to "anon";

grant select on table "public"."levels" to "anon";

grant trigger on table "public"."levels" to "anon";

grant truncate on table "public"."levels" to "anon";

grant update on table "public"."levels" to "anon";

grant delete on table "public"."levels" to "authenticated";

grant insert on table "public"."levels" to "authenticated";

grant references on table "public"."levels" to "authenticated";

grant select on table "public"."levels" to "authenticated";

grant trigger on table "public"."levels" to "authenticated";

grant truncate on table "public"."levels" to "authenticated";

grant update on table "public"."levels" to "authenticated";

grant delete on table "public"."levels" to "service_role";

grant insert on table "public"."levels" to "service_role";

grant references on table "public"."levels" to "service_role";

grant select on table "public"."levels" to "service_role";

grant trigger on table "public"."levels" to "service_role";

grant truncate on table "public"."levels" to "service_role";

grant update on table "public"."levels" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."orderItems" to "anon";

grant insert on table "public"."orderItems" to "anon";

grant references on table "public"."orderItems" to "anon";

grant select on table "public"."orderItems" to "anon";

grant trigger on table "public"."orderItems" to "anon";

grant truncate on table "public"."orderItems" to "anon";

grant update on table "public"."orderItems" to "anon";

grant delete on table "public"."orderItems" to "authenticated";

grant insert on table "public"."orderItems" to "authenticated";

grant references on table "public"."orderItems" to "authenticated";

grant select on table "public"."orderItems" to "authenticated";

grant trigger on table "public"."orderItems" to "authenticated";

grant truncate on table "public"."orderItems" to "authenticated";

grant update on table "public"."orderItems" to "authenticated";

grant delete on table "public"."orderItems" to "service_role";

grant insert on table "public"."orderItems" to "service_role";

grant references on table "public"."orderItems" to "service_role";

grant select on table "public"."orderItems" to "service_role";

grant trigger on table "public"."orderItems" to "service_role";

grant truncate on table "public"."orderItems" to "service_role";

grant update on table "public"."orderItems" to "service_role";

grant delete on table "public"."orderTracking" to "anon";

grant insert on table "public"."orderTracking" to "anon";

grant references on table "public"."orderTracking" to "anon";

grant select on table "public"."orderTracking" to "anon";

grant trigger on table "public"."orderTracking" to "anon";

grant truncate on table "public"."orderTracking" to "anon";

grant update on table "public"."orderTracking" to "anon";

grant delete on table "public"."orderTracking" to "authenticated";

grant insert on table "public"."orderTracking" to "authenticated";

grant references on table "public"."orderTracking" to "authenticated";

grant select on table "public"."orderTracking" to "authenticated";

grant trigger on table "public"."orderTracking" to "authenticated";

grant truncate on table "public"."orderTracking" to "authenticated";

grant update on table "public"."orderTracking" to "authenticated";

grant delete on table "public"."orderTracking" to "service_role";

grant insert on table "public"."orderTracking" to "service_role";

grant references on table "public"."orderTracking" to "service_role";

grant select on table "public"."orderTracking" to "service_role";

grant trigger on table "public"."orderTracking" to "service_role";

grant truncate on table "public"."orderTracking" to "service_role";

grant update on table "public"."orderTracking" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."players" to "anon";

grant insert on table "public"."players" to "anon";

grant references on table "public"."players" to "anon";

grant select on table "public"."players" to "anon";

grant trigger on table "public"."players" to "anon";

grant truncate on table "public"."players" to "anon";

grant update on table "public"."players" to "anon";

grant delete on table "public"."players" to "authenticated";

grant insert on table "public"."players" to "authenticated";

grant references on table "public"."players" to "authenticated";

grant select on table "public"."players" to "authenticated";

grant trigger on table "public"."players" to "authenticated";

grant truncate on table "public"."players" to "authenticated";

grant update on table "public"."players" to "authenticated";

grant delete on table "public"."players" to "service_role";

grant insert on table "public"."players" to "service_role";

grant references on table "public"."players" to "service_role";

grant select on table "public"."players" to "service_role";

grant trigger on table "public"."players" to "service_role";

grant truncate on table "public"."players" to "service_role";

grant update on table "public"."players" to "service_role";

grant delete on table "public"."playersAchievement" to "anon";

grant insert on table "public"."playersAchievement" to "anon";

grant references on table "public"."playersAchievement" to "anon";

grant select on table "public"."playersAchievement" to "anon";

grant trigger on table "public"."playersAchievement" to "anon";

grant truncate on table "public"."playersAchievement" to "anon";

grant update on table "public"."playersAchievement" to "anon";

grant delete on table "public"."playersAchievement" to "authenticated";

grant insert on table "public"."playersAchievement" to "authenticated";

grant references on table "public"."playersAchievement" to "authenticated";

grant select on table "public"."playersAchievement" to "authenticated";

grant trigger on table "public"."playersAchievement" to "authenticated";

grant truncate on table "public"."playersAchievement" to "authenticated";

grant update on table "public"."playersAchievement" to "authenticated";

grant delete on table "public"."playersAchievement" to "service_role";

grant insert on table "public"."playersAchievement" to "service_role";

grant references on table "public"."playersAchievement" to "service_role";

grant select on table "public"."playersAchievement" to "service_role";

grant trigger on table "public"."playersAchievement" to "service_role";

grant truncate on table "public"."playersAchievement" to "service_role";

grant update on table "public"."playersAchievement" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."records" to "anon";

grant insert on table "public"."records" to "anon";

grant references on table "public"."records" to "anon";

grant select on table "public"."records" to "anon";

grant trigger on table "public"."records" to "anon";

grant truncate on table "public"."records" to "anon";

grant update on table "public"."records" to "anon";

grant delete on table "public"."records" to "authenticated";

grant insert on table "public"."records" to "authenticated";

grant references on table "public"."records" to "authenticated";

grant select on table "public"."records" to "authenticated";

grant trigger on table "public"."records" to "authenticated";

grant truncate on table "public"."records" to "authenticated";

grant update on table "public"."records" to "authenticated";

grant delete on table "public"."records" to "service_role";

grant insert on table "public"."records" to "service_role";

grant references on table "public"."records" to "service_role";

grant select on table "public"."records" to "service_role";

grant trigger on table "public"."records" to "service_role";

grant truncate on table "public"."records" to "service_role";

grant update on table "public"."records" to "service_role";

grant delete on table "public"."rules" to "anon";

grant insert on table "public"."rules" to "anon";

grant references on table "public"."rules" to "anon";

grant select on table "public"."rules" to "anon";

grant trigger on table "public"."rules" to "anon";

grant truncate on table "public"."rules" to "anon";

grant update on table "public"."rules" to "anon";

grant delete on table "public"."rules" to "authenticated";

grant insert on table "public"."rules" to "authenticated";

grant references on table "public"."rules" to "authenticated";

grant select on table "public"."rules" to "authenticated";

grant trigger on table "public"."rules" to "authenticated";

grant truncate on table "public"."rules" to "authenticated";

grant update on table "public"."rules" to "authenticated";

grant delete on table "public"."rules" to "service_role";

grant insert on table "public"."rules" to "service_role";

grant references on table "public"."rules" to "service_role";

grant select on table "public"."rules" to "service_role";

grant trigger on table "public"."rules" to "service_role";

grant truncate on table "public"."rules" to "service_role";

grant update on table "public"."rules" to "service_role";

grant delete on table "public"."userSocial" to "anon";

grant insert on table "public"."userSocial" to "anon";

grant references on table "public"."userSocial" to "anon";

grant select on table "public"."userSocial" to "anon";

grant trigger on table "public"."userSocial" to "anon";

grant truncate on table "public"."userSocial" to "anon";

grant update on table "public"."userSocial" to "anon";

grant delete on table "public"."userSocial" to "authenticated";

grant insert on table "public"."userSocial" to "authenticated";

grant references on table "public"."userSocial" to "authenticated";

grant select on table "public"."userSocial" to "authenticated";

grant trigger on table "public"."userSocial" to "authenticated";

grant truncate on table "public"."userSocial" to "authenticated";

grant update on table "public"."userSocial" to "authenticated";

grant delete on table "public"."userSocial" to "service_role";

grant insert on table "public"."userSocial" to "service_role";

grant references on table "public"."userSocial" to "service_role";

grant select on table "public"."userSocial" to "service_role";

grant trigger on table "public"."userSocial" to "service_role";

grant truncate on table "public"."userSocial" to "service_role";

grant update on table "public"."userSocial" to "service_role";


