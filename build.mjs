#!/usr/bin/env zx

import {python, torchPath} from './common.mjs';

const config = argv['config'] || 'Release'
const targetArch = argv['target-arch'] || process.arch
const targetOs = argv['target-os'] || {
  darwin: 'mac',
  linux: 'linux',
  win32: 'win',
}[process.platform]

const flags = [
  `CMAKE_BUILD_TYPE=${config}`,
  `CMAKE_PREFIX_PATH=${await torchPath()}`,
  `PYTHON_EXECUTABLE=${python}`,
  `FLATC_EXECUTABLE=${await which('flatc')}`,
  'EXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON',
  'EXECUTORCH_BUILD_EXTENSION_MODULE=ON',
  'EXECUTORCH_BUILD_EXTENSION_TENSOR=ON',
  'EXECUTORCH_BUILD_KERNELS_OPTIMIZED=ON',
  'EXECUTORCH_BUILD_KERNELS_QUANTIZED=ON',
  'EXECUTORCH_BUILD_XNNPACK=ON',
]

if (config == 'Debug') {
  flags.push('EXECUTORCH_ENABLE_LOGGING=ON',
             'ET_MIN_LOG_LEVEL=Debug')
}

if (process.platform == 'darwin') {
  flags.push('DEPLOYMENT_TARGET=10.15',
             'EXECUTORCH_BUILD_COREML=ON',
             'EXECUTORCH_BUILD_MPS=ON')
  if (targetArch != process.arch) {
    flags.push('CMAKE_TOOLCHAIN_FILE=third-party/ios-cmake/ios.toolchain.cmake')
    if (targetArch == 'arm64')
      flags.push('PLATFORM=MAC_ARM64')
    else if (targetArch == 'x64')
      flags.push('PLATFORM=MAC')
    else
      throw new Error(`Unsupport target arch ${targetArch} on macOS`)
  }
} else {
  if (targetArch != process.arch)
    throw new Error('Cross-compilation is not supported except for macOS')
}

// Use clang when possible.
try {
  process.env.CC = await which('clang')
  process.env.CXX = await which('clang++')
} catch {}

// Use ccache when available.
try {
  flags.push(`CMAKE_CXX_COMPILER_LAUNCHER=${await which('ccache')}`)
} catch {}

// Regenerate project if repo or build args args updated.
const outDir = 'out'
const version = (await $`git submodule`).stdout.trim()
const stamp = [ config, targetArch, targetOs, version, ...flags ].join('\n')
const stampFile = `${outDir}/.stamp`
if (!fs.existsSync(stampFile) || fs.readFileSync(stampFile).toString() != stamp) {
  fs.emptyDirSync(outDir)
  await $`cmake executorch -B ${outDir} ${flags.map(f => '-D' + f)}`
  fs.writeFileSync(stampFile, stamp)
}

// Limit parallel jobs if running on a machine with small RAM, otherwise linking
// may take too much time due to swapping.
const jobs = os.totalmem() < 10 * Math.pow(1024, 3) ? 1 : ''
await $`cmake --build ${outDir} --config ${config} -j ${jobs}`
