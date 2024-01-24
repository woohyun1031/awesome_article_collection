import { readFile } from "fs/promises";

function throwNotFound(cause) {
  const notFound = new Error("Not found.", { cause });
  notFound.statusCode = 404;
  throw notFound;
}

export async function Post({ slug }) {
  let content;
  try {
    content = await readFile("./server/posts/" + slug + ".txt", "utf8");
  } catch (err) {
    throwNotFound(err);
  }
  return (
    <section>
      <h2>
        <a href={"/" + slug}>{slug}</a>
      </h2>
      <article>{content}</article>
    </section>
  );
}
