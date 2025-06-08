export default async function handler(req, res) {
  const url = req.query.url;
  if (!url || !url.startsWith("http://hls3.bashtel.ru")) {
    return res.status(400).send("Invalid or missing URL");
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send("Proxy error: " + error.message);
  }
}
