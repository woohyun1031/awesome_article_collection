import { createServer } from "http";
import { readFile, readdir } from "fs/promises";
import escapeHtml from "escape-html";
import sanitizeFilename from "sanitize-filename";
import { BlogIndexPage, BlogPostPage } from "./components/index.js";
import { Router } from "./router/Router.js";

async function matchRoute(url) {
  if (url.pathname === "/") {
    const postFiles = await readdir("./posts");
    const postSlugs = postFiles.map((file) =>
      file.slice(0, file.lastIndexOf("."))
    );
    const postContents = await Promise.all(
      postSlugs.map((postSlug) =>
        readFile("./posts/" + postSlug + ".txt", "utf8")
      )
    );
    return <BlogIndexPage postSlugs={postSlugs} postContents={postContents} />;
  } else {
    const postSlug = sanitizeFilename(url.pathname.slice(1));
    try {
      const postContent = await readFile(
        "./posts/" + postSlug + ".txt",
        "utf8"
      );
      return <BlogPostPage postSlug={postSlug} postContent={postContent} />;
    } catch (err) {
      throwNotFound(err);
    }
  }
}

function throwNotFound(cause) {
  const notFound = new Error("Not found.", { cause });
  notFound.statusCode = 404;
  throw notFound;
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
