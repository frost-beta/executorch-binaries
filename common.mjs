$.verbose = true

export async function python() {
  try {
    return await which('python3')
  } catch {
    return await which('python')
  }
}

export async function torchPath() {
  const r = await $`${await python()} -c 'import torch as _; print(_.__path__[0])'`
  return r.stdout.trim()
}
