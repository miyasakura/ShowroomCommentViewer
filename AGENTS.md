# Repository Guidelines

## Project Structure & Module Organization
Core code lives in `src/packs`: `app.js` bootstraps the CoffeeScript-driven `comment.coffee` that handles WebSocket sessions, filters, and DOM updates. Webpack emits to `assets/javascripts/bundle.js`, while static CSS, images, and vendor files stay under `assets/stylesheets`, `assets/images`, and `assets/vendor`. Update selectors in `index.html` before touching CoffeeScript. Use `server.rb` as the local Sinatra proxy (CORS bypass); infrastructure templates stay in `cloudformation.yaml`.

## Build, Test, and Development Commands
`npm install` once per machine installs the webpack/Babel stack. `npx webpack --mode development --watch` rebuilds `bundle.js` with sourcemaps as you edit CoffeeScript/SCSS. Produce release assets with `npx webpack --mode production`. When SHOWROOM APIs block the browser, run `ruby server.rb` and hit `http://localhost:4567/proxy?url=…` as the data source. `npm test` currently fails on purpose—replace it with a real runner when tests exist.

## Coding Style & Naming Conventions
Keep CoffeeScript 2 features (implicit returns, safe navigation) and 2-space indentation. Shared state, jQuery selectors, and helper functions use `camelCase` (`roomId`, `showSPGift`); keep that pattern in new modules. Any modern JavaScript you add should stick to ES modules with `const`/`let` and pass through Babel. Organize SCSS by feature under `assets/stylesheets` and import via a single entry so webpack resolves dependencies predictably.

## Testing Guidelines
No automated framework ships today, so regression testing means connecting to a real SHOWROOM room, exercising every toggle (comment, special gift, paid/free), and verifying quick-search results update as new payloads arrive. When you introduce logic that can be isolated—parsers, throttling helpers, DOM utilities—add Jest or Vitest, colocate specs (`comment.spec.coffee`), and wire the runner to `npm test` so CI can fail loudly. Document manual steps in PRs until coverage exists.

## Commit & Pull Request Guidelines
History favors short imperative summaries (`fixed`, `play voice`); keep the tone but add context such as `gift: add special filter toggle`. Scope commits so reviewers can revert individually. Pull requests should include a concise description, screenshots or short clips for UI tweaks, manual-test notes, and links to the relevant issue or incident. Always push the freshly built `assets/javascripts/bundle.js` alongside CoffeeScript changes unless you intentionally exclude compiled artifacts.

## Security & Configuration Tips
Do not hardcode room IDs, API keys, or alternate hosts in `comment.coffee`; prefer runtime inputs and the proxy endpoint. If `server.rb` changes, preserve the narrow `/proxy` surface, explain new environment variables, and ensure CloudFormation parameters or README snippets stay synchronized to avoid leaking production credentials.
