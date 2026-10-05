-- Add Threads only; preserve any catalog entries already configured by an admin.
BEGIN;

INSERT INTO "Platform" ("id", "name", "slug", "icon", "active")
VALUES ('platform-threads', '＠ Threads', 'threads', 'threads', true)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Service" ("id", "platformId", "name", "slug", "active")
SELECT 'service-threads-followers', "id", 'Tăng follow Threads', 'threads-followers', true
FROM "Platform" WHERE "slug" = 'threads'
ON CONFLICT ("platformId", "slug") DO NOTHING;

INSERT INTO "Server" (
  "id", "serviceId", "name", "description", "speed", "min", "max", "pricePer1000", "active", "createdAt", "updatedAt"
)
SELECT
  'server-threads-followers-sv1', s."id", 'Tăng follow Threads [SV1]',
  'Nhập liên kết trang cá nhân Threads cần tăng follow.', 'Trong vòng 24h',
  10, 100000, 40000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Service" s
JOIN "Platform" p ON p."id" = s."platformId"
WHERE p."slug" = 'threads' AND s."slug" = 'threads-followers'
AND NOT EXISTS (
  SELECT 1 FROM "Server" WHERE "serviceId" = s."id" AND "name" = 'Tăng follow Threads [SV1]'
)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
