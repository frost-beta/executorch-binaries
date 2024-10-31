#!/usr/bin/env zx

import {python} from './common.mjs';

await fs.emptyDir('dist')

// Copy headers.
const headers = await glob([
  'executorch/extension/data_loader/**/*.h',
  'executorch/extension/module/**/*.h',
  'executorch/extension/tensor/**/*.h',
  'executorch/runtime/**/*.h',
  'executorch/schema/**/*.h',
])
await Promise.all(headers.map(h => fs.copy(h, `dist/include/${h}`)))

// Copy static libs.
const libs = await glob('out/**/*.a')
await Promise.all(libs.map(l => fs.copy(l, `dist/libs/${path.basename(l)}`)))

// Zip files.
const [ targetArch, targetOs ] = String(await fs.readFile('out/.stamp')).split('\n')
const name = `executorch-${targetOs}-${targetArch}-full`
await $`${python} -c "import shutil; shutil.make_archive('${name}', 'zip', 'dist')"`
await fs.remove('dist')
