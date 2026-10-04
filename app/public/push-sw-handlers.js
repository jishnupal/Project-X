/* Loaded into the generated Workbox SW via importScripts */
/* eslint-disable no-restricted-globals */

function parsePushData(event) {
  const fallback = {
    title: "BiyeFlow",
    body: "You have a new update",
    href: "/",
  };
  if (!event.data) return fallback;
  try {
    const data = event.data.json();
    if (data && typeof data === "object") {
      return {
        title: data.title || fallback.title,
        body: data.body || fallback.body,
        href: data.href || fallback.href,
      };
    }
  } catch {
    /* try text next */
  }
  try {
    const raw = event.data.text();
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return {
      title: data.title || fallback.title,
      body: data.body || fallback.body,
      href: data.href || fallback.href,
    };
  } catch {
    try {
      return { ...fallback, body: event.data.text() || fallback.body };
    } catch {
      return fallback;
    }
  }
}

self.addEventListener("push", (event) => {
  const { title, body, href } = parsePushData(event);
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { href },
      renotify: true,
      tag: "biyeflow-update",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(href);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(href);
      return undefined;
    }),
  );
});
