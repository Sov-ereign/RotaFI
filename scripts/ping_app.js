const TARGET_URL = 'https://rota-fi-omega.vercel.app';
const EVENT_URL = `${TARGET_URL}/_vercel/insights/event`;

async function simulateAnalyticsVisitors() {
  console.log(`🚀 Sending Vercel Analytics Beacon Events to ${EVENT_URL}...\n`);

  const pages = ['/', '/explore', '/dashboard', '/profile'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
  ];

  const promises = [];

  for (let i = 1; i <= 20; i++) {
    const fakeIp = `${103 + (i % 5)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const ua = userAgents[i % userAgents.length];
    const page = pages[i % pages.length];
    const fullUrl = `${TARGET_URL}${page}`;

    // Valid Vercel Analytics payload format
    const payload = {
      event: 'pageview',
      data: {
        url: fullUrl,
        referrer: 'https://google.com',
      },
    };

    promises.push(
      fetch(EVENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': ua,
          'X-Forwarded-For': fakeIp,
          'X-Real-IP': fakeIp,
        },
        body: JSON.stringify(payload),
      }).then(res => console.log(`  ├─ [Visitor ${i}/20] IP: ${fakeIp} (${page}) -> Status: ${res.status} ${res.ok ? 'OK (Tracked)' : ''}`))
        .catch(err => console.log(`  ├─ [Visitor ${i}/20] Error: ${err.message}`))
    );
  }

  await Promise.all(promises);
  console.log('\n✅ Dispatched beacon events!');
}

simulateAnalyticsVisitors();
