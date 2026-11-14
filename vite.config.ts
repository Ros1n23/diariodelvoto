import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { 
  getCalendarDaysForMonth, 
  getInitiativesByDate, 
  getAllInitiatives, 
  getInitiativeById,
  getSponsorAuctionState,
  createPendingSponsor,
  getPendingSponsors,
  getSponsorById,
  moderateSponsor
} from "./server/dbService.ts";
import {
  getPayPalPublicClientId,
  getPayPalMode,
  createPayPalOrder,
  capturePayPalOrder,
  refundPayPalCapture
} from "./server/paypalService.ts";

function sqliteApiPlugin(): Plugin {
  const handleApi = (req: any, res: any, next: () => void) => {
    if (!req.url || !req.url.startsWith("/api/")) {
      return next();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    res.setHeader("Content-Type", "application/json; charset=utf-8");

    try {
      if (pathname === "/api/calendar") {
        const year = parseInt(searchParams.get("year") || "2026", 10);
        const month = parseInt(searchParams.get("month") || "10", 10);
        const data = getCalendarDaysForMonth(year, month);
        res.end(JSON.stringify(data));
        return;
      }

      if (pathname === "/api/initiatives") {
        const date = searchParams.get("date");
        const data = date ? getInitiativesByDate(date) : getAllInitiatives();
        res.end(JSON.stringify(data));
        return;
      }

      if (pathname.startsWith("/api/initiatives/")) {
        const id = pathname.replace("/api/initiatives/", "");
        const data = getInitiativeById(id);
        if (!data) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Not found" }));
          return;
        }
        res.end(JSON.stringify(data));
        return;
      }

      if (pathname === "/api/sponsors" && req.method === "GET") {
        const state = getSponsorAuctionState();
        res.end(JSON.stringify(state));
        return;
      }

      if (pathname === "/api/sponsors/config" && req.method === "GET") {
        res.end(JSON.stringify({
          paypalClientId: getPayPalPublicClientId(),
          paypalMode: getPayPalMode(),
        }));
        return;
      }

      if (pathname === "/api/sponsors/pending" && req.method === "GET") {
        const pending = getPendingSponsors();
        res.end(JSON.stringify(pending));
        return;
      }

      if (pathname === "/api/sponsors/paypal-create-order" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { body += chunk; });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body || "{}");
            const state = getSponsorAuctionState();
            const amountEur = parseFloat(data.amountEur);
            if (isNaN(amountEur) || amountEur < state.minNextBidEur) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: `La puja mínima es de ${state.minNextBidEur.toFixed(2)} €` }));
              return;
            }

            const desc = data.name ? `Mecenas: ${data.name.slice(0, 40)}` : "Auspicio Cívico — Diario del Voto";
            const order = await createPayPalOrder(amountEur, desc);
            res.end(JSON.stringify({ orderId: order.orderId }));
          } catch (err: any) {
            console.error("Error paypal-create-order:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || "Error al crear la orden de PayPal" }));
          }
        });
        return;
      }

      if (pathname === "/api/sponsors/paypal-capture" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { body += chunk; });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body || "{}");
            if (!data.orderId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Falta el ID de orden de PayPal" }));
              return;
            }
            if (!data.name || !data.url || !data.message) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Faltan campos obligatorios" }));
              return;
            }
            if (data.name.length > 40) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "El nombre no puede superar 40 caracteres" }));
              return;
            }
            if (!data.url.startsWith("https://")) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "El enlace debe ser seguro (https://)" }));
              return;
            }
            if (data.message.length > 90) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "El mensaje no puede superar 90 caracteres" }));
              return;
            }

            // Capturar en PayPal
            const capture = await capturePayPalOrder(data.orderId);

            // Registrar en base de datos SQLite como pendiente de revisión editorial
            const created = createPendingSponsor({
              name: data.name,
              url: data.url,
              message: data.message,
              amountCents: Math.round(capture.amountEur * 100),
              paypalOrderId: capture.orderId,
              paypalCaptureId: capture.captureId,
            });

            res.statusCode = 201;
            res.end(JSON.stringify({
              success: true,
              sponsor: created,
              captureId: capture.captureId,
            }));
          } catch (err: any) {
            console.error("Error paypal-capture:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || "Error al procesar la captura de pago" }));
          }
        });
        return;
      }

      if (pathname === "/api/sponsors/propose" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { body += chunk; });
        req.on("end", () => {
          try {
            const data = JSON.parse(body || "{}");
            if (!data.name || !data.url || !data.message || !data.amountEur) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Faltan campos obligatorios" }));
              return;
            }
            if (data.name.length > 40) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "El nombre no puede superar 40 caracteres" }));
              return;
            }
            if (!data.url.startsWith("https://")) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "El enlace debe ser seguro (https://)" }));
              return;
            }
            if (data.message.length > 90) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "El mensaje no puede superar 90 caracteres" }));
              return;
            }

            const state = getSponsorAuctionState();
            const amountEur = parseFloat(data.amountEur);
            if (isNaN(amountEur) || amountEur < state.minNextBidEur) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: `La puja mínima es de ${state.minNextBidEur.toFixed(2)} €` }));
              return;
            }

            const created = createPendingSponsor({
              name: data.name,
              url: data.url,
              message: data.message,
              amountCents: Math.round(amountEur * 100),
              paypalOrderId: data.paypalOrderId,
              paypalCaptureId: data.paypalCaptureId,
            });

            res.statusCode = 201;
            res.end(JSON.stringify(created));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "JSON inválido" }));
          }
        });
        return;
      }

      if (pathname === "/api/sponsors/moderate" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { body += chunk; });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body || "{}");
            if (!data.id || !['approve', 'reject'].includes(data.action)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Acción o ID no válidos" }));
              return;
            }

            const existing = getSponsorById(data.id);
            if (!existing) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Mecenas no encontrado" }));
              return;
            }

            let refundId: string | undefined;
            // Si se rechaza y tiene un capture ID real de PayPal (no simulado), reembolsar
            if (data.action === 'reject' && existing.paypalCaptureId && !existing.paypalCaptureId.startsWith("CAP_")) {
              try {
                const refundRes = await refundPayPalCapture(
                  existing.paypalCaptureId,
                  data.rejectionReason || "No cumple la política editorial de Diario del Voto"
                );
                refundId = refundRes.refundId;
              } catch (refundErr: any) {
                console.error("Error al procesar reembolso en PayPal:", refundErr);
                res.statusCode = 500;
                res.end(JSON.stringify({
                  error: `Error al emitir el reembolso en PayPal: ${refundErr.message || 'Fallo desconocido'}`
                }));
                return;
              }
            }

            const updated = moderateSponsor(data.id, data.action, data.rejectionReason, refundId);
            res.end(JSON.stringify({ ...updated, refundId }));
          } catch (err: any) {
            console.error("Error moderate:", err);
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Error en la petición de moderación" }));
          }
        });
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Endpoint not found" }));
    } catch (err: any) {
      console.error("API error:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err?.message || 'Server error' }));
    }
  };

  return {
    name: "sqlite-api-plugin",
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sqliteApiPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
