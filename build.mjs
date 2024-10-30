#!/usr/bin/env zx

import {python, torchPath} from './common.mjs';

const flags = [
  `CMAKE_PREFIX_PATH=${await torchPath()}`,
  `PYTHON_EXECUTABLE=${await python()}`,
  `FLATC_EXECUTABLE=${await which('flatc')}`,
  'EXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON',
  'EXECUTORCH_BUILD_EXTENSION_MODULE=ON',
  'EXECUTORCH_BUILD_EXTENSION_TENSOR=ON',
  'EXECUTORCH_BUILD_KERNELS_OPTIMIZED=ON',
  'EXECUTORCH_BUILD_KERNELS_QUANTIZED=ON',
  'EXECUTORCH_BUILD_XNNPACK=ON',
]

if (process.platform == 'darwin') {
  flags.push('CMAKE_TOOLCHAIN_FILE=third-party/ios-cmake/ios.toolchain.cmake',
             'DEPLOYMENT_TARGET=10.15',
             'EXECUTORCH_BUILD_COREML=ON',
             'EXECUTORCH_BUILD_MPS=ON')
  const targetArch = argv['target-arch'] || process.arch
  if (targetArch == 'arm64')
    flags.push('PLATFORM=MAC_ARM64')
  else if (targetArch == 'x64')
    flags.push('PLATFORM=MAC')
  else
    throw new Error(`Unsupport target arch ${targetArch} on macOS`)
}

// Use ccache when available.
try {
  flags.push(`CMAKE_CXX_COMPILER_LAUNCHER=${await which('ccache')}`)
} catch {}

// Use clang when possible.
try {
  process.env.CC = await which('clang')
  process.env.CXX = await which('clang++')
} catch {}

const outDir = 'out'
// Regenerate project if repo or build args args updated.
const stamp = `${outDir}/.initalized`
const buildArgs = await captureBuildArgs()
if (!fs.existsSync(stamp) || fs.readFileSync(stamp).toString() != buildArgs) {
  fs.emptyDirSync(outDir)
  await $`cmake executorch -B ${outDir} ${flags.map(f => '-D' + f)}`
  fs.writeFileSync(stamp, buildArgs)
}

// Run building.
await $`cmake --build ${outDir} --config Release -j`

// Return a text used for identifying whether we should clean out dir.
async function captureBuildArgs() {
  const text = await $`git submodule`
  return text + flags.join('\n')
}
