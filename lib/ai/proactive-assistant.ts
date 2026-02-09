import { openai } from './openai'

export type AssistantActionId =
  | 'browse_dinners'
  | 'open_messages'
  | 'complete_profile'
  | 'open_swipe'
  | 'apply_host'
  | 'create_dinner'
  | 'plan_dinner'
  | 'plan_recipe'
  | 'browse_recipes'
  | 'sign_in'
  | 'sign_up'

export interface AssistantAction {
  id: AssistantActionId
  label: string
  href: string
  reason?: string
}

export interface AssistantContext {
  path?: string
  idleSeconds?: number
  userRole?: string | null
  mode?: 'plan_dinner' | 'plan_recipe' | 'general' | 'moderator'
  isProfileComplete?: boolean
}

export interface AssistantSuggestion {
  message: string
  action?: AssistantAction
}

interface SuggestionPair {
  message: string
  actionId: AssistantActionId
}

interface FunctionToolCall {
  function?: {
    name?: string
    arguments?: string
  }
}

const PROACTIVE_SUGGESTION_PAIRS: SuggestionPair[] = [
  {
    message: 'If you want, I can point you to dinners, recipes, or messages.',
    actionId: 'browse_dinners',
  },
  {
    message: 'Need to continue a conversation? Open your messages.',
    actionId: 'open_messages',
  },
  {
    message: 'If you are planning something new, start with a recipe plan.',
    actionId: 'plan_recipe',
  },
  {
    message: 'If you are hosting, you can start a new dinner listing.',
    actionId: 'create_dinner',
  },
  {
    message: 'You can browse recipes for ideas and then refine with Dine Bot.',
    actionId: 'browse_recipes',
  },
  {
    message: 'If matching is your goal, open swipe to see hosts and dinners.',
    actionId: 'open_swipe',
  },
]

const actionCatalog: Record<AssistantActionId, AssistantAction> = {
  browse_dinners: {
    id: 'browse_dinners',
    label: 'Browse dinners',
    href: '/dinners',
  },
  open_messages: {
    id: 'open_messages',
    label: 'View messages',
    href: '/dashboard/messages',
  },
  complete_profile: {
    id: 'complete_profile',
    label: 'Finish profile',
    href: '/dashboard/profile',
  },
  open_swipe: {
    id: 'open_swipe',
    label: 'Find matches',
    href: '/swipe',
  },
  apply_host: {
    id: 'apply_host',
    label: 'Become a host',
    href: '/dashboard/host/apply',
  },
  create_dinner: {
    id: 'create_dinner',
    label: 'Create a dinner',
    href: '/dashboard/host/dinners/new',
  },
  plan_dinner: {
    id: 'plan_dinner',
    label: 'Plan a dinner',
    href: '/minebot/plan-dinner',
  },
  plan_recipe: {
    id: 'plan_recipe',
    label: 'Plan a recipe',
    href: '/minebot/plan-recipe',
  },
  browse_recipes: {
    id: 'browse_recipes',
    label: 'Browse recipes',
    href: '/recipes',
  },
  sign_in: {
    id: 'sign_in',
    label: 'Sign in',
    href: '/login',
  },
  sign_up: {
    id: 'sign_up',
    label: 'Create account',
    href: '/signup',
  },
}

function getDailyIndex(length: number): number {
  if (length <= 0) return 0

  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  const weekday = now.getDay()

  return (dayOfYear + weekday) % length
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase))
}

function pickAvailableAction(
  actionIds: AssistantActionId[],
  availableActionMap: Map<AssistantActionId, AssistantAction>
): AssistantAction | undefined {
  for (const actionId of actionIds) {
    const action = availableActionMap.get(actionId)
    if (action) {
      return action
    }
  }

  return undefined
}

function getSuggestionFromPool(context: AssistantContext): AssistantSuggestion | null {
  const actions = getAvailableActions(context)
  const availableActionIds = new Set(actions.map((action) => action.id))
  const filtered = PROACTIVE_SUGGESTION_PAIRS.filter((pair) => availableActionIds.has(pair.actionId))

  if (filtered.length === 0) {
    return null
  }

  const pair = filtered[getDailyIndex(filtered.length)]
  const action = actions.find((availableAction) => availableAction.id === pair.actionId)

  return {
    message: pair.message,
    action,
  }
}

function getAvailableActions(context: AssistantContext): AssistantAction[] {
  const path = context.path || ''
  const role = context.userRole || null
  const mode = context.mode || 'general'
  const isProfileComplete = context.isProfileComplete ?? false

  const baseActions: AssistantAction[] = [
    actionCatalog.browse_dinners,
    actionCatalog.open_swipe,
    actionCatalog.plan_recipe,
    actionCatalog.browse_recipes,
  ]

  if (role === 'HOST') {
    baseActions.push(actionCatalog.create_dinner)
    baseActions.push(actionCatalog.open_messages)
  } else if (role) {
    if (!isProfileComplete) {
      baseActions.push(actionCatalog.complete_profile)
    }
    baseActions.push(actionCatalog.open_messages)
    baseActions.push(actionCatalog.apply_host)
  } else {
    baseActions.push(actionCatalog.sign_in)
    baseActions.push(actionCatalog.sign_up)
  }

  if (path.startsWith('/dashboard/host')) {
    return [
      actionCatalog.plan_dinner,
      actionCatalog.create_dinner,
      actionCatalog.open_messages,
      actionCatalog.browse_dinners,
    ]
  }

  if (path.startsWith('/dashboard/profile')) {
    const actions = [actionCatalog.open_messages, actionCatalog.browse_dinners]
    if (!isProfileComplete) {
      actions.unshift(actionCatalog.complete_profile)
    }
    return actions
  }

  if (path.startsWith('/dashboard/messages')) {
    return [actionCatalog.open_messages, actionCatalog.browse_dinners]
  }

  if (mode === 'moderator' || path.startsWith('/minebot/moderator')) {
    return [actionCatalog.open_messages, actionCatalog.browse_dinners, actionCatalog.browse_recipes]
  }

  if (path.startsWith('/minebot/plan-dinner') || mode === 'plan_dinner') {
    return [
      actionCatalog.plan_dinner,
      actionCatalog.create_dinner,
      actionCatalog.browse_dinners,
    ]
  }

  if (path.startsWith('/minebot/plan-recipe') || mode === 'plan_recipe') {
    return [
      actionCatalog.plan_recipe,
      actionCatalog.browse_recipes,
      actionCatalog.browse_dinners,
    ]
  }

  return baseActions
}

function fallbackMessage(context: AssistantContext): string {
  if (context.mode === 'plan_dinner' || context.path?.startsWith('/minebot/plan-dinner')) {
    return 'Tell me what to adjust next: menu, timing, pricing, or listing details.'
  }

  if (context.mode === 'plan_recipe' || context.path?.startsWith('/minebot/plan-recipe')) {
    return 'Tell me what to refine next: ingredients, steps, title, or plating.'
  }

  if (context.path?.startsWith('/dashboard/profile') && !context.isProfileComplete) {
    return 'I can help with profile completion, messages, dinners, or hosting.'
  }

  return 'I can help you navigate. Tell me what you want to do next.'
}

function buildProactivePrompt(context: AssistantContext, actions: AssistantAction[]): string {
  const idleSeconds = Math.max(0, Math.floor(context.idleSeconds || 0))
  const actionList = actions.map((action) => `- ${action.id}: ${action.label}`).join('\n')

  return `The user appears idle in the Mine Dine app.

Context:
- Path: ${context.path || 'unknown'}
- Idle time: ${idleSeconds}s
- Role: ${context.userRole || 'unknown'}
- Mode: ${context.mode || 'general'}

Write one calm, concise sentence offering help.
Only call select_action if there is an obvious next click from context.
If uncertain, do not call any tool.

Available actions:
${actionList}`
}

function buildChatPrompt(message: string, context: AssistantContext, actions: AssistantAction[]): string {
  const actionList = actions.map((action) => `- ${action.id}: ${action.label}`).join('\n')

  return `User message: "${message}"

Context:
- Path: ${context.path || 'unknown'}
- Role: ${context.userRole || 'unknown'}
- Mode: ${context.mode || 'general'}

Response rules:
- Professional, concise, and practical.
- 1-2 short sentences.
- No hype and no exclamation marks.
- Only call select_action if the user clearly needs a specific next click.
- If uncertain, reply with clarification and do not call any tool.

Available actions:
${actionList}`
}

function parseToolAction(
  toolCalls: FunctionToolCall[],
  availableActions: AssistantAction[]
): AssistantAction | undefined {
  const toolCall = toolCalls.find((call) => call.function?.name === 'select_action')
  if (!toolCall?.function?.arguments) {
    return undefined
  }

  const availableActionMap = new Map(availableActions.map((action) => [action.id, action] as const))

  try {
    const args = JSON.parse(toolCall.function.arguments) as {
      id?: AssistantActionId
      label?: string
      reason?: string
    }

    if (!args.id) {
      return undefined
    }

    const base = availableActionMap.get(args.id)
    if (!base) {
      return undefined
    }

    return {
      ...base,
      label: args.label?.trim() || base.label,
      reason: args.reason?.trim(),
    }
  } catch (error) {
    console.warn('Failed to parse assistant tool call:', error)
    return undefined
  }
}

function mapToolCalls(
  toolCalls: Array<{
    type?: string
    function?: {
      name?: string
      arguments?: string | object
    }
  }> = []
): FunctionToolCall[] {
  return toolCalls
    .filter((toolCall) => toolCall.type === 'function')
    .map((toolCall) => ({
      function: {
        name: toolCall.function?.name,
        arguments:
          typeof toolCall.function?.arguments === 'string'
            ? toolCall.function.arguments
            : toolCall.function?.arguments
              ? JSON.stringify(toolCall.function.arguments)
              : undefined,
      },
    }))
}

function resolveNavigationIntent(
  userMessage: string,
  availableActions: AssistantAction[]
): AssistantSuggestion | null {
  const normalized = normalizeText(userMessage)
  if (!normalized) {
    return null
  }

  const availableActionMap = new Map(availableActions.map((action) => [action.id, action] as const))

  const quickClarifiers = new Set(['help', 'hello', 'hi', 'hey', 'start'])
  if (quickClarifiers.has(normalized)) {
    return {
      message:
        'I can route you to messages, dinners, recipes, profile, or hosting. Tell me your goal.',
    }
  }

  if (includesAny(normalized, ['message', 'messages', 'inbox', 'chat'])) {
    const action = pickAvailableAction(['open_messages', 'sign_in', 'sign_up'], availableActionMap)

    if (action?.id === 'open_messages') {
      return {
        message: 'Open your messages to view and reply to conversations.',
        action,
      }
    }

    if (action) {
      return {
        message: 'Messages are available after sign-in.',
        action,
      }
    }

    return {
      message: 'Messages are available in your dashboard after sign-in.',
    }
  }

  if (
    includesAny(normalized, [
      'become a host',
      'become host',
      'apply host',
      'host application',
      'host apply',
    ]) ||
    (normalized.includes('host') && includesAny(normalized, ['apply', 'become', 'how', 'start']))
  ) {
    const action = pickAvailableAction(['apply_host', 'sign_in', 'sign_up'], availableActionMap)

    if (action?.id === 'apply_host') {
      return {
        message: 'Use the host application flow to get started.',
        action,
      }
    }

    if (action) {
      return {
        message: 'To apply as a host, sign in first.',
        action,
      }
    }

    return {
      message: 'Host applications are available from the dashboard after sign-in.',
    }
  }

  if (includesAny(normalized, ['profile', 'bio', 'tags'])) {
    const action = pickAvailableAction(['complete_profile', 'sign_in', 'sign_up'], availableActionMap)

    if (action?.id === 'complete_profile') {
      return {
        message: 'Open your profile to complete or update your details.',
        action,
      }
    }

    if (action) {
      return {
        message: 'Profile editing is available after sign-in.',
        action,
      }
    }

    return {
      message: 'Profile settings are available from your dashboard.',
    }
  }

  if (
    includesAny(normalized, ['create dinner', 'new dinner', 'post dinner', 'list dinner']) ||
    (normalized.includes('dinner') && includesAny(normalized, ['create', 'new', 'publish', 'post', 'list']))
  ) {
    const action = pickAvailableAction(
      ['create_dinner', 'plan_dinner', 'apply_host', 'sign_in'],
      availableActionMap
    )

    if (action?.id === 'create_dinner') {
      return {
        message: 'Create a dinner listing and continue from there.',
        action,
      }
    }

    if (action?.id === 'plan_dinner') {
      return {
        message: 'Start with dinner planning, then continue to your listing.',
        action,
      }
    }

    if (action?.id === 'apply_host') {
      return {
        message: 'Hosting tools are unlocked after your host application is approved.',
        action,
      }
    }

    if (action) {
      return {
        message: 'Creating a dinner requires sign-in first.',
        action,
      }
    }

    return {
      message: 'Dinner creation is available from host tools after sign-in.',
    }
  }

  if (
    includesAny(normalized, ['plan dinner', 'dinner plan', 'menu plan']) ||
    (normalized.includes('dinner') && includesAny(normalized, ['plan', 'planning']))
  ) {
    const action = pickAvailableAction(['plan_dinner', 'create_dinner', 'apply_host', 'sign_in'], availableActionMap)

    if (action?.id === 'plan_dinner') {
      return {
        message: 'Open dinner planning to draft menu, timing, and pricing.',
        action,
      }
    }

    if (action?.id === 'create_dinner') {
      return {
        message: 'Open dinner creation and refine the plan in the listing flow.',
        action,
      }
    }

    if (action?.id === 'apply_host') {
      return {
        message: 'Dinner planning is available to hosts. Apply first to unlock it.',
        action,
      }
    }

    if (action) {
      return {
        message: 'Dinner planning requires sign-in first.',
        action,
      }
    }

    return {
      message: 'Dinner planning is available in MineBot host tools.',
    }
  }

  if (
    includesAny(normalized, ['plan recipe', 'recipe plan']) ||
    (normalized.includes('recipe') && includesAny(normalized, ['plan', 'create']))
  ) {
    const action = pickAvailableAction(['plan_recipe', 'browse_recipes', 'sign_in', 'sign_up'], availableActionMap)

    if (action?.id === 'plan_recipe') {
      return {
        message: 'Open recipe planning to draft and refine your dish.',
        action,
      }
    }

    if (action?.id === 'browse_recipes') {
      return {
        message: 'Browse recipes for ideas, then choose one to refine.',
        action,
      }
    }

    if (action) {
      return {
        message: 'Recipe planning is available after sign-in.',
        action,
      }
    }

    return {
      message: 'Recipe planning is available in MineBot tools.',
    }
  }

  if (includesAny(normalized, ['recipe', 'recipes', 'cooking ideas', 'dish ideas'])) {
    const action = pickAvailableAction(['browse_recipes', 'plan_recipe'], availableActionMap)

    if (action?.id === 'browse_recipes') {
      return {
        message: 'Browse recipes to find ideas or save something to try.',
        action,
      }
    }

    if (action) {
      return {
        message: 'You can jump into recipe planning directly.',
        action,
      }
    }

    return {
      message: 'I can help you with recipes once that section is available.',
    }
  }

  if (includesAny(normalized, ['swipe', 'match', 'matches', 'discover host', 'discover hosts'])) {
    const action = pickAvailableAction(['open_swipe', 'browse_dinners'], availableActionMap)

    if (action?.id === 'open_swipe') {
      return {
        message: 'Open swipe to discover and match with hosts.',
        action,
      }
    }

    if (action) {
      return {
        message: 'Browse dinners to discover available hosts and events.',
        action,
      }
    }

    return {
      message: 'I can help you discover hosts from swipe or dinner listings.',
    }
  }

  if (includesAny(normalized, ['dinner', 'dinners', 'event', 'events'])) {
    const action = pickAvailableAction(['browse_dinners', 'open_swipe'], availableActionMap)

    if (action?.id === 'browse_dinners') {
      return {
        message: 'Browse dinners to compare dates, pricing, and hosts.',
        action,
      }
    }

    if (action) {
      return {
        message: 'Open swipe to discover dinners and hosts.',
        action,
      }
    }

    return {
      message: 'I can help you find dinners from the listing pages.',
    }
  }

  if (includesAny(normalized, ['log in', 'login', 'sign in'])) {
    const action = pickAvailableAction(['sign_in', 'sign_up'], availableActionMap)

    if (action) {
      return {
        message: 'Open sign-in to access your dashboard and tools.',
        action,
      }
    }

    return {
      message: 'Sign-in is available from the account menu.',
    }
  }

  if (includesAny(normalized, ['sign up', 'signup', 'create account', 'register', 'join'])) {
    const action = pickAvailableAction(['sign_up', 'sign_in'], availableActionMap)

    if (action) {
      return {
        message: 'Create an account to save progress and use planning tools.',
        action,
      }
    }

    return {
      message: 'Account creation is available from the sign-up page.',
    }
  }

  return null
}

export async function generateProactiveSuggestion(
  context: AssistantContext
): Promise<AssistantSuggestion> {
  const actions = getAvailableActions(context)

  const fromPool = getSuggestionFromPool(context)
  if (fromPool) {
    return fromPool
  }

  if (!openai) {
    return {
      message: fallbackMessage(context),
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.3,
    max_tokens: 160,
    messages: [
      {
        role: 'system',
        content:
          'You are Mine Dine\'s in-app assistant. Be professional, concise, and low-pressure.',
      },
      {
        role: 'user',
        content: buildProactivePrompt(context, actions),
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'select_action',
          description: 'Pick a single next action only when it is clearly helpful.',
          parameters: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                enum: actions.map((action) => action.id),
              },
              label: {
                type: 'string',
                description: 'Short CTA label (2-4 words).',
              },
              reason: {
                type: 'string',
                description: 'Brief rationale for logging.',
              },
            },
            required: ['id'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  })

  const message = response.choices[0]?.message
  const content = message?.content?.trim() || fallbackMessage(context)
  const action = message?.tool_calls
    ? parseToolAction(mapToolCalls(message.tool_calls), actions)
    : undefined

  return {
    message: content,
    action,
  }
}

export async function generateAssistantReply(
  userMessage: string,
  context: AssistantContext
): Promise<AssistantSuggestion> {
  const actions = getAvailableActions(context)

  const deterministicReply = resolveNavigationIntent(userMessage, actions)
  if (deterministicReply) {
    return deterministicReply
  }

  if (!openai) {
    return {
      message: fallbackMessage(context),
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.35,
    max_tokens: 220,
    messages: [
      {
        role: 'system',
        content:
          'You are Mine Dine\'s in-app assistant. Be professional, concise, and practical.',
      },
      {
        role: 'user',
        content: buildChatPrompt(userMessage, context, actions),
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'select_action',
          description: 'Pick a single next action only when it is clearly helpful.',
          parameters: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                enum: actions.map((action) => action.id),
              },
              label: {
                type: 'string',
                description: 'Short CTA label (2-4 words).',
              },
              reason: {
                type: 'string',
                description: 'Brief rationale for logging.',
              },
            },
            required: ['id'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  })

  const message = response.choices[0]?.message
  const content = message?.content?.trim() || fallbackMessage(context)
  const action = message?.tool_calls
    ? parseToolAction(mapToolCalls(message.tool_calls), actions)
    : undefined

  return {
    message: content,
    action,
  }
}
