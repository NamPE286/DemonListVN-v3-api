-- ==========================================================================
-- Seed data generated from production database
-- Generated at: 2026-03-08T05:58:51.931Z
-- Sensitive fields have been replaced with fake data.
-- ==========================================================================

-- Temporarily disable triggers to avoid side-effects during seeding
SET session_replication_role = 'replica';

-- products (7 rows)
INSERT INTO "public"."products" ("id", "name", "description", "price", "featured", "hidden", "bannerTextColor", "imgCount", "maxQuantity", "redirect", "stock", "created_at") VALUES
  (7, 'Thẻ thành viên', 'Quét để Thể Hiện. Chạm để Khẳng Định.

*Hàng đặt trước. Giao sau 1/3*

## Tính năng

- **Hỗ trợ NFC & QR**  
  Chạm hoặc quét để truy cập ngay trang **Thẻ Thành Viên**, bao gồm:  
  - Thiết kế thẻ kỹ thuật số  
  - Thông số & danh tính người chơi  
  - **Tiểu sử tuỳ chỉnh độc nhất** — khác biệt cho từng thẻ!  

- **Hoàn thiện in UV**  
  In UV mờ, sắc nét trên bề mặt thẻ nhẵn mịn, mang lại vẻ ngoài tinh tế, cao cấp và độ bền lâu dài.  

- **Thiết kế tối giản & cao cấp**  
  Tông đen nhám sang trọng với dấu ấn thương hiệu Geometry Dash VN tinh tế.  

## Bao gồm

- 1x Thẻ Thành Viên NFC Geometry Dash VN
- 1x [Geometry Dash VN Supporter](/supporter) (1 tháng)

## Lưu ý

- Những ai dã mua Thẻ thành viên Demon List VN sẽ được bù thêm 2 tháng Supporter vào Thẻ khi mua mới.
- Thẻ Demon List VN vẫn có thể sử dụng cho đến tháng 6 do tên miền cũ sẽ hết hạn vào tháng 6.', 149000, TRUE, FALSE, '#000000', 3, 1, NULL, 93, '2026-02-11T12:20:24.885077+00:00'),
  (6, 'Pass', NULL, 149000, FALSE, TRUE, '#FFFFFF', NULL, NULL, NULL, NULL, '2026-01-23T14:11:25.853209+00:00'),
  (5, 'Queue Boost', '1 ngày', 5000, FALSE, TRUE, '#FFFFFF', NULL, NULL, NULL, NULL, '2026-01-18T09:46:51.920126+00:00'),
  (4, 'Geometry Dash VN Supporter', '1 ngày', 5000, FALSE, TRUE, '#FFFFFF', NULL, NULL, NULL, NULL, '2025-10-21T16:03:50.720036+00:00'),
  (3, 'Clan Boost', '1 ngày', 5000, FALSE, TRUE, '#FFFFFF', NULL, NULL, '/supporter', NULL, '2025-08-25T20:23:24.740233+00:00'),
  (2, 'Thẻ thành viên', 'Quét để Thể Hiện. Chạm để Khẳng Định.

## Tính năng

- **Hỗ trợ NFC & QR**  
  Chạm hoặc quét để truy cập ngay trang **Thẻ Thành Viên**, bao gồm:  
  - Thiết kế thẻ kỹ thuật số  
  - Thông số & danh tính người chơi  
  - **Tiểu sử tuỳ chỉnh độc nhất** — khác biệt cho từng thẻ!  

- **Hoàn thiện in UV**  
  In UV mờ, sắc nét trên bề mặt thẻ nhẵn mịn, mang lại vẻ ngoài tinh tế, cao cấp và độ bền lâu dài.  

- **Thiết kế tối giản & cao cấp**  
  Tông đen nhám sang trọng với dấu ấn thương hiệu Demon List VN tinh tế.  

## Bao gồm

- 1x Thẻ Thành Viên NFC Demon List VN  
- 1x Demon List VN Supporter (1 tháng)
', 149000, FALSE, TRUE, '#000000', 3, 1, NULL, 0, '2025-07-17T14:37:05.148394+00:00'),
  (1, 'Geometry Dash VN Supporter (1 tháng)', 'Một vai trò. Ảnh hưởng lớn lao.', 49000, FALSE, FALSE, '#FFFFFF', NULL, NULL, '/supporter', NULL, '2025-06-03T19:54:28.030237+00:00')
ON CONFLICT DO NOTHING;

-- subscriptions (2 rows)
INSERT INTO "public"."subscriptions" ("id", "name", "description", "price", "type", "refId", "created_at") VALUES
  (2, 'Pass Premium - Season 1', NULL, 0, 'battlepass_premium', 3, '2026-02-25T08:53:05.199076+00:00'),
  (1, 'Pass Premium - Test Season', NULL, 0, 'battlepass_premium', 1, '2026-01-23T16:39:21.960814+00:00')
ON CONFLICT DO NOTHING;

-- levelTags (10 rows)
INSERT INTO "public"."levelTags" ("id", "name", "color", "created_at") VALUES
  (58, 'Icetech', '#3bf4f7', '2026-02-11T17:22:12.658219+00:00'),
  (57, 'RNG', '#3bf761', '2026-02-11T17:19:36.463836+00:00'),
  (56, 'Old Swing', '#f7863b', '2026-02-11T05:41:07.659791+00:00'),
  (55, 'Chokepoints', '#f73b9f', '2026-02-11T05:33:44.52676+00:00'),
  (54, 'XXL', '#3b82f6', '2026-02-11T05:29:43.9132+00:00'),
  (53, 'Slopetech', '#3bf7f4', '2026-02-11T04:47:11.166609+00:00'),
  (49, 'Jetpack', '#f73bd4', '2026-02-11T04:46:33.511517+00:00'),
  (47, 'NONG', '#f73b3b', '2026-02-11T04:46:11.606262+00:00'),
  (46, 'Orbs', '#eaf73b', '2026-02-11T04:45:38.742572+00:00'),
  (45, 'Dashtech', '#6df73b', '2026-02-11T04:45:30.966605+00:00')
ON CONFLICT DO NOTHING;

-- postTags (5 rows)
INSERT INTO "public"."postTags" ("id", "name", "color", "adminOnly", "createdAt") VALUES
  (5, 'Meme', '#a23bf7', FALSE, '2026-02-09T18:49:21.790132+00:00'),
  (4, 'Vui vẻ', '#f73b86', FALSE, '2026-02-09T18:49:14.074098+00:00'),
  (3, 'Hướng dẫn', '#3bf751', FALSE, '2026-02-09T18:48:59.081183+00:00'),
  (2, 'Sáng tạo', '#fbff00', FALSE, '2026-02-08T23:51:28.701333+00:00'),
  (1, 'Thành tích', '#3b82f6', FALSE, '2026-02-08T23:51:05.974824+00:00')
ON CONFLICT DO NOTHING;

-- rules (6 rows)
INSERT INTO "public"."rules" ("type", "lang", "content") VALUES
  ('platformer', 'en', '## Platformer List rule

+ When submitting a time, you must make sure that it is formatted properly (0:00:00.000).
+ A full recording (raw footage) is ideal, but the footage (cut version) must record at least 5 minutes for each checkpoint (or record all starting attempts at the checkpoint).
+ Clicks and raw footage are required for extreme demons.
+ 2-player levels must be completed solo. Handcam footage is required for 2-player extreme demons (except ''the guards mission'' and ''Ice Climbers'').
+ Click Between Frames (CBF) and Platformer Saves are not allowed. However, Platformer Saves still can be accepted if you:
1. Beat a level that has checkpoints in one sitting.
2. Beat a level that doesn’t have any checkpoints (e.g We Forgot Everything, Aerios, etc.).

Note: If you are playing a level with only one checkpoint (e.g Crerro Kaizo II with the countdown intro) but still using Platformer Saves, you shouldn’t get the checkpoint.

+ Completions utilising large skips or secret ways may invalidate your record (small skips are allowed).
+ It is recommended to check the list of allowed hacks / mods / programs from [Pemonlist](https://docs.google.com/spreadsheets/d/13zirLi-ociDBJ8QyRZs803_WAm68HiSHtnyoAnNPncw/edit?usp=sharing).'),
  ('platformer', 'vi', '## Luật Platformer List

+ Khi gửi thời gian, bạn phải đảm bảo rằng thời gian được định dạng đúng (0:00:00.000).
+ Một record đầy đủ (raw footage) là lý tưởng, nhưng video (bản cắt) phải ghi lại ít nhất 5 phút cho mỗi checkpoint (hoặc ghi lại tất cả attempt bắt đầu tại checkpoint).
+ Yêu cầu tiếng click và raw footage đối với extreme demon.
+ Các level 2 người chơi phải được hoàn thành một mình. Yêu cầu quay video cử động tay đối với extreme demon 2 người chơi (ngoại trừ ''the guards mission'' và ''Ice Climbers'').
+ Không được phép sử dụng Click Between Frames (CBF) và Platformer Saves. Tuy nhiên, Platformer Saves vẫn có thể được chấp nhận nếu bạn:
1. Hoàn thành level có các checkpoint trong cùng 1 chỗ.
2. Hoàn thành level không có checkpoint (ví dụ: We Forgot Everything, Aerios, v.v).

Lưu ý: Nếu bạn đang chơi một level chỉ có một checkpoint (ví dụ: Crerro Kaizo II với phần giới thiệu đếm ngược) nhưng vẫn sử dụng Platformer Saves, bạn không nên lấy checkpoint.

+ Việc hoàn thành bằng cách skip đoạn dài hoặc dùng đường tắt bí mật có thể khiến record của bạn không được chấp nhận (skip đoạn ngắn thì được phép).
+ Khuyến khích kiểm tra danh sách các bản hack / mod / chương trình được phép từ [Pemonlist](https://docs.google.com/spreadsheets/d/13zirLi-ociDBJ8QyRZs803_WAm68HiSHtnyoAnNPncw/edit?usp=sharing).'),
  ('general', 'en', '## General rule

+ Only the players who have Vietnamese citizenship or Vietnamese bloodline can submit records.
+ Records must be 360p 25fps or better.
+ Records not showing the in-game endscreen (Level Complete) after completing the level will not be accepted.
+ Records should be available on YouTube (public or unlisted).
+ Players are allowed to fix bugs that are caused by varying refresh rates or in-game physics changes.
+ If you use a custom LDM version, you must show the LDM level''s ID in the comment section when submitting. Otherwise, your submission will be rejected immediately.'),
  ('general', 'vi', '## Luật chung

+ Chỉ những người chơi có quốc tịch Việt Nam hoặc có dòng máu Việt Nam mới có thể gửi record.
+ Record phải có độ phân giải 360p 25fps trở lên.
+ Record không hiển thị màn hình kết thúc (Level Complete) sau khi hoàn thành level sẽ không được chấp nhận.
+ Record nên có sẵn trên YouTube (công khai hoặc không công khai).
+ Người chơi được phép sửa lỗi do tần số làm mới khác nhau hoặc thay đổi vật lý trong game gây ra.
+ Nếu bạn sử dụng phiên bản LDM tùy chỉnh, bạn phải cung cấp ID của level LDM trong phần bình luận khi nộp. Nếu không, bản nộp của bạn sẽ bị từ chối ngay lập tức.'),
  ('classic', 'en', '## Classic + Featured List rule

+ Records without FPS counter, clicks and raw footage will be rejected immediately (for extreme demons).
+ Records must reach minimum progress requirement of any level to be accepted.
+ Records using disallowed hacks or secret routes (bypassing the hardest parts of the level), or stolen from others will not be accepted. It is recommended to check the list of allowed hacks from [Pointercrate](https://docs.google.com/spreadsheets/d/1evE4nXATxRAQWu2Ajs54E6cVUqHBoSid8I7JauJnOzg/edit?usp=sharing).
+ For Featured List creators, levels must be rated demons, created and uploaded by the Vietnamese (or having at least 50% Vietnamese contribution).'),
  ('classic', 'vi', '## Luật Classic + Featured List

+ Record không có FPS counter, tiếng click và raw footage sẽ bị từ chối ngay lập tức (đối với extreme demon).
+ Record phải đạt yêu cầu tiến độ tối thiểu của level để được chấp nhận.
+ Record sử dụng hack không được phép hoặc đường tắt bí mật (bỏ qua những phần khó nhất của level), hoặc ăn cắp từ người khác sẽ không được chấp nhận. Khuyến khích kiểm tra danh sách hack được phép từ [Pointercrate](https://docs.google.com/spreadsheets/d/1evE4nXATxRAQWu2Ajs54E6cVUqHBoSid8I7JauJnOzg/edit?usp=sharing).
+ Đối với Featured List creator, level phải là rated demon, được tạo và upload bởi người Việt Nam (hoặc có ít nhất 50% đóng góp của người Việt Nam).')
ON CONFLICT DO NOTHING;

-- wiki (10 rows)
INSERT INTO "public"."wiki" ("path", "locale", "title", "description", "image", "modifiedAt", "created_at") VALUES
  ('regulations/general.md', 'vi', 'QUY CHẾ TỔ CHỨC VÀ VẬN HÀNH DỰ ÁN GDVN', '## MỤC LỤC', NULL, '2026-03-05T08:41:32.155+00:00', '2026-03-04T05:31:13.440748+00:00'),
  ('rules/contest.md', 'en', 'Contest Rules', '## Rating distribution', NULL, '2026-02-11T02:48:48.452+00:00', '2026-02-11T02:48:48.835605+00:00'),
  ('rules/contest.md', 'vi', 'Luật cuộc thi', '## Xếp hạng', NULL, '2026-02-11T02:48:48.637+00:00', '2026-02-11T02:48:48.835605+00:00'),
  ('rules/platformer.md', 'en', 'Platformer List Rules', '- When submitting a time, ensure the time is formatted correctly (0:00:00.000).', NULL, '2026-02-07T09:40:53.823+00:00', '2026-02-07T09:40:55.087223+00:00'),
  ('rules/classic.md', 'en', 'Classic + Featured List Rules', '- Records missing an FPS counter, click sounds, or raw footage will be rejected immediately (for extreme demons).', NULL, '2026-02-11T03:05:59.112+00:00', '2026-02-07T09:40:55.087223+00:00'),
  ('rules/classic.md', 'vi', 'Luật Classic + Featured List', '- Record không có FPS counter, tiếng click và raw footage sẽ bị từ chối ngay lập tức (đối với extreme demon).', NULL, '2026-02-11T03:05:59.547+00:00', '2026-02-07T09:40:55.087223+00:00'),
  ('rules/platformer.md', 'vi', 'Luật Platformer List', '- Khi gửi thời gian, bạn phải đảm bảo rằng thời gian được định dạng đúng (0:00:00.000).', NULL, '2026-02-07T09:40:54.448+00:00', '2026-02-07T09:40:55.087223+00:00'),
  ('rules/challenge.md', 'vi', 'Luật Challenge List', '## Level', NULL, '2026-02-11T03:03:46.944+00:00', '2026-02-07T09:40:55.087223+00:00'),
  ('rules/challenge.md', 'en', 'Challenge List Rules', '## Level', NULL, '2026-02-11T03:03:46.775+00:00', '2026-02-07T09:40:55.087223+00:00'),
  ('news/index.md', 'vi', 'News', NULL, NULL, '2026-01-30T17:39:14.612+00:00', '2026-01-30T17:39:15.247316+00:00')
ON CONFLICT DO NOTHING;

-- mapPacks (6 rows)
INSERT INTO "public"."mapPacks" ("id", "name", "description", "difficulty", "xp", "created_at") VALUES
  (18, 'Pack 6', '', 'insane_demon', 200, '2026-02-25T04:28:53.95864+00:00'),
  (17, 'Pack 5', '', 'insane_demon', 200, '2026-02-25T04:28:46.048858+00:00'),
  (16, 'Pack 4', '', 'medium_demon', 200, '2026-02-25T04:28:32.112537+00:00'),
  (15, 'Pack 3', '', 'medium_demon', 200, '2026-02-25T04:28:21.862777+00:00'),
  (14, 'Pack 2', '', 'harder', 200, '2026-02-25T04:28:00.74442+00:00'),
  (13, 'Pack 1', '', 'harder', 200, '2026-02-25T04:24:51.61544+00:00')
ON CONFLICT DO NOTHING;

-- players (15 rows)
INSERT INTO "public"."players" ("uid", "id", "name", "email", "discord", "facebook", "youtube", "province", "city", "DiscordDMChannelID", "overviewData", "pointercrate", "avatarVersion", "bannerVersion", "bgColor", "borderColor", "clan", "clrank", "clRating", "dlMaxPt", "dlrank", "elo", "exp", "extraExp", "flMaxPt", "flrank", "isAdmin", "isAvatarGif", "isBanned", "isBannerGif", "isHidden", "isTrusted", "matchCount", "nameLocked", "overallRank", "overwatchReviewCount", "overwatchReviewDate", "plrank", "plRating", "rating", "recordCount", "renameCooldown", "reviewCooldown", "supporterUntil", "totalDLpt", "totalFLpt") VALUES
  ('00000000-0000-0000-0000-000000000001', 24982, 'Player_Alpha', 'user0@example.com', 'fakeuser0#0000', 'https://www.facebook.com/profile.php?id=100000000000', 'https://www.youtube.com/@fakeuser0', NULL, NULL, NULL, NULL, 'fakeuser0', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, NULL, 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000002', 24980, 'Player_Beta', 'user1@example.com', 'fakeuser1#0000', 'https://www.facebook.com/profile.php?id=100000000001', 'https://www.youtube.com/@fakeuser1', NULL, NULL, NULL, NULL, 'fakeuser1', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, NULL, 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000003', 24964, 'Player_Gamma', 'user2@example.com', 'fakeuser2#0000', 'https://www.facebook.com/profile.php?id=100000000002', 'https://www.youtube.com/@fakeuser2', NULL, NULL, NULL, NULL, 'fakeuser2', 3, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, NULL, 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000004', 24900, 'Player_Delta', 'user3@example.com', 'fakeuser3#0000', 'https://www.facebook.com/profile.php?id=100000000003', 'https://www.youtube.com/@fakeuser3', NULL, NULL, NULL, NULL, 'fakeuser3', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000005', 24758, 'Player_Epsilon', 'user4@example.com', 'fakeuser4#0000', 'https://www.facebook.com/profile.php?id=100000000004', 'https://www.youtube.com/@fakeuser4', NULL, NULL, NULL, NULL, 'fakeuser4', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000006', 24738, 'Player_Zeta', 'user5@example.com', 'fakeuser5#0000', 'https://www.facebook.com/profile.php?id=100000000005', 'https://www.youtube.com/@fakeuser5', NULL, NULL, NULL, NULL, 'fakeuser5', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000007', 24664, 'Player_Eta', 'user6@example.com', 'fakeuser6#0000', 'https://www.facebook.com/profile.php?id=100000000006', 'https://www.youtube.com/@fakeuser6', NULL, NULL, NULL, NULL, 'fakeuser6', 1, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000008', 24563, 'Player_Theta', 'user7@example.com', 'fakeuser7#0000', 'https://www.facebook.com/profile.php?id=100000000007', 'https://www.youtube.com/@fakeuser7', NULL, NULL, NULL, NULL, 'fakeuser7', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000009', 24541, 'Player_Iota', 'user8@example.com', 'fakeuser8#0000', 'https://www.facebook.com/profile.php?id=100000000008', 'https://www.youtube.com/@fakeuser8', NULL, NULL, NULL, NULL, 'fakeuser8', 1, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000010', 24525, 'Player_Kappa', 'user9@example.com', 'fakeuser9#0000', 'https://www.facebook.com/profile.php?id=100000000009', 'https://www.youtube.com/@fakeuser9', NULL, NULL, NULL, NULL, 'fakeuser9', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000011', 24517, 'Player_Lambda', 'user10@example.com', 'fakeuser10#0000', 'https://www.facebook.com/profile.php?id=1000000000010', 'https://www.youtube.com/@fakeuser10', NULL, NULL, NULL, NULL, 'fakeuser10', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000012', 24487, 'Player_Mu', 'user11@example.com', 'fakeuser11#0000', 'https://www.facebook.com/profile.php?id=1000000000011', 'https://www.youtube.com/@fakeuser11', NULL, NULL, NULL, NULL, 'fakeuser11', 1, 0, NULL, NULL, NULL, 4870, NULL, 2291, 151, 1500, 4633, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, 138, 0, '2026-03-08', 25, NULL, 2291, 1, '2020-06-09T14:03:33.297+00:00', NULL, NULL, 2291, NULL),
  ('00000000-0000-0000-0000-000000000013', 24474, 'Player_Nu', 'user12@example.com', 'fakeuser12#0000', 'https://www.facebook.com/profile.php?id=1000000000012', 'https://www.youtube.com/@fakeuser12', NULL, NULL, NULL, NULL, 'fakeuser12', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000014', 24437, 'Player_Xi', 'user13@example.com', 'fakeuser13#0000', 'https://www.facebook.com/profile.php?id=1000000000013', 'https://www.youtube.com/@fakeuser13', NULL, NULL, NULL, NULL, 'fakeuser13', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000015', 24435, 'Player_Omicron', 'user14@example.com', 'fakeuser14#0000', 'https://www.facebook.com/profile.php?id=1000000000014', 'https://www.youtube.com/@fakeuser14', NULL, NULL, NULL, NULL, 'fakeuser14', 0, 0, NULL, NULL, NULL, 4870, NULL, -1, NULL, 1500, 0, 0, -1, NULL, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, NULL, 0, '2026-03-08', 25, NULL, NULL, 0, '2020-06-09T14:03:33.297+00:00', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- items (10 rows)
INSERT INTO "public"."items" ("id", "name", "description", "type", "rarity", "quantity", "stackable", "productId", "redirect", "defaultExpireAfter") VALUES
  (21, 'Hòm pass cao cấp', NULL, 'case', 2, 1, FALSE, NULL, NULL, NULL),
  (20, 'Hòm pass cơ bản', NULL, 'case', 0, 1, FALSE, NULL, NULL, NULL),
  (19, 'Battlepass Season 1', NULL, 'medal', 4, 1, FALSE, NULL, NULL, NULL),
  (18, 'Supporter (3 ngày)', NULL, 'coupon', 3, 3, FALSE, 4, NULL, 604800000),
  (17, 'Nâng cấp Clan (3 ngày)', NULL, 'coupon', 3, 3, FALSE, 3, NULL, 604800000),
  (16, 'Lì xì', NULL, 'case', 4, 1, FALSE, NULL, NULL, NULL),
  (15, 'Tăng tốc duyệt', 'Dùng để tăng tốc duyệt 1 bản ghi. Bản ghi sẽ được coi như nộp sớm hơn 1 ngày', 'currency', 4, 1, TRUE, NULL, NULL, NULL),
  (14, 'Supporter (30 ngày)', NULL, 'coupon', 4, 30, FALSE, 4, NULL, 604800000),
  (13, 'Nâng cấp Clan (30 ngày)', NULL, 'coupon', 4, 30, FALSE, 3, NULL, 604800000),
  (12, 'Supporter (7 ngày)', NULL, 'coupon', 3, 7, FALSE, 4, NULL, 604800000)
ON CONFLICT DO NOTHING;

-- levels (15 rows)
INSERT INTO "public"."levels" ("id", "name", "creator", "creatorId", "difficulty", "dlTop", "flPt", "flTop", "insaneTier", "isChallenge", "isNonList", "isPlatformer", "main_level_id", "minProgress", "rating", "videoID", "accepted", "created_at") VALUES
  (135081535, 'KLSW ', 'KalickGD', '00000000-0000-0000-0000-000000000016', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, 'jzC3_TPJIpo', FALSE, '2026-03-08T05:12:16.28125+00:00'),
  (134866632, 'no broken', 'HUYDRAGON', '00000000-0000-0000-0000-000000000017', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, 'rRwkfAafPmM', FALSE, '2026-03-04T12:57:13.958491+00:00'),
  (134851765, 'Wave Carried Gaming', 'Lych33TheW', '00000000-0000-0000-0000-000000000018', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, 'qvNQTuXixVg', FALSE, '2026-03-04T12:46:37.352908+00:00'),
  (134637068, 'Dont Wake Me Up', 'SC750', NULL, 'Insane', NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, NULL, 100, NULL, 'N/a', FALSE, '2026-03-03T00:00:02.262+00:00'),
  (134634877, 'C', 'Lych33TheW', '00000000-0000-0000-0000-000000000018', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, 'MrQRE4w_Wm4', FALSE, '2026-03-03T15:24:00.923602+00:00'),
  (134629375, 'Anaconda', 'Andrexel', NULL, 'Hard', NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, NULL, 100, NULL, 'N/a', FALSE, '2026-03-08T03:00:01.741+00:00'),
  (134623829, 'Passing on Through', 'Vaughners', NULL, 'Hard', NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, NULL, 100, NULL, 'N/a', FALSE, '2026-03-02T02:00:02.036+00:00'),
  (134542147, 'chs challenge ko', 'DuckLmao', '00000000-0000-0000-0000-000000000019', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, 'TXfNUV9VxDU', FALSE, '2026-02-28T11:36:55.904758+00:00'),
  (134534214, 'a simple challenge', 'namvn2993', '00000000-0000-0000-0000-000000000020', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, 'CAI8y292Hpo', FALSE, '2026-02-28T05:56:36.062267+00:00'),
  (134473508, 'Toxic Sewers', 'JesseGDGaming', NULL, 'Harder', NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, NULL, 100, NULL, 'N/a', FALSE, '2026-03-06T01:00:03.282+00:00'),
  (134408233, 'LIGHT', 'TNDYGD', '00000000-0000-0000-0000-000000000021', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, '0rTE5ig-nPU', FALSE, '2026-02-26T15:16:21.646359+00:00'),
  (134337807, 'Would You Be Waiting', 'evrglo', NULL, 'Hard', NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, NULL, 100, NULL, 'N/a', FALSE, '2026-02-28T01:00:02.178+00:00'),
  (134265317, 'Hi Riley', 'noly2k', NULL, 'Harder', NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, NULL, 100, NULL, 'N/a', FALSE, '2026-02-25T00:00:02.704+00:00'),
  (134264671, 'chip shallenge', 'Quyetdat', '00000000-0000-0000-0000-000000000022', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, FALSE, NULL, 100, NULL, 'iwBvwIhSUr4', FALSE, '2026-02-24T09:54:28.750479+00:00'),
  (134220929, 'moody mount fog', 'Notonich', NULL, 'Harder', NULL, NULL, NULL, NULL, FALSE, FALSE, FALSE, NULL, 100, NULL, 'N/a', FALSE, '2026-02-27T00:00:02.254+00:00')
ON CONFLICT DO NOTHING;

-- clans (10 rows)
INSERT INTO "public"."clans" ("id", "name", "tag", "owner", "rating", "rank", "memberCount", "memberLimit", "isPublic", "mode", "imageVersion", "tagBgColor", "tagTextColor", "homeContent", "boostedUntil", "created_at") VALUES
  (232, 'Con j', 'Cnj', '00000000-0000-0000-0000-000000000023', 0, NULL, 3, 0, TRUE, 'markdown', 3, NULL, NULL, NULL, '2026-03-04T15:20:58.289816+00:00', '2026-03-04T15:20:58.289816+00:00'),
  (231, 'NewJeans', 'NJZ', '00000000-0000-0000-0000-000000000024', 0, NULL, 1, 0, TRUE, 'markdown', 1, NULL, NULL, NULL, '2026-03-03T14:38:03.224518+00:00', '2026-03-03T14:38:03.224518+00:00'),
  (230, 'Lmao Society🐧', 'LMAO', '00000000-0000-0000-0000-000000000019', 0, NULL, 2, 0, TRUE, 'markdown', 1, NULL, NULL, NULL, '2026-02-28T02:38:12.999855+00:00', '2026-02-28T02:38:12.999855+00:00'),
  (229, 'Lưu Trữ Xanh Clan ', 'LTX', '00000000-0000-0000-0000-000000000025', 0, NULL, 8, 0, TRUE, 'markdown', 5, NULL, NULL, NULL, '2026-02-23T06:26:59.871676+00:00', '2026-02-23T06:26:59.871676+00:00'),
  (218, 'CAS Tô Cơm', 'CAS', '00000000-0000-0000-0000-000000000026', 0, NULL, 6, 50, TRUE, 'markdown', 1, NULL, NULL, NULL, '2026-02-18T12:59:25.895372+00:00', '2026-02-18T12:59:25.895372+00:00'),
  (217, 'It''s No Use', 'NoUse', '00000000-0000-0000-0000-000000000027', 0, NULL, 1, 36, FALSE, 'markdown', 1, NULL, NULL, NULL, '2026-02-13T15:34:33.944608+00:00', '2026-02-13T15:34:33.944608+00:00'),
  (216, 'Sài Goon by night', 'SGb9', '00000000-0000-0000-0000-000000000028', 0, NULL, 1, 420, FALSE, 'markdown', 0, NULL, NULL, NULL, '2026-02-16T15:59:50.01+00:00', '2026-02-12T08:22:33.626714+00:00'),
  (215, 'Liems', 'Liems', '00000000-0000-0000-0000-000000000029', 0, NULL, 1, 20, TRUE, 'markdown', 5, NULL, NULL, NULL, '2026-02-09T08:28:19.637537+00:00', '2026-02-09T08:28:19.637537+00:00'),
  (214, 'Astolfo lovers', 'ALC', '00000000-0000-0000-0000-000000000030', 0, NULL, 3, 5, FALSE, 'markdown', 1, NULL, NULL, NULL, '2026-02-05T15:06:35.517191+00:00', '2026-02-05T15:06:35.517191+00:00'),
  (210, 'Hyperion', 'HPR', '00000000-0000-0000-0000-000000000031', 0, NULL, 1, 18, TRUE, 'markdown', 1, '#ff00ff', '#000000', 'Welcome to the #1 QN clan <3,join my discord server in https://discord.gg/Y2xr9QVy8U ', '2026-01-07T17:53:33.651+00:00', '2026-01-04T13:49:59.337218+00:00')
ON CONFLICT DO NOTHING;

-- events (10 rows)
INSERT INTO "public"."events" ("id", "title", "description", "content", "type", "start", "end", "freeze", "hidden", "imgUrl", "isCalculated", "isContest", "isExternal", "isRanked", "isSupporterOnly", "minExp", "needProof", "priority", "redirect", "exp", "data", "created_at") VALUES
  (69, 'Giải đấu thường xuyên #31', 'Giải đấu xếp hạng', '', 'contest', '2026-03-06T05:41:00+00:00', '2026-03-06T05:46:00+00:00', NULL, TRUE, '', FALSE, TRUE, FALSE, FALSE, FALSE, 0, FALSE, 0, NULL, NULL, NULL, '2026-03-06T05:39:00+00:00'),
  (68, 'Khảo sát GDVN', 'Khảo sát GDVN', '', 'basic', '2026-03-03T03:11:00+00:00', '2026-03-03T17:00:00+00:00', NULL, FALSE, 'https://marketplace.canva.com/EAD2962NKnQ/2/0/1600w/canva-rainbow-gradient-pink-and-purple-virtual-background-_Tcjok-d9b4.jpg', FALSE, FALSE, TRUE, FALSE, FALSE, 0, FALSE, 0, 'https://forms.gle/ABUo2DsPkCXHEG1c8', NULL, NULL, '2026-03-03T03:11:00+00:00'),
  (67, 'Giải đấu thường xuyên #30', 'Giải đấu xếp hạng', '# Giải đấu thường xuyên #30

## Thông tin chung
- **Thời lượng:** 100 phút (bảng xếp hạng đóng băng sau 60 phút).
- **Độ khó:** 6 level từ Harder (6 sao) đến Medium Demon + 1 bonus level bất kỳ.
- **Người chọn Level:** [SuperLuckyCat](https://www.demonlistvn.com/player/3b586caa-c2a2-42e6-8072-c75b1766b6c9), **banner suggest:** [eEddy](https://www.demonlistvn.com/player/f85e1d10-c2be-48b3-9bd3-f34c8fe945b9).
- **Lưu ý:** Contest này chỉ chấp nhận progress được nộp thông qua [DLVN Geode Mod](https://github.com/NamPE286/DemonListVN-geode-mod/releases).

## Thể thức

Bảng xếp hạng được sắp xếp bởi:
- **Tổng điểm** - Cao hơn là tốt hơn.
- **Thời gian phạt** - Thấp hơn là tốt hơn (dùng để gỡ hoà).
### Điểm 
- Hoàn thành level thì người chơi sẽ nhận được toàn bộ điểm của level đó.  
- Hoàn thành một phần thì sẽ nhận được `tiến độ * điểm level / 100` điểm.
### Thời gian phạt 
- Là tổng thời gian tính từ lúc bắt đầu contest cho đến khi đạt được tiến độ cao nhất.  
- Áp dụng cho tiến độ toàn bộ và một phần.
- Thời gian phạt được tính đến **mili giây** nhưng trên bảng xếp hạng sẽ hiện thị đến **phút** cho dễ đọc.
### Ví dụ
| Level | Điểm | Tiến độ | Thời gian (phút) | Điểm nhận được | Thời gian phạt |
|--------|------------|----------|------------|---------------|--------------|
| A | 10 | 100% | 10 | 10.0 | 10 |
| B | 8 | 70% | 20 | 5.6 | 20 |
| **Tổng** | — | — | — | **15.6** | **30** |
', 'contest', '2026-03-07T13:00:00+00:00', '2026-03-07T14:40:00+00:00', NULL, FALSE, '', TRUE, TRUE, FALSE, TRUE, FALSE, 0, FALSE, 0, NULL, NULL, NULL, '2026-03-02T03:19:00+00:00'),
  (66, 'Ứng tuyển trusted player', 'Ứng tuyển trusted player', '# Ứng tuyển trusted player

## Mô tả công việc

- Duyệt bản ghi classic, featured, challenge list thông qua hệ thống phân phối (được duyệt 1 bản ghi mỗi 2 tiếng)
- Sau khi được nhận làm trusted player, sẽ có thêm nút Overwatch khi mở menu avatar
- Lưu ý: Trusted player sẽ không thể đổi tên để admin có thể nhận biết ai là người duyệt

## Quyền lợi

- Có dấu tick ở bên cạnh tên
- Được ưu tiên khi ứng tuyển vị trí mod/admin

## Yêu cầu khi ứng tuyển

- Nếu từng là trusted player trước đó, phải duyệt ít nhất 3 bản ghi trong tháng vừa rồi
- Có kĩ năng bắt cheat
- Hoạt động thường xuyên, duyệt tối thiểu nhất 3 bản ghi trong 1 tháng
- Nghiêm túc, có trách nhiệm và không lạm quyền (Ví dụ: duyệt cho người quen biết mà không kiểm tra)
- Đã tham gia group facebook ít nhất một năm
- Ưu tiên theo thứ tự sau (giảm dần từ trên xuống dưới)
  - Từng là cheater và đã hoàn lương
  - Từng là helper/mod/admin ở các list GD khác
  - Không có xích mích, drama với cộng đồng GDVN
  - Trên 16 tuổi

## Hướng dẫn ứng tuyển

- Bấm vào nút **Tham gia** ở trang này và viết một đoạn văn ngắn mô tả về bản thân và lý do muốn làm trusted player

## Chỉ tiêu

- Đợt này sẽ tuyển 5 trusted player

## Thông tin bổ sung

- Google sheets danh sách và cấu trúc nhân sự: https://docs.google.com/spreadsheets/d/1wvuQWGcxFYb-hrlBrFoOobJThLdUN4-DMvWSHYhO7n8/edit?gid=0#gid=0', 'basic', '2026-02-26T17:44:00+00:00', '2026-02-28T05:00:00+00:00', NULL, FALSE, 'https://t3.ftcdn.net/jpg/00/59/94/22/360_F_59942212_W7SRITy6mCGMj4i4owOeKXqaDbKRDHxZ.jpg', FALSE, FALSE, FALSE, FALSE, FALSE, 1000, FALSE, 1, NULL, NULL, NULL, '2026-02-26T17:44:00+00:00'),
  (65, 'Mã Đáo Thành Công - Tết 2026', 'Nhận lì xì Tết', '# Cách tham gia
- Bấm vào nút Tham gia xong sang tab Nhiệm vụ và nhận lì xì', 'contest', '2026-02-16T15:15:00+00:00', '2026-02-17T16:59:00+00:00', NULL, FALSE, 'https://media.loveitopcdn.com/24349/hinh-nen-tet-2026-4k-full-hd-cuc-dep-13.jpg', FALSE, TRUE, FALSE, FALSE, FALSE, 0, FALSE, 0, NULL, NULL, NULL, '2026-02-16T15:15:00+00:00'),
  (64, 'Sự kiện đóng góp nội dung cộng đồng', 'Sự kiện đóng góp nội dung cộng đồng', '# Sự kiện đóng góp nội dung cộng đồng

https://www.gdvn.net/community

## Cách tham gia
Tất cả hoạt động trong khu vực **Bài viết cộng đồng** đều được tính điểm:

- 📝 Tạo bài viết
- 👍 Nhận like từ người khác
- 💬 Bình luận (comment) hợp lệ
- ⭐ Nội dung được cộng đồng hoặc mod đánh giá cao

Điểm sẽ được cộng dồn trong suốt thời gian diễn ra event.

## Cách tính điểm
| Hoạt động | Điểm |
|---------|------|
| Post >3 like | +1 |
| Post >10 like | +5 |
| Post >25 like | +5 |
| Post >50 like | +5 |
| Post có thêm 50 like từ like thứ 51 | +5 |
| Comment được >3 like | +1 |
| Comment được >10 like | +1 |

### Post hợp lệ
- Không phải shitpost
- Các bài như quảng cáo hợp lệ nhưng không khuyến khích

### Comment hợp lệ
- Có nội dung rõ ràng, liên quan tới bài viết
- Không spam, không chỉ emoji hoặc từ vô nghĩa
- Không lặp lại nội dung comment khác

> ⚠️ Post / comment spam sẽ không được tính điểm.

## Phần thưởng
- **Mỗi 10 điểm = 1 Hòm Cộng Đồng**
- **Mỗi 50 điểm** = 1 ngày Supporter, Clan Boost và Tăng tốc duyệt

### Nội dung Hòm Cộng Đồng
- **10%** nhận **Supporter (1 ngày)**
- **10%** nhận **Clan Boost (1 ngày)**
- **10%** nhận **Tăng tốc duyệt (1 ngày)**

## Thời điểm trao thưởng
- Toàn bộ phần thưởng sẽ được **trao sau khi sự kiện kết thúc**. 
- Dữ liệu sẽ được tổng hợp vào một Google Sheets để đảm bảo tính minh bạch.

## Lưu ý
- Không sử dụng tài khoản phụ để farm điểm
- Gian lận / spam sẽ bị loại khỏi sự kiện và có thể dẫn tới ban tài khoản
- Mod có quyền loại bỏ điểm từ nội dung kém chất lượng
- Quyết định cuối cùng thuộc về ban quản trị

## Lời nhắn
Sự kiện hướng tới chất lượng nội dung, không khuyến khích spam số lượng.  
Hãy cùng nhau xây dựng một cộng đồng vui vẻ và bổ ích nhé!
', 'basic', '2026-02-09T10:40:00+00:00', '2026-03-10T10:33:00+00:00', NULL, FALSE, 'https://cdn.gdvn.net/event-banner/64.webp', FALSE, FALSE, FALSE, FALSE, FALSE, 0, FALSE, 0, '', NULL, NULL, '2026-02-09T10:40:00+00:00'),
  (63, 'Giải đấu thường xuyên #29', 'Giải đấu xếp hạng', '# Giải đấu thường xuyên #29

## Thông tin chung
- **Thời lượng:** 100 phút (bảng xếp hạng đóng băng sau 60 phút).
- **Độ khó:** 6 level từ Harder (6 sao) đến Medium Demon.
- **Người chọn Level:** [Ember](https://www.gdvn.net/player/1fff0abc-b63d-4954-b18c-a3240beb10b6), **banner suggest:** [eEddy](https://www.demonlistvn.com/player/f85e1d10-c2be-48b3-9bd3-f34c8fe945b9).
- **Lưu ý:** Contest này chỉ chấp nhận progress được nộp thông qua [DLVN Geode Mod](https://github.com/NamPE286/DemonListVN-geode-mod/releases).

## Thể thức

Bảng xếp hạng được sắp xếp bởi:
- **Tổng điểm** - Cao hơn là tốt hơn.
- **Thời gian phạt** - Thấp hơn là tốt hơn (dùng để gỡ hoà).
### Điểm 
- Hoàn thành level thì người chơi sẽ nhận được toàn bộ điểm của level đó.  
- Hoàn thành một phần thì sẽ nhận được `tiến độ * điểm level / 100` điểm.
### Thời gian phạt 
- Là tổng thời gian tính từ lúc bắt đầu contest cho đến khi đạt được tiến độ cao nhất.  
- Áp dụng cho tiến độ toàn bộ và một phần.
- Thời gian phạt được tính đến **mili giây** nhưng trên bảng xếp hạng sẽ hiện thị đến **phút** cho dễ đọc.
### Ví dụ
| Level | Điểm | Tiến độ | Thời gian (phút) | Điểm nhận được | Thời gian phạt |
|--------|------------|----------|------------|---------------|--------------|
| A | 10 | 100% | 10 | 10.0 | 10 |
| B | 8 | 70% | 20 | 5.6 | 20 |
| **Tổng** | — | — | — | **15.6** | **30** |
', 'contest', '2026-02-28T13:00:00+00:00', '2026-02-28T14:40:00+00:00', NULL, FALSE, '', TRUE, TRUE, FALSE, TRUE, FALSE, 0, FALSE, 0, NULL, NULL, NULL, '2026-01-19T07:47:00+00:00'),
  (62, 'Giải đấu thường xuyên #28', 'Giải đấu xếp hạng', '# Giải đấu thường xuyên #28

## Thông tin chung
- **Thời lượng:** 100 phút (bảng xếp hạng đóng bằng sau 60 phút).
- **Độ khó:** 6 level từ Harder (6 sao) đến Medium Demon + 1 bonus level bất kỳ.
- **Người chọn Level:** [SuperLuckyCat](https://www.demonlistvn.com/player/3b586caa-c2a2-42e6-8072-c75b1766b6c9).
- **Lưu ý:** Contest này chỉ chấp nhận progress được nộp thông qua [DLVN Geode Mod](https://github.com/NamPE286/DemonListVN-geode-mod/releases).

## Thể thức

Bảng xếp hạng được sắp xếp bởi:
- **Tổng điểm** - Cao hơn là tốt hơn.
- **Thời gian phạt** - Thấp hơn là tốt hơn (dùng để gỡ hoà).
### Điểm 
- Hoàn thành level thì người chơi sẽ nhận được toàn bộ điểm của level đó.  
- Hoàn thành một phần thì sẽ nhận được `tiến độ * điểm level / 100` điểm.
### Thời gian phạt 
- Là tổng thời gian tính từ lúc bắt đầu contest cho đến khi đạt được tiến độ cao nhất.  
- Áp dụng cho tiến độ toàn bộ và một phần.
- Thời gian phạt được tính đến **mili giây** nhưng trên bảng xếp hạng sẽ hiện thị đến **phút** cho dễ đọc.
### Ví dụ
| Level | Điểm | Tiến độ | Thời gian (phút) | Điểm nhận được | Thời gian phạt |
|--------|------------|----------|------------|---------------|--------------|
| A | 10 | 100% | 10 | 10.0 | 10 |
| B | 8 | 70% | 20 | 5.6 | 20 |
| **Tổng** | — | — | — | **15.6** | **30** |', 'contest', '2026-01-18T13:00:00+00:00', '2026-01-18T14:40:00+00:00', NULL, FALSE, '', TRUE, TRUE, FALSE, TRUE, FALSE, 0, FALSE, 0, NULL, NULL, NULL, '2026-01-18T05:14:00+00:00'),
  (61, 'Giải đấu thường xuyên #27', 'Giải đấu không xếp hạng', '# Giải đấu thường xuyên #27

## Thông tin chung
- **Thời lượng:** 100 phút (bảng xếp hạng đóng bằng sau 60 phút).
- **Độ khó:** 6 level từ Harder (6 sao) đến Medium Demon.
- **Người chọn Level:** [Ember](https://www.demonlistvn.com/player/1fff0abc-b63d-4954-b18c-a3240beb10b6), **banner suggest:** [eEddy](https://www.demonlistvn.com/player/f85e1d10-c2be-48b3-9bd3-f34c8fe945b9).
- **Lưu ý:** Contest này chỉ chấp nhận progress được nộp thông qua [DLVN Geode Mod](https://github.com/NamPE286/DemonListVN-geode-mod/releases).

## Thể thức

Bảng xếp hạng được sắp xếp bởi:
- **Tổng điểm** - Cao hơn là tốt hơn.
- **Thời gian phạt** - Thấp hơn là tốt hơn (dùng để gỡ hoà).
### Điểm 
- Hoàn thành level thì người chơi sẽ nhận được toàn bộ điểm của level đó.  
- Hoàn thành một phần thì sẽ nhận được `tiến độ * điểm level / 100` điểm.
### Thời gian phạt 
- Là tổng thời gian tính từ lúc bắt đầu contest cho đến khi đạt được tiến độ cao nhất.  
- Áp dụng cho tiến độ toàn bộ và một phần.
- Thời gian phạt được tính đến **mili giây** nhưng trên bảng xếp hạng sẽ hiện thị đến **phút** cho dễ đọc.
### Ví dụ
| Level | Điểm | Tiến độ | Thời gian (phút) | Điểm nhận được | Thời gian phạt |
|--------|------------|----------|------------|---------------|--------------|
| A | 10 | 100% | 10 | 10.0 | 10 |
| B | 8 | 70% | 20 | 5.6 | 20 |
| **Tổng** | — | — | — | **15.6** | **30** |
', 'contest', '2026-01-17T13:00:00+00:00', '2026-01-18T05:00:00+00:00', NULL, FALSE, '', FALSE, TRUE, FALSE, FALSE, FALSE, 0, FALSE, 0, NULL, NULL, NULL, '2026-01-13T01:53:00+00:00'),
  (59, 'Giải đấu thường xuyên #26', 'Giải đấu xếp hạng', '# Giải đấu thường xuyên #26

## Thông tin chung
- **Thời lượng:** 100 phút (bảng xếp hạng đóng bằng sau 60 phút).
- **Độ khó:** 6 level từ Harder (6 sao) đến Medium Demon + 1 bonus level bất kỳ.
- **Người chọn Level:** [SuperLuckyCat](https://www.demonlistvn.com/player/3b586caa-c2a2-42e6-8072-c75b1766b6c9), **banner suggest:** [eEddy](https://www.demonlistvn.com/player/f85e1d10-c2be-48b3-9bd3-f34c8fe945b9).
- **Lưu ý:** Contest này chỉ chấp nhận progress được nộp thông qua [DLVN Geode Mod](https://github.com/NamPE286/DemonListVN-geode-mod/releases).

## Thể thức

Bảng xếp hạng được sắp xếp bởi:
- **Tổng điểm** - Cao hơn là tốt hơn.
- **Thời gian phạt** - Thấp hơn là tốt hơn (dùng để gỡ hoà).
### Điểm 
- Hoàn thành level thì người chơi sẽ nhận được toàn bộ điểm của level đó.  
- Hoàn thành một phần thì sẽ nhận được `tiến độ * điểm level / 100` điểm.
### Thời gian phạt 
- Là tổng thời gian tính từ lúc bắt đầu contest cho đến khi đạt được tiến độ cao nhất.  
- Áp dụng cho tiến độ toàn bộ và một phần.
- Thời gian phạt được tính đến **mili giây** nhưng trên bảng xếp hạng sẽ hiện thị đến **phút** cho dễ đọc.
### Ví dụ
| Level | Điểm | Tiến độ | Thời gian (phút) | Điểm nhận được | Thời gian phạt |
|--------|------------|----------|------------|---------------|--------------|
| A | 10 | 100% | 10 | 10.0 | 10 |
| B | 8 | 70% | 20 | 5.6 | 20 |
| **Tổng** | — | — | — | **15.6** | **30** |', 'contest', '2026-01-11T13:00:00+00:00', '2026-01-11T14:40:00+00:00', NULL, FALSE, '', TRUE, TRUE, FALSE, TRUE, FALSE, 0, FALSE, 0, NULL, NULL, NULL, '2026-01-04T13:18:00+00:00')
ON CONFLICT DO NOTHING;

-- battlePassCourses (1 rows)
INSERT INTO "public"."battlePassCourses" ("id", "title", "description", "created_at") VALUES
  (1, 'Season 1', '', '2026-02-27T21:16:41.510064+00:00')
ON CONFLICT DO NOTHING;

-- battlePassSeasons (1 rows)
INSERT INTO "public"."battlePassSeasons" ("id", "title", "description", "start", "end", "isArchived", "primaryColor", "courseId", "created_at") VALUES
  (3, 'Season 1', '', '2026-02-25T11:47:00+00:00', '2026-04-26T11:47:00+00:00', FALSE, '#34a4f9', 1, '2026-02-25T04:30:06.780696+00:00')
ON CONFLICT DO NOTHING;

-- records (10 rows)
INSERT INTO "public"."records" ("userid", "levelid", "progress", "videoLink", "mobile", "needMod", "isChecked", "dlPt", "flPt", "clPt", "plPt", "comment", "raw", "refreshRate", "reviewer", "reviewerComment", "suggestedRating", "timestamp", "prioritizedBy", "no", "queueNo", "variant_id") VALUES
  ('00000000-0000-0000-0000-000000000016', 65610376, 100, 'https://www.youtube.com/watch?v=Nz1h_dYBM1U', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL, 'idk', '', 240, NULL, NULL, NULL, 1772949326661, 0, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000032', 120825475, 100, 'https://youtu.be/VbhNg-kZzmA?si=4MuLEjV69hfuHCE5', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, 'Ship mù', '', 60, NULL, NULL, NULL, 1772949291731, 0, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000016', 108988804, 100, 'https://www.youtube.com/watch?v=sYIBcxPCfhc', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL, 'Ngồi trúng máy lỏ nên video hơi lag', '', 240, NULL, NULL, NULL, 1772949241107, 0, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000016', 112331501, 100, 'https://www.youtube.com/watch?v=bCVf4hENGZ0', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL, 'Con gà trong nồi', '', 240, NULL, NULL, NULL, 1772949138270, 0, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000033', 130205247, 100, 'https://youtu.be/fslnK_r6JsM?si=x3j3ASZdrD2StkbO', TRUE, FALSE, FALSE, NULL, NULL, NULL, NULL, '', '', 60, NULL, NULL, NULL, 1772949090991, 0, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000016', 66351188, 100, 'https://www.youtube.com/watch?v=9wFjbK2C3qk', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL, 'Tên level hay đấy👌', '', 240, NULL, NULL, NULL, 1772948928783, 0, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000000016', 106716551, 100, 'https://www.youtube.com/watch?v=wEdxlYI4Dok', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL, 'FPS 60/240 =)) Fluke từ đoạn drop', '', 60, NULL, NULL, NULL, 1772948697279, 0, 303, 65, NULL),
  ('00000000-0000-0000-0000-000000000032', 94196048, 100, 'https://youtu.be/PTONeNh5KzE?si=omyS8Ub6qVEkJnNn', TRUE, FALSE, FALSE, NULL, 1, NULL, NULL, 'Iu YesKhoaVN', '', 60, NULL, NULL, 10, 1772947110776, 0, NULL, 64, NULL),
  ('00000000-0000-0000-0000-000000000022', 133511589, 100, 'https://www.youtube.com/watch?v=V-Dbl1dHMw4', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL, 'am i the luckest victor?', 'https://drive.google.com/file/d/1WgQ2VXApFI5fqRtn-8kXnhmBxAVdO5d6/view?usp=drive_link', 240, NULL, NULL, 2500, 1772946787027, 0, 2, 63, NULL),
  ('00000000-0000-0000-0000-000000000022', 133017131, 100, 'https://www.youtube.com/watch?v=V-Dbl1dHMw4', FALSE, FALSE, FALSE, NULL, NULL, NULL, NULL, '2000 hoi cao', '', 240, NULL, NULL, 1700, 1772945896414, 0, 3, 62, NULL)
ON CONFLICT DO NOTHING;

-- levels_tags (10 rows)
INSERT INTO "public"."levels_tags" ("level_id", "tag_id") VALUES
  (132593458, 21),
  (132593458, 26),
  (132593458, 9),
  (132308232, 13),
  (132303486, 13),
  (132186702, 21),
  (132121864, 13),
  (132038960, 13),
  (131899725, 14),
  (131899725, 17)
ON CONFLICT DO NOTHING;

-- mapPackLevels (10 rows)
INSERT INTO "public"."mapPackLevels" ("id", "mapPackId", "levelID", "order", "created_at") VALUES
  (44, 18, 111537810, 0, '2026-02-25T06:53:47.734446+00:00'),
  (43, 18, 116801757, 0, '2026-02-25T06:53:42.097657+00:00'),
  (42, 18, 113985283, 0, '2026-02-25T06:53:38.259204+00:00'),
  (41, 18, 114277968, 0, '2026-02-25T06:53:33.168718+00:00'),
  (40, 18, 76999577, 0, '2026-02-25T06:53:28.874996+00:00'),
  (39, 17, 98490093, 0, '2026-02-25T06:52:14.5617+00:00'),
  (38, 17, 90248804, 0, '2026-02-25T06:52:11.689067+00:00'),
  (37, 17, 127144323, 0, '2026-02-25T06:52:06.947888+00:00'),
  (36, 17, 77528221, 0, '2026-02-25T06:51:59.40375+00:00'),
  (35, 17, 101974873, 0, '2026-02-25T06:51:49.988649+00:00')
ON CONFLICT DO NOTHING;

-- levelGDStates (10 rows)
INSERT INTO "public"."levelGDStates" ("levelId", "isDaily", "isWeekly") VALUES
  (134637068, FALSE, FALSE),
  (134629375, TRUE, FALSE),
  (134623829, FALSE, FALSE),
  (134473508, FALSE, FALSE),
  (134337807, FALSE, FALSE),
  (134265317, FALSE, FALSE),
  (134220929, FALSE, FALSE),
  (134044567, FALSE, FALSE),
  (133966596, FALSE, FALSE),
  (133880546, FALSE, FALSE)
ON CONFLICT DO NOTHING;

-- changelogs (10 rows)
INSERT INTO "public"."changelogs" ("id", "levelID", "old", "new", "published", "created_at") VALUES
  (2048, 120825475, NULL, '{"id":120825475,"name":"cataclysm wave LOL","creator":"PhukShadow","videoID":"v8ZmOurhO7U","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-03-07T16:44:30.327154+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":true,"difficulty":null,"isChallenge":true,"creatorId":"e864f782-cd94-4b26-8cb4-822a157cb50b","main_level_id":null}', FALSE, '2026-03-07T16:44:32.314581+00:00'),
  (2047, 94839390, NULL, '{"id":94839390,"name":"Beyond the summit","creator":"MCres","videoID":"N/a","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-03-06T09:58:20.335479+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":false,"difficulty":null,"isChallenge":false,"creatorId":null,"main_level_id":null}', FALSE, '2026-03-06T09:58:21.507003+00:00'),
  (2046, 93155813, NULL, '{"id":93155813,"name":"Rigel","creator":"Dan2D","videoID":"N/a","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-03-03T09:54:32.066975+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":false,"difficulty":null,"isChallenge":false,"creatorId":null,"main_level_id":null}', FALSE, '2026-03-03T09:54:34.687239+00:00'),
  (2045, 95929957, NULL, '{"id":95929957,"name":"Th3Dev0n","creator":"Zeptoz","videoID":"N/a","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-02-28T14:47:02.721165+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":false,"difficulty":null,"isChallenge":false,"creatorId":null,"main_level_id":null}', FALSE, '2026-02-28T14:47:03.315344+00:00'),
  (2044, 27919097, NULL, '{"id":27919097,"name":"Fake A Might","creator":"LunarSimg","videoID":"N/a","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-02-28T11:50:23.979005+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":false,"difficulty":null,"isChallenge":false,"creatorId":null,"main_level_id":null}', FALSE, '2026-02-28T11:50:25.276837+00:00'),
  (2043, 134542147, NULL, '{"id":134542147,"name":"chs challenge ko","creator":"DuckLmao","videoID":"TXfNUV9VxDU","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-02-28T11:36:55.904758+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":true,"difficulty":null,"isChallenge":true,"creatorId":"f434449a-6780-4dca-844e-7749450b92cc","main_level_id":null}', FALSE, '2026-02-28T11:36:57.973239+00:00'),
  (2042, 118549005, NULL, '{"id":118549005,"name":"Jimu","creator":"Laayte","videoID":"N/a","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-02-28T06:20:49.038672+00:00","isPlatformer":true,"insaneTier":null,"accepted":false,"isNonList":false,"difficulty":null,"isChallenge":false,"creatorId":null,"main_level_id":null}', FALSE, '2026-02-28T06:20:49.715602+00:00'),
  (2041, 110264740, NULL, '{"id":110264740,"name":"Hyperion","creator":"Flaminick","videoID":"N/a","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-02-26T16:48:07.820794+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":false,"difficulty":null,"isChallenge":false,"creatorId":null,"main_level_id":null}', FALSE, '2026-02-26T16:48:10.215006+00:00'),
  (2040, 134408233, NULL, '{"id":134408233,"name":"LIGHT","creator":"TNDYGD","videoID":"0rTE5ig-nPU","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-02-26T15:16:21.646359+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":true,"difficulty":null,"isChallenge":true,"creatorId":"bd82cc6b-7287-46a2-bbe0-0b1a59fe4e8e","main_level_id":null}', FALSE, '2026-02-26T15:16:22.268076+00:00'),
  (2039, 111596039, NULL, '{"id":111596039,"name":"0 mind","creator":"MinAY","videoID":"N/a","minProgress":100,"flTop":null,"dlTop":null,"flPt":null,"rating":null,"created_at":"2026-02-26T11:15:55.676072+00:00","isPlatformer":false,"insaneTier":null,"accepted":false,"isNonList":false,"difficulty":null,"isChallenge":false,"creatorId":null,"main_level_id":null}', FALSE, '2026-02-26T11:15:56.327501+00:00')
ON CONFLICT DO NOTHING;

-- inventory (10 rows)
INSERT INTO "public"."inventory" ("id", "userID", "itemId", "quantity", "consumed", "content", "expireAt", "redirectTo", "created_at") VALUES
  (1188, '00000000-0000-0000-0000-000000000034', 20, 1, TRUE, NULL, NULL, NULL, '2026-03-08T04:13:17.494441+00:00'),
  (1187, '00000000-0000-0000-0000-000000000035', 9, 1, FALSE, NULL, '2026-03-15T01:31:07.919+00:00', '/redeem/71daa2e7026e0aa99326bb9bca912424', '2026-03-08T01:31:08.043141+00:00'),
  (1186, '00000000-0000-0000-0000-000000000035', 10, 1, TRUE, NULL, NULL, NULL, '2026-03-08T01:30:58.659443+00:00'),
  (1185, '00000000-0000-0000-0000-000000000035', 9, 1, FALSE, NULL, '2026-03-15T01:30:58.303+00:00', '/redeem/cb15c7abee679b42681455b855db72e9', '2026-03-08T01:30:58.416755+00:00'),
  (1184, '00000000-0000-0000-0000-000000000035', 8, 1, FALSE, NULL, '2026-03-15T01:30:57.973+00:00', '/redeem/1eaded47aa706619e8dde5525881fc19', '2026-03-08T01:30:58.084058+00:00'),
  (1183, '00000000-0000-0000-0000-000000000035', 7, 1, FALSE, NULL, NULL, NULL, '2026-03-08T01:30:57.391696+00:00'),
  (1182, '00000000-0000-0000-0000-000000000035', 8, 1, FALSE, NULL, '2026-03-15T01:30:57.031+00:00', '/redeem/c67d730d8628ae0404b8077d5bc45837', '2026-03-08T01:30:57.143113+00:00'),
  (1181, '00000000-0000-0000-0000-000000000035', 7, 1, FALSE, NULL, NULL, NULL, '2026-03-08T01:30:56.255344+00:00'),
  (1180, '00000000-0000-0000-0000-000000000036', 8, 1, FALSE, NULL, '2026-03-14T15:53:12.591+00:00', '/redeem/e2e11be0db4797ed9d35a4cd52d08784', '2026-03-07T15:53:12.602608+00:00'),
  (1179, '00000000-0000-0000-0000-000000000036', 20, 1, TRUE, NULL, NULL, NULL, '2026-03-07T15:53:00.249642+00:00')
ON CONFLICT DO NOTHING;

-- caseItems (10 rows)
INSERT INTO "public"."caseItems" ("id", "caseId", "itemId", "rate", "expireAfter", "created_at") VALUES
  (19, 21, 11, 0.01, 604800000, '2026-02-25T13:19:07.887108+00:00'),
  (18, 21, 12, 0.01, 604800000, '2026-02-25T13:18:49.64433+00:00'),
  (17, 21, 17, 0.14, 604800000, '2026-02-25T13:18:35.000751+00:00'),
  (16, 21, 18, 0.14, 604800000, '2026-02-25T13:18:22.39804+00:00'),
  (15, 21, 9, 0.35, 604800000, '2026-02-25T13:17:52.972933+00:00'),
  (14, 21, 8, 0.35, 604800000, '2026-02-25T13:17:34.109088+00:00'),
  (13, 20, 18, 0.05, 604800000, '2026-02-25T13:16:55.81424+00:00'),
  (12, 20, 8, 0.15, 604800000, '2026-02-25T13:16:33.068074+00:00'),
  (11, 16, 14, 0.05, 604800000, '2026-02-16T15:22:32.876949+00:00'),
  (10, 16, 12, 0.25, 604800000, '2026-02-16T15:22:16.179208+00:00')
ON CONFLICT DO NOTHING;

-- eventLevels (10 rows)
INSERT INTO "public"."eventLevels" ("id", "eventID", "levelID", "point", "totalProgress", "minEventProgress", "needRaw", "requiredLevel", "unlockCondition") VALUES
  (304, 67, 67527983, 0, 0, 0, FALSE, NULL, NULL),
  (303, 69, 128, 1, 0, 0, FALSE, NULL, NULL),
  (301, 67, 95296970, 600, 0, 0, FALSE, NULL, NULL),
  (300, 67, 91767011, 500, 0, 0, FALSE, NULL, NULL),
  (299, 67, 21927333, 400, 0, 0, FALSE, NULL, NULL),
  (298, 67, 96447996, 300, 0, 0, FALSE, NULL, NULL),
  (297, 67, 77876987, 200, 0, 0, FALSE, NULL, NULL),
  (296, 67, 14010139, 100, 0, 0, FALSE, NULL, NULL),
  (295, 63, 49985348, 600, 0, 0, FALSE, NULL, NULL),
  (294, 63, 54474315, 500, 0, 0, FALSE, NULL, NULL)
ON CONFLICT DO NOTHING;

-- eventQuests (10 rows)
INSERT INTO "public"."eventQuests" ("id", "eventId", "title", "condition", "created_at") VALUES
  (41, 67, 'Đạt 2100 điểm', '[{"type":"min","value":2100,"attribute":"total_point"}]', '2026-03-02T03:25:10.268729+00:00'),
  (40, 67, 'Đạt 1000 điểm', '[{"type":"min","value":1000,"attribute":"total_point"}]', '2026-03-02T03:24:58.780492+00:00'),
  (39, 67, 'Đạt 300 điểm', '[{"type":"min","value":300,"attribute":"total_point"}]', '2026-03-02T03:24:48.811278+00:00'),
  (38, 63, 'Đạt 2100 điểm', '[{"type":"min","value":2100,"attribute":"total_point"}]', '2026-02-25T12:18:21.912984+00:00'),
  (37, 63, 'Đạt 1000 điểm', '[{"type":"min","value":1000,"attribute":"total_point"}]', '2026-02-25T12:18:09.378763+00:00'),
  (36, 63, 'Đạt 300 điểm', '[{"type":"min","value":300,"attribute":"total_point"}]', '2026-02-25T12:17:51.51345+00:00'),
  (35, 65, 'Lì xì', '[{"type":"min","value":0,"attribute":"total_point"}]', '2026-02-16T15:18:16.793421+00:00'),
  (34, 62, 'Đạt 2100 điểm', '[{"type":"min","value":2100,"attribute":"total_point"}]', '2026-01-18T06:39:15.290276+00:00'),
  (33, 62, 'Đạt 1000 điểm', '[{"type":"min","value":1000,"attribute":"total_point"}]', '2026-01-18T06:39:03.649589+00:00'),
  (32, 62, 'Đạt 300 điểm', '[{"type":"min","value":300,"attribute":"total_point"}]', '2026-01-18T06:38:51.7262+00:00')
ON CONFLICT DO NOTHING;

-- eventQuestRewards (10 rows)
INSERT INTO "public"."eventQuestRewards" ("id", "questId", "rewardId", "expireAfter", "created_at") VALUES
  (98, 41, 10, NULL, '2026-03-02T03:26:03.488469+00:00'),
  (97, 41, 9, 604800000, '2026-03-02T03:25:57.862297+00:00'),
  (96, 41, 8, 604800000, '2026-03-02T03:25:53.044881+00:00'),
  (95, 40, 7, NULL, '2026-03-02T03:25:46.751108+00:00'),
  (94, 40, 8, 604800000, '2026-03-02T03:25:41.064531+00:00'),
  (93, 39, 7, NULL, '2026-03-02T03:25:29.622683+00:00'),
  (92, 38, 10, NULL, '2026-02-26T05:20:24.784613+00:00'),
  (91, 38, 7, NULL, '2026-02-26T05:20:18.710514+00:00'),
  (90, 37, 7, NULL, '2026-02-26T05:20:08.649533+00:00'),
  (89, 36, 7, NULL, '2026-02-26T05:20:00.113283+00:00')
ON CONFLICT DO NOTHING;

-- battlePassLevels (5 rows)
INSERT INTO "public"."battlePassLevels" ("id", "seasonId", "levelID", "type", "xp", "minProgress", "minProgressXp", "created_at") VALUES
  (23, 3, 127148097, 'normal', 1000, 50, 500, '2026-02-25T07:40:14.887511+00:00'),
  (22, 3, 128765333, 'normal', 1000, 50, 500, '2026-02-25T07:38:06.512203+00:00'),
  (21, 3, 132088589, 'normal', 1000, 50, 500, '2026-02-25T07:28:13.395081+00:00'),
  (19, 3, 133807232, 'weekly', 100, 100, 0, '2026-02-25T05:00:02.808+00:00'),
  (18, 3, 134629375, 'daily', 25, 100, 0, '2026-02-25T05:00:02.524+00:00')
ON CONFLICT DO NOTHING;

-- battlePassTierRewards (10 rows)
INSERT INTO "public"."battlePassTierRewards" ("id", "seasonId", "tier", "itemId", "quantity", "isPremium", "description", "created_at") VALUES
  (172, 3, 1, 20, 1, FALSE, 'Hòm pass cơ bản', '2026-02-26T14:59:58.270808+00:00'),
  (53, 3, 30, 21, 1, TRUE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (64, 3, 40, 21, 1, TRUE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (77, 3, 50, 21, 1, TRUE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (99, 3, 60, 21, 1, TRUE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (40, 3, 20, 21, 1, TRUE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (39, 3, 20, 8, 1, FALSE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (47, 3, 25, 15, 3, TRUE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (76, 3, 50, 18, 1, FALSE, NULL, '2026-02-25T08:36:09.064478+00:00'),
  (27, 3, 10, 21, 1, TRUE, NULL, '2026-02-25T08:36:09.064478+00:00')
ON CONFLICT DO NOTHING;

-- battlePassMapPacks (6 rows)
INSERT INTO "public"."battlePassMapPacks" ("id", "seasonId", "mapPackId", "sortOrder", "unlockWeek", "created_at") VALUES
  (12, 3, 18, 5, 5, '2026-02-25T07:15:50.88542+00:00'),
  (11, 3, 17, 4, 4, '2026-02-25T07:15:29.089933+00:00'),
  (10, 3, 16, 3, 3, '2026-02-25T07:15:11.981117+00:00'),
  (9, 3, 15, 2, 2, '2026-02-25T07:14:27.476637+00:00'),
  (8, 3, 14, 1, 1, '2026-02-25T07:12:57.005548+00:00'),
  (6, 3, 13, 0, 0, '2026-02-25T06:52:29.619818+00:00')
ON CONFLICT DO NOTHING;

-- battlePassCourseEntries (10 rows)
INSERT INTO "public"."battlePassCourseEntries" ("id", "courseId", "type", "refId", "rewardItemId", "rewardQuantity", "rewardXp", "sortOrder", "created_at") VALUES
  (10, 1, 'level', 113685088, 20, 1, 100, 8, '2026-03-04T14:58:04.512062+00:00'),
  (9, 1, 'level', 118515795, 20, 1, 100, 9, '2026-03-04T14:56:57.289681+00:00'),
  (8, 1, 'level', 77396433, 20, 1, 100, 7, '2026-03-04T14:50:43.957518+00:00'),
  (7, 1, 'level', 36574438, 20, 1, 100, 6, '2026-03-04T14:48:07.265655+00:00'),
  (6, 1, 'level', 67296979, 20, 1, 100, 5, '2026-03-04T14:45:28.309676+00:00'),
  (5, 1, 'level', 81730370, 20, 1, 100, 4, '2026-03-04T14:42:59.57933+00:00'),
  (4, 1, 'level', 11849346, 20, 1, 100, 3, '2026-02-27T21:24:18.909618+00:00'),
  (3, 1, 'level', 18533148, 20, 1, 100, 0, '2026-02-27T21:22:32.562007+00:00'),
  (2, 1, 'level', 114165438, 20, 1, 100, 2, '2026-02-27T21:21:09.321493+00:00'),
  (1, 1, 'level', 132226730, 20, 1, 100, 1, '2026-02-27T21:19:25.518823+00:00')
ON CONFLICT DO NOTHING;

-- notifications (10 rows)
INSERT INTO "public"."notifications" ("id", "to", "content", "redirect", "status", "timestamp") VALUES
  (12281, '00000000-0000-0000-0000-000000000037', 'Record Dash Land (108074135) của bạn đã được chấp nhận bởi itzlamn.', NULL, 0, '2026-03-08T05:26:26.65209+00:00'),
  (12280, '00000000-0000-0000-0000-000000000037', 'Record Lyze (63545759) của bạn đã được chấp nhận bởi itzlamn.', NULL, 0, '2026-03-08T05:22:38.591862+00:00'),
  (12278, '00000000-0000-0000-0000-000000000038', 'Record 9blue (95061038) của bạn đã được chấp nhận bởi anhkhoidu.', NULL, 0, '2026-03-08T03:39:11.479869+00:00'),
  (12277, '00000000-0000-0000-0000-000000000039', 'Record Reflect (89131259) của bạn đã được chuyển tiếp đến đội ngũ moderator để kiểm tra thêm bởi anhkhoidu.', NULL, 0, '2026-03-08T03:38:46.591895+00:00'),
  (12276, '00000000-0000-0000-0000-000000000040', 'Level "cataclysm wave LOL" (120825475) bạn gửi đã bị từ chối. ', NULL, 2, '2026-03-08T03:19:11.21699+00:00'),
  (12275, '00000000-0000-0000-0000-000000000041', 'Level "S0m3 ChALl3N4" (126546914) bạn gửi đã bị từ chối. Lý do: copy chall', NULL, 2, '2026-03-07T17:50:47.212229+00:00'),
  (12274, '00000000-0000-0000-0000-000000000042', 'Level "thuanpro challenge" (130700887) bạn gửi đã bị từ chối. Lý do: chall qua dai', NULL, 2, '2026-03-07T17:49:18.767276+00:00'),
  (12273, '00000000-0000-0000-0000-000000000037', 'Record Thien Long (76208050) của bạn đã được chấp nhận bởi b.', NULL, 0, '2026-03-07T15:11:06.493609+00:00'),
  (12272, '00000000-0000-0000-0000-000000000037', 'Record LongHunter (80155667) của bạn đã được chấp nhận bởi b.', NULL, 0, '2026-03-07T15:10:57.4622+00:00'),
  (12271, '00000000-0000-0000-0000-000000000043', 'Record Acu (61079355) của bạn đã được chấp nhận bởi b.', NULL, 0, '2026-03-07T11:22:31.572986+00:00')
ON CONFLICT DO NOTHING;

-- communityPosts (10 rows)
INSERT INTO "public"."communityPosts" ("id", "uid", "title", "content", "type", "imageUrl", "videoUrl", "attachedLevel", "attachedRecord", "clanId", "likesCount", "commentsCount", "viewsCount", "pinned", "isRecommended", "participantsCount", "maxParticipants", "createdAt", "updatedAt") VALUES
  (242, '00000000-0000-0000-0000-000000000044', 'test', '', 'discussion', NULL, NULL, NULL, NULL, 82, 0, 0, 2, FALSE, NULL, 0, NULL, '2026-03-07T15:55:07.736219+00:00', NULL),
  (241, '00000000-0000-0000-0000-000000000044', 'test', '', 'discussion', NULL, NULL, NULL, NULL, 82, 0, 0, 2, FALSE, NULL, 0, NULL, '2026-03-07T15:54:27.432875+00:00', NULL),
  (240, '00000000-0000-0000-0000-000000000045', 'cach tu mot player thuan clicksync tro thanh mot player thuan skill based', '1. dung choi clicksync nua', 'discussion', 'https://cdn.gdvn.net/community/790f927d-5a04-4fa2-bc88-6c6467bfedbb/1772896037238.jpg', NULL, NULL, NULL, NULL, 0, 0, 9, FALSE, NULL, 0, NULL, '2026-03-07T15:07:29.573544+00:00', NULL),
  (237, '00000000-0000-0000-0000-000000000014', 'Cần tìm người mua hộ Mega hack.Tui trả bằng thẻ cào', '', 'discussion', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, FALSE, NULL, 0, NULL, '2026-03-06T11:33:46.084719+00:00', NULL),
  (236, '00000000-0000-0000-0000-000000000046', 'moi nguoi cho minh hoi la ai la nguoi thanh lap ra cong dong gdvn tren facebook vay', '', 'discussion', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, FALSE, NULL, 0, NULL, '2026-03-05T14:18:43.765422+00:00', NULL),
  (235, '00000000-0000-0000-0000-000000000047', 'hỏi về việc practice mất 173 cho lần đầu tiên để chơi nine circles', 'như này có ổn để chơi nine circles không mọi người', 'discussion', 'https://cdn.gdvn.net/community/1c465134-eec9-4626-b605-9722365f7d6a/1772703219147.jpg', NULL, '{"id":4284013,"name":"Nine Circles","rating":10,"creator":"Zobros","difficulty":"Hard Demon","isPlatformer":false}', NULL, NULL, 4, 4, 39, FALSE, NULL, 0, NULL, '2026-03-05T09:33:29.681319+00:00', NULL),
  (234, '00000000-0000-0000-0000-000000000012', '.', '', 'discussion', 'https://cdn.gdvn.net/community/55a7f4f5-8f93-4c0f-8e7e-c8ba72d015d0/1772698600195.jpg', NULL, NULL, NULL, NULL, 0, 0, 0, FALSE, NULL, 0, NULL, '2026-03-05T08:16:50.544664+00:00', NULL),
  (233, '00000000-0000-0000-0000-000000000014', 'Cần tìm người mua hộ Mega hack.Tui trả bằng thẻ cào', '', 'discussion', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, FALSE, NULL, 0, NULL, '2026-03-04T23:08:25.754661+00:00', NULL),
  (232, '00000000-0000-0000-0000-000000000048', 'Làm sao để đăng nhập vô tài khoản khác gmail đc vậy', 'Mọi người ơi, mình có cái tk gdvn này(trong hình) mà mình tạo ở email cũ. Giờ email đó bị xóa rồi(do bị dính family link) nên giờ mình ko đăng nhập vô tk này dc nx. Giờ sao đây mn, trong tk này có completion niwa :(((', 'discussion', 'https://cdn.gdvn.net/community/72fd2b30-0540-4302-9fc1-ae4892d2c421/1772633291969.jpg', NULL, NULL, NULL, NULL, 0, 0, 27, FALSE, NULL, 0, NULL, '2026-03-04T14:08:24.032045+00:00', NULL),
  (231, '00000000-0000-0000-0000-000000000049', 'Tui muốn beat bloodlust thì mn có lưu ý gì khi chs không?(chokepoint, run,...) ', 'Tui được 67-100 rồi và thấy level khá thú vị', 'guide', NULL, NULL, NULL, NULL, NULL, 1, 2, 22, FALSE, NULL, 0, NULL, '2026-03-04T08:09:07.821468+00:00', NULL)
ON CONFLICT DO NOTHING;

-- communityComments (10 rows)
INSERT INTO "public"."communityComments" ("id", "postId", "uid", "content", "attachedLevel", "likesCount", "hidden", "createdAt") VALUES
  (236, 231, '00000000-0000-0000-0000-000000000050', 'xaro nhu cut, namtar (crack) nhu cut, evasium nhu cut, noi chung lvl ko rac nhm toan may part troi oi dat hoi', NULL, 0, FALSE, '2026-03-08T05:30:09.637193+00:00'),
  (235, 220, '00000000-0000-0000-0000-000000000051', 'ừm hình như đoạn đấy dễ nhất thì phải idk (nếu tập cả level mà vẫn ok thì chơi)', NULL, 0, FALSE, '2026-03-07T08:59:13.187423+00:00'),
  (234, 226, '00000000-0000-0000-0000-000000000051', 'cũng được, nhưng là tôi thì sẽ chơi em khong hieu trc', NULL, 0, FALSE, '2026-03-07T08:57:55.691837+00:00'),
  (233, 235, '00000000-0000-0000-0000-000000000052', 'được', NULL, 0, FALSE, '2026-03-06T16:48:45.850346+00:00'),
  (232, 235, '00000000-0000-0000-0000-000000000053', 'Con đường trở thành top 1 wave carried ;)', NULL, 0, FALSE, '2026-03-06T16:34:13.529689+00:00'),
  (231, 235, '00000000-0000-0000-0000-000000000017', 'Prac nhiều lên là có thể beat dc', NULL, 0, FALSE, '2026-03-06T14:42:40.334516+00:00'),
  (230, 235, '00000000-0000-0000-0000-000000000054', 'có nhé bn beat đc thoải mái', NULL, 0, FALSE, '2026-03-05T11:59:20.24756+00:00'),
  (229, 122, '00000000-0000-0000-0000-000000000047', 'vãi cả zoink gd lỏ ạ', NULL, 0, FALSE, '2026-03-05T09:35:47.248106+00:00'),
  (228, 231, '00000000-0000-0000-0000-000000000055', 'Trình k có mà hỏi làm gì 10 năm sau chưa chắc bro còn chơi GD', NULL, 0, FALSE, '2026-03-05T05:05:00.988843+00:00'),
  (227, 164, '00000000-0000-0000-0000-000000000056', '@[NhPhuc](a583bf55-3634-40a5-860f-2893c865a951) toxic😢😢', NULL, 0, FALSE, '2026-03-04T11:17:31.59837+00:00')
ON CONFLICT DO NOTHING;

-- heatmap (10 rows)
INSERT INTO "public"."heatmap" ("uid", "year", "days") VALUES
  ('00000000-0000-0000-0000-000000000057', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 68, 295, 0, 0, 0, 0, 185, 45, 104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 77, 70, 0, 3, 0, 326, 0, 213, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000058', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1741, 1557, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000059', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 707, 1806, 0, 0, 0, 1350, 1234, 997, 941, 303, 1886, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000060', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 802, 115, 75, 0, 0, 8, 240, 7, 56, 230, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000061', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 955, 0, 0, 0, 0, 0, 1, 1752, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000062', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 458, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000063', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000064', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000065', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3300, 673, 0, 0, 0, 126, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ('00000000-0000-0000-0000-000000000066', 2026, ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 118, 2594, 122, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
ON CONFLICT DO NOTHING;

-- playerConvictions (1 rows)
INSERT INTO "public"."playerConvictions" ("id", "userId", "content", "creditReduce", "isHidden", "created_at") VALUES
  (2, '00000000-0000-0000-0000-000000000044', 'Test', 0, FALSE, '2026-02-15T11:13:33.956514+00:00')
ON CONFLICT DO NOTHING;

-- APIKey (10 rows)
INSERT INTO "public"."APIKey" ("uid", "key", "created_at") VALUES
  ('00000000-0000-0000-0000-000000000034', 'fake_key_76f9e4fdb13f378ced0e7b0175e69e61', '2026-03-08T04:12:56.186978+00:00'),
  ('00000000-0000-0000-0000-000000000067', 'fake_key_f06501979262c3e604f76c6f0682df06', '2026-03-08T04:02:19.640019+00:00'),
  ('00000000-0000-0000-0000-000000000068', 'fake_key_e4752fd572e63816a1893c4e94ccc915', '2026-03-08T01:57:17.95551+00:00'),
  ('00000000-0000-0000-0000-000000000057', 'fake_key_163f1d0e75fcea628052da992fcbe631', '2026-03-07T14:59:58.101644+00:00'),
  ('00000000-0000-0000-0000-000000000069', 'fake_key_a0ab8a3f0de6008dc611d6fe71bab252', '2026-03-07T13:46:29.902112+00:00'),
  ('00000000-0000-0000-0000-000000000070', 'fake_key_5d3923759b6ce1d2c3895462075ecddd', '2026-03-07T13:18:26.633057+00:00'),
  ('00000000-0000-0000-0000-000000000071', 'fake_key_d7cc1ccaa84c3895f722de742ceacc68', '2026-03-07T12:49:17.466932+00:00'),
  ('00000000-0000-0000-0000-000000000072', 'fake_key_7f22c7891dafd1e5777329b15a7e89f3', '2026-03-07T12:46:32.1388+00:00'),
  ('00000000-0000-0000-0000-000000000071', 'fake_key_c1db62e07402ee3ecb532ec4b8ef79a1', '2026-03-07T12:45:57.678479+00:00'),
  ('00000000-0000-0000-0000-000000000016', 'fake_key_dec6529dddc203c70fb4dc3f3bade27e', '2026-03-07T12:26:13.654073+00:00')
ON CONFLICT DO NOTHING;

-- otp (10 rows)
INSERT INTO "public"."otp" ("code", "created_at", "expired_at", "granted_by", "is_expired") VALUES
  ('666461', '2026-03-08T04:12:45.844199+00:00', '2026-03-08T04:14:45.655+00:00', '00000000-0000-0000-0000-000000000034', TRUE),
  ('696445', '2026-03-08T04:01:26.395161+00:00', '2026-03-08T04:03:26.397+00:00', '00000000-0000-0000-0000-000000000067', TRUE),
  ('248785', '2026-03-08T01:57:05.924794+00:00', '2026-03-08T01:59:05.545+00:00', '00000000-0000-0000-0000-000000000068', TRUE),
  ('562047', '2026-03-07T17:18:20.566384+00:00', '2026-03-07T17:20:20.396+00:00', '00000000-0000-0000-0000-000000000073', TRUE),
  ('820563', '2026-03-07T14:59:41.186614+00:00', '2026-03-07T15:01:41.133+00:00', '00000000-0000-0000-0000-000000000057', TRUE),
  ('510062', '2026-03-07T13:46:22.330595+00:00', '2026-03-07T13:48:22.312+00:00', '00000000-0000-0000-0000-000000000069', TRUE),
  ('773796', '2026-03-07T12:49:10.123212+00:00', '2026-03-07T12:51:10.122+00:00', '00000000-0000-0000-0000-000000000071', TRUE),
  ('394639', '2026-03-07T12:47:06.222221+00:00', '2026-03-07T12:49:06.216+00:00', NULL, TRUE),
  ('765906', '2026-03-07T12:46:47.702023+00:00', '2026-03-07T12:48:47.695+00:00', NULL, TRUE),
  ('956116', '2026-03-07T12:46:22.673012+00:00', '2026-03-07T12:48:22.659+00:00', '00000000-0000-0000-0000-000000000072', TRUE)
ON CONFLICT DO NOTHING;

-- coupons (10 rows)
INSERT INTO "public"."coupons" ("code", "owner", "productID", "percent", "deduct", "quantity", "usageLeft", "validUntil", "created_at") VALUES
  ('FAKECOUPON0', '00000000-0000-0000-0000-000000000035', 3, 1, 0, 1, 1, '2026-03-15T01:31:07.841+00:00', '2026-03-08T01:31:07.893553+00:00'),
  ('FAKECOUPON1', '00000000-0000-0000-0000-000000000035', 3, 1, 0, 1, 1, '2026-03-15T01:30:58.223+00:00', '2026-03-08T01:30:58.275058+00:00'),
  ('FAKECOUPON2', '00000000-0000-0000-0000-000000000035', 4, 1, 0, 1, 1, '2026-03-15T01:30:57.897+00:00', '2026-03-08T01:30:57.941328+00:00'),
  ('FAKECOUPON3', '00000000-0000-0000-0000-000000000035', 4, 1, 0, 1, 1, '2026-03-15T01:30:56.921+00:00', '2026-03-08T01:30:56.980341+00:00'),
  ('FAKECOUPON4', '00000000-0000-0000-0000-000000000036', 4, 1, 0, 1, 1, '2026-03-14T15:53:12.517+00:00', '2026-03-07T15:53:12.500253+00:00'),
  ('FAKECOUPON5', '00000000-0000-0000-0000-000000000074', 4, 1, 0, 1, 0, '2026-03-14T14:16:30.033+00:00', '2026-03-07T14:16:30.081738+00:00'),
  ('FAKECOUPON6', '00000000-0000-0000-0000-000000000074', 3, 1, 0, 1, 1, '2026-03-14T14:16:09.359+00:00', '2026-03-07T14:16:09.400726+00:00'),
  ('FAKECOUPON7', '00000000-0000-0000-0000-000000000074', 3, 1, 0, 1, 1, '2026-03-14T14:15:55.425+00:00', '2026-03-07T14:15:55.468957+00:00'),
  ('FAKECOUPON8', '00000000-0000-0000-0000-000000000074', 3, 1, 0, 1, 1, '2026-03-14T14:15:32.479+00:00', '2026-03-07T14:15:32.521543+00:00'),
  ('FAKECOUPON9', '00000000-0000-0000-0000-000000000074', 4, 1, 0, 1, 0, '2026-03-14T14:15:32.322+00:00', '2026-03-07T14:15:32.366762+00:00')
ON CONFLICT DO NOTHING;

-- orders (10 rows)
INSERT INTO "public"."orders" ("id", "userID", "productID", "quantity", "amount", "currency", "paymentMethod", "state", "delivered", "discount", "fee", "address", "phone", "recipientName", "giftTo", "data", "coupon", "targetClanID", "created_at") VALUES
  (1772893016380, '00000000-0000-0000-0000-000000000074', 4, 1, 0, 'VND', 'Coupon', 'PAID', FALSE, 0, 0, '321 Elm Blvd', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07T14:16:56.423354+00:00'),
  (1772893012065, '00000000-0000-0000-0000-000000000074', 4, 1, 0, 'VND', 'Coupon', 'PAID', FALSE, 0, 0, '444 Cherry Pl', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07T14:16:52.111531+00:00'),
  (1772893003569, '00000000-0000-0000-0000-000000000074', 4, 1, 0, 'VND', 'Coupon', 'PAID', FALSE, 0, 0, '456 Oak Ave', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07T14:16:43.614581+00:00'),
  (1772892072999, '00000000-0000-0000-0000-000000000075', 4, 1, 0, 'VND', 'Coupon', 'PAID', FALSE, 0, 0, '222 Birch Way', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07T14:01:13.026288+00:00'),
  (1772888389111, '00000000-0000-0000-0000-000000000075', 1, 1, 49000, 'VND', 'Bank Transfer', 'PENDING', FALSE, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07T12:59:49.580545+00:00'),
  (1772864280739, '00000000-0000-0000-0000-000000000076', 1, 1, 49000, 'VND', 'Bank Transfer', 'PAID', TRUE, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07T06:18:01.268475+00:00'),
  (1772860710941, '00000000-0000-0000-0000-000000000037', 1, 1, 49000, 'VND', 'Bank Transfer', 'PAID', TRUE, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07T05:18:31.618211+00:00'),
  (1772819635519, '00000000-0000-0000-0000-000000000077', NULL, NULL, 149000, 'VND', 'COD', 'PENDING', FALSE, 0, 25000, '789 Pine Rd', 6145687548, 'Recipient 7', NULL, NULL, NULL, NULL, '2026-03-06T17:53:55.709351+00:00'),
  (1772792653874, '00000000-0000-0000-0000-000000000078', 4, 1, 0, 'VND', 'Coupon', 'PAID', FALSE, 0, 0, '654 Cedar Ln', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06T10:24:13.930849+00:00'),
  (1772774213798, '00000000-0000-0000-0000-000000000079', 4, 1, 0, 'VND', 'Coupon', 'PAID', FALSE, 0, 0, '789 Pine Rd', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06T05:16:53.808162+00:00')
ON CONFLICT DO NOTHING;

-- cards (10 rows)
INSERT INTO "public"."cards" ("id", "name", "content", "img", "owner", "supporterIncluded", "activationDate", "created_at") VALUES
  ('d7c0fea7-32c2-432a-bd6b-3aba2fcd2b35', 'Thẻ cơ bản', 'k cs j', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000080', 2, '2025-08-09T15:44:19+00:00', '2025-08-08T09:30:52.213087+00:00'),
  ('c1b6f948-9c87-49ae-a99a-ed3a14dba365', 'Thẻ cơ bản', '', 'https://cdn.demonlistvn.com/cards/basic.webp', NULL, 0, NULL, '2025-08-08T09:30:41.076385+00:00'),
  ('af21e00f-f1fa-4847-ba65-31a77560079a', 'Thẻ cơ bản', 'Tui gà lắm 🐧', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000081', 2, '2025-08-09T12:59:22+00:00', '2025-08-08T09:30:29.080566+00:00'),
  ('05c549c9-7808-4b98-91fb-347edbaba382', 'Thẻ cơ bản', '', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000082', 2, '2025-08-10T05:21:59+00:00', '2025-08-08T09:30:16.918621+00:00'),
  ('64bc5f26-d63f-498e-8ccd-3ae202f889d7', 'Thẻ cơ bản', '‎ ‎ ‎ ‎ ‎       
‎ ‎ ‎  ‎‎  ‎ ‎‎ ‎ ‎ LIMBO 100% // Jump from Windy Landscape                                                
‎ ‎ ‎ ‎ ‎ ‎‎ ‎  ‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎‎ ‎ ‎Done on 144hz // Fluke from 79%
', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000083', 2, '2025-08-09T12:18:47+00:00', '2025-08-08T09:30:08.836172+00:00'),
  ('cd1ac2ed-8efb-4494-86ac-20d175ebebab', 'Thẻ cơ bản', '', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000084', 1, '2025-09-07T13:14:45+00:00', '2025-07-30T05:52:14.285874+00:00'),
  ('4149e958-582d-431f-8880-2874d953697b', 'Thẻ cơ bản', '', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000085', 2, '2025-08-09T11:54:30+00:00', '2025-07-30T05:52:14.285874+00:00'),
  ('b431db38-bec3-49b1-9da4-f292d40dd5ef', 'Thẻ cơ bản', '', 'https://cdn.demonlistvn.com/cards/basic.webp', NULL, 2, '2025-08-09T14:57:11+00:00', '2025-07-30T05:52:14.285874+00:00'),
  ('008a69f6-ca38-4c23-b74d-a1572db5267e', 'Thẻ cơ bản', 'Kẹo lạc Cham Cham /
Đặc sản Hà Nam, /
Đây là bằng chứng /
Của ChamTheSlime. /
🐧', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000086', 2, '2025-08-09T11:27:17+00:00', '2025-07-30T05:52:14.285874+00:00'),
  ('6b7421b1-c5c9-4cd9-87fb-8406f8a234e0', 'Thẻ cơ bản', 'You better to fight than to live in fear', 'https://cdn.demonlistvn.com/cards/basic.webp', '00000000-0000-0000-0000-000000000087', 2, '2025-08-09T12:58:36+00:00', '2025-07-30T05:52:14.285874+00:00')
ON CONFLICT DO NOTHING;


-- Re-enable triggers
SET session_replication_role = 'origin';
