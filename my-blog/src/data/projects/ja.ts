export const projectsMeta = {
  pageTitle: '作ったもの',
  pageSubtitle: '実際に作ったもの一覧。AIツール、Webアプリ、自動化スクリプトなど。困ってたことを解決するために作ったのがほとんど。',
}

export const projects = [
  {
    slug: 'openclaw',
    title: 'OpenClaw',
    description: 'Telegram/Discord用のAIアシスタントフレームワーク。複数のAIエージェントを協調させてタスクを自動化。',
    tags: ['TypeScript', 'Node.js', 'AI', 'Telegram Bot'],
    problem: '日常の反復タスクを自動化したい。複数のAIモデルをうまく連携させたくて。',
    challenge: 'エージェント間の状態管理と、冗長な処理の排除。',
    github: 'https://github.com',
    stars: '340',
    icon: 'Bot',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    slug: 'ai-dashboard',
    title: 'AI Analytics',
    description: 'AIモデルの性能監視ダッシュボード。リアルタイムメトリクスと自動レポート。',
    tags: ['React', 'Next.js', 'D3.js', 'Python'],
    problem: 'AIの出力を可視化して、パフォーマンスの改善点をすぐ見つけたかった。',
    challenge: '大量データをいかにスムーズに描画するか。',
    github: 'https://github.com',
    stars: '89',
    icon: 'Zap',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    slug: 'trading-bot',
    title: 'Crypto Bot',
    description: '機械学習ベースの自動取引ボット。複数の取引所に対応。',
    tags: ['Python', 'TensorFlow', 'API'],
    problem: '感情に流されない自動取引が欲しかった。',
    challenge: 'リアルタイム性と信頼性のバランス。',
    github: 'https://github.com',
    stars: '127',
    icon: 'Code2',
    gradient: 'from-orange-500 to-red-500',
  },
]

export const ctaLabels = {
  code: 'コード',
  demo: 'デモ',
}