#!/usr/bin/env zx

import {python} from './common.mjs';

await $`git submodule sync --recursive`
await $`git submodule update --init --recursive`

await $({cwd: 'executorch'})`${await python()} install_requirements.py`
