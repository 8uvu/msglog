// The three plugin hosts inject these globals into the bundle's JS runtime, and
// every plugin only touches them behind a `typeof x !== 'undefined'` guard so
// one bundle runs everywhere. They cannot be imported, so declare them for the
// typechecker — this is the honest shape of the runtime, not a suppression.
// They are `var`s rather than `const`s because the entry point assigns
// `globalThis.plugin = <definition>` for the vendetta-style loaders.
declare global {
    var revenge: any;
    var bunny: any;
    var vendetta: any;
    var plugin: any;

    // Replaced by esbuild's `define` in build.mjs.
    var __DEV__: boolean;
    var IS_DEV: boolean;
}

export {};
