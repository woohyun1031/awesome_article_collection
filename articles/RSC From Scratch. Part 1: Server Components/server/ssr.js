import { createServer } from "http";
import { readFile } from "fs/promises";
import { renderToString } from "react-dom/server";

// This is a server to host CDN distributed resources like static files and SSR.

async function sendScript(res, filename) {
  console.log("sendScript_ssr:::", filename);
  const content = await readFile(filename, "utf8");
  res.setHeader("Content-Type", "text/javascript");
  res.end(content);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    console.log("request_ssr:::", url.pathname);
    if (url.pathname === "/client/client.js") {
      await sendScript(res, "./client/client.js");
      return;
    }
    // RSC 서버에 JSX를 요청한 다음 해당 JSX를 문자열(페이지 간 탐색용)로 제공하거나
    // 이를 HTML(초기 로드용)로 변환합니다
    const response = await fetch("http://127.0.0.1:8081" + url.pathname);
    if (!response.ok) {
      res.statusCode = response.status;
      res.end();
      return;
    }
    const clientJSXString = await response.text();
    if (url.searchParams.has("jsx")) {
      res.setHeader("Content-Type", "application/json");
      res.end(clientJSXString);
    } else {
      // <html>...</html> 형태
      // const clientJSX = await renderJSXToClientJSX(jsx);
      const clientJSX = JSON.parse(clientJSXString, parseJSX);
      let html = renderToString(clientJSX);
      html += `<script>window.__INITIAL_CLIENT_JSX_STRING__ = `;
      html += JSON.stringify(clientJSXString).replace(/</g, "\\u003c");
      html += `</script>`;
      html += `
        <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@canary",
              "react-dom/client": "https://esm.sh/react-dom@canary/client"
            }
          }
        </script>
        <script type="module" src="/client/client.js"></script>
      `;
      res.setHeader("Content-Type", "text/html");
      res.end(html);
    }
  } catch (err) {
    console.error(err);
    res.statusCode = err.statusCode ?? 500;
    res.end();
  }
}).listen(8080);

function parseJSX(key, value) {
  if (value === "$RE") {
    return Symbol.for("react.element");
  } else if (typeof value === "string" && value.startsWith("$$")) {
    return value.slice(1);
  } else {
    return value;
  }
}
