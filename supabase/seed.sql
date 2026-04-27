-- Insert test players
INSERT INTO public.players (uid, name, "isAdmin", "isTrusted") VALUES
  ('11111111-1111-1111-1111-111111111111', 'VietPlayer1', true, true),
  ('22222222-2222-2222-2222-222222222222', 'VietPlayer2', false, true)
ON CONFLICT (uid) DO NOTHING;

-- Insert Classic List Levels
INSERT INTO public.levels (id, name, creator, difficulty, rating, "dlTop", "isPlatformer", "isChallenge", "isNonList", accepted) VALUES
  (10565740, 'Bloodbath', 'Riot', 'Extreme Demon', 8500, 1, false, false, false, true),
  (11774780, 'Sonic Wave', 'Cyclic', 'Extreme Demon', 8200, 2, false, false, false, true),
  (63055422, 'Zodiac', 'Bianox', 'Extreme Demon', 9000, 3, false, false, false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Records for Classic List
INSERT INTO public.records (userid, levelid, progress, mobile, "isChecked", "videoLink", "dlPt", timestamp) VALUES
  ('11111111-1111-1111-1111-111111111111', 10565740, 100, false, true, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 250, 1713000000000),
  ('11111111-1111-1111-1111-111111111111', 11774780, 85, false, true, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 150, 1713000000000),
  ('22222222-2222-2222-2222-222222222222', 10565740, 100, true, true, 'https://youtube.com/watch?v=dQw4w9WgXcQ', 250, 1713000000000)
ON CONFLICT (userid, levelid) DO NOTHING;