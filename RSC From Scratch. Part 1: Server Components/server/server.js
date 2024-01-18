import { createServer } from "http";
import { readFile } from "fs/promises";
import escapeHtml from "escape-html";
import { Router } from "./router/Router.js";

async function renderJSXToClientJSX(jsx) {
  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean" ||
    jsx == null
  ) {
    // Don't need to do anything special with these types.
    return jsx;
  } else if (Array.isArray(jsx)) {
    // Process each item in an array.
    return Promise.all(jsx.map((child) => renderJSXToClientJSX(child)));
  } else if (jsx != null && typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === "string") {
        // This is a component like <div />.
        // Go over its props to make sure they can be turned into JSON.
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props),
        };
      } else if (typeof jsx.type === "function") {
        // This is a custom React component (like <Footer />).
        // Call its function, and repeat the procedure for the JSX it returns.
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = await Component(props);
        return renderJSXToClientJSX(returnedJsx);
      } else throw new Error("Not implemented.");
    } else {
      // This is an arbitrary object (for example, props, or something inside of them).
      // Go over every value inside, and process it too in case there's some JSX in it.
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([propName, value]) => [
            propName,
            await renderJSXToClientJSX(value),
          ])
        )
      );
    }
  } else throw new Error("Not implemented");
}

async function renderJSXToHTML(jsx) {
  if (typeof jsx === "string" || typeof jsx === "number") {
    return escapeHtml(jsx);
  } else if (jsx == null || typeof jsx === "boolean") {
    return "";
  } else if (Array.isArray(jsx)) {
    const childHtmls = await Promise.all(
      jsx.map((child) => renderJSXToHTML(child))
    );
    return childHtmls.join("");
  } else if (typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === "string") {
        let html = "<" + jsx.type;
        for (const propName in jsx.props) {
          if (jsx.props.hasOwnProperty(propName) && propName !== "children") {
            html += " ";
            html += propName;
            html += "=";
            html += escapeHtml(jsx.props[propName]);
          }
        }
        html += ">";
        html += await renderJSXToHTML(jsx.props.children);
        html += "</" + jsx.type + ">";
        return html;
      } else if (typeof jsx.type === "function") {
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = await Component(props);
        return renderJSXToHTML(returnedJsx);
      } else throw new Error("Not implemented.");
    } else throw new Error("Cannot render an object.");
  } else throw new Error("Not implemented.");
}

async function sendScript(res, filename) {
  console.log("sendScript:::", filename);
  const content = await readFile(filename, "utf8");
  res.setHeader("Content-Type", "text/javascript");
  res.end(content);
}

async function sendJSX(res, jsx) {
  console.log("sendJSX:::");
  const clientJSX = await renderJSXToClientJSX(jsx);
  const clientJSXString = JSON.stringify(clientJSX, null, 2); // Indent with two spaces
  res.setHeader("Content-Type", "application/json");
  res.end(clientJSXString);
}

async function sendHTML(res, jsx) {
  console.log("sendHTML:::");
  let html = await renderJSXToHTML(jsx);
  html += `<script type="module" src="/client/client.js"></script>`;
  res.setHeader("Content-Type", "text/html");
  res.end(html);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    console.log("request:::", url.pathname);
    if (url.pathname === "/client/client.js") {
      await sendScript(res, "./client/client.js");
    } else if (url.searchParams.has("jsx")) {
      url.searchParams.delete("jsx");
      await sendJSX(res, <Router url={url} />);
    } else {
      await sendHTML(res, <Router url={url} />);
    }
  } catch (err) {
    console.error(err);
    res.statusCode = err.statusCode ?? 500;
    res.end();
  }
}).listen(8080);
