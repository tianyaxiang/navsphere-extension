import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StorageManager } from '@/lib/storage'
import { detectNavSphereInstance, getSiteMetadata } from '@/lib/api'
import type { NavSphereInstance, ExtensionSettings } from '@/types'
import { generateId } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Settings,
  Globe,
  Github,
  Bookmark,
  Loader2,
  Check,
  X,
  ExternalLink,
  Home,
  Server,
  Key,
  RefreshCw as Sync
} from 'lucide-react'

type TabType = 'welcome' | 'instances' | 'auth' | 'sync' | 'settings'

export default function OptionsApp() {
  const [activeTab, setActiveTab] = useState<TabType>('welcome')
  const [instances, setInstances] = useState<NavSphereInstance[]>([])
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initializeOptions()

    // 检查URL参数决定显示哪个标签
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab') as TabType
    if (tab) {
      setActiveTab(tab)
    }
  }, [])

  async function initializeOptions() {
    try {
      const [instanceList, settingsData] = await Promise.all([
        StorageManager.getInstances(),
        StorageManager.getSettings()
      ])

      setInstances(instanceList)
      setSettings(settingsData)
    } catch (error) {
      console.error('Failed to initialize options:', error)
    }
  }

  const tabs = [
    { id: 'welcome', label: '欢迎', icon: Home },
    { id: 'instances', label: '实例管理', icon: Server },
    { id: 'auth', label: '认证设置', icon: Key },
    { id: 'sync', label: '书签同步', icon: Sync },
    { id: 'settings', label: '通用设置', icon: Settings },
  ]

  return (
    <div className="extension-options min-h-screen bg-background">
      {/* 头部 */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">NavSphere 扩展</h1>
                <p className="text-sm text-muted-foreground">浏览器书签管理和同步工具</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/tianyaxiang/NavSphere', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* 侧边栏 */}
        <aside className="w-64 p-6">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          {activeTab === 'welcome' && (
            <WelcomeTab />
          )}

          {activeTab === 'instances' && (
            <InstancesTab
              instances={instances}
              onInstancesChange={setInstances}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {activeTab === 'auth' && (
            <AuthTab
              instances={instances}
              onInstancesChange={setInstances}
            />
          )}

          {activeTab === 'sync' && (
            <SyncTab
              settings={settings}
              onSettingsChange={setSettings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              instances={instances}
              onSettingsChange={setSettings}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// 欢迎标签页
function WelcomeTab() {
  return (
    <div className="space-y-6">
      {/* 欢迎标题 */}
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">欢迎使用 NavSphere 扩展</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          一个强大的浏览器书签管理和同步工具，让您的导航体验更加便捷高效
        </p>
      </div>

      {/* 功能特性 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Server className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">多实例管理</h3>
            <p className="text-muted-foreground">
              连接和管理多个 NavSphere 实例，在不同的导航网站之间轻松切换
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">书签同步</h3>
            <p className="text-muted-foreground">
              将浏览器书签同步到您的 NavSphere 实例，实现跨设备访问
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Github className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">GitHub 集成</h3>
            <p className="text-muted-foreground">
              通过 GitHub OAuth 认证，安全地管理您的个人导航数据
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">个性化设置</h3>
            <p className="text-muted-foreground">
              丰富的配置选项，让扩展完全符合您的使用习惯
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">跨平台支持</h3>
            <p className="text-muted-foreground">
              支持 Chrome、Edge 等主流浏览器，数据云端同步
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">安全可靠</h3>
            <p className="text-muted-foreground">
              采用标准 OAuth 认证，数据传输加密，保护您的隐私安全
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快速开始 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            快速开始
          </CardTitle>
          <CardDescription>
            按照以下步骤快速配置和使用 NavSphere 扩展
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">添加 NavSphere 实例</h4>
                  <p className="text-sm text-muted-foreground">
                    在"实例管理"页面添加您的 NavSphere 导航网站
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">配置 GitHub 认证</h4>
                  <p className="text-sm text-muted-foreground">
                    在"认证设置"页面配置 GitHub OAuth 以启用同步功能
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">同步书签</h4>
                  <p className="text-sm text-muted-foreground">
                    在"书签同步"页面将浏览器书签同步到您的导航网站
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">个性化设置</h4>
                  <p className="text-sm text-muted-foreground">
                    在"通用设置"页面调整扩展的行为和外观
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  5
                </div>
                <div>
                  <h4 className="font-semibold">开始使用</h4>
                  <p className="text-sm text-muted-foreground">
                    点击浏览器工具栏的扩展图标，享受便捷的导航体验
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set('tab', 'instances')
                    window.location.href = url.toString()
                  }}
                  className="w-full"
                >
                  <Server className="w-4 h-4 mr-2" />
                  开始配置实例
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 帮助和支持 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              开源项目
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              NavSphere 是一个开源项目，欢迎参与贡献和反馈
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/tianyaxiang/NavSphere', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub 仓库
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/tianyaxiang/NavSphere/issues', '_blank')}
              >
                问题反馈
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              相关链接
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              了解更多关于 NavSphere 项目的信息
            </p>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://github.com/tianyaxiang/NavSphere/blob/main/README.md', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                使用文档
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://github.com/tianyaxiang/NavSphere/releases', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                版本更新
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 版本信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>NavSphere Browser Extension</span>
            </div>
            <div>
              版本 1.0.0
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 实例管理标签页
function InstancesTab({
  instances,
  onInstancesChange,
  loading,
  setLoading
}: {
  instances: NavSphereInstance[]
  onInstancesChange: (instances: NavSphereInstance[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newInstance, setNewInstance] = useState({
    name: '',
    url: '',
  })
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
    details?: string[]
    metadata?: {
      title?: string
      description?: string
      favicon?: string
    }
  } | null>(null)

  async function handleAddInstance() {
    if (!newInstance.name || !newInstance.url) return

    setLoading(true)
    try {
      const instance: NavSphereInstance = {
        id: generateId(),
        name: newInstance.name,
        url: newInstance.url.replace(/\/$/, ''), // 移除末尾斜杠
        apiUrl: newInstance.url.replace(/\/$/, ''),
        isActive: true,
        // 使用验证时获取的元数据
        title: validationResult?.metadata?.title,
        description: validationResult?.metadata?.description,
        favicon: validationResult?.metadata?.favicon,
        authConfig: {
          isAuthenticated: false,
        },
        createdAt: Date.now(),
        lastUsed: 0,
      }

      console.log('准备添加实例:', instance)
      await StorageManager.addInstance(instance)
      console.log('实例添加成功')

      const updatedInstances = await StorageManager.getInstances()
      console.log('获取到的实例列表:', updatedInstances)
      onInstancesChange(updatedInstances)

      setNewInstance({ name: '', url: '' })
      setShowAddForm(false)
      setValidationResult(null)
    } catch (error) {
      console.error('Failed to add instance:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveInstance(instanceId: string) {
    if (!confirm('确定要删除这个实例吗？')) return

    try {
      await StorageManager.removeInstance(instanceId)
      const updatedInstances = await StorageManager.getInstances()
      onInstancesChange(updatedInstances)
    } catch (error) {
      console.error('Failed to remove instance:', error)
    }
  }

  async function validateInstance() {
    if (!newInstance.url) return

    setValidating(true)
    setValidationResult(null)

    try {
      console.log('开始验证实例:', newInstance.url)

      // 先检查URL格式
      let testUrl: URL
      try {
        testUrl = new URL(newInstance.url)
      } catch {
        setValidationResult({
          isValid: false,
          message: 'URL格式不正确',
          details: ['请输入完整的URL，例如：https://your-site.vercel.app']
        })
        return
      }

      // 检查协议
      if (!['http:', 'https:'].includes(testUrl.protocol)) {
        setValidationResult({
          isValid: false,
          message: 'URL协议不支持',
          details: ['请使用 http:// 或 https:// 协议']
        })
        return
      }

      const isValid = await detectNavSphereInstance(newInstance.url)

      if (isValid) {
        // 获取站点元数据
        console.log('获取站点元数据...')
        const metadata = await getSiteMetadata(newInstance.url)
        console.log('站点元数据:', metadata)

        setValidationResult({
          isValid: true,
          message: '✅ 检测到有效的 NavSphere 实例',
          details: [
            '连接成功，可以添加此实例',
            metadata.title ? `站点标题: ${metadata.title}` : undefined,
            metadata.description ? `站点描述: ${metadata.description}` : undefined,
            metadata.favicon ? '已获取站点图标' : undefined
          ].filter(Boolean) as string[],
          metadata
        })
      } else {
        // 尝试检查是否是健康检查端点但不确定是否为NavSphere
        try {
          const healthResponse = await fetch(`${newInstance.url.replace(/\/$/, '')}/api/health`, {
            method: 'GET',
            mode: 'cors',
            signal: AbortSignal.timeout(5000)
          })

          if (healthResponse.ok) {
            const data = await healthResponse.json()
            if (data.status === 'ok') {
              // 即使是健康检查端点，也尝试获取元数据
              console.log('获取站点元数据...')
              const metadata = await getSiteMetadata(newInstance.url)
              console.log('站点元数据:', metadata)

              setValidationResult({
                isValid: true,
                message: '⚠️ 检测到健康检查端点',
                details: [
                  '发现了健康检查API，但无法确定是否为NavSphere实例',
                  '这可能是一个NavSphere部署，但缺少标准标识',
                  '您可以尝试添加此实例，如果不是NavSphere，功能将无法正常工作',
                  '',
                  metadata.title ? `站点标题: ${metadata.title}` : undefined,
                  metadata.description ? `站点描述: ${metadata.description}` : undefined,
                  metadata.favicon ? '已获取站点图标' : undefined,
                  '',
                  '建议：',
                  '• 确认这是基于NavSphere项目部署的网站',
                  '• 如果是自己部署的，建议在健康检查端点返回 {"service": "NavSphere"}'
                ].filter(Boolean) as string[],
                metadata
              })
              return
            }
          }
        } catch (error) {
          // 忽略错误，显示原始错误信息
        }

        setValidationResult({
          isValid: false,
          message: '❌ 无法连接到 NavSphere 实例',
          details: [
            '可能的原因：',
            '• 该URL不是NavSphere实例',
            '• 网站无法访问或响应超时',
            '• CORS跨域限制',
            '• 网站未正确配置API端点',
            '',
            '请检查：',
            '• URL是否正确',
            '• 网站是否可以正常访问',
            '• 是否为NavSphere部署的网站'
          ]
        })
      }
    } catch (error) {
      console.error('验证失败:', error)
      let errorMessage = '验证过程中发生错误'
      const details = ['请检查网络连接和URL是否正确']

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = '网络连接失败'
        details.push('• 检查网络连接')
        details.push('• 确认目标网站可以访问')
        details.push('• 可能存在CORS跨域限制')
      } else if (error instanceof Error) {
        details.push(`错误详情: ${error.message}`)
      }

      setValidationResult({
        isValid: false,
        message: errorMessage,
        details
      })
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">实例管理</h2>
        <p className="text-muted-foreground">
          管理您的 NavSphere 实例。您可以添加多个实例并在它们之间切换。
        </p>
      </div>

      {/* 添加新实例 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">添加 NavSphere 实例</CardTitle>
              <CardDescription>
                连接到您的 NavSphere 导航网站
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加实例
            </Button>
          </div>
        </CardHeader>

        {showAddForm && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instance-name">实例名称</Label>
              <Input
                id="instance-name"
                value={newInstance.name}
                onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                placeholder="例如：个人导航、工作导航"
              />
            </div>

            <div>
              <Label htmlFor="instance-url">实例 URL</Label>
              <div className="flex gap-2">
                <Input
                  id="instance-url"
                  value={newInstance.url}
                  onChange={(e) => setNewInstance({ ...newInstance, url: e.target.value })}
                  placeholder="https://your-navsphere.vercel.app"
                />
                <Button
                  variant="outline"
                  onClick={validateInstance}
                  disabled={validating || !newInstance.url}
                >
                  {validating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '验证'
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                请输入完整的NavSphere网站URL，例如：https://your-site.vercel.app
              </p>

              {validationResult && (
                <div className={`mt-2 ${validationResult.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    {validationResult.isValid ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {validationResult.message}
                  </div>

                  {validationResult.details && validationResult.details.length > 0 && (
                    <div className="text-xs bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                      {validationResult.details.map((detail, index) => (
                        <div key={index} className={detail === '' ? 'h-2' : ''}>
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddInstance}
                disabled={loading || !newInstance.name || !newInstance.url || (validationResult && !validationResult.isValid)}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                添加
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewInstance({ name: '', url: '' })
                  setValidationResult(null)
                }}
              >
                取消
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 实例列表 */}
      <div className="space-y-4">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">还没有配置实例</h3>
              <p className="text-muted-foreground mb-4">
                添加您的第一个 NavSphere 实例开始使用
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加实例
              </Button>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`instance-status ${instance.authConfig.isAuthenticated ? 'online' : 'offline'
                      }`} />
                    {instance.favicon && (
                      <img
                        src={instance.favicon}
                        alt=""
                        className="w-5 h-5 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{instance.name}</h3>
                      {instance.description && (
                        <p className="text-xs text-muted-foreground mb-1">{instance.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{instance.url}</span>
                        <span>•</span>
                        <span className={
                          instance.authConfig.isAuthenticated ? 'text-green-600' : 'text-red-600'
                        }>
                          {instance.authConfig.isAuthenticated ? '已认证' : '未认证'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(instance.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveInstance(instance.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            连接帮助
          </CardTitle>
          <CardDescription>
            如何正确添加 NavSphere 实例
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">支持的 NavSphere 实例</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 官方 NavSphere 项目部署的网站</li>
              <li>• 必须可以通过浏览器正常访问</li>
              <li>• 支持 CORS 跨域请求</li>
              <li>• 具有标准的 API 端点</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">常见问题解决</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <div>
                <strong>1. CORS 跨域问题</strong>
                <p className="ml-4">如果是自己部署的实例，需要在服务器配置中允许扩展的跨域访问</p>
              </div>
              <div>
                <strong>2. API 端点不存在</strong>
                <p className="ml-4">确保网站是基于 NavSphere 项目搭建，并且包含必要的 API 路由</p>
              </div>
              <div>
                <strong>3. 网络连接问题</strong>
                <p className="ml-4">检查网络连接，确保目标网站可以正常访问</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">URL 示例</h4>
            <div className="text-sm font-mono bg-gray-100 p-2 rounded">
              <div>✅ https://your-navsphere.vercel.app</div>
              <div>✅ https://navsphere.example.com</div>
              <div>❌ https://github.com/user/navsphere</div>
              <div>❌ http://localhost:3000 (本地开发)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 认证设置标签页
function AuthTab({
  instances,
  onInstancesChange
}: {
  instances: NavSphereInstance[]
  onInstancesChange: (instances: NavSphereInstance[]) => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [githubClientId, setGithubClientId] = useState('')
  const [selectedInstance, setSelectedInstance] = useState('')

  async function handleConfigureOAuth() {
    if (!selectedInstance || !githubClientId) return

    setLoading('configuring')
    try {
      const { configureGitHubOAuth } = await import('@/lib/github-auth')
      await configureGitHubOAuth(selectedInstance, githubClientId)

      const updatedInstances = await StorageManager.getInstances()
      onInstancesChange(updatedInstances)

      setGithubClientId('')
      setSelectedInstance('')
    } catch (error) {
      console.error('OAuth配置失败:', error)
      alert('OAuth配置失败，请检查设置')
    } finally {
      setLoading(null)
    }
  }

  async function handleAuthenticate(instanceId: string) {
    setLoading(instanceId)
    try {
      const { authenticateGitHub } = await import('@/lib/github-auth')
      await authenticateGitHub(instanceId)

      const updatedInstances = await StorageManager.getInstances()
      onInstancesChange(updatedInstances)
    } catch (error) {
      console.error('GitHub认证失败:', error)
      alert('GitHub认证失败，请重试')
    } finally {
      setLoading(null)
    }
  }

  async function handleLogout(instanceId: string) {
    setLoading(instanceId)
    try {
      const { logoutGitHub } = await import('@/lib/github-auth')
      await logoutGitHub(instanceId)

      const updatedInstances = await StorageManager.getInstances()
      onInstancesChange(updatedInstances)
    } catch (error) {
      console.error('注销失败:', error)
      alert('注销失败，请重试')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">认证设置</h2>
        <p className="text-muted-foreground">
          管理您的 GitHub OAuth 认证设置，用于书签同步功能
        </p>
      </div>

      {/* GitHub OAuth 配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub OAuth 配置
          </CardTitle>
          <CardDescription>
            为实例配置 GitHub OAuth，需要在 GitHub 上创建 OAuth App
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instance-select">选择实例</Label>
            <select
              id="instance-select"
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="">请选择实例</option>
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="github-client-id">GitHub Client ID</Label>
            <Input
              id="github-client-id"
              value={githubClientId}
              onChange={(e) => setGithubClientId(e.target.value)}
              placeholder="输入您的 GitHub OAuth App Client ID"
            />
            <p className="text-xs text-muted-foreground mt-1">
              在 GitHub Settings → Developer settings → OAuth Apps 中创建应用获取
            </p>
          </div>

          <Button
            onClick={handleConfigureOAuth}
            disabled={!selectedInstance || !githubClientId || loading === 'configuring'}
          >
            {loading === 'configuring' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Key className="w-4 h-4 mr-2" />
            )}
            配置 OAuth
          </Button>
        </CardContent>
      </Card>

      {/* 实例认证状态 */}
      <Card>
        <CardHeader>
          <CardTitle>实例认证状态</CardTitle>
          <CardDescription>
            查看和管理各实例的 GitHub 认证状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <p className="text-muted-foreground">请先添加实例</p>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${instance.authConfig.isAuthenticated ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    <div>
                      <h4 className="font-medium">{instance.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {instance.authConfig.githubClientId ? (
                          <>
                            <span>Client ID: {instance.authConfig.githubClientId.slice(0, 8)}...</span>
                            {instance.authConfig.userInfo && (
                              <span className="ml-4">
                                用户: {instance.authConfig.userInfo.login}
                              </span>
                            )}
                          </>
                        ) : (
                          '未配置 OAuth'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {instance.authConfig.githubClientId ? (
                      <>
                        {instance.authConfig.isAuthenticated ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogout(instance.id)}
                            disabled={loading === instance.id}
                          >
                            {loading === instance.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              '注销'
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAuthenticate(instance.id)}
                            disabled={loading === instance.id}
                          >
                            {loading === instance.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Github className="w-4 h-4 mr-2" />
                            )}
                            认证
                          </Button>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">请先配置 OAuth</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle>设置说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. 创建 GitHub OAuth App</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 访问 GitHub Settings → Developer settings → OAuth Apps</li>
              <li>• 点击 "New OAuth App" 创建新应用</li>
              <li>• Application name: 填写应用名称（如：NavSphere Extension）</li>
              <li>• Homepage URL: 填写您的主页或仓库地址</li>
              <li>• Authorization callback URL: {chrome.identity.getRedirectURL()}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. 配置 Client ID</h4>
            <p className="text-sm text-muted-foreground">
              创建完成后，复制 Client ID 并在上方表单中配置
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. 进行认证</h4>
            <p className="text-sm text-muted-foreground">
              配置完成后，点击 "认证" 按钮完成 GitHub OAuth 认证流程
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 书签同步标签页
function SyncTab({
  settings,
  onSettingsChange
}: {
  settings: ExtensionSettings | null
  onSettingsChange: (settings: ExtensionSettings) => void
}) {
  const [instances, setInstances] = useState<NavSphereInstance[]>([])
  const [loading, setLoading] = useState(false)
  const [syncProgress, setSyncProgress] = useState<any>(null)
  const [lastSyncResult, setLastSyncResult] = useState<any>(null)
  const [bookmarkFolders, setBookmarkFolders] = useState<any[]>([])
  const [hasBookmarkPermission, setHasBookmarkPermission] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [instanceList, hasPermission] = await Promise.all([
        StorageManager.getInstances(),
        checkBookmarkPermission()
      ])

      setInstances(instanceList)
      setHasBookmarkPermission(hasPermission)

      if (hasPermission) {
        const folders = await getBookmarkFolders()
        setBookmarkFolders(folders.filter(f => f.title && f.title !== ''))
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  async function handleRequestPermission() {
    const { requestBookmarkPermission } = await import('@/lib/bookmark-sync')
    const granted = await requestBookmarkPermission()
    if (granted) {
      setHasBookmarkPermission(true)
      loadData()
    }
  }

  async function handleToggleSync(enabled: boolean) {
    if (!settings) return

    const updated = {
      ...settings,
      syncSettings: {
        ...settings.syncSettings,
        enabled
      }
    }

    await StorageManager.setSettings(updated)
    onSettingsChange(updated)
  }

  async function handleUpdateSyncSettings(updates: any) {
    if (!settings) return

    const updated = {
      ...settings,
      syncSettings: {
        ...settings.syncSettings,
        ...updates
      }
    }

    await StorageManager.setSettings(updated)
    onSettingsChange(updated)
  }

  async function handleManualSync(instanceId: string) {
    setLoading(true)
    setSyncProgress(null)
    setLastSyncResult(null)

    try {
      const { BookmarkSyncManager } = await import('@/lib/bookmark-sync')
      const syncManager = new BookmarkSyncManager((progress) => {
        setSyncProgress(progress)
      })

      const result = await syncManager.syncBookmarks(instanceId)
      setLastSyncResult(result)
    } catch (error) {
      setLastSyncResult({
        success: false,
        message: error instanceof Error ? error.message : '同步失败',
        stats: { totalProcessed: 0, newBookmarks: 0, duplicatesSkipped: 0, errors: 1 }
      })
    } finally {
      setLoading(false)
      setSyncProgress(null)
    }
  }

  const { checkBookmarkPermission, getBookmarkFolders } = React.useMemo(() => {
    return {
      checkBookmarkPermission: async () => {
        try {
          const { checkBookmarkPermission } = await import('@/lib/bookmark-sync')
          return await checkBookmarkPermission()
        } catch {
          return false
        }
      },
      getBookmarkFolders: async () => {
        try {
          const { getBookmarkFolders } = await import('@/lib/bookmark-sync')
          return await getBookmarkFolders()
        } catch {
          return []
        }
      }
    }
  }, [])

  if (!hasBookmarkPermission) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">书签同步</h2>
          <p className="text-muted-foreground">
            配置浏览器书签同步设置
          </p>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">需要书签访问权限</h3>
            <p className="text-muted-foreground mb-4">
              扩展需要访问您的书签才能进行同步操作
            </p>
            <Button onClick={handleRequestPermission}>
              <Key className="w-4 h-4 mr-2" />
              授权访问书签
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">书签同步</h2>
        <p className="text-muted-foreground">
          将浏览器书签同步到 NavSphere 实例，只会添加新书签，不会删除服务器上的数据
        </p>
      </div>

      {/* 同步开关 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sync className="w-5 h-5" />
            同步设置
          </CardTitle>
          <CardDescription>
            启用书签同步功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">启用书签同步</h4>
              <p className="text-sm text-muted-foreground">
                开启后可以同步浏览器书签到 NavSphere
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.syncSettings.enabled || false}
                onChange={(e) => handleToggleSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings?.syncSettings.enabled && (
            <>
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-2">自动同步</h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.syncSettings.autoSync}
                        onChange={(e) => handleUpdateSyncSettings({ autoSync: e.target.checked })}
                      />
                      <span className="text-sm">启用自动同步</span>
                    </label>

                    {settings.syncSettings.autoSync && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sync-interval" className="text-sm">间隔:</Label>
                        <select
                          id="sync-interval"
                          value={settings.syncSettings.interval}
                          onChange={(e) => handleUpdateSyncSettings({ interval: parseInt(e.target.value) })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value={1800000}>30分钟</option>
                          <option value={3600000}>1小时</option>
                          <option value={7200000}>2小时</option>
                          <option value={21600000}>6小时</option>
                          <option value={43200000}>12小时</option>
                          <option value={86400000}>24小时</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">排除文件夹</h4>
                  <div className="space-y-2">
                    {['其他书签', 'Mobile Bookmarks', '最近添加的书签'].map(folder => (
                      <label key={folder} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.syncSettings.excludedFolders.includes(folder)}
                          onChange={(e) => {
                            const excludedFolders = e.target.checked
                              ? [...settings.syncSettings.excludedFolders, folder]
                              : settings.syncSettings.excludedFolders.filter(f => f !== folder)
                            handleUpdateSyncSettings({ excludedFolders })
                          }}
                        />
                        <span className="text-sm">{folder}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 手动同步 */}
      {settings?.syncSettings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>手动同步</CardTitle>
            <CardDescription>
              立即同步书签到选定的 NavSphere 实例
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instances.length === 0 ? (
              <p className="text-muted-foreground">请先添加并认证 NavSphere 实例</p>
            ) : (
              <>
                {instances.map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${instance.authConfig.isAuthenticated ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      <div>
                        <h4 className="font-medium">{instance.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {instance.authConfig.isAuthenticated ? '已认证' : '未认证'}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleManualSync(instance.id)}
                      disabled={!instance.authConfig.isAuthenticated || loading}
                      size="sm"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sync className="w-4 h-4 mr-2" />
                      )}
                      同步
                    </Button>
                  </div>
                ))}

                {/* 同步进度 */}
                {syncProgress && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{syncProgress.message}</span>
                      <span className="text-sm text-muted-foreground">
                        {syncProgress.current}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${syncProgress.current}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 同步结果 */}
                {lastSyncResult && (
                  <div className={`p-4 rounded-lg ${lastSyncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    } border`}>
                    <div className="flex items-center gap-2 mb-2">
                      {lastSyncResult.success ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${lastSyncResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                        {lastSyncResult.message}
                      </span>
                    </div>

                    {lastSyncResult.success && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• 处理书签: {lastSyncResult.stats.totalProcessed} 个</p>
                        <p>• 新增书签: {lastSyncResult.stats.newBookmarks} 个</p>
                        <p>• 跳过重复: {lastSyncResult.stats.duplicatesSkipped} 个</p>
                        {lastSyncResult.stats.errors > 0 && (
                          <p>• 错误: {lastSyncResult.stats.errors} 个</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 同步状态 */}
      {settings?.syncSettings.enabled && settings.syncSettings.lastSyncTime > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>同步历史</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              上次同步时间: {new Date(settings.syncSettings.lastSyncTime).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 通用设置标签页
function SettingsTab({
  settings,
  instances,
  onSettingsChange
}: {
  settings: ExtensionSettings | null
  instances: NavSphereInstance[]
  onSettingsChange: (settings: ExtensionSettings) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">通用设置</h2>
        <p className="text-muted-foreground">
          配置扩展的通用设置
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>默认实例</CardTitle>
          <CardDescription>
            选择快速添加时使用的默认实例
          </CardDescription>
        </CardHeader>
        <CardContent>
          {instances.length > 0 ? (
            <div className="space-y-2">
              {instances.map((instance) => (
                <div key={instance.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`default-${instance.id}`}
                    name="defaultInstance"
                    checked={settings?.defaultInstanceId === instance.id}
                    onChange={async () => {
                      if (settings) {
                        const updated = { ...settings, defaultInstanceId: instance.id }
                        await StorageManager.setSettings(updated)
                        onSettingsChange(updated)
                      }
                    }}
                  />
                  <label htmlFor={`default-${instance.id}`} className="flex-1">
                    {instance.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">请先添加实例</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}