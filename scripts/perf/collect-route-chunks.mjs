#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import vm from 'vm'

const repoRoot = process.cwd()
const nextDir = path.join(repoRoot, '.next')

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size
  } catch {
    return 0
  }
}

function normalizeChunkFile(file) {
  if (typeof file !== 'string' || !file.endsWith('.js')) return null
  if (file.startsWith('/_next/')) return file.slice('/_next/'.length)
  if (file.startsWith('_next/')) return file.slice('_next/'.length)
  return file.replace(/^\/+/, '')
}

function uniqueChunkFiles(chunks) {
  return [...new Set(chunks.map(normalizeChunkFile).filter(Boolean))]
}

function findRouteEntryChunks(routeManifest, routeKey) {
  const entryJSFiles = routeManifest?.entryJSFiles || {}
  const entryKeys = Object.keys(entryJSFiles)
  if (entryKeys.length === 0) return []

  const directCandidates = [
    `[project]/app${routeKey}`,
    `[project]/app${routeKey}/page`,
    `[project]/app${routeKey.replace(/\/page$/, '')}/page`,
  ]

  const selectedKey = directCandidates.find((key) => key in entryJSFiles)
    ?? entryKeys.find((key) => key.endsWith(routeKey))
    ?? entryKeys.find((key) => key.endsWith(`${routeKey}/page`))

  if (!selectedKey) return []
  return uniqueChunkFiles(entryJSFiles[selectedKey] || [])
}

function collectRouteManifestFiles(dir) {
  const files = []

  if (!fs.existsSync(dir)) return files

  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(absolutePath)
      } else if (entry.name === 'page_client-reference-manifest.js') {
        files.push(absolutePath)
      }
    }
  }

  walk(dir)
  return files
}

function parseManifestFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8')
  const context = { globalThis: {} }
  vm.createContext(context)
  vm.runInContext(code, context)
  return context.globalThis.__RSC_MANIFEST || {}
}

function summarize() {
  const buildManifestPath = path.join(nextDir, 'build-manifest.json')
  if (!fs.existsSync(buildManifestPath)) {
    throw new Error('Missing .next/build-manifest.json. Run `npm run build` first.')
  }

  const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'))
  const routeManifestFiles = collectRouteManifestFiles(path.join(nextDir, 'server/app'))
  const routeMap = new Map()
  const sharedRuntimeChunkFiles = new Set()

  for (const filePath of routeManifestFiles) {
    const manifest = parseManifestFile(filePath)

    for (const [routeKey, routeManifest] of Object.entries(manifest)) {
      const entryJSFiles = routeManifest?.entryJSFiles || {}
      const layoutEntry = entryJSFiles['[project]/app/layout'] || []
      for (const chunk of uniqueChunkFiles(layoutEntry)) {
        sharedRuntimeChunkFiles.add(chunk)
      }
    }
  }

  const sharedRuntimeFiles = [...sharedRuntimeChunkFiles]
  const fallbackRootRuntimeFiles = uniqueChunkFiles([
    ...(buildManifest.rootMainFiles || []),
    ...(buildManifest.polyfillFiles || []),
  ])
  const rootRuntimeFiles = sharedRuntimeFiles.length > 0
    ? uniqueChunkFiles([...sharedRuntimeFiles, ...(buildManifest.polyfillFiles || [])])
    : fallbackRootRuntimeFiles

  const rootRuntime = rootRuntimeFiles.map((file) => {
    const absolute = path.join(nextDir, file)
    return {
      file,
      bytes: fileSize(absolute),
    }
  })

  const sharedRuntimeSet = new Set(sharedRuntimeFiles)

  for (const filePath of routeManifestFiles) {
    const manifest = parseManifestFile(filePath)

    for (const [routeKey, routeManifest] of Object.entries(manifest)) {
      const chunkFiles = findRouteEntryChunks(routeManifest, routeKey)
      if (chunkFiles.length === 0) continue

      const exclusiveChunkFiles = chunkFiles.filter((chunk) => !sharedRuntimeSet.has(chunk))

      const chunks = chunkFiles.map((file) => {
        const absolute = path.join(nextDir, file)
        const content = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : ''
        return {
          file,
          bytes: fileSize(absolute),
          hasJoyride: content.includes('react-joyride'),
          hasP5: content.includes('p5.js') || content.includes('p5'),
        }
      })

      const exclusiveChunks = exclusiveChunkFiles.map((file) => {
        const absolute = path.join(nextDir, file)
        return {
          file,
          bytes: fileSize(absolute),
        }
      })

      routeMap.set(routeKey, {
        route: routeKey,
        routeAliases: routeKey.endsWith('/page')
          ? [routeKey, routeKey.replace(/\/page$/, '')]
          : [routeKey, `${routeKey}/page`],
        entryBytes: exclusiveChunks.reduce((sum, chunk) => sum + chunk.bytes, 0),
        totalEntryBytes: chunks.reduce((sum, chunk) => sum + chunk.bytes, 0),
        hasJoyride: chunks.some((chunk) => chunk.hasJoyride),
        hasP5: chunks.some((chunk) => chunk.hasP5),
        chunks,
        exclusiveChunks,
      })
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    rootRuntimeBytes: rootRuntime.reduce((sum, file) => sum + file.bytes, 0),
    rootRuntime,
    routes: [...routeMap.values()].sort((a, b) => b.entryBytes - a.entryBytes),
  }
}

function bytesToKB(bytes) {
  return Number((bytes / 1024).toFixed(1))
}

function printReport(summary) {
  console.log('Root runtime:')
  for (const file of summary.rootRuntime) {
    console.log(`  - ${file.file}: ${bytesToKB(file.bytes)} KB`)
  }
  console.log(`  Total: ${bytesToKB(summary.rootRuntimeBytes)} KB`)

  console.log('\nRoute entry chunks (exclusive / total):')
  for (const route of summary.routes.slice(0, 16)) {
    console.log(
      `  - ${route.route}: ${bytesToKB(route.entryBytes)} KB / ${bytesToKB(route.totalEntryBytes)} KB` +
      `${route.hasJoyride ? ' (joyride)' : ''}${route.hasP5 ? ' (p5)' : ''}`
    )
  }
}

function assertBudget(summary, budgetPath) {
  const absoluteBudgetPath = path.isAbsolute(budgetPath)
    ? budgetPath
    : path.join(repoRoot, budgetPath)

  if (!fs.existsSync(absoluteBudgetPath)) {
    throw new Error(`Budget file not found: ${absoluteBudgetPath}`)
  }

  const budget = JSON.parse(fs.readFileSync(absoluteBudgetPath, 'utf8'))
  const errors = []

  if (typeof budget.rootRuntimeKBMax === 'number') {
    const actual = bytesToKB(summary.rootRuntimeBytes)
    if (actual > budget.rootRuntimeKBMax) {
      errors.push(
        `Root runtime is ${actual} KB, exceeds budget ${budget.rootRuntimeKBMax} KB`
      )
    }
  }

  const routeByPath = new Map()
  for (const route of summary.routes) {
    routeByPath.set(route.route, route)
    for (const alias of route.routeAliases || []) {
      routeByPath.set(alias, route)
    }
  }

  for (const [routePath, maxKB] of Object.entries(budget.routeEntryKBMax || {})) {
    const route = routeByPath.get(routePath)
    if (!route) {
      errors.push(`Route not found in build manifests: ${routePath}`)
      continue
    }

    const actual = bytesToKB(route.entryBytes)
    if (actual > maxKB) {
      errors.push(`Route ${routePath} entry is ${actual} KB, exceeds budget ${maxKB} KB`)
    }
  }

  for (const [routePath, signatures] of Object.entries(budget.forbiddenRuntimeSignatures || {})) {
    const route = routeByPath.get(routePath)
    if (!route) {
      errors.push(`Route not found in build manifests: ${routePath}`)
      continue
    }

    for (const signature of signatures) {
      const found = route.chunks.some((chunk) => {
        const absolute = path.join(nextDir, chunk.file)
        if (!fs.existsSync(absolute)) return false
        const content = fs.readFileSync(absolute, 'utf8')
        return content.includes(signature)
      })

      if (found) {
        errors.push(`Route ${routePath} contains forbidden runtime signature: ${signature}`)
      }
    }
  }

  if (errors.length > 0) {
    console.error('Performance budget failed:')
    for (const error of errors) {
      console.error(`  - ${error}`)
    }
    process.exit(1)
  }

  console.log('Performance budget passed.')
}

const args = process.argv.slice(2)
const shouldPrintReport = args.includes('--report')
const budgetIndex = args.findIndex((arg) => arg === '--budget')
const budgetPath = budgetIndex >= 0 ? args[budgetIndex + 1] : null

const summary = summarize()

if (shouldPrintReport || !budgetPath) {
  printReport(summary)
}

if (budgetPath) {
  assertBudget(summary, budgetPath)
}
