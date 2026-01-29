import fs from 'fs/promises'
import path from 'path'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { pinMarkdownToIPFS } from '@/lib/ipfs'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'recipe'
}

function buildMarkdown(recipe: any): string {
  const frontMatter = [
    '---',
    `title: "${recipe.title.replace(/"/g, '\\"')}"`,
    `id: ${recipe.id}`,
    `author: "${recipe.author?.name || 'Unknown'}"`,
    `created: ${recipe.createdAt.toISOString()}`,
    recipe.servings ? `servings: ${recipe.servings}` : null,
    recipe.prepTime ? `prepTime: "${recipe.prepTime}"` : null,
    recipe.cookTime ? `cookTime: "${recipe.cookTime}"` : null,
    recipe.tags?.length ? `tags: [${recipe.tags.map((t: string) => `"${t}"`).join(', ')}]` : null,
    '---',
  ]
    .filter(Boolean)
    .join('\n')

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
        .map((ing: any) => {
          const qty = ing.quantity ? `${ing.quantity} ` : ''
          const unit = ing.unit ? `${ing.unit} ` : ''
          const notes = ing.notes ? ` _(${ing.notes})_` : ''
          return `- ${qty}${unit}${ing.name}${notes}`
        })
        .join('\n')
    : ''

  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
        .map((step: any, idx: number) => {
          const duration = step.duration ? ` (${step.duration})` : ''
          return `${idx + 1}. ${step.step || step}${duration}`
        })
        .join('\n')
    : ''

  const description = recipe.description ? `${recipe.description}\n\n` : ''

  return `${frontMatter}\n\n${description}## Ingredients\n${ingredients}\n\n## Steps\n${steps}\n`
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: { author: { select: { name: true, id: true } } },
    })

    if (!recipe || (!recipe.isPublic && recipe.authorId !== session.user.id)) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const markdown = buildMarkdown(recipe)
    const vaultDir = path.join(process.cwd(), 'obsidian-vault', 'recipes')
    await fs.mkdir(vaultDir, { recursive: true })

    const filename = `${slugify(recipe.title || 'recipe')}-${recipe.id.slice(0, 6)}.md`
    const filePath = path.join(vaultDir, filename)
    await fs.writeFile(filePath, markdown, 'utf8')

    let ipfs: { cid: string; url: string } | null = null
    try {
      ipfs = await pinMarkdownToIPFS(filename, markdown)
    } catch (err) {
      console.warn('Pinata pin failed, continuing without IPFS:', err)
    }

    return NextResponse.json(
      {
        markdownPath: filePath,
        ipfs,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Recipe export failed:', error)
    return NextResponse.json({ error: 'Failed to export recipe' }, { status: 500 })
  }
}
