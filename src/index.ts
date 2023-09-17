import { type Element, load } from "cheerio";
import type { Plugin, ResolvedConfig } from "vite";
import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import type { OutputBundle } from "rollup";

export default (): Plugin => {
  let config: ResolvedConfig;
  const bundle: OutputBundle = {};

  return {
    name: "vite-plugin-sri",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    enforce: "post",
    apply: "build",
    async writeBundle(options, _bundle) {
      // when use with vite-plugin-legacy
      // writeBundle will be called twice
      // legacy bundle will be run first, but not with index.html file
      // esm bundle will be run after, so should saved legacy bundle before esm bundle output.
      Object.entries(_bundle).forEach(([k, v]) => {
        bundle[k] = v;
      });

      const htmls = Object.keys(bundle)
        .filter((filename) => filename.endsWith(".html"))
        .map((filename) => {
          const bundleItem = bundle[filename];
          if (bundleItem.type === "asset") {
            return {
              name: bundleItem.fileName,
              source: bundleItem.source,
            };
          }
        })
        .filter((item) => !!item) as Array<{
        name: string;
        source: string;
      }>;

      htmls.forEach(async ({ name, source: html }) => {
        const $ = load(html as string);

        // Implement SRI for scripts and stylesheets.
        const scripts = $("script").filter("[src]");
        const stylesheets = $("link").filter("[href]");

        const calculateIntegrityHashes = async (element: Element) => {
          let source: string | Uint8Array | undefined;
          const attributeName = element.attribs.src ? "src" : "href";
          const resourceUrl = element.attribs[attributeName];

          const resourcePath =
            resourceUrl.indexOf(config.base) === 0
              ? resourceUrl.substring(config.base.length)
              : resourceUrl;

          const t = Object.entries(bundle).find(
            ([, bundleItem]) => bundleItem.fileName === resourcePath,
          )?.[1];

          if (!t) {
            config.logger.warn(`cannot find ${resourcePath} in output bundle.`);
            try {
              source = readFileSync(
                resolve(options.dir as string, resourcePath),
              );
            } catch (error) {
              source = void 0;
            }
          } else {
            if (t.type === "asset") {
              source = t.source;
            } else {
              source = t.code;
            }
          }

          if (source)
            element.attribs.integrity = `sha512-${createHash("sha512")
              .update(source)
              .digest()
              .toString("base64")}`;

          if (element.attribs.crossorigin === void 0) {
            // 在进行跨域资源请求时，integrity必须配合crossorigin使用，不然浏览器会丢弃这个资源的请求
            // https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/crossorigin
            element.attribs.crossorigin = "anonymous";
          }
        };

        await Promise.all([
          ...scripts.map(async (i, script) => {
            return await calculateIntegrityHashes(script);
          }),
          ...stylesheets.map(async (i, style) => {
            return await calculateIntegrityHashes(style);
          }),
        ]);

        writeFileSync(
          resolve(config?.root as string, config?.build.outDir as string, name),
          $.html(),
        );
      });
    },
  };
};
