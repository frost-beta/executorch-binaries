#!/usr/bin/env zx

import {python} from './common.mjs';

await $`git submodule sync --recursive`
await $`git submodule update --init --recursive`

// Accelerate install_requirements.py which builds native deps.
process.env.CMAKE_BUILD_PARALLEL_LEVEL = os.cpus().length
try {
  // Use ccache when available.
  process.env.CMAKE_ARGS = `-DCMAKE_CXX_COMPILER_LAUNCHER=${await which('ccache')}`
} catch {}

await $({cwd: 'executorch'})`${python} install_requirements.py`
