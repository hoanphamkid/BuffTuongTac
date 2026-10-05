export const threadsPlatform = {
  id: 'platform-threads',
  name: '＠ Threads',
  slug: 'threads',
  icon: 'threads',
  active: true,
};

export const threadsService = {
  id: 'service-threads-followers',
  name: 'Tăng follow Threads',
  slug: 'threads-followers',
  active: true,
};

export const threadsServer = {
  id: 'server-threads-followers-sv1',
  name: 'Tăng follow Threads [SV1]',
  description: 'Nhập liên kết trang cá nhân Threads cần tăng follow.',
  speed: 'Trong vòng 24h',
  min: 10,
  max: 100000,
  pricePer1000: 40000,
  active: true,
};

// Preview the new service locally without modifying the shared database.
export const threadsPreview = {
  ...threadsPlatform,
  services: [{
    ...threadsService,
    platformId: threadsPlatform.id,
    servers: [{ ...threadsServer, serviceId: threadsService.id, previewOnly: true }],
  }],
};
