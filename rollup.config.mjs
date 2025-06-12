import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import importAssets from 'rollup-plugin-import-assets';

const isDev = process.env.NODE_ENV === 'development';

const config = {
  input: 'src/index.tsx',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: isDev,
  },
  plugins: [
    typescript(),
    nodeResolve(),
    commonjs(),
    importAssets({
      // You can specify conditions for which assets to inline or copy
      // For example, to inline SVG files:
      // 'include': [/.svg$/],
      // 'limit': 10000, // bytes
      // 'publicPath': './',
    }),
  ],
};

export default config; 