alter table "public"."APIKey" drop constraint "public_APIKey_uid_fkey";

alter table "public"."PVPPlayers" drop constraint "PVPPlayers_player_fkey";

alter table "public"."PVPPlayers" drop constraint "PVPPlayers_room_fkey";

alter table "public"."PVPRooms" drop constraint "PVPRoom_host_fkey";

alter table "public"."battlePassLevelProgress" drop constraint "battlePassLevelProgress_battlePassLevelId_fkey";

alter table "public"."battlePassLevelProgress" drop constraint "battlePassLevelProgress_userID_fkey";

alter table "public"."battlePassLevels" drop constraint "battlePassLevels_levelID_fkey";

alter table "public"."battlePassLevels" drop constraint "battlePassLevels_seasonId_fkey";

alter table "public"."battlePassMapPackLevelProgress" drop constraint "battlePassMapPackLevelProgress_battlePassMapPackId_fkey";

alter table "public"."battlePassMapPackLevelProgress" drop constraint "battlePassMapPackLevelProgress_userID_fkey";

alter table "public"."battlePassMapPackProgress" drop constraint "battlePassMapPackProgress_battlePassMapPackId_fkey";

alter table "public"."battlePassMapPackProgress" drop constraint "battlePassMapPackProgress_userID_fkey";

alter table "public"."battlePassMapPacks" drop constraint "battlePassMapPacks_mapPackId_fkey";

alter table "public"."battlePassMapPacks" drop constraint "battlePassMapPacks_seasonId_fkey";

alter table "public"."battlePassMissionClaims" drop constraint "battlePassMissionClaims_missionId_fkey";

alter table "public"."battlePassMissionClaims" drop constraint "battlePassMissionClaims_userID_fkey";

alter table "public"."battlePassMissionProgress" drop constraint "battlePassMissionProgress_missionId_fkey";

alter table "public"."battlePassMissionProgress" drop constraint "battlePassMissionProgress_userID_fkey";

alter table "public"."battlePassMissionRewards" drop constraint "battlePassMissionRewards_itemId_fkey";

alter table "public"."battlePassMissionRewards" drop constraint "battlePassMissionRewards_missionId_fkey";

alter table "public"."battlePassMissions" drop constraint "battlePassMissions_seasonId_fkey";

alter table "public"."battlePassProgress" drop constraint "battlePassProgress_seasonId_fkey";

alter table "public"."battlePassProgress" drop constraint "battlePassProgress_userID_fkey";

alter table "public"."battlePassRewardClaims" drop constraint "battlePassRewardClaims_rewardId_fkey";

alter table "public"."battlePassRewardClaims" drop constraint "battlePassRewardClaims_userID_fkey";

alter table "public"."battlePassTierRewards" drop constraint "battlePassTierRewards_itemId_fkey";

alter table "public"."battlePassTierRewards" drop constraint "battlePassTierRewards_seasonId_fkey";

alter table "public"."battlePassXPLogs" drop constraint "battlePassXPLogs_seasonId_fkey";

alter table "public"."battlePassXPLogs" drop constraint "battlePassXPLogs_userID_fkey";

alter table "public"."cards" drop constraint "cards_owner_fkey";

alter table "public"."caseItems" drop constraint "caseItems_caseId_fkey";

alter table "public"."caseItems" drop constraint "caseItems_itemId_fkey";

alter table "public"."caseResult" drop constraint "caseResult_caseId_fkey1";

alter table "public"."caseResult" drop constraint "caseResult_openerId_fkey";

alter table "public"."caseResult" drop constraint "caseResult_resultId_fkey";

alter table "public"."changelogs" drop constraint "changelogs_levelID_fkey";

alter table "public"."clanBan" drop constraint "clanBan_clan_fkey";

alter table "public"."clanBan" drop constraint "clanBan_userid_fkey";

alter table "public"."clanInvitations" drop constraint "clanInvitations_clan_fkey";

alter table "public"."clanInvitations" drop constraint "clanInvitations_to_fkey";

alter table "public"."clans" drop constraint "clans_owner_fkey";

alter table "public"."coupons" drop constraint "coupons_owner_fkey";

alter table "public"."coupons" drop constraint "coupons_productID_fkey";

alter table "public"."deathCount" drop constraint "public_deathCount_uid_fkey";

alter table "public"."eventLevelUnlockConditions" drop constraint "eventLevelUnlockConditions_eventLevelId_fkey";

alter table "public"."eventLevelUnlockConditions" drop constraint "eventLevelUnlockConditions_requireEventLevelId_fkey";

alter table "public"."eventLevels" drop constraint "eventLevels_eventID_fkey";

alter table "public"."eventLevels" drop constraint "eventLevels_levelID_fkey";

alter table "public"."eventProofs" drop constraint "eventProofs_eventID_fkey";

alter table "public"."eventProofs" drop constraint "eventProofs_userid_fkey";

alter table "public"."eventQuestClaims" drop constraint "eventQuestClaims_questId_fkey";

alter table "public"."eventQuestClaims" drop constraint "eventQuestClaims_userId_fkey";

alter table "public"."eventQuestRewards" drop constraint "eventQuestRewards_questId_fkey";

alter table "public"."eventQuestRewards" drop constraint "eventQuestRewards_rewardId_fkey";

alter table "public"."eventQuests" drop constraint "eventQuests_eventId_fkey";

alter table "public"."eventRecords" drop constraint "eventRecords_levelID_fkey";

alter table "public"."eventRecords" drop constraint "qualifier_userID_fkey";

alter table "public"."heatmap" drop constraint "public_attempts_uid_fkey";

alter table "public"."inventory" drop constraint "inventory_itemId_fkey";

alter table "public"."inventory" drop constraint "playerMedal_userID_fkey";

alter table "public"."itemTransactions" drop constraint "stackableItemTransactions_inventoryItemId_fkey";

alter table "public"."items" drop constraint "items_productId_fkey";

alter table "public"."mapPackLevels" drop constraint "mapPackLevels_levelID_fkey";

alter table "public"."mapPackLevels" drop constraint "mapPackLevels_mapPackId_fkey";

alter table "public"."notifications" drop constraint "notifications_to_fkey";

alter table "public"."orderItems" drop constraint "orderItems_orderID_fkey";

alter table "public"."orderItems" drop constraint "orderItems_productID_fkey";

alter table "public"."orderTracking" drop constraint "deliverySteps_orderID_fkey";

alter table "public"."orders" drop constraint "orders_coupon_fkey";

alter table "public"."orders" drop constraint "orders_giftTo_fkey";

alter table "public"."orders" drop constraint "orders_productID_fkey";

alter table "public"."orders" drop constraint "orders_targetClanID_fkey";

alter table "public"."orders" drop constraint "orders_userID_fkey";

alter table "public"."playerSubscriptions" drop constraint "playerSubscriptions_subscriptionId_fkey";

alter table "public"."playerSubscriptions" drop constraint "playerSubscriptions_userID_fkey";

alter table "public"."players" drop constraint "players_clan_fkey";

alter table "public"."playersAchievement" drop constraint "playersAchievement_achievementid_fkey";

alter table "public"."playersAchievement" drop constraint "playersAchievement_userid_fkey";

alter table "public"."records" drop constraint "public_records_levelid_fkey";

alter table "public"."records" drop constraint "public_records_userid_fkey";

alter table "public"."records" drop constraint "records_reviewer_fkey";

alter table "public"."userSocial" drop constraint "userSocial_userid_fkey";


  create table "public"."levelGDStates" (
    "levelId" bigint not null,
    "isDaily" boolean default false,
    "isWeekly" boolean default false
      );


alter table "public"."levelGDStates" enable row level security;

alter table "public"."players" alter column "uid" set default extensions.uuid_generate_v4();

CREATE UNIQUE INDEX "levelGDStates_pkey" ON public."levelGDStates" USING btree ("levelId");

alter table "public"."levelGDStates" add constraint "levelGDStates_pkey" PRIMARY KEY using index "levelGDStates_pkey";

alter table "public"."levelGDStates" add constraint "levelGDStates_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."levelGDStates" validate constraint "levelGDStates_levelId_fkey";

alter table "public"."APIKey" add constraint "public_APIKey_uid_fkey" FOREIGN KEY (uid) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."APIKey" validate constraint "public_APIKey_uid_fkey";

alter table "public"."PVPPlayers" add constraint "PVPPlayers_player_fkey" FOREIGN KEY (player) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."PVPPlayers" validate constraint "PVPPlayers_player_fkey";

alter table "public"."PVPPlayers" add constraint "PVPPlayers_room_fkey" FOREIGN KEY (room) REFERENCES public."PVPRooms"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."PVPPlayers" validate constraint "PVPPlayers_room_fkey";

alter table "public"."PVPRooms" add constraint "PVPRoom_host_fkey" FOREIGN KEY (host) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."PVPRooms" validate constraint "PVPRoom_host_fkey";

alter table "public"."battlePassLevelProgress" add constraint "battlePassLevelProgress_battlePassLevelId_fkey" FOREIGN KEY ("battlePassLevelId") REFERENCES public."battlePassLevels"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassLevelProgress" validate constraint "battlePassLevelProgress_battlePassLevelId_fkey";

alter table "public"."battlePassLevelProgress" add constraint "battlePassLevelProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassLevelProgress" validate constraint "battlePassLevelProgress_userID_fkey";

alter table "public"."battlePassLevels" add constraint "battlePassLevels_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassLevels" validate constraint "battlePassLevels_levelID_fkey";

alter table "public"."battlePassLevels" add constraint "battlePassLevels_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES public."battlePassSeasons"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassLevels" validate constraint "battlePassLevels_seasonId_fkey";

alter table "public"."battlePassMapPackLevelProgress" add constraint "battlePassMapPackLevelProgress_battlePassMapPackId_fkey" FOREIGN KEY ("battlePassMapPackId") REFERENCES public."battlePassMapPacks"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPackLevelProgress" validate constraint "battlePassMapPackLevelProgress_battlePassMapPackId_fkey";

alter table "public"."battlePassMapPackLevelProgress" add constraint "battlePassMapPackLevelProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPackLevelProgress" validate constraint "battlePassMapPackLevelProgress_userID_fkey";

alter table "public"."battlePassMapPackProgress" add constraint "battlePassMapPackProgress_battlePassMapPackId_fkey" FOREIGN KEY ("battlePassMapPackId") REFERENCES public."battlePassMapPacks"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPackProgress" validate constraint "battlePassMapPackProgress_battlePassMapPackId_fkey";

alter table "public"."battlePassMapPackProgress" add constraint "battlePassMapPackProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPackProgress" validate constraint "battlePassMapPackProgress_userID_fkey";

alter table "public"."battlePassMapPacks" add constraint "battlePassMapPacks_mapPackId_fkey" FOREIGN KEY ("mapPackId") REFERENCES public."mapPacks"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPacks" validate constraint "battlePassMapPacks_mapPackId_fkey";

alter table "public"."battlePassMapPacks" add constraint "battlePassMapPacks_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES public."battlePassSeasons"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMapPacks" validate constraint "battlePassMapPacks_seasonId_fkey";

alter table "public"."battlePassMissionClaims" add constraint "battlePassMissionClaims_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES public."battlePassMissions"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMissionClaims" validate constraint "battlePassMissionClaims_missionId_fkey";

alter table "public"."battlePassMissionClaims" add constraint "battlePassMissionClaims_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMissionClaims" validate constraint "battlePassMissionClaims_userID_fkey";

alter table "public"."battlePassMissionProgress" add constraint "battlePassMissionProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES public."battlePassMissions"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMissionProgress" validate constraint "battlePassMissionProgress_missionId_fkey";

alter table "public"."battlePassMissionProgress" add constraint "battlePassMissionProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMissionProgress" validate constraint "battlePassMissionProgress_userID_fkey";

alter table "public"."battlePassMissionRewards" add constraint "battlePassMissionRewards_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMissionRewards" validate constraint "battlePassMissionRewards_itemId_fkey";

alter table "public"."battlePassMissionRewards" add constraint "battlePassMissionRewards_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES public."battlePassMissions"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMissionRewards" validate constraint "battlePassMissionRewards_missionId_fkey";

alter table "public"."battlePassMissions" add constraint "battlePassMissions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES public."battlePassSeasons"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassMissions" validate constraint "battlePassMissions_seasonId_fkey";

alter table "public"."battlePassProgress" add constraint "battlePassProgress_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES public."battlePassSeasons"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassProgress" validate constraint "battlePassProgress_seasonId_fkey";

alter table "public"."battlePassProgress" add constraint "battlePassProgress_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassProgress" validate constraint "battlePassProgress_userID_fkey";

alter table "public"."battlePassRewardClaims" add constraint "battlePassRewardClaims_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES public."battlePassTierRewards"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassRewardClaims" validate constraint "battlePassRewardClaims_rewardId_fkey";

alter table "public"."battlePassRewardClaims" add constraint "battlePassRewardClaims_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassRewardClaims" validate constraint "battlePassRewardClaims_userID_fkey";

alter table "public"."battlePassTierRewards" add constraint "battlePassTierRewards_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassTierRewards" validate constraint "battlePassTierRewards_itemId_fkey";

alter table "public"."battlePassTierRewards" add constraint "battlePassTierRewards_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES public."battlePassSeasons"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassTierRewards" validate constraint "battlePassTierRewards_seasonId_fkey";

alter table "public"."battlePassXPLogs" add constraint "battlePassXPLogs_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES public."battlePassSeasons"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassXPLogs" validate constraint "battlePassXPLogs_seasonId_fkey";

alter table "public"."battlePassXPLogs" add constraint "battlePassXPLogs_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."battlePassXPLogs" validate constraint "battlePassXPLogs_userID_fkey";

alter table "public"."cards" add constraint "cards_owner_fkey" FOREIGN KEY (owner) REFERENCES public.players(uid) not valid;

alter table "public"."cards" validate constraint "cards_owner_fkey";

alter table "public"."caseItems" add constraint "caseItems_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public.items(id) not valid;

alter table "public"."caseItems" validate constraint "caseItems_caseId_fkey";

alter table "public"."caseItems" add constraint "caseItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) not valid;

alter table "public"."caseItems" validate constraint "caseItems_itemId_fkey";

alter table "public"."caseResult" add constraint "caseResult_caseId_fkey1" FOREIGN KEY ("caseId") REFERENCES public.items(id) not valid;

alter table "public"."caseResult" validate constraint "caseResult_caseId_fkey1";

alter table "public"."caseResult" add constraint "caseResult_openerId_fkey" FOREIGN KEY ("openerId") REFERENCES public.players(uid) not valid;

alter table "public"."caseResult" validate constraint "caseResult_openerId_fkey";

alter table "public"."caseResult" add constraint "caseResult_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES public."caseItems"(id) not valid;

alter table "public"."caseResult" validate constraint "caseResult_resultId_fkey";

alter table "public"."changelogs" add constraint "changelogs_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."changelogs" validate constraint "changelogs_levelID_fkey";

alter table "public"."clanBan" add constraint "clanBan_clan_fkey" FOREIGN KEY (clan) REFERENCES public.clans(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."clanBan" validate constraint "clanBan_clan_fkey";

alter table "public"."clanBan" add constraint "clanBan_userid_fkey" FOREIGN KEY (userid) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."clanBan" validate constraint "clanBan_userid_fkey";

alter table "public"."clanInvitations" add constraint "clanInvitations_clan_fkey" FOREIGN KEY (clan) REFERENCES public.clans(id) ON DELETE CASCADE not valid;

alter table "public"."clanInvitations" validate constraint "clanInvitations_clan_fkey";

alter table "public"."clanInvitations" add constraint "clanInvitations_to_fkey" FOREIGN KEY ("to") REFERENCES public.players(uid) ON DELETE CASCADE not valid;

alter table "public"."clanInvitations" validate constraint "clanInvitations_to_fkey";

alter table "public"."clans" add constraint "clans_owner_fkey" FOREIGN KEY (owner) REFERENCES public.players(uid) not valid;

alter table "public"."clans" validate constraint "clans_owner_fkey";

alter table "public"."coupons" add constraint "coupons_owner_fkey" FOREIGN KEY (owner) REFERENCES public.players(uid) not valid;

alter table "public"."coupons" validate constraint "coupons_owner_fkey";

alter table "public"."coupons" add constraint "coupons_productID_fkey" FOREIGN KEY ("productID") REFERENCES public.products(id) not valid;

alter table "public"."coupons" validate constraint "coupons_productID_fkey";

alter table "public"."deathCount" add constraint "public_deathCount_uid_fkey" FOREIGN KEY (uid) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."deathCount" validate constraint "public_deathCount_uid_fkey";

alter table "public"."eventLevelUnlockConditions" add constraint "eventLevelUnlockConditions_eventLevelId_fkey" FOREIGN KEY ("eventLevelId") REFERENCES public."eventLevels"(id) not valid;

alter table "public"."eventLevelUnlockConditions" validate constraint "eventLevelUnlockConditions_eventLevelId_fkey";

alter table "public"."eventLevelUnlockConditions" add constraint "eventLevelUnlockConditions_requireEventLevelId_fkey" FOREIGN KEY ("requireEventLevelId") REFERENCES public."eventLevels"(id) not valid;

alter table "public"."eventLevelUnlockConditions" validate constraint "eventLevelUnlockConditions_requireEventLevelId_fkey";

alter table "public"."eventLevels" add constraint "eventLevels_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES public.events(id) not valid;

alter table "public"."eventLevels" validate constraint "eventLevels_eventID_fkey";

alter table "public"."eventLevels" add constraint "eventLevels_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES public.levels(id) not valid;

alter table "public"."eventLevels" validate constraint "eventLevels_levelID_fkey";

alter table "public"."eventProofs" add constraint "eventProofs_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."eventProofs" validate constraint "eventProofs_eventID_fkey";

alter table "public"."eventProofs" add constraint "eventProofs_userid_fkey" FOREIGN KEY (userid) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."eventProofs" validate constraint "eventProofs_userid_fkey";

alter table "public"."eventQuestClaims" add constraint "eventQuestClaims_questId_fkey" FOREIGN KEY ("questId") REFERENCES public."eventQuests"(id) not valid;

alter table "public"."eventQuestClaims" validate constraint "eventQuestClaims_questId_fkey";

alter table "public"."eventQuestClaims" add constraint "eventQuestClaims_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.players(uid) not valid;

alter table "public"."eventQuestClaims" validate constraint "eventQuestClaims_userId_fkey";

alter table "public"."eventQuestRewards" add constraint "eventQuestRewards_questId_fkey" FOREIGN KEY ("questId") REFERENCES public."eventQuests"(id) not valid;

alter table "public"."eventQuestRewards" validate constraint "eventQuestRewards_questId_fkey";

alter table "public"."eventQuestRewards" add constraint "eventQuestRewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES public.items(id) not valid;

alter table "public"."eventQuestRewards" validate constraint "eventQuestRewards_rewardId_fkey";

alter table "public"."eventQuests" add constraint "eventQuests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) not valid;

alter table "public"."eventQuests" validate constraint "eventQuests_eventId_fkey";

alter table "public"."eventRecords" add constraint "eventRecords_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES public."eventLevels"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."eventRecords" validate constraint "eventRecords_levelID_fkey";

alter table "public"."eventRecords" add constraint "qualifier_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) not valid;

alter table "public"."eventRecords" validate constraint "qualifier_userID_fkey";

alter table "public"."heatmap" add constraint "public_attempts_uid_fkey" FOREIGN KEY (uid) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."heatmap" validate constraint "public_attempts_uid_fkey";

alter table "public"."inventory" add constraint "inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) not valid;

alter table "public"."inventory" validate constraint "inventory_itemId_fkey";

alter table "public"."inventory" add constraint "playerMedal_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) not valid;

alter table "public"."inventory" validate constraint "playerMedal_userID_fkey";

alter table "public"."itemTransactions" add constraint "stackableItemTransactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES public.inventory(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."itemTransactions" validate constraint "stackableItemTransactions_inventoryItemId_fkey";

alter table "public"."items" add constraint "items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) not valid;

alter table "public"."items" validate constraint "items_productId_fkey";

alter table "public"."mapPackLevels" add constraint "mapPackLevels_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mapPackLevels" validate constraint "mapPackLevels_levelID_fkey";

alter table "public"."mapPackLevels" add constraint "mapPackLevels_mapPackId_fkey" FOREIGN KEY ("mapPackId") REFERENCES public."mapPacks"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mapPackLevels" validate constraint "mapPackLevels_mapPackId_fkey";

alter table "public"."notifications" add constraint "notifications_to_fkey" FOREIGN KEY ("to") REFERENCES public.players(uid) not valid;

alter table "public"."notifications" validate constraint "notifications_to_fkey";

alter table "public"."orderItems" add constraint "orderItems_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."orderItems" validate constraint "orderItems_orderID_fkey";

alter table "public"."orderItems" add constraint "orderItems_productID_fkey" FOREIGN KEY ("productID") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."orderItems" validate constraint "orderItems_productID_fkey";

alter table "public"."orderTracking" add constraint "deliverySteps_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES public.orders(id) not valid;

alter table "public"."orderTracking" validate constraint "deliverySteps_orderID_fkey";

alter table "public"."orders" add constraint "orders_coupon_fkey" FOREIGN KEY (coupon) REFERENCES public.coupons(code) not valid;

alter table "public"."orders" validate constraint "orders_coupon_fkey";

alter table "public"."orders" add constraint "orders_giftTo_fkey" FOREIGN KEY ("giftTo") REFERENCES public.players(uid) not valid;

alter table "public"."orders" validate constraint "orders_giftTo_fkey";

alter table "public"."orders" add constraint "orders_productID_fkey" FOREIGN KEY ("productID") REFERENCES public.products(id) not valid;

alter table "public"."orders" validate constraint "orders_productID_fkey";

alter table "public"."orders" add constraint "orders_targetClanID_fkey" FOREIGN KEY ("targetClanID") REFERENCES public.clans(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_targetClanID_fkey";

alter table "public"."orders" add constraint "orders_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) not valid;

alter table "public"."orders" validate constraint "orders_userID_fkey";

alter table "public"."playerSubscriptions" add constraint "playerSubscriptions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public.subscriptions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."playerSubscriptions" validate constraint "playerSubscriptions_subscriptionId_fkey";

alter table "public"."playerSubscriptions" add constraint "playerSubscriptions_userID_fkey" FOREIGN KEY ("userID") REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."playerSubscriptions" validate constraint "playerSubscriptions_userID_fkey";

alter table "public"."players" add constraint "players_clan_fkey" FOREIGN KEY (clan) REFERENCES public.clans(id) ON DELETE SET NULL not valid;

alter table "public"."players" validate constraint "players_clan_fkey";

alter table "public"."playersAchievement" add constraint "playersAchievement_achievementid_fkey" FOREIGN KEY (achievementid) REFERENCES public.items(id) not valid;

alter table "public"."playersAchievement" validate constraint "playersAchievement_achievementid_fkey";

alter table "public"."playersAchievement" add constraint "playersAchievement_userid_fkey" FOREIGN KEY (userid) REFERENCES public.players(uid) not valid;

alter table "public"."playersAchievement" validate constraint "playersAchievement_userid_fkey";

alter table "public"."records" add constraint "public_records_levelid_fkey" FOREIGN KEY (levelid) REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."records" validate constraint "public_records_levelid_fkey";

alter table "public"."records" add constraint "public_records_userid_fkey" FOREIGN KEY (userid) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."records" validate constraint "public_records_userid_fkey";

alter table "public"."records" add constraint "records_reviewer_fkey" FOREIGN KEY (reviewer) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."records" validate constraint "records_reviewer_fkey";

alter table "public"."userSocial" add constraint "userSocial_userid_fkey" FOREIGN KEY (userid) REFERENCES public.players(uid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."userSocial" validate constraint "userSocial_userid_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_random_levels(row_count integer, filter_type text)
 RETURNS SETOF public.levels
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT *
    FROM levels
    WHERE
        (
            filter_type IS NULL
        )
        OR
        (
            filter_type = 'fl'
            AND "flTop" IS NOT NULL
        )
        OR
        (
            filter_type = 'dl'
            AND "dlTop" IS NOT NULL
            AND "isPlatformer" = false
        )
        OR
        (
            filter_type = 'pl'
            AND "dlTop" IS NOT NULL
            AND "isPlatformer" = true
        )
    ORDER BY RANDOM()
    LIMIT row_count;
END;
$function$
;

grant delete on table "public"."levelGDStates" to "anon";

grant insert on table "public"."levelGDStates" to "anon";

grant references on table "public"."levelGDStates" to "anon";

grant select on table "public"."levelGDStates" to "anon";

grant trigger on table "public"."levelGDStates" to "anon";

grant truncate on table "public"."levelGDStates" to "anon";

grant update on table "public"."levelGDStates" to "anon";

grant delete on table "public"."levelGDStates" to "authenticated";

grant insert on table "public"."levelGDStates" to "authenticated";

grant references on table "public"."levelGDStates" to "authenticated";

grant select on table "public"."levelGDStates" to "authenticated";

grant trigger on table "public"."levelGDStates" to "authenticated";

grant truncate on table "public"."levelGDStates" to "authenticated";

grant update on table "public"."levelGDStates" to "authenticated";

grant delete on table "public"."levelGDStates" to "service_role";

grant insert on table "public"."levelGDStates" to "service_role";

grant references on table "public"."levelGDStates" to "service_role";

grant select on table "public"."levelGDStates" to "service_role";

grant trigger on table "public"."levelGDStates" to "service_role";

grant truncate on table "public"."levelGDStates" to "service_role";

grant update on table "public"."levelGDStates" to "service_role";


