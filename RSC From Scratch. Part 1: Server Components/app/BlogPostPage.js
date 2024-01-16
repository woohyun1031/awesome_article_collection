import { Footer } from "./Footer.js";

export function BlogPostPage({ postContent, author }) {
  return (
    <html>
      <head>
        <title>My blog</title>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <hr />
        </nav>
        <article>{postContent}</article>
        <Footer author={author} />
      </body>
    </html>
  );
}
