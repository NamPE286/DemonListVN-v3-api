alter table "public"."orderItems" drop constraint "orderItems_userID_fkey";

alter table "public"."orderItems" drop column "userID";

alter table "public"."orderItems" alter column "orderID" set not null;


