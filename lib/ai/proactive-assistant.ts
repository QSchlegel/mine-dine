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
  mode?: 'plan_dinner' | 'plan_recipe' | 'general'
  isProfileComplete?: boolean
}

export interface AssistantSuggestion {
  message: string
  action?: AssistantAction
}

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
    // Only suggest complete_profile if profile is not complete
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
    const actions = [
      actionCatalog.open_messages,
      actionCatalog.browse_dinners,
    ]
    // Only include complete_profile if profile is not complete
    if (!isProfileComplete) {
      actions.unshift(actionCatalog.complete_profile)
    }
    return actions
  }

  if (path.startsWith('/dashboard/messages')) {
    return [actionCatalog.open_messages, actionCatalog.browse_dinners]
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
  if (context.path?.startsWith('/dashboard/host')) {
    return 'Need a hand setting up your dinner? I can guide you to the next step.'
  }

  if (context.path?.startsWith('/dashboard/profile')) {
    // Only suggest completing profile if it's not already complete
    if (!context.isProfileComplete) {
      return 'Want help finishing your profile so others can find you?'
    }
    return 'Need help with something else? I can help you browse dinners or answer questions.'
  }

  if (context.path?.startsWith('/dinners')) {
    return 'If you want, I can help you filter dinners or answer questions.'
  }

  return 'Need a quick assist finding the right dinner or host?'
}

function buildProactivePrompt(context: AssistantContext, actions: AssistantAction[]): string {
  const idleSeconds = Math.max(0, Math.floor(context.idleSeconds || 0))
  const actionList = actions.map((action) => `- ${action.id}: ${action.label}`).join('\n')

  return `The user appears hesitant or idle in the Mine Dine app.

Context:
- Path: ${context.path || 'unknown'}
- Idle time: ${idleSeconds}s
- Role: ${context.userRole || 'unknown'}
- Mode: ${context.mode || 'general'}

If the mode is plan_dinner, focus on dinner planning. If the mode is plan_recipe, focus on recipe creation.

Provide a short, friendly proactive message (max 2 sentences). If a clear next step helps, call the tool to select ONE action from the list.

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

If the mode is plan_dinner, focus on dinner planning. If the mode is plan_recipe, focus on recipe creation.

Reply in 1-3 sentences. If a concrete next step helps, call the tool to select ONE action from the list.

Available actions:
${actionList}`
}

function parseToolAction(toolCalls: Array<{ function?: { name?: string; arguments?: string } }>): AssistantAction | undefined {
  const toolCall = toolCalls.find((call) => call.function?.name === 'select_action')
  if (!toolCall?.function?.arguments) {
    return undefined
  }

  try {
    const args = JSON.parse(toolCall.function.arguments) as {
      id?: AssistantActionId
      label?: string
      reason?: string
    }

    if (!args.id || !actionCatalog[args.id]) {
      return undefined
    }

    const base = actionCatalog[args.id]
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

export async function generateProactiveSuggestion(
  context: AssistantContext
): Promise<AssistantSuggestion> {
  const actions = getAvailableActions(context)

  if (!openai) {
    return {
      message: fallbackMessage(context),
      action: actions[0],
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.4,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content:
          'You are Mine Dine’s in-app assistant. Be brief, warm, and non-pushy. Avoid assumptions.',
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
          description: 'Pick the single best next action to help the user.',
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
                description: 'Short reason for logging.',
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
    ? parseToolAction(message.tool_calls
        .filter(tc => tc.type === 'function')
        .map(tc => ({ 
          function: { 
            name: tc.function.name, 
            arguments: typeof tc.function.arguments === 'string' 
              ? tc.function.arguments 
              : (tc.function.arguments ? JSON.stringify(tc.function.arguments) : undefined)
          } 
        })))
    : undefined

  return {
    message: content,
    action: action || actions[0],
  }
}

export async function generateAssistantReply(
  userMessage: string,
  context: AssistantContext
): Promise<AssistantSuggestion> {
  const actions = getAvailableActions(context)

  if (!openai) {
    return {
      message:
        'Thanks for the note. I can help you find dinners, connect with hosts, or finish your profile.',
      action: actions[0],
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.5,
    max_tokens: 240,
    messages: [
      {
        role: 'system',
        content:
          'You are Mine Dine’s in-app assistant. Keep replies friendly, concise, and actionable.',
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
          description: 'Pick the single best next action to help the user.',
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
                description: 'Short reason for logging.',
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
    ? parseToolAction(message.tool_calls
        .filter(tc => tc.type === 'function')
        .map(tc => ({ 
          function: { 
            name: tc.function.name, 
            arguments: typeof tc.function.arguments === 'string' 
              ? tc.function.arguments 
              : (tc.function.arguments ? JSON.stringify(tc.function.arguments) : undefined)
          } 
        })))
    : undefined

  return {
    message: content,
    action: action || actions[0],
  }
}
