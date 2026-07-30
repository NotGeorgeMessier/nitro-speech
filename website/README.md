# Docs website

Docusaurus site for [react-native-nitro-speech](https://github.com/NotGeorgeMessier/nitro-speech).

Content lives in the repo-root [`docs/`](../docs) folder.

## Local development

```bash
# from repo root
npm run docs:start

# or
cd website && npm start
```

## Build

```bash
npm run docs:build
```

## Deploy

Push to `main` (changes under `docs/` or `website/`). GitHub Actions builds and deploys to:

https://NotGeorgeMessier.github.io/nitro-speech/

Enable Pages once: repo **Settings → Pages → Source: GitHub Actions**.
