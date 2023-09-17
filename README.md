# vite-plugin-sri

Generates the integrity value in the transformIndexHtml hook, and if **dynamic imports** are used in the code, the correct integrity cannot be generated. This plugin is designed to solve this problem

[Subresource integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) (SRI) plugin for [Vite](https://vitejs.dev/)

Adds subresource integrity hashes to script and stylesheet imports from your _index.html_ file at build time. It generates a sha512 hash

## Install

```bash
pnmp i --D @vividlemon/vite-plugin-sri
```

## Use

In your `vite.config.ts` file:

```ts
import { defineConfig } from 'vite'
import sri from '@vividlemon/vite-plugin-sri'

export default defineConfig({
  // …
  plugins: [sri()]
})
```
