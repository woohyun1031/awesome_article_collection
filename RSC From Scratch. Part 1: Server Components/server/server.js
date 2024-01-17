import { createServer } from "http";
import escapeHtml from "escape-html";
import { Router } from "./router/Router.js";

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

async function sendHTML(res, jsx) {
  const html = await renderJSXToHTML(jsx);
  res.setHeader("Content-Type", "text/html");
  res.end(html);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    await sendHTML(res, <Router url={url} />);
  } catch (err) {
    console.error(err);
    res.statusCode = err.statusCode ?? 500;
    res.end();
  }
}).listen(8080);
