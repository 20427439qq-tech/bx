import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Mock OCR API
  app.post("/api/ocr", (req, res) => {
    // Simulate OCR processing
    setTimeout(() => {
      const mockResults = {
        type: "增值税发票",
        date: new Date().toISOString().split('T')[0],
        merchant: "模拟商户有限公司",
        amount: 888.00,
        tax: 53.28,
        total: 941.28,
        category: "办公费",
        ocrStatus: "success",
        invoiceNumber: "NO" + Math.floor(Math.random() * 100000000)
      };
      res.json(mockResults);
    }, 1500);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
