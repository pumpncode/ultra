import {
  emptyDirSync,
  ensureDirSync,
  walkSync,
} from "https://deno.land/std@0.106.0/fs/mod.ts";

import transform from "../transform.ts";


//get importmap
const importmapSource = await Deno.readTextFile("importmap.json");
const importmap = JSON.parse(importmapSource);

console.log(importmap);

const transforms = { "jsx": true, "tsx": true };

for (const entry of walkSync("./src")) {
  let ext = entry?.path?.split(".").pop();
  if (transforms[ext]) {
    const source = await Deno.readTextFile(entry.path);
    let t = await transform({
      source,
      importmap,
      root: "https://ultra.deno.dev",
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

// let render = await Deno.readTextFile('render.ts')

// render = 'import app from "./app.js";' + render;

// render = render.replace("app.default", "app");

// render = await transform({
//   source: render,
//   importmap,
//   root: "https://ultra.deno.dev",
//   skip: true,
// });

// await Deno.writeTextFile(".ultra/render.js", render);

// let ultra = await Deno.readTextFile('ultra.ts')

// ultra = await transform({
//   source: ultra,
//   importmap,
//   root: "https://ultra.deno.dev",
//   skip: true,
// });

// await Deno.writeTextFile(".ultra/ultra.js", ultra);

Deno.exit();
