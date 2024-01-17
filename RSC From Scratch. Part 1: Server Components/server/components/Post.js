import { readFile } from "fs/promises";

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
