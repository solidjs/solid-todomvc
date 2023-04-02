import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const plugins = [
	babel({
		extensions: [".js", ".ts", ".tsx"],
    exclude: 'node_modules/**',
    babelHelpers: "bundled",
		presets: ["solid", "@babel/preset-typescript"],
	}),
	resolve({ extensions: ['.js', '.ts', '.tsx'] })
];

if (process.env.production) {
	plugins.push(terser());
}

export default {
	input: 'src/index.tsx',
	output: {
		file: 'dist/bundle.js',
		format: 'iife'
	},
	treeshake: {
		tryCatchDeoptimization: false
	},
	plugins
};