import { defineConfig } from 'vitepress'

export default defineConfig({
	base: process.env.DOCS_BASE ?? '/',
	title: 'uxiu',
	description: '为 Koa 后端应用提供基础能力的 TypeScript 工具库',
	lang: 'zh-CN',
	cleanUrls: true,
	lastUpdated: true,
	head: [
		['meta', { name: 'theme-color', content: '#2563eb' }],
		['meta', { name: 'author', content: 'feiYu' }]
	],
	themeConfig: {
		logo: {
			src: '/logo.svg',
			alt: 'uxiu'
		},
		siteTitle: 'uxiu',
		search: {
			provider: 'local'
		},
		nav: [
			{ text: '指南', link: '/guide/getting-started' },
			{ text: 'API', link: '/api/type-guards' },
			{ text: '维护', link: '/maintenance/development' },
			{
				text: 'v0.21.0',
				items: [
					{ text: 'npm', link: 'https://www.npmjs.com/package/uxiu' },
					{ text: 'GitHub', link: 'https://github.com/fy-store/uxiu' }
				]
			}
		],
		sidebar: [
			{
				text: '使用指南',
				items: [
					{ text: '快速开始', link: '/guide/getting-started' },
					{ text: '模块入口', link: '/guide/module-entry' },
					{ text: 'Koa 应用示例', link: '/guide/koa-quickstart' }
				]
			},
			{
				text: '通用 API',
				items: [
					{ text: '类型判断', link: '/api/type-guards' },
					{ text: '对象与校验工具', link: '/api/object-utils' },
					{ text: '只读代理', link: '/api/readonly' },
					{ text: '异步与随机工具', link: '/api/dependence' },
					{ text: 'DbFit', link: '/api/db-fit' }
				]
			},
			{
				text: 'Node API',
				items: [
					{ text: 'createApp', link: '/api/create-app' },
					{ text: '日志模块', link: '/api/logger' },
					{ text: '请求检查器', link: '/api/request-inspector' },
					{ text: '会话存储', link: '/api/session-store' },
					{ text: '本地 IP', link: '/api/network' }
				]
			},
			{
				text: '项目维护',
				items: [{ text: '开发与发布', link: '/maintenance/development' }]
			}
		],
		socialLinks: [{ icon: 'github', link: 'https://github.com/fy-store/uxiu' }],
		editLink: {
			pattern: 'https://github.com/fy-store/uxiu/edit/master/packages/docs/:path',
			text: '在 GitHub 上编辑此页'
		},
		lastUpdated: {
			text: '最后更新'
		},
		docFooter: {
			prev: '上一页',
			next: '下一页'
		},
		outline: {
			level: [2, 3],
			label: '本页目录'
		},
		returnToTopLabel: '返回顶部',
		sidebarMenuLabel: '目录',
		darkModeSwitchLabel: '主题',
		lightModeSwitchTitle: '切换到浅色模式',
		darkModeSwitchTitle: '切换到深色模式',
		footer: {
			message: '基于 MIT 许可发布',
			copyright: 'Copyright © 2025-present feiYu and uxiu contributors'
		}
	}
})
