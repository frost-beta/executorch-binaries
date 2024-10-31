$.verbose = true

export let python
try {
  python = await which('python3')
} catch {
  python = await which('python')
}

export async function torchPath() {
  const r = await $`${python} -c 'import torch as _; print(_.__path__[0])'`
  return r.stdout.trim()
}
