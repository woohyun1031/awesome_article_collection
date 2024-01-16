import sanitizeFilename from "sanitize-filename";
import {
  BlogIndexPage,
  BlogLayout,
  BlogPostPage,
} from "../components/index.js";

export function Router({ url }) {
  let page;
  if (url.pathname === "/") {
    page = <BlogIndexPage />;
  } else {
    const postSlug = sanitizeFilename(url.pathname.slice(1));
    page = <BlogPostPage postSlug={postSlug} />;
  }
  return <BlogLayout>{page}</BlogLayout>;
}
