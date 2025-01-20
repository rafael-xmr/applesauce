const modules = import.meta.glob("./examples/**/*");

function basename(path: string) {
  return path.split("/").pop()?.replace(/\..+$/, "") ?? "";
}

const examples: { id: string; path: string; load: () => Promise<unknown> }[] = [];
for (const [path, load] of Object.entries(modules)) {
  examples.push({ id: basename(path), path, load });
}

export default examples;
