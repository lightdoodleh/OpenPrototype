<div align="center">

# OpenPrototype

**English** | [简体中文](README.zh-CN.md)

**A local prototyping workbench — navigation tree on the left · live preview in the middle · an AI Agent on the right**

Let product managers run "requirements → PRD → HTML prototype" as a single closed loop, with the AI sitting right next to the prototype and editing pages against their PRD.

*A local prototyping workbench: navigation tree · live preview · an AI agent that edits your HTML prototypes against their PRD.*

![License](https://img.shields.io/badge/license-MIT-blue)
![Node Core](https://img.shields.io/badge/node_core-%3E%3D16-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)

</div>

<table>
  <tr>
    <td><img src="image/README/workbench-overview.png" alt="openprototype workbench preview" width="440"></td>
    <td><img src="image/README/workbench-prd.png" alt="openprototype workbench prd preview" width="440"></td>
  </tr>
</table>


## Why it exists

The recurring pain points when a PM builds prototypes:

- **PRD and prototype live apart** — the doc is in Word / Axure, the prototype is somewhere else. Changing one field means manually syncing several places, and they drift further apart the more you edit.
- **AI can write code, but doesn't know your rules** — hand a prototype to a general-purpose AI and it rewrites whole pages, names things inconsistently, hardcodes status labels, and breaks existing interactions.
- **Pages are scattered at review time** — dozens of prototype pages with no unified entry point; you find pages and track versions from memory.

`openprototype` folds these three things into **one local workbench**:

1. **PRD (`.md`) and prototype (`.html`) sit side by side in the same directory** — browse in one place, keep them aligned in one place.
2. **The AI Agent on the right automatically carries "current page + current PRD" context.** Say "change field X to XX" and it edits only the relevant part instead of rewriting the whole page; it can also pick up the **red-marked** incremental changes in the PRD and land them precisely.
3. **A built-in red-line checker** covers script order, the data layer, status constants, the font stack, and `mode=view` physical hiding. The companion `auto-test` skill tells the Agent to run it after prototype edits.

> In one sentence: **a local workbench with guardrails, built for "PM + AI prototyping."**

---

## ✨ Features

- 🌲 **Navigation tree** — scans the product directory to auto-generate a page tree, with fuzzy title search, version badges (read from the PRD version table), and review markers.
- 👁 **Live preview** — the middle iframe renders the prototype page directly; click on the left and see it instantly.
- 🤖 **Context-aware AI Agent** — connects to your local [OpenCode](https://opencode.ai); every message automatically carries the current page + PRD path, with one-click "update the page per the PRD's red-marked content."
- 🧱 **Zero-backend data layer** — `BaseDataManager` does CRUD via localStorage, so prototypes ship with interactive fake data and no database to spin up.
- ✅ **Automated red-line checks** — static rules work out of the box; install Playwright and Chromium to add real-browser smoke tests.
- 📦 **Scaffold distribution** — `create` starts a project from scratch, `init` grafts it into an existing project, `add-product` adds a product, and `npm update openprototype` upgrades the framework runtime.
- 🖥 **Cross-platform** — manual serving works on macOS / Windows / Linux; the background service currently supports macOS / Windows only, and the OpenCode path is auto-detected.

---

## 🎯 Who it's for / Use cases

**A good fit for**
- **B2B / back-office product managers**: need to quickly build high-fidelity, interactive prototypes and keep the PRD and prototype always in sync.
- **Small teams / solo developers**: want AI to speed up prototype iteration without letting it rewrite things randomly or drift in style.
- **Teams that want to codify their standards**: put your own PRD templates and UI guidelines into `rules/` and have the AI produce work to your standard.

**Typical scenarios**
| Scenario | How to use it |
|----------|---------------|
| Go from requirements to prototype quickly | Write the PRD → have the Agent generate/fill in pages per the PRD → preview and debug |
| Incrementally edit a prototype per the PRD | **Red-mark** the parts to change in the PRD → click "Update page per PRD red-marked content" → the Agent edits only that part |
| Keep PRD and prototype consistent | For any field/rule change, the Agent updates the page + PRD + fake data together |
| Requirement review | Browse all pages in one place via the navigation tree; version badges make versions align at a glance |
| Roll out team standards | Write standards into `rules/` + `CONVENTIONS.md`; the checker enforces the red lines |

**Not a fit for**: writing production backend code, database design, or formal frontend engineering (this is a tool for the "prototype + PRD" phase, not a delivery scaffold).

---

## 🚀 Quick start

> Prerequisite: the core runtime needs Node ≥ 16. Use Node ≥ 18 for Playwright smoke tests or repository development. The AI panel additionally needs local [OpenCode](https://opencode.ai) (see below; it can be installed later).

### Scenario ①: Start a project from scratch

```bash
npx openprototype create myapp
cd myapp
npm install
# Open http://127.0.0.1:8082/product/demo/pc/index.html
```

On macOS / Windows, `npm install` registers and starts the project's background service by default. Open the URL above when installation finishes; do not run `npm run serve` as well, or the two processes will compete for the same port. On Linux, when the background service is disabled, or if automatic installation fails, run:

```bash
npm run serve
```

The first run ships with an interactive demo product (customer list + form + PRD); follow it to add your own pages.

### Scenario ②: Graft into an existing project

```bash
cd your-project
npm i openprototype
npx openprototype init
npx openprototype add-product shop
# Open http://127.0.0.1:8082/product/shop/pc/index.html
```

`init` does not overwrite existing template files. It adds missing assets and merges `package.json` scripts, but it also rewrites `package.json` and, by default, registers and starts an OS background service on macOS / Windows. On Linux or with the service disabled, run `npm run serve` manually. If the background service is already running, run `npx openprototype service restart` after `add-product` so the Agent loads the new product's write scope.

### Background service

The background service keeps the workbench available after login and is registered separately for each project. It currently supports macOS LaunchAgent and Windows Task Scheduler; use `npm run serve` on Linux.

```bash
npx openprototype service status
npx openprototype service restart
npx openprototype service logs
npx openprototype service uninstall
```

- To prevent automatic registration, set `OPENPROTOTYPE_SERVICE_AUTO_INSTALL=0` before the first `npm install` / `init`, or set `"service": { "autoInstall": false }` in the config beforehand.
- `service stop` stops the current process only; it will start again at the next login. Use `service uninstall` to remove it permanently.
- After adding a product or changing the port or Node path, run `service restart` to load the new configuration. Run it after a package upgrade too if the install hook did not restart the service successfully.

---

## 🤖 How the AI Agent works

The right-hand panel is essentially **a context-aware shell around the local OpenCode inside your project**:

```
You type in the panel  ──▶  local server (/api/agent)  ──▶  OpenCode (127.0.0.1)
     ▲                          │  Auto-injects: current page path + current PRD path + page red-line conventions
     └──── SSE streaming echo ◀─┘  After the Agent edits files, the preview refreshes automatically
```

- **Context carried automatically**: click any page on the left and the top of the panel shows "This message will carry: page X / PRD Y" — no need to paste paths manually.
- **Incremental update per PRD red-marks**: one click sends the PRD content marked `<span style="color:red">…</span>` as the **only edit scope** to the Agent — it edits only the red-marked parts, treats un-marked history as background, and won't rewrite or "optimize on the side."
- **Local by default**: the server listens on `127.0.0.1` by default; all writes and the Agent interface (`/api/*`) accept local requests only.
- **LAN exposure boundary**: with `--host 0.0.0.0`, LAN clients still cannot call write or Agent endpoints, but they can read non-hidden files that the static server can reach under the project root—not only prototype pages. Use this only on a trusted network and in a dedicated prototype project with no secrets or other sensitive files.

### Install OpenCode (prerequisite for the AI panel)

```bash
npx openprototype doctor    # One-shot check of Node / OpenCode / config / Playwright
```

- For installation see https://opencode.ai; once installed, confirm it's on PATH: `which opencode` (Windows: `where opencode`).
- Models / API keys are managed by OpenCode itself (`opencode auth`); this tool only forwards messages.
- Not on PATH: write the absolute path in `opencode.bin` in `proto-kit.config.json`.

**Usable without OpenCode too** — navigation + prototype preview work normally; only the right-hand panel is unavailable.

---

## 🗂 Directory structure and the three-layer separation

```
your-project/
├─ proto-kit.config.json     # Ports / OpenCode / product list (the single config entry)
├─ AGENTS.md                 # Collaboration conventions for the AI (a generic template you own and can edit)
├─ CONVENTIONS.md            # Explanation of the page red lines the checker enforces (coupled to the runtime)
├─ skills/                   # xiaojia (restrained editing) + auto-test (requires checks after editing)
├─ rules/                    # Empty directory: put your team's own PRD templates / UI guidelines here
└─ product/<id>/pc/
   ├─ index.html             # Navigation shell (thin, references the /_kit runtime)
   ├─ nav-tree.json          # Page manifest (auto-generated by nav:sync)
   └─ …your prototype pages and PRD.md
```

The three-layer separation determines **who is responsible for updates**, which is also the key to clean upgrades:

| Layer | Content | Ownership | Update method |
|-------|---------|-----------|---------------|
| **Runtime** | Server / shared engine / Agent panel / check scripts | Framework (mounted at `/_kit/`) | `npm update openprototype` |
| **Editable assets** | `AGENTS.md` `CONVENTIONS.md` `skills/` + your own `rules/` | You own them | `npx openprototype update` prints manual comparison and merge guidance |
| **Business content** | Your product PRDs / prototypes / data | You own them | You maintain them yourself |

> The framework ships only the **minimal generic conventions** (page red lines + editing restraint). Methodology like PRD templates, UI guidelines, and business terminology **belongs to you** — put it in `rules/` and `product/<id>/`; it's not distributed with the framework and won't be overwritten on upgrade.

**Engine fallback resolution**: when a page references `../shared/xxx.js` by relative path and that file doesn't exist under `product/<id>/shared/`, the server automatically falls back to the framework's built-in engine (equivalent to `/_kit/shared/`). Therefore:

- Generic engines (`base-manager.js`, `common/*`, `styles.css`) **don't need to be copied into the product directory** — upgrading the framework upgrades the engine;
- The product directory holds only its own **business components and constants** (`shared/components/`, `shared/constants/`) and design assets — these two directories **never fall back**; if missing they 404 to expose the problem instead of being silently replaced by the framework's generic version;
- For same-named files, **local wins** — when migrating from an old project, you can keep the old local version file by file and switch over gradually.

---

## 🧪 Quality assurance: the red-line checker

`npx openprototype check` always runs the static red-line checks. After Playwright and Chromium are installed, it also runs real-browser smoke tests (see [CONVENTIONS.md](templates/CONVENTIONS.md) for details):

- Fixed script load order · data must go through `BaseDataManager` (no page-level localStorage)
- Status labels as constants (no hardcoded `<option>`) · no Google Fonts (system font stack)
- `?mode=view` physical hiding (`display:none`, not `disabled`) · no console errors when opening a page

```bash
npm run check          # Scan all pages
npm run check:changed  # Scan only git changes
```

Enable the browser layer once:

```bash
npm i -D playwright
npx playwright install chromium
```

When Playwright or Chromium is missing, do not rely on browser-layer results; install both before treating `check` as the full check suite. The companion `auto-test` skill tells the Agent to run checks after every prototype edit and fix all ERRORs before delivery; this is an Agent workflow rule, not a server-side file watcher.

---

## ⚙️ Config `proto-kit.config.json`

```json
{
  "port": 8082,
  "host": "127.0.0.1",
  "service": {
    "autoInstall": true
  },
  "opencode": {
    "bin": "auto",
    "model": "deepseek/deepseek-v4-flash",
    "agent": "build",
    "host": "127.0.0.1",
    "port": 4097,
    "startTimeoutMs": 15000
  },
  "products": [
    { "id": "demo", "roots": ["pc"] }
  ]
}
```

`host` defaults to `127.0.0.1`. Setting it to `0.0.0.0` exposes static file reads to the LAN, so review the security boundary above first. A long-running background service also requires an explicit `npx openprototype service install --allow-lan`.

Environment variables can override temporarily: `PROTO_KIT_PORT` · `PROTO_KIT_HOST` · `OPENCODE_BIN` · `OPENCODE_MODEL` · `OPENCODE_PORT`.
You can also use `npx openprototype serve --port 9000 --host 0.0.0.0` to specify the port / listen address ad hoc.

---

## 📟 Commands

The table uses `npx` for the default local-project installation. You can omit `npx` after a global installation. `create` adds npm script aliases, and `init` does the same when the project already has a `package.json`, so day-to-day commands can use `npm run serve`, `npm run check`, `npm run check:changed`, and `npm run nav:sync`.

| Command | Purpose |
|---------|---------|
| `npx openprototype create <dir>` | Create a new project from scratch with a runnable demo |
| `npx openprototype init` | Add missing assets, merge scripts, and install the background service when configured |
| `npx openprototype add-product <id> [--title <name>]` | Add a PC product shell with an optional display name |
| `npx openprototype serve [--port <port>] [--host <address>]` | Start the foreground server with optional temporary listen overrides |
| `npx openprototype service <action>` | Manage the background service: `install/start/stop/restart/status/logs/uninstall/prune` |
| `npx openprototype check [--changed] [--static-only] [path]` | Check all pages, Git changes, or a path; optionally run static rules only |
| `npx openprototype nav:sync` | Scan product directories and rebuild `nav-tree.json` |
| `npx openprototype doctor` | Check Node / OpenCode / config / Playwright / background service health |
| `npm update openprototype` | Upgrade the runtime package within the version range in `package.json` |
| `npx openprototype update` | Print manual editable-asset comparison and merge guidance; does not upgrade |

---

## 🛣 Roadmap

- [ ] **PageShell**: extract the full page shell (top bar + menu + design system) into a product-agnostic component so list/form/detail/approval page templates work out of the box (the current demo uses self-contained example pages).
- [ ] **H5 (mobile)**: `add-product --h5` mobile support.
- [ ] A `publish` command for one-click publishing / stripping the local dev panel (cross-platform).
- [ ] More example products and page templates.

Feature requests and feedback are welcome in Issues.

---

## 🤝 Contributing

PRs welcome. Development conventions:

- Use only Node built-in modules; the runtime has zero dependencies (the checker's Playwright is a devDependency).
- The core runtime supports Node ≥ 16; installing the current Playwright dependency and running the full checks requires Node ≥ 18.
- Run `npm run check` after changing the runtime; after changing the shell / Agent panel, start the server locally and test the three columns for real.
- Keep the repository **free of any private information** (company / personal / intranet addresses / secrets).

## 📄 License

[MIT](LICENSE)
