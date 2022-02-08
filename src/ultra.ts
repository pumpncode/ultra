import { existsSync } from "https://deno.land/std@0.123.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.123.0/path/mod.ts";
import LRU from "https://deno.land/x/lru@1.0.2/mod.ts";
import {
  Application,
  Router,
  send,
} from "https://deno.land/x/oak@v10.1.1/mod.ts";
import render from "./render.ts";
import transform from "./transform.ts";
import type { ImportMap, StartOptions } from "./types.ts";

const {
  env,
  listen,
  serveHttp
} = Deno;

const handleRedirect = async(connection) => {
  for await(const {request, respondWith} of serveHttp(connection)) {
    respondWith(Response.redirect(request.url.replace("http", "https"), 301));
  }
}

const port = Number(env.get("port")) || 3000;
const dev = env.get("mode") === "dev";
const prod = env.get("mode") === "prod";

const app = new Application();
const router = new Router();
const memory = new LRU<string>(500);

const root = Deno.env.get("url") || `http://localhost:${port}`;

function findFileOnDisk(pathname: string) {
  const jsx = pathname.replaceAll(".js", ".jsx");
  const tsx = pathname.replaceAll(".js", ".tsx");
  const ts = pathname.replaceAll(".js", ".ts");
  const js = pathname;

  return existsSync(join(Deno.cwd(), "src", jsx))
    ? { path: jsx, loader: "jsx" as const }
    : existsSync(join(Deno.cwd(), "src", tsx))
    ? { path: tsx, loader: "tsx" as const }
    : existsSync(join(Deno.cwd(), "src", ts))
    ? { path: ts, loader: "ts" as const }
    : existsSync(join(Deno.cwd(), "src", js))
    ? { path: js, loader: "ts" as const }
    : null;
}

const start = async(
  { importmap: importMapSource, lang = "en", secure = false }: StartOptions,
) => {
  const importmap: ImportMap = JSON.parse(importMapSource);

  app.use(async (context, next) => {
    const { pathname } = context.request.url;
    if (pathname == "/") await next();
    try {

      if (pathname.endsWith(".js") && existsSync(join(Deno.cwd(), "src", pathname))) {
        throw new Error();
      }

      await send(context, pathname, {
        root: join(Deno.cwd(), "src"),
      });
    } catch (_e) {
      await next();
    }
  });

  router.get("/:slug+.js", async (context, next) => {
    const { pathname } = context.request.url;

    if (memory.has(pathname) && !dev) {
      
      context.response.type = "application/javascript";
      context.response.body = memory.get(pathname);
      return;
    }
    const file = findFileOnDisk(pathname);

    if (!file) {
      return await next();
    }

    try {
      const source = await Deno.readTextFile(
        join(Deno.cwd(), "src", ...file.path.split("/")),
      );

      const code = await transform({
        source,
        importmap,
        root,
        loader: file.loader,
      });

      if (!dev) {
        memory.set(pathname, code);
      }
      context.response.type = "application/javascript";
      context.response.body = code;
    } catch (e) {
      console.log(e);
    }

    
  });

  router.get("/(.*)", async (context) => {
    try {
      context.response.body = await render({
        root,
        request: context.request,
        importmap,
        lang,
        // 0 to disable buffering which stops streaming
        bufferSize: 0,
      });
    } catch (e) {
      console.log(e);
      context.throw(500);
    }
  });

  app.use(router.routes());

  app.use(router.allowedMethods());

  app.addEventListener("listen", () => {
    console.log(`Listening: ${root}`);
  });

  app.addEventListener("error", (evt) => {
    console.log(evt.error);
  });

  if (prod) {
    
    const options = {
      port: secure ? 443 : 80,
      secure
    }

    if (secure) {
      const certFile = env.get("certFile");
      const keyFile = env.get("keyFile");

      Object.assign(options, {certFile, keyFile});

      const listener = listen({port: 80});

      for await(const connection of listener) {
        handleRedirect(connection);
      }
    }

    app.listen(options);
  }
  else {
    app.listen({ port });
  }
};

export default start;

export { app, router };
