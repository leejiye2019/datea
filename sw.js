const CACHE = "datea-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = e.request.url;
  // 실시간 데이터/외부 API는 캐시하지 않음
  if (url.includes("firestore") || url.includes("firebase") || url.includes("googleapis") ||
      url.includes("microlink") || url.includes("gstatic") || url.includes("oembed")) return;

  // HTML(페이지 자체)은 항상 네트워크 우선 → 새 버전이 바로 반영됨. 오프라인일 때만 캐시 사용
  if (e.request.mode === "navigate" || url.endsWith("/index.html")) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // 나머지(아이콘, 폰트 등)는 캐시 우선
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});
