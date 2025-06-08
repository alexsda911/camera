export default async function handler(req, res) {
  const url = req.query.url;

  if (!url || !url.startsWith("http://hls3.bashtel.ru")) {
    return res.status(400).send("Missing or invalid URL parameter");
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // Если это HLS playlist (.m3u8) — модифицируем его содержимое
    if (url.endsWith(".m3u8") || contentType.includes("mpegurl")) {
      const text = await response.text();

      // Абсолютный путь к текущему endpoint
      const proxyBase = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}${req.url.split('?')[0]}`;
      const base = url.substring(0, url.lastIndexOf("/") + 1);

      // Заменяем относительные .ts-ссылки на абсолютные через прокси
      const modified = text.replace(/^(?!#)(.+\.ts)$/gm, (line) => {
        const fullUrl = new URL(line, base).href;
        const encoded = encodeURIComponent(fullUrl);
        return `${proxyBase}?url=${encoded}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.status(200).send(modified);
    } else {
      // Все остальные ресурсы (например, .ts сегменты) — отдаем как есть
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", contentType);
      res.status(200).send(Buffer.from(buffer));
    }
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}
