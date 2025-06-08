export default async function handler(req, res) {
  const url = req.query.url;

  if (!url || !url.startsWith("http://hls3.bashtel.ru")) {
    return res.status(400).send("Invalid or missing URL");
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    let text = await response.text();

    if (contentType.includes("application/vnd.apple.mpegurl") || url.endsWith(".m3u8")) {
      // 👇 Абсолютный путь к текущему прокси
      const proxyBase = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}${req.url.split('?')[0]}`;

      const base = url.substring(0, url.lastIndexOf("/") + 1);

      text = text.replace(/^(?!#)(.+\.ts)$/gm, (line) => {
        const segmentUrl = new URL(line, base).href;
        const encoded = encodeURIComponent(segmentUrl);
        return `${proxyBase}?url=${encoded}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.status(200).send(text);
    } else {
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", contentType);
      res.status(200).send(Buffer.from(buffer));
    }
  } catch (error) {
    res.status(500).send("Proxy error: " + error.message);
  }
}
