drop table if exists bookmarks;

create table bookmarks (
  id UUID primary key,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  rating INTEGER NOT NULL
);

insert into bookmarks (
  id, title, url, description, rating
)
values
  ('a8691d50-88e9-4b4c-a43e-dd3483a0ae0f', 'Thinkful', 'https://www.thinful.com', 'Think outside the classroom', 5),
  ('1c20da88-4adb-4b7d-9880-fc90d49824dc', 'Google', 'https://www.google.com', 'Where we find everything else', 4),
  ('09743b16-b7d0-4e62-a6c0-6412514a3273', 'MDN', 'https://developer.mozilla.org', 'The only place to find web documentation', 5),
  ('5a01f8f7-a047-41d8-871a-f56fb9c8c137', 'Realest Blog', 'http://realestblog.com', 'The best real estate blog', 5),
  ('ca047b7c-bdff-4478-b5f7-0cdd89775af5', 'YouTube', 'https://www.youtube.com', 'A place to watch videos', 4),
  ('a2fb1e98-aaf0-4387-ba79-14fa89f4d31d', 'Postgres', 'https://www.postgresql.org', 'A database manager', 3),
  ('8f770ced-0e3b-46f8-9777-c23868db55fd', 'DevDocs', 'https://devdocs.io', 'All the docs', 5),
  ('ff4222b1-0ae9-4342-986a-f710887109b1', 'CSS-Tricks', 'https://css-tricks.com', 'CSS tricks', 4),
  ('7199b5b5-2b5c-4849-a16e-b432230a946b', 'Minecraft', 'https://minecraft.net', 'Only the best game ever created', 5),
  ('dc263b53-bc0c-4f41-ad56-aad90ac8eb98', 'Albion Online', 'https://albiononline.com', 'Another really great game', 4);