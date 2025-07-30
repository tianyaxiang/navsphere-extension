import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StorageManager } from '@/lib/storage'
import { NavSphereAPI } from '@/lib/api'
import type { NavSphereInstance, NavigationData, PageInfo, QuickAddData } from '@/types'
import { Settings, Plus, ExternalLink, Loader2, Check, X } from 'lucide-react'

export default function PopupApp() {
  const [instances, setInstances] = useState<NavSphereInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<NavSphereInstance | null>(null)
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null)
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string>('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    initializePopup()
  }, [])

  async function initializePopup() {
    try {
      // 获取实例列表
      const instanceList = await StorageManager.getInstances()
      setInstances(instanceList)

      if (instanceList.length === 0) {
        // 没有配置实例，显示设置提示
        return
      }

      // 获取默认实例
      const settings = await StorageManager.getSettings()
      const defaultInstance = instanceList.find(i => i.id === settings.defaultInstanceId) || instanceList[0]
      setSelectedInstance(defaultInstance)

      // 获取快速添加数据
      const result = await chrome.storage.session.get('quickAddData')
      const quickAddData = result.quickAddData as QuickAddData
      console.log('快速添加数据:', quickAddData)
      
      if (quickAddData?.pageInfo) {
        console.log('使用快速添加数据')
        setPageInfo(quickAddData.pageInfo)
        setCustomTitle(quickAddData.pageInfo.title)
        setCustomDescription(quickAddData.pageInfo.description || '')
        console.log('设置的页面信息:', quickAddData.pageInfo)
      } else {
        // 没有快速添加数据，获取当前页面信息
        console.log('获取当前页面信息')
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        console.log('当前标签页:', tab)
        if (tab) {
          const pageInfo = {
            title: tab.title || '',
            url: tab.url || '',
            description: '',
            favicon: tab.favIconUrl || '',
          }
          console.log('设置的页面信息:', pageInfo)
          setPageInfo(pageInfo)
          setCustomTitle(tab.title || '')
        }
      }

      // 获取导航数据
      await loadNavigationData(defaultInstance)
      setInitialized(true)
      console.log('初始化完成')
    } catch (err) {
      console.error('Failed to initialize popup:', err)
      setError('初始化失败')
    }
  }

  async function loadNavigationData(instance: NavSphereInstance) {
    try {
      const api = new NavSphereAPI(instance)
      const data = await api.getNavigationData()
      setNavigationData(data)
      
      // 设置默认分类
      if (data.navigationItems.length > 0 && !selectedCategoryId) {
        handleCategorySelect(data.navigationItems[0].id, data)
      }
    } catch (err) {
      console.error('Failed to load navigation data:', err)
      // 如果是认证相关错误，提示用户去设置页面认证
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
        setError('需要认证，请先在设置页面完成GitHub登录')
      } else {
        setError('加载导航数据失败，请检查网络连接或实例配置')
      }
    }
  }

  async function handleQuickAdd() {
    if (!selectedInstance || !pageInfo || !selectedCategoryId) {
      setError('请选择分类')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('开始添加书签')
      console.log('选中实例:', selectedInstance)
      console.log('页面信息:', pageInfo)
      console.log('选中分类ID:', selectedCategoryId)
      
      const bookmarkData = {
        title: (customTitle && customTitle.trim()) || pageInfo.title,
        href: pageInfo.url,
        description: (customDescription && customDescription.trim()) || pageInfo.description || '',
        icon: pageInfo.favicon,
      }
      console.log('书签数据:', bookmarkData)
      console.log('customTitle:', customTitle)
      console.log('customDescription:', customDescription)
      console.log('pageInfo:', pageInfo)
      
      const api = new NavSphereAPI(selectedInstance)
      console.log('调用API添加书签...')
      await api.addNavigationItem(selectedCategoryId, bookmarkData)
      console.log('API调用成功')

      setSuccess(true)
      
      // 清除会话数据
      chrome.storage.session.remove('quickAddData')
      
      // 2秒后关闭弹窗
      setTimeout(() => {
        window.close()
      }, 2000)
    } catch (err) {
      console.error('Failed to add item:', err)
      // 如果是认证相关错误，提示用户去设置页面认证
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
        setError('需要认证，请先在设置页面完成GitHub登录')
      } else {
        setError('添加失败，请检查网络连接或实例配置')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleCategorySelect(categoryId: string, navigationData: NavigationData) {
    setSelectedCategoryId(categoryId)
    
    // 查找分类路径
    let categoryPath = ''
    for (const category of navigationData.navigationItems) {
      if (category.id === categoryId) {
        categoryPath = category.title
        break
      }
      
      if (category.subCategories) {
        for (const subCategory of category.subCategories) {
          if (subCategory.id === categoryId) {
            categoryPath = `${category.title} > ${subCategory.title}`
            break
          }
        }
      }
      
      if (categoryPath) break
    }
    
    setSelectedCategoryPath(categoryPath)
  }

  function openOptionsPage() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/index.html')
    })
    window.close()
  }

  if (success) {
    return (
      <div className="extension-popup flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">添加成功</h3>
            <p className="text-sm text-green-600">链接已添加到 NavSphere</p>
          </div>
        </div>
      </div>
    )
  }

  // 根据实例状态显示不同界面
  if (instances.length === 0) {
    return (
      <div className="extension-popup p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">欢迎使用 NavSphere 扩展</CardTitle>
            <CardDescription>
              您还没有配置任何 NavSphere 实例
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openOptionsPage} className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              配置实例
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 主界面 - 显示添加书签功能
  return (
    <div className="extension-popup p-6 space-y-6">
      {/* 页面信息 */}
      {pageInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {pageInfo.favicon && (
                <img src={pageInfo.favicon} alt="" className="w-4 h-4" />
              )}
              添加到 NavSphere
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="请输入标题"
              />
            </div>
            
            <div>
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="请输入描述"
              />
            </div>

            <div>
              <Label htmlFor="url">链接</Label>
              <Input
                id="url"
                value={pageInfo.url}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* 分类选择 */}
            {navigationData ? (
              <div>
                <Label>选择分类</Label>
                {selectedCategoryPath && (
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    当前选择: {selectedCategoryPath}
                  </p>
                )}
                <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {navigationData.navigationItems.map((category) => (
                    <div key={category.id}>
                      {/* 一级分类 */}
                      <div
                        onClick={() => handleCategorySelect(category.id, navigationData)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedCategoryId === category.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.title}</span>
                        </div>
                        {category.description && (
                          <p className="text-xs opacity-80 mt-1">{category.description}</p>
                        )}
                      </div>
                      
                      {/* 二级分类 */}
                      {category.subCategories && category.subCategories.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {category.subCategories.map((subCategory) => (
                            <div
                              key={subCategory.id}
                              onClick={() => handleCategorySelect(subCategory.id, navigationData)}
                              className={`p-2 rounded-md cursor-pointer transition-colors text-sm ${
                                selectedCategoryId === subCategory.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-accent/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">├─</span>
                                <span>{subCategory.title}</span>
                              </div>
                              {subCategory.description && (
                                <p className="text-xs opacity-70 mt-1 ml-4">{subCategory.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">无法加载分类数据</span>
                </div>
                <p className="text-xs text-yellow-700 mb-3">
                  可能原因：实例需要认证或网络连接问题
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={openOptionsPage}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  去设置页面配置
                </Button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleQuickAdd}
                disabled={loading || !selectedCategoryId}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {loading ? '添加中...' : '添加'}
              </Button>
              
              <Button
                variant="outline"
                onClick={openOptionsPage}
                size="icon"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 实例信息 */}
      {selectedInstance && (
        <div className="text-xs text-muted-foreground text-center">
          添加到: {selectedInstance.name}
        </div>
      )}
    </div>
  )
}