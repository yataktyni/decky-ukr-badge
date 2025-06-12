import deckyPlugin from "@decky/rollup";

export default deckyPlugin({
  external: ['react', 'react-dom'],
  // Add your extra Rollup options here
});
