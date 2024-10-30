#!/usr/bin/env zx

// Hide stderr by default.
$.quiet = !argv.verbose

// Some systems only have python3 or python.
let python = 'python3'
try {
  await which(python)
} catch {
  python = 'python'
}

await spinner('Syncing executorch repo...', async () => {
  await $`git submodule sync --recursive`
  await $`git submodule update --init --recursive`
})

await spinner('Installing requirements...', async () => {
  await $`${python} executorch/install_requirements.py`
})
