// 离线缓存：先用缓存秒开，同时在后台拉取新版本，下次打开生效
const CACHE = 'cake-defense-801d337f95';
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./img/album_bg.jpg", "./img/card_back.jpg", "./img/card_flash.webp", "./img/card_gold.webp", "./img/gacha_bg.jpg", "./img/gacha_machine.webp", "./img/ico_album.webp", "./img/ico_bag.webp", "./img/ico_bomb.webp", "./img/ico_capsule.webp", "./img/ico_coin.webp", "./img/ico_flashpick.webp", "./img/ico_freeze.webp", "./img/ico_gear.webp", "./img/ico_gem.webp", "./img/ico_gift.webp", "./img/ico_goldpick.webp", "./img/ico_heal.webp", "./img/ico_robot.webp", "./img/ico_sugar.webp", "./img/ico_tasks.webp", "./img/ico_ticket.webp", "./img/levels_bg.jpg", "./img/menu_bg.jpg", "./img/pack_daily.webp", "./img/pack_newbie.webp", "./img/shop_banner.jpg", "./img/shop_stall.webp"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    if (req.mode === 'navigate') {
      // 页面本身：联网时先拿最新的（3 秒没响应就用缓存），保证更新马上生效
      const net = fetch(req, { cache: 'no-store' }).then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; });
      const timeout = new Promise(r => setTimeout(() => r(null), 3000));
      try { const res = await Promise.race([net, timeout]); if (res && res.ok) return res; } catch (e) {}
      return cached || net;
    }
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
