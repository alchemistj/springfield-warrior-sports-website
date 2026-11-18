# Springfield Warrior Sports

Faithful Astro rebuild of [springfieldwarriorsports.com](https://www.springfieldwarriorsports.com/). The captured WordPress source lives in `source/`. The spec is `docs/SPEC-astro-rebuild.md`.

```bash
npm install
npm run prepare:content
npm run check
npm run lint
npm test
npm run build
```

`npm test` expects a fresh `dist/` from `npm run build` for the copy, phone, and link checks. Playwright starts `astro preview`.
