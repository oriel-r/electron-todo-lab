const isEqualTo = [
    '/package.json',
    '/node_modules',
]

const startsWith = [
    '/.vite',
    '/node_modules/better-sqlite3'
]
export default function ignore(file: string) {
    if (!file) return false
    if (isEqualTo.includes(file)) return false
    if (startsWith.some((s) => file.startsWith(s))) return false
    return true
}

