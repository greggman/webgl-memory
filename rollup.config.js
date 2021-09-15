import resolve from 'rollup-plugin-node-resolve';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}));
const banner = `/* webgl-memory@${pkg.version}, license MIT */`;

export default [
  {
    input: 'src/webgl-memory.js',
    plugins: [
      resolve({
        modulesOnly: true,
      }),
    ],
    output: [
      {
        format: 'umd',
        file: 'webgl-memory.js',
        indent: '  ',
        banner,
      },
    ],
  },
];
