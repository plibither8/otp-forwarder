# Simple TypeScript Starter

> Bare minimum TypeScript project template to get started quickly.

A bare minimum, no-frills TypeScript starter template with development/production scripts and linting included.

- Nodemon + `ts-node` for development
- `tsc` for building production distribution

Entry file: `src/main.ts`.

## Get Started

There are two branches: [**`main`**](https://github.com/plibither8/typescript/tree/main/) and [**`esm`**](https://github.com/plibither8/typescript/tree/esm/). The `main` branch uses the CommonJS module system, whereas the ESM branch uses the ESM module system.

1. Create a repo from this template and locally clone it. Or... run `npx degit plibither8/typescript` or `npx degit plibither8/typescript#esm` to get it directly onto your machine.
2. `npm install` or `pnpm install` or `yarn`, as per your taste
3. `npm run dev` for running in development mode (watches files)
4. `npm run build` for building production files
5. `npm run start` for running production-built files

## License

[MIT](LICENSE)
