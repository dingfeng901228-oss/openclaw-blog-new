export const projectsMeta = {
  pageTitle: '项目',
  pageSubtitle: '我做过的东西的集合。从AI工具到Web应用，每个项目都代表着我攻克的挑战和学到的教训。',
}

export const projects = [
  {
    slug: 'openclaw',
    title: 'OpenClaw',
    description: 'Telegram/Discord AI助手框架。协调多个AI代理实现任务自动化。',
    tags: ['TypeScript', 'Node.js', 'AI', 'Telegram Bot'],
    problem: '想把日常重复任务自动化。需要有效地协调多个AI模型。',
    challenge: '代理间的状态管理和消除冗余处理。',
    github: 'https://github.com',
    stars: '340',
    icon: 'Bot',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    slug: 'ai-dashboard',
    title: 'AI Analytics',
    description: 'AI模型性能监控仪表板。实时指标和自动报告。',
    tags: ['React', 'Next.js', 'D3.js', 'Python'],
    problem: '需要可视化AI输出，快速找到性能改进点。',
    challenge: '如何平滑渲染大量数据。',
    github: 'https://github.com',
    stars: '89',
    icon: 'Zap',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    slug: 'trading-bot',
    title: 'Crypto Bot',
    description: '基于机器学习的自动交易机器人。支持多个交易所。',
    tags: ['Python', 'TensorFlow', 'API'],
    problem: '想要不受情绪影响的自动交易。',
    challenge: '实时性与可靠性的平衡。',
    github: 'https://github.com',
    stars: '127',
    icon: 'Code2',
    gradient: 'from-orange-500 to-red-500',
  },
]

export const ctaLabels = {
  code: '代码',
  demo: '演示',
}