#!/usr/bin/env zx

import {torchPath} from './common.mjs';

const flags = [
  `CMAKE_PREFIX_PATH=${await torchPath()}`,
  `FLATC_EXECUTABLE=${await which('flatc')}`,
  'EXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON',
  'EXECUTORCH_BUILD_EXTENSION_MODULE=ON',
  'EXECUTORCH_BUILD_EXTENSION_TENSOR=ON',
  'EXECUTORCH_BUILD_KERNELS_OPTIMIZED=ON',
  'EXECUTORCH_BUILD_KERNELS_QUANTIZED=ON',
]

if (process.platform == 'darwin') {
  flags.push('CMAKE_TOOLCHAIN_FILE=third-party/ios-cmake/ios.toolchain.cmake',
             'EXECUTORCH_BUILD_COREML=ON',
             'EXECUTORCH_BUILD_MPS=ON',
             'EXECUTORCH_BUILD_EXTENSION_APPLE=ON')
  flags.push('PLATFORM=MAC_ARM64',
             'DEPLOYMENT_TARGET=10.15')
}

cd('executorch')

const outDir = 'cmake-out'
const stamp = `${outDir}/.initalized`
if (!fs.existsSync(stamp)) {
  await $`cmake . -B ${outDir} ${flags.map(f => '-D' + f)}`
  fs.writeFileSync(stamp, '')
}

await $`cmake --build ${outDir} --config Release -j`
