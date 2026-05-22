'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Briefcase, GraduationCap, Rocket, Star } from 'lucide-react'

const timelineData = [
  {
    date: '2024 - Present',
    title: 'Independent Developer',
    title_ja: '独立開発者',
    title_zh: '独立开发者',
    description: 'Building AI tools and web applications. Focused on automation and AI agent orchestration.',
    description_ja: 'AIツールとWebアプリケーションを構築。自動化とAIエージェントオーケストレーションが専門。',
    description_zh: '构建AI工具和Web应用。专注自动化和AI代理编排。',
    type: 'work' as const,
  },
  {
    date: '2024',
    title: 'OpenClaw Framework',
    title_ja: 'OpenClaw フレームワーク',
    title_zh: 'OpenClaw 框架',
    description: 'Launched open-source AI assistant framework. 340+ GitHub stars and growing.',
    description_ja: 'オープンソースAIアシスタントフレームワークを発表。GitHubで340以上のスター。',
    description_zh: '发布开源AI助手框架。GitHub 340+ stars。',
    type: 'project' as const,
  },
  {
    date: '2023',
    title: 'Senior Developer @ TechCorp',
    title_ja: 'TechCorp シニア開発者',
    title_zh: 'TechCorp 高级开发',
    description: 'Led microservices architecture. 1M+ users served.',
    description_ja: 'マイクロサービスアーキテクチャを主導。100万以上のユーザー対応。',
    description_zh: '主导微服务架构。服务100万+用户。',
    type: 'work' as const,
  },
  {
    date: '2023',
    title: 'AI Trading Bot',
    title_ja: 'AI取引ボット',
    title_zh: 'AI交易机器人',
    description: 'Built ML-based crypto trading bot. Consistent returns through automated strategies.',
    description_ja: '機械学習ベースの暗号通貨取引ボットを構築。自動戦略で安定収益。',
    description_zh: '构建基于ML的加密货币交易机器人。自动化策略稳定盈利。',
    type: 'project' as const,
  },
  {
    date: '2022',
    title: 'Computer Science Degree',
    title_ja: '情報科学学位取得',
    title_zh: '计算机科学学位',
    description: 'Graduated with honors. Specialized in distributed systems and ML.',
    description_ja: '成績優秀で卒業。分散システムとMLを専攻。',
    description_zh: '以优异成绩毕业。专攻分布式系统和机器学习。',
    type: 'education' as const,
  },
  {
    date: '2020',
    title: 'Started Coding',
    title_ja: 'コーディング始める',
    title_zh: '开始编程',
    description: 'Wrote first line of code. Immediately hooked on building things with computers.',
    description_ja: '初めてコードを書いて、电脑で何かを作るのにハマる。',
    description_zh: '写出第一行代码。立刻迷上了用电脑创造东西。',
    type: 'milestone' as const,
  },
]

const iconMap = {
  work: Briefcase,
  education: GraduationCap,
  project: Rocket,
  milestone: Star,
}

const colorMap = {
  work: 'from-blue-500 to-cyan-500',
  education: 'from-purple-500 to-pink-500',
  project: 'from-orange-500 to-red-500',
  milestone: 'from-green-500 to-emerald-500',
}

export default function TimelineSection({ locale }: { locale: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const getTitle = (item: typeof timelineData[0]) => {
    if (locale === 'ja') return item.title_ja
    if (locale === 'zh') return item.title_zh
    return item.title
  }

  const getDesc = (item: typeof timelineData[0]) => {
    if (locale === 'ja') return item.description_ja
    if (locale === 'zh') return item.description_zh
    return item.description
  }

  return (
    <section ref={ref} className="py-24 md:py-32">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {locale === 'ja' ? '足跡' : locale === 'zh' ? '时间线' : 'Timeline'}
          </h2>
          <p className="text-text-secondary text-base max-w-2xl mx-auto">
            {locale === 'ja' ? 'これまでの遍歷。こんなことやってきました。' : locale === 'zh' ? '我的技术成长之路。每一个里程碑。' : 'My journey in tech. Every milestone.'}
          </p>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />

          <div className="space-y-12">
            {timelineData.map((item, index) => {
              const Icon = iconMap[item.type]
              const isLeft = index % 2 === 0

              return (
                <motion.div
                  key={item.date + item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative pl-8 md:pl-0"
                >
                  {/* Icon */}
                  <div className="absolute left-0 md:left-1/2 top-0 w-10 h-10 rounded-full bg-bg-secondary border-4 border-bg-primary flex items-center justify-center md:-translate-x-1/2 z-10">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${colorMap[item.type]} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`md:w-[calc(50%-2rem)] ${isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}>
                    <div className="p-5 rounded-xl bg-bg-secondary/50 border border-border hover:border-border-hover transition-all duration-300">
                      <span className="text-xs text-accent-blue font-medium mb-1 block">
                        {item.date}
                      </span>
                      <h3 className="text-base font-bold text-text-primary mb-1">
                        {getTitle(item)}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {getDesc(item)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}