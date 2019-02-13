import pkg from './package.json';

export default {
  input: 'index.mjs',
  external: (
    Object.keys (pkg.peerDependencies)
    .concat (Object.keys (pkg.dependencies))
  ),
  output: {
    format: 'cjs',
    name: 'flutureFastify',
    file: 'index.js',
    interop: false,
  },
};
