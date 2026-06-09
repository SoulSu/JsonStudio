<div align="center">

[中文](README.md) | **English**

# JsonStudio Web

### Pure-frontend, offline-capable, one-click-deployable JSON workbench

Format, diff, convert, validate, and extract JSON out of mixed log text — all in the browser, **no backend required**.

<p align="center">
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/SvelteKit-static-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="SvelteKit static">
  <img src="https://img.shields.io/badge/Monaco-Editor-0078D4?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Monaco">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Pages">
  <img src="https://img.shields.io/badge/License-Apache--2.0-166534?style=flat-square" alt="License">
</p>

<sub>Forked from <a href="https://github.com/sundegan/JsonStudio">sundegan/JsonStudio</a> · ported from Tauri desktop to a pure web app</sub>

</div>

## What is this

[sundegan/JsonStudio](https://github.com/sundegan/JsonStudio) is an excellent JSON desktop tool. This repository forks it and **reimplements every Rust-backed feature in pure browser-side JS/TS**, removing the Tauri shell so the entire app can be deployed straight to Cloudflare Pages, Vercel, GitHub Pages, or any static host.

Good for:

- Putting an internal JSON tool behind one URL for your whole team
- Keeping sensitive JSON on the user's device (every operation runs locally in the browser)
- Anyone who likes JsonStudio's UX but prefers a web app over installing a desktop binary

## Try it

Deploy your own Cloudflare Pages / Vercel and visit your domain. This repository does not host a public instance.

## What it does

Everything inherited from upstream, all running in the browser:

- **Monaco-powered editor** with syntax highlighting, folding, find/replace, light/dark, 10+ themes.
- **Multi-shape JSON input**: standard JSON, JSON5, escaped JSON strings, trailing commas, unquoted keys, `Infinity`/`NaN` literals, and log-like text where JSON fragments are mixed in.
- **Tree / grid view + search**: edit on the left, browse on the right; JMESPath and JSONPath queries are built in.
- **Multi-tab + persistence**: tabs, settings and shortcuts are stored in `localStorage` and survive refresh.
- **Compare / convert / codegen / schema**:
  - JSON diff (Monaco diff editor)
  - Two-way conversion: YAML / XML / TOML / CSV (via `js-yaml`, `fast-xml-parser`, `@iarna/toml`, `papaparse`, lazy-loaded)
  - Typed code generation for ~19 languages including TypeScript, Go, Rust, Python, Swift, Kotlin, C#, Java, Ruby, Dart, C++, Scala, Elm, Haskell, Crystal, Elixir, Pike (via `quicktype-core`)
  - JSON Schema generation and validation (`AJV`)
- **Export image**: render the live editor to PNG / JPEG and trigger a browser download (via `html-to-image`).

## What was removed from upstream

To fit the browser, the following desktop-only features were dropped in this fork:

- Open / save real files (and drag-and-drop `.json`) → replaced with paste + browser download
- Folder sidebar and file watching
- Auto-update, quit / restart / "open devtools" buttons
- Always-on-top, native menus, global shortcuts, single-instance lock
- protobuf / thrift code generation and reverse "code → JSON" (no mature JS implementation)
- macOS Finder / Windows Explorer integration (e.g. "show in folder")

If you need any of these, keep using the [upstream desktop build](https://github.com/sundegan/JsonStudio).

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # node --test unit tests
pnpm check        # svelte-check
pnpm build        # output to build/
pnpm preview      # preview the production build locally
```

Requires Node.js ≥ 22 (we use `--experimental-strip-types` so .ts tests can run directly).

## Deploy to Cloudflare Pages

Everything is preconfigured:

| Field | Value |
|---|---|
| Build command | `pnpm install && pnpm build` |
| Output directory | `build` |
| Node version | `22` or newer |
| SPA fallback | `static/_redirects` (`/*  /index.html  200`) |

Cloudflare Pages → Create project → Connect to Git → pick this repo → fill in the table → done.

The same setup works on Vercel, Netlify, and GitHub Pages — anything that honors a SPA fallback.

## Stack

- **Svelte 5** + **SvelteKit** (`@sveltejs/adapter-static`)
- **Monaco Editor** — the editor surface
- **TailwindCSS 4** — styling
- Pure-JS data libs: `json5`, `@mischnic/json-sourcemap`, `js-yaml`, `fast-xml-parser`, `@iarna/toml`, `papaparse`, `jsonrepair`, `jmespath`, `jsonpath-plus`, `ajv`, `quicktype-core`, `html-to-image`, `jspdf`

## Credits

- [@sundegan](https://github.com/sundegan) — author of the original [JsonStudio](https://github.com/sundegan/JsonStudio); the product design, UI, and the bulk of the frontend code all come from upstream.
- Maintainers of Monaco Editor, Svelte, Tailwind, quicktype and every library listed above.

## License

Licensed under the [Apache License 2.0](LICENSE), same as upstream. See [NOTICE](NOTICE) for the fork's origin and a summary of changes.

If you fork or redistribute this project, please keep `LICENSE` and `NOTICE` intact and attribute both upstream and this fork in your own README.
