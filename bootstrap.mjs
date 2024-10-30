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

try {
  await which('conda')
} catch {
  console.error('Conda is required for running this script, check https://docs.anaconda.com/miniconda/ for install instructions.');
  process.exit(1)
}

const envs = (await $`conda env list`).stdout
                                      .split('\n')
                                      .filter(l => !l.startsWith('#'))
                                      .map(l => l.split(' ')[0])
                                      .filter(l => l.length > 0)
if (!envs.includes('executorch')) {
  await spinner('Initialize conda...', async () => {
    await $`conda create -yn executorch python=3.10.0`
    await $`conda init`
  })
}

await spinner('Syncing executorch repo...', async () => {
  await $`git submodule sync --recursive`
  await $`git submodule update --init --recursive`
})

await spinner('Installing requirements...', async () => {
  await $`conda run -n executorch --cwd executorch ${python} install_requirements.py`
})
