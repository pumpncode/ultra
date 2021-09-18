import {
  emptyDirSync,
  ensureDirSync,
  walkSync,
} from "https://deno.land/std@0.106.0/fs/mod.ts";

import transform from "../transform.ts";

//get importmap
const importmapSource = await Deno.readTextFile("importmap.json");
const importmap = JSON.parse(importmapSource);

const transforms = { "jsx": true, "tsx": true };

for (const entry of walkSync("./src")) {
  let ext = entry?.path?.split(".").pop();
  if (transforms[ext]) {
    const source = await Deno.readTextFile(entry.path);
    let t = await transform({
      source,
      importmap,
      root: "http://localhost:8080",
    });
    await Deno.writeTextFile(
      `${
        entry.path.replace(
          /.jsx|.tsx/gi,
          () => `.js`,
        )
      }`,
      t,
    );
  }
}

Deno.exit();
