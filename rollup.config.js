import deckyPlugin from "@decky/rollup";

export default deckyPlugin({
  external: ['react', 'react-dom'],
  output: {
    globals: {
      react: 'SP_REACT',
      'react-dom': 'SP_REACT',
    },
  },
  // Add your extra Rollup options here
});
