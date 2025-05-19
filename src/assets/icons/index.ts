// src/icons/index.ts
const modules = import.meta.glob('./*.svg', { eager: true })

const icons: Record<string, any> = {}

for (const path in modules) {
  const name = path.match(/\.\/(.*)\.svg$/)?.[1]
  if (name) {
    icons[name] = (modules[path] as any).default
  }
}

export default icons
