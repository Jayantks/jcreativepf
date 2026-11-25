import { createPortfolio } from "../src/worker.mjs";

// Vercel serves the files in public/ before forwarding a request here.
const portfolio = createPortfolio(() => null);

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/portfolio") {
      const path = url.searchParams.get("__portfolio_path");
      if (path?.startsWith("/") && !path.startsWith("//")) {
        url.pathname = path;
        url.searchParams.delete("__portfolio_path");
        request = new Request(url, {
          method: request.method,
          headers: request.headers,
          signal: request.signal,
        });
      }
    }
    return portfolio.fetch(request, process.env);
  },
};
