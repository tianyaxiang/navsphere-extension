import { useState, useEffect } from 'react'
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
  Loader2,
  Check,
  X,
  ExternalLink,
  Home,
  Server
} from 'lucide-react'

type TabType = 'welcome' | 'instances' | 'settings'

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
          一个强大的浏览器书签管理工具，让您的导航体验更加便捷高效
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
              支持 Chrome、Edge 等主流浏览器
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
                  <h4 className="font-semibold">个性化设置</h4>
                  <p className="text-sm text-muted-foreground">
                    在"通用设置"页面调整扩展的行为和外观
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
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
                disabled={loading || !newInstance.name || !newInstance.url || (validationResult !== null && !validationResult.isValid)}
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
                    <div className="instance-status online" />
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