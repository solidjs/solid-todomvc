import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

const plugins = [
	babel({
    exclude: 'node_modules/**',
    babelHelpers: "bundled",
		presets: ["solid"]
	}),
	resolve({ extensions: ['.js', '.jsx'] })
];

if (process.env.production) {
	plugins.push(terser());
}

export default {
	input: 'src/index.jsx',
	output: {
		file: 'dist/bundle.js',
		format: 'iife'
	},
	plugins
};