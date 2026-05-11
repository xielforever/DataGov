import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

async function enableMocking() {
  if (import.meta.env.PROD) {
    return;
  }
  try {
    const { worker } = await import("./mock/browser");
    // `onUnhandledRequest: 'bypass'` 忽略对未拦截请求的警告
    await worker.start({ onUnhandledRequest: 'bypass' });
    console.log('[MSW] Mocking enabled successfully');
  } catch (error) {
    console.error('[MSW] Failed to enable mocking:', error);
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
