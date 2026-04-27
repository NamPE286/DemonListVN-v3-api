-- 1. Create a dummy admin user (if you don't have one)
INSERT INTO public.players (uid, name, "isAdmin", "isTrusted") 
VALUES ('11111111-1111-1111-1111-111111111111', 'AdminDev', true, true)
ON CONFLICT (uid) DO UPDATE SET "isAdmin" = true, "isTrusted" = true;

-- 2. Insert some Extreme Demons for the Classic List
INSERT INTO public.levels (id, name, creator, difficulty, rating, "isPlatformer", "isChallenge", "isNonList", accepted) 
VALUES 
  (10565740, 'Bloodbath', 'Riot', 'Extreme Demon', 8500, false, false, false, true),
  (11774780, 'Sonic Wave', 'Cyclic', 'Extreme Demon', 8200, false, false, false, true),
  (63055422, 'Zodiac', 'Bianox', 'Extreme Demon', 9000, false, false, false, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert completion records for these levels
INSERT INTO public.records (userid, levelid, progress, mobile, "isChecked", "videoLink", timestamp) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 10565740, 100, false, true, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 1713000000000),
  ('11111111-1111-1111-1111-111111111111', 11774780, 100, false, true, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 1713000000000),
  ('11111111-1111-1111-1111-111111111111', 63055422, 100, false, true, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 1713000000000)
ON CONFLICT (userid, levelid) DO NOTHING;

-- 4. CRITICAL: Recalculate ranks and points so they show up on the frontend
SELECT update_rank();
SELECT update_list();