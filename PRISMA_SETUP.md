# Prisma setup

If you see **"Module not found: Can't resolve '@prisma/client'"** or similar:

1. **Restore and generate the client** (run in project root):
   ```bash
   npm run fix-prisma
   ```
2. Restart the dev server: `npm run dev`.

**Why:** The Prisma client must be the npm package in `node_modules/@prisma/client` (with a `package.json`). If that folder was overwritten by an old generator output, the bundler can’t resolve it. `fix-prisma` removes the broken folders, reinstalls the real package, and runs `prisma generate`.

**"Cannot find module ... runtime/library.js":** This happens when `@prisma/client` (e.g. 7.x) does not match the Prisma CLI (e.g. 6.x). The generated code expects `runtime/library.js`, which exists in **@prisma/client 6.x** but not in 7.x. This project pins `@prisma/client` to **6.19.2** in dependencies; do not upgrade to 7 without following the Prisma 7 upgrade guide.

**Prevention:** Keep `prisma` and `@prisma/client` on the same major version (6.x). The `postinstall` script runs `prisma generate` after every `npm install`.
