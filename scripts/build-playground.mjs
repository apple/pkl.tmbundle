/*
 * Copyright © 2026 Apple Inc. and the Pkl project authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Builds a static, self-contained playground into build/playground/.
// Open build/playground/index.html in a browser to preview syntax highlighting.
import { build } from "esbuild";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "build", "playground");

const grammar = await readFile(path.join(root, "Syntaxes", "pkl.tmLanguage.json"), "utf8");

// Don't delete `outDir`: a dev server might be watching it.
await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [path.join(root, "playground", "main.js")],
  outfile: path.join(outDir, "main.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
  loader: { ".pkl": "text" },
  define: { __GRAMMAR__: grammar },
  logLevel: "info",
});

await copyFile(path.join(root, "playground", "index.html"), path.join(outDir, "index.html"));
