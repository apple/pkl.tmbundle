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

import {createHighlighterCore} from "shiki/core";
import {createOnigurumaEngine} from "shiki/engine/oniguruma";
import githubLight from "@shikijs/themes/github-light";
import githubDark from "@shikijs/themes/github-dark";
import lightPlus from "@shikijs/themes/light-plus";
import darkPlus from "@shikijs/themes/dark-plus";
import monokai from "@shikijs/themes/monokai";
import solarizedLight from "@shikijs/themes/solarized-light";
import solarizedDark from "@shikijs/themes/solarized-dark";
import nord from "@shikijs/themes/nord";
import oneDarkPro from "@shikijs/themes/one-dark-pro";
import sample from "./sample.pkl";

// Injected by scripts/build-playground.mjs (Syntaxes/pkl.tmLanguage converted to JSON).
/* global __GRAMMAR__ */
const grammar = __GRAMMAR__;

const themes = [githubLight, githubDark, lightPlus, darkPlus, monokai, solarizedLight, solarizedDark, nord, oneDarkPro];

const input = document.getElementById("input");
const output = document.getElementById("output");
const scopes = document.getElementById("scopes");
const themeSelect = document.getElementById("theme");

async function main() {
  // noinspection NpmUsedModulesInstalled
  const highlighter = await createHighlighterCore({
    themes,
    langs: [{...grammar, name: "pkl"}],
    engine: createOnigurumaEngine(import("shiki/wasm")),
  });

  for (const t of themes) {
    const opt = document.createElement("option");
    opt.value = t.name;
    opt.textContent = t.name;
    themeSelect.append(opt);
  }
  themeSelect.value = localStorage.getItem("theme") ?? "github-dark";
  input.value = localStorage.getItem("source") ?? sample;

  // Flattened token explanations, indexed by `data-i` on each rendered span.
  let explanations = [];

  function render() {
    const theme = themeSelect.value;
    const {tokens, bg, fg} = highlighter.codeToTokens(input.value, {
      lang: "pkl",
      theme,
      includeExplanation: true,
    });
    explanations = [];
    const doc = document.createDocumentFragment();
    const code = document.createElement("code");
    for (const line of tokens) {
      const lineEl = document.createElement("span");
      lineEl.className = "line";
      for (const token of line) {
        const span = document.createElement("span");
        span.textContent = token.content;
        if (token.color) span.style.color = token.color;
        if (token.fontStyle & 1) span.style.fontStyle = "italic";
        if (token.fontStyle & 2) span.style.fontWeight = "bold";
        if (token.fontStyle & 4) span.style.textDecoration = "underline";
        span.dataset.i = explanations.length;
        explanations.push(token.explanation ?? []);
        lineEl.append(span);
      }
      code.append(lineEl);
    }
    const pre = document.createElement("pre");
    pre.append(code);
    doc.append(pre);
    output.replaceChildren(doc);
    output.style.background = bg;
    output.style.color = fg;
    document.body.style.background = bg;
    document.body.style.color = fg;
    input.style.background = bg;
    input.style.color = fg;
  }

  output.addEventListener("mouseover", (e) => {
    const el = e.target.closest("span[data-i]");
    if (!el) return;
    const parts = explanations[el.dataset.i];
    scopes.textContent = parts
      .map((p) => {
        const stack = p.scopes.map((s) => s.scopeName).join("\n    ");
        return `${JSON.stringify(p.content)}\n    ${stack}`;
      })
      .join("\n");
  });

  input.addEventListener("input", () => {
    localStorage.setItem("source", input.value);
    render();
  });
  themeSelect.addEventListener("change", () => {
    localStorage.setItem("theme", themeSelect.value);
    render();
  });

  render();
}

// noinspection JSIgnoredPromiseFromCall
main();
