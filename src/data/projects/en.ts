export const projectsMeta = {
  pageTitle: 'Made Things',
  pageSubtitle: 'Collection of things I actually built. AI tools, web apps, automation scripts — each one solves a problem I actually had.',
}

export const projects = [
  {
    slug: 'openclaw',
    title: 'OpenClaw',
    description: 'AI assistant framework for Telegram/Discord. Orchestrates multiple AI agents to automate tasks.',
    tags: ['TypeScript', 'Node.js', 'AI', 'Telegram Bot'],
    problem: 'Wanted to automate repetitive daily tasks. Needed to coordinate multiple AI models effectively.',
    challenge: 'State management between agents and eliminating redundant processing.',
    github: 'https://github.com',
    stars: '340',
    icon: 'Bot',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    slug: 'ai-dashboard',
    title: 'AI Analytics',
    description: 'Real-time AI model performance monitoring dashboard. Custom visualizations and automated reporting.',
    tags: ['React', 'Next.js', 'D3.js', 'Python'],
    problem: 'Needed to visualize AI outputs and find performance improvement points quickly.',
    challenge: 'Smooth rendering of large data volumes.',
    github: 'https://github.com',
    stars: '89',
    icon: 'Zap',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    slug: 'trading-bot',
    title: 'Crypto Bot',
    description: 'Machine learning-based automated trading bot. Supports multiple exchanges.',
    tags: ['Python', 'TensorFlow', 'API'],
    problem: 'Wanted emotion-free automated trading.',
    challenge: 'Balancing real-time performance and reliability.',
    github: 'https://github.com',
    stars: '127',
    icon: 'Code2',
    gradient: 'from-orange-500 to-red-500',
  },
]

export const ctaLabels = {
  code: 'Code',
  demo: 'Demo',
}