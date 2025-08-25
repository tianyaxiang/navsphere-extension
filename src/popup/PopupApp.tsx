import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StorageManager } from '@/lib/storage'
import { NavSphereAPI } from '@/lib/api'
import { getCurrentActiveInstance } from '@/lib/utils'
import type { NavSphereInstance, NavigationData, PageInfo, QuickAddData } from '@/types'
import { Settings, Plus, ExternalLink, Loader2, Check, X } from 'lucide-react'

// 默认图标 - 一个简单的用户头像SVG
const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNOCA0QzYuMzQzMTUgNCA1IDUuMzQzMTUgNSA3QzUgOC42NTY4NSA2LjM0MzE1IDEwIDggMTBDOS42NTY4NSAxMCAxMSA4LjY1Njg1IDExIDdDMTEgNS4zNDMxNSA5LjY1Njg1IDQgOCA0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTggMTJDNi4zNDMxNSAxMiA1IDEzLjM0MzEgNSAxNUg5SDExQzExIDEzLjM0MzEgOS42NTY4NSAxMiA4IDEyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'

export default function PopupApp() {
  const [instances, setInstances] = useState<NavSphereInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<NavSphereInstance | null>(null)
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null)
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('')
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string>('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [customIcon, setCustomIcon] = useState('')
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [isRestoredSelection, setIsRestoredSelection] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)

  useEffect(() => {
    initializePopup()
  }, [])

  // 通过API获取网站元数据
  async function fetchMetadataFromAPI(url: string, instance: NavSphereInstance, fallbackFavicon?: string) {
    console.log('fetchMetadataFromAPI 被调用:', { url, instance: instance.name, isAuthenticated: instance.authConfig?.isAuthenticated, fallbackFavicon })

    // 验证URL
    if (!url || !url.trim()) {
      console.error('URL为空，无法调用API')
      return
    }

    // 验证URL格式
    try {
      const urlObj = new URL(url)
      // 检查是否为特殊协议页面
      if (['chrome:', 'chrome-extension:', 'about:', 'moz-extension:', 'edge:', 'safari-extension:'].some(protocol => urlObj.protocol.startsWith(protocol.replace(':', '')))) {
        console.log('跳过特殊协议页面:', url)
        if (fallbackFavicon) {
          setMetadataLoading(true)
          setTimeout(() => {
            setCustomIcon(fallbackFavicon)
            setMetadataLoading(false)
          }, 200)
        }
        return
      }
    } catch (error) {
      console.error('URL格式无效:', url, error)
      return
    }

    setMetadataLoading(true)
    try {
      console.log('通过API获取网站元数据:', url)

      // 尝试通过内容脚本获取元数据
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab && tab.id) {
        try {
          // 调用内容脚本中的fetchWebsiteMetadata函数
          const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'FETCH_WEBSITE_METADATA',
            url: url
          })

          if (response && response.success) {
            const metadata = response.data
            console.log('API返回的元数据:', metadata)

            // 更新描述和图标
            if (metadata.description) {
              setCustomDescription(metadata.description)
            }
            if (metadata.icon) {
              setCustomIcon(metadata.icon)
            }
            return
          }
        } catch (error) {
          console.log('通过内容脚本获取元数据失败，尝试直接API调用:', error)
        }
      }

      // 如果内容脚本方式失败，直接调用API
      const response = await fetch(`${instance.apiUrl}/api/website-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${instance.authConfig?.accessToken}`,
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const metadata = await response.json()
      console.log('API返回的元数据:', metadata)

      // 更新描述和图标
      if (metadata.description) {
        setCustomDescription(metadata.description)
      }
      if (metadata.icon) {
        setCustomIcon(metadata.icon)
      }
    } catch (error) {
      console.error('API获取元数据失败:', error)

      // 如果是认证相关错误，设置错误提示
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        setError('获取网站元数据失败：需要认证，请先在设置页面完成GitHub登录')
      } else if (!instance.authConfig?.isAuthenticated) {
        setError('获取网站元数据失败：实例未认证，请先在设置页面完成GitHub登录')
      } else {
        setError('获取网站元数据失败，请检查网络连接或实例配置')
      }

      // API失败时使用页面的默认favicon作为备用
      if (fallbackFavicon) {
        console.log('API失败，使用页面默认favicon:', fallbackFavicon)
        setCustomIcon(fallbackFavicon)
      } else {
        console.log('API失败且无页面favicon，使用默认图标')
        // 使用一个默认的图标URL，避免提交空值
        setCustomIcon(DEFAULT_ICON)
      }
    } finally {
      console.log('fetchMetadataFromAPI 完成，设置 metadataLoading = false')
      setMetadataLoading(false)
    }
  }

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
      const defaultInstance = await getCurrentActiveInstance()
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
        setCustomIcon('') // 不设置默认值，等待API返回
        // 通过API获取描述和图标
        if (quickAddData.pageInfo.url) {
          await fetchMetadataFromAPI(quickAddData.pageInfo.url, defaultInstance, quickAddData.pageInfo.favicon)
        } else {
          console.log('快速添加数据中无URL，跳过API调用')
          if (quickAddData.pageInfo.favicon) {
            setCustomIcon(quickAddData.pageInfo.favicon)
          } else {
            // 使用默认图标
            setCustomIcon(DEFAULT_ICON)
          }
        }
        console.log('设置的页面信息:', quickAddData.pageInfo)
      } else {
        // 没有快速添加数据，获取当前页面信息
        console.log('获取当前页面信息')
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        console.log('当前标签页:', tab)

        if (!tab) {
          console.error('无法获取当前标签页')
          setError('无法获取当前页面信息')
          return
        }

        if (!tab.url) {
          console.error('无法获取当前页面URL')
          setError('无法获取当前页面URL')
          return
        }

        console.log('当前页面URL:', tab.url)

        if (tab && tab.id) {
          try {
            // 通过内容脚本获取页面元数据（包括描述信息）
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_METADATA' })
            if (response && response.success) {
              console.log('从内容脚本获取的页面信息:', response.data)
              setPageInfo(response.data)
              setCustomTitle(response.data.title || '')
              setCustomDescription(response.data.description || '')
              setCustomIcon('') // 不设置默认值，等待API返回
              // 通过API获取描述和图标
              await fetchMetadataFromAPI(response.data.url, defaultInstance, response.data.favicon || '')
            } else {
              // 如果内容脚本获取失败，使用标签页基本信息
              const pageInfo = {
                title: tab.title || '',
                url: tab.url || '',
                description: '',
                favicon: tab.favIconUrl || '',
              }
              console.log('使用标签页基本信息:', pageInfo)
              setPageInfo(pageInfo)
              setCustomTitle(tab.title || '')
              setCustomDescription('')
              setCustomIcon('') // 不设置默认值，等待API返回
              // 通过API获取描述和图标
              if (pageInfo.url) {
                await fetchMetadataFromAPI(pageInfo.url, defaultInstance, pageInfo.favicon || '')
              } else {
                console.log('无法获取页面URL，使用默认图标')
                setCustomIcon(DEFAULT_ICON)
              }
            }
          } catch (error) {
            console.log('内容脚本通信失败，使用标签页基本信息:', error)
            // 如果内容脚本通信失败，使用标签页基本信息
            const pageInfo = {
              title: tab.title || '',
              url: tab.url || '',
              description: '',
              favicon: tab.favIconUrl || '',
            }
            setPageInfo(pageInfo)
            setCustomTitle(tab.title || '')
            setCustomDescription('')
            setCustomIcon('') // 不设置默认值，等待API返回
            // 通过API获取描述和图标
            if (pageInfo.url) {
              await fetchMetadataFromAPI(pageInfo.url, defaultInstance, pageInfo.favicon || '')
            } else {
              console.log('无法获取页面URL，使用默认图标')
              setCustomIcon(DEFAULT_ICON)
            }
          }
        }
      }

      // 获取导航数据
      await loadNavigationData(defaultInstance)
      console.log('初始化完成')
    } catch (err) {
      console.error('Failed to initialize popup:', err)
      setError('初始化失败')
    }
  }

  async function loadNavigationData(instance: NavSphereInstance) {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const api = new NavSphereAPI(instance)
      const data = await api.getNavigationData()
      setNavigationData(data)

      // 尝试恢复上次选择的分类
      await restoreLastSelectedCategory(instance.id, data)
    } catch (err) {
      console.error('Failed to load navigation data:', err)
      // 如果是认证相关错误，提示用户去设置页面认证
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
        setCategoriesError('需要认证，请先在设置页面完成GitHub登录')
      } else {
        setCategoriesError('加载导航数据失败，请检查网络连接或实例配置')
      }
    } finally {
      setCategoriesLoading(false)
    }
  }

  // 恢复上次选择的分类
  async function restoreLastSelectedCategory(instanceId: string, navigationData: NavigationData) {
    try {
      // 从存储中获取上次选择的分类和父分类
      const result = await chrome.storage.local.get([
        `lastSelectedCategory_${instanceId}`,
        `lastSelectedParentCategory_${instanceId}`
      ])
      const lastCategoryId = result[`lastSelectedCategory_${instanceId}`]
      const lastParentCategoryId = result[`lastSelectedParentCategory_${instanceId}`]

      if (lastCategoryId && isValidCategoryId(lastCategoryId, navigationData)) {
        // 如果上次选择的分类仍然存在，则选择它
        await handleCategorySelect(lastCategoryId, navigationData, true)
        console.log('恢复上次选择的分类:', lastCategoryId, lastParentCategoryId ? `(父分类: ${lastParentCategoryId})` : '')
      } else if (navigationData.navigationItems.length > 0) {
        // 否则选择第一个分类
        await handleCategorySelect(navigationData.navigationItems[0].id, navigationData, false)
        console.log('选择默认分类:', navigationData.navigationItems[0].id)
      }
    } catch (error) {
      console.error('恢复上次选择的分类失败:', error)
      // 出错时选择第一个分类
      if (navigationData.navigationItems.length > 0) {
        await handleCategorySelect(navigationData.navigationItems[0].id, navigationData, false)
      }
    }
  }

  // 检查分类ID是否仍然有效
  function isValidCategoryId(categoryId: string, navigationData: NavigationData): boolean {
    for (const category of navigationData.navigationItems) {
      if (category.id === categoryId) {
        return true
      }

      if (category.subCategories) {
        for (const subCategory of category.subCategories) {
          if (subCategory.id === categoryId) {
            return true
          }
        }
      }
    }
    return false
  }

  async function handleQuickAdd() {
    if (!selectedInstance || !pageInfo || !selectedCategoryId) {
      setError('请选择分类')
      return
    }

    // 移除认证状态检查，允许未认证的实例提交站点

    // 如果图标为空且不在加载中，使用默认图标
    if ((!customIcon || !customIcon.trim()) && !metadataLoading) {
      console.log('图标为空，使用默认图标')
      setCustomIcon(DEFAULT_ICON)
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🚀 开始添加书签')
      console.log('🏠 选中实例:', selectedInstance.name, selectedInstance.apiUrl)
      console.log('📄 页面信息:', pageInfo)
      console.log('📂 选中分类ID:', selectedCategoryId)
      console.log('🔐 认证状态:', selectedInstance.authConfig.isAuthenticated)

      const bookmarkData = {
        title: (customTitle && customTitle.trim()) || pageInfo.title,
        href: pageInfo.url,
        description: (customDescription && customDescription.trim()) || pageInfo.description || '',
        icon: (customIcon && customIcon.trim()) || pageInfo.favicon || '',
      }

      console.log('📋 最终书签数据:', bookmarkData)
      console.log('📝 表单数据详情:')
      console.log('  - customTitle:', customTitle)
      console.log('  - customDescription:', customDescription)
      console.log('  - customIcon:', customIcon)
      console.log('  - pageInfo:', pageInfo)

      // 最后验证数据完整性
      if (!bookmarkData.title) {
        throw new Error('书签标题不能为空')
      }
      if (!bookmarkData.href) {
        throw new Error('书签链接不能为空')
      }
      if (!bookmarkData.icon) {
        throw new Error('书签图标不能为空')
      }

      const api = new NavSphereAPI(selectedInstance)
      console.log('📡 调用API添加书签...')
      console.log('📂 传递的分类信息:', {
        categoryId: selectedCategoryId,
        subCategoryId: selectedSubCategoryId || undefined
      })
      await api.addNavigationItem(selectedCategoryId, bookmarkData, selectedSubCategoryId || undefined)
      console.log('✅ API调用成功')

      // 保存成功使用的分类作为下次的默认选择
      // 如果选择了二级分类，保存二级分类ID和父分类ID；否则只保存一级分类ID
      try {
        const categoryToSave = selectedSubCategoryId || selectedCategoryId
        const saveData: any = {
          [`lastSelectedCategory_${selectedInstance.id}`]: categoryToSave
        }

        // 如果选择了二级分类，同时保存父分类ID
        if (selectedSubCategoryId) {
          saveData[`lastSelectedParentCategory_${selectedInstance.id}`] = selectedCategoryId
        }

        await chrome.storage.local.set(saveData)
        console.log('保存成功使用的分类:', categoryToSave, selectedSubCategoryId ? `(二级分类: ${selectedSubCategoryId}, 父分类: ${selectedCategoryId})` : '(一级分类)')
      } catch (error) {
        console.error('保存分类选择失败:', error)
      }

      setSuccess(true)

      // 清除会话数据
      chrome.storage.session.remove('quickAddData')

      // 2秒后关闭弹窗
      setTimeout(() => {
        window.close()
      }, 2000)
    } catch (err) {
      console.error('❌ Failed to add item:', err)

      // 详细的错误处理
      if (err instanceof Error) {
        console.error('错误详情:', err.message)

        if (err.message.includes('401') || err.message.includes('403') || err.message.includes('未认证')) {
          setError('需要认证，请先在设置页面完成GitHub登录')
        } else if (err.message.includes('网络') || err.message.includes('Network') || err.message.includes('fetch')) {
          setError('网络连接失败，请检查网络连接和实例配置')
        } else if (err.message.includes('分类ID') || err.message.includes('标题') || err.message.includes('链接')) {
          setError(`数据验证失败：${err.message}`)
        } else {
          setError(`添加失败：${err.message}`)
        }
      } else {
        setError('添加失败，发生未知错误')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCategorySelect(categoryId: string, navigationData: NavigationData, isRestored: boolean = false) {
    setIsRestoredSelection(isRestored)

    // 查找分类信息并设置相应的状态
    let categoryPath = ''
    let parentCategoryId = ''
    let subCategoryId = ''

    for (const category of navigationData.navigationItems) {
      if (category.id === categoryId) {
        // 选择的是一级分类
        categoryPath = category.title
        parentCategoryId = categoryId
        subCategoryId = ''
        break
      }

      if (category.subCategories) {
        for (const subCategory of category.subCategories) {
          if (subCategory.id === categoryId) {
            // 选择的是二级分类
            categoryPath = `${category.title} > ${subCategory.title}`
            parentCategoryId = category.id
            subCategoryId = categoryId
            break
          }
        }
      }

      if (categoryPath) break
    }

    // 设置状态
    setSelectedCategoryId(parentCategoryId)
    setSelectedSubCategoryId(subCategoryId)
    setSelectedCategoryPath(categoryPath)

    console.log('分类选择:', {
      categoryPath,
      parentCategoryId,
      subCategoryId,
      isSubCategory: !!subCategoryId
    })

    // 保存当前选择到存储中（只有在用户主动选择时才保存）
    // 现在支持保存二级分类ID和父分类ID
    if (selectedInstance && !isRestored) {
      try {
        const saveData: any = {
          [`lastSelectedCategory_${selectedInstance.id}`]: categoryId
        }

        // 如果选择了二级分类，同时保存父分类ID
        if (subCategoryId) {
          saveData[`lastSelectedParentCategory_${selectedInstance.id}`] = parentCategoryId
        } else {
          // 如果选择的是一级分类，清除之前保存的父分类ID
          await chrome.storage.local.remove(`lastSelectedParentCategory_${selectedInstance.id}`)
        }

        await chrome.storage.local.set(saveData)
        console.log('保存分类选择:', categoryId, subCategoryId ? `(二级分类: ${subCategoryId}, 父分类: ${parentCategoryId})` : '(一级分类)')
      } catch (error) {
        console.error('保存分类选择失败:', error)
      }
    }
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
      <div className="extension-popup p-6 space-y-4">
        {/* 插件介绍头部 */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">NavSphere 扩展</h1>
          <p className="text-sm text-gray-600">快速书签管理和同步工具</p>
        </div>

        {/* 功能特性 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🚀 核心功能</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">快速添加链接</p>
                <p className="text-xs text-gray-600">右键菜单或快捷键 Ctrl+Shift+A 快速添加当前页面</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">多实例支持</p>
                <p className="text-xs text-gray-600">支持添加和管理多个 NavSphere 实例</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">智能分类</p>
                <p className="text-xs text-gray-600">自动获取页面信息，支持选择或创建分类</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium">书签同步</p>
                <p className="text-xs text-gray-600">同步浏览器书签到 NavSphere 平台</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用指南 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📖 快速开始</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
              <p className="text-sm">配置您的 NavSphere 实例</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">2</div>
              <p className="text-sm">完成 GitHub OAuth 认证</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">3</div>
              <p className="text-sm">开始快速添加书签</p>
            </div>
          </CardContent>
        </Card>

        {/* 技术特性 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🔧 技术特性</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded px-2 py-1 text-center">Manifest V3</div>
              <div className="bg-gray-50 rounded px-2 py-1 text-center">TypeScript</div>
              <div className="bg-gray-50 rounded px-2 py-1 text-center">React</div>
              <div className="bg-gray-50 rounded px-2 py-1 text-center">跨浏览器</div>
            </div>
          </CardContent>
        </Card>

        {/* 配置按钮 */}
        <Card>
          <CardContent className="pt-6">
            <Button onClick={openOptionsPage} className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              开始配置实例
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              配置完成后即可开始使用快速添加功能
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 主界面 - 显示添加书签功能
  return (
    <div className="extension-popup p-6 space-y-6">
      {/* 插件简介头部 */}
      {!pageInfo && (
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">NavSphere 扩展</h2>
          <p className="text-sm text-gray-600">快速添加当前页面到您的导航平台</p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>右键菜单</span>
            <span>•</span>
            <span>Ctrl+Shift+A</span>
            <span>•</span>
            <span>智能分类</span>
          </div>
        </div>
      )}

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
              <Label htmlFor="description">
                描述（可选）
                {metadataLoading && (
                  <span className="ml-2 text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    正在获取...
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder={metadataLoading ? "正在获取描述..." : "请输入描述（自动获取，可编辑）"}
                  className={metadataLoading ? "bg-blue-50 border-blue-200" : ""}
                />
                {metadataLoading && (
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="icon">
                图标地址 <span className="text-red-500">*</span>
                {metadataLoading && (
                  <span className="ml-2 text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    正在获取...
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="icon"
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                  placeholder={metadataLoading ? "正在获取图标..." : "请输入图标URL（等待API获取或手动输入）"}
                  required
                  className={metadataLoading ? "bg-blue-50 border-blue-200" : ""}
                />
                {metadataLoading ? (
                  <div className="flex-shrink-0 w-8 h-8 border-2 border-blue-200 rounded flex items-center justify-center bg-blue-50">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                ) : customIcon ? (
                  <div>
                  </div>
                ) : (
                  <div>
                  </div>
                )}
              </div>
              {metadataLoading && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  正在通过API获取网站图标，请稍候...
                </p>
              )}
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
            <div>
              <Label>选择分类</Label>
              {selectedCategoryPath && (
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <p className="text-xs text-muted-foreground">
                    当前选择: {selectedCategoryPath}
                  </p>
                  {isRestoredSelection && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      记住的选择
                    </span>
                  )}
                </div>
              )}

              {categoriesLoading ? (
                <div className="mt-2 space-y-2">
                  {/* 加载状态提示 */}
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600">加载分类中...</span>
                  </div>

                  {/* 骨架屏效果 */}
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-gray-200 rounded-md"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : categoriesError ? (
                <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">加载分类失败</span>
                  </div>
                  <p className="text-xs text-red-700 mb-3">{categoriesError}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedInstance && loadNavigationData(selectedInstance)}
                      className="flex-1"
                    >
                      重试
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openOptionsPage}
                      className="flex-1"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      设置
                    </Button>
                  </div>
                </div>
              ) : navigationData ? (
                <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {navigationData.navigationItems.map((category) => (
                    <div key={category.id}>
                      {/* 一级分类 */}
                      <div
                        onClick={() => handleCategorySelect(category.id, navigationData, false)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${selectedCategoryId === category.id && !selectedSubCategoryId
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
                              onClick={() => handleCategorySelect(subCategory.id, navigationData, false)}
                              className={`p-2 rounded-md cursor-pointer transition-colors text-sm ${selectedSubCategoryId === subCategory.id
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
              ) : (
                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">暂无分类数据</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    请检查实例配置或网络连接
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedInstance && loadNavigationData(selectedInstance)}
                      className="flex-1"
                    >
                      重新加载
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openOptionsPage}
                      className="flex-1"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      设置
                    </Button>
                  </div>
                </div>
              )}
            </div>

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
                disabled={loading || categoriesLoading || !selectedCategoryId || !!categoriesError || metadataLoading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {loading ? '添加中...' : categoriesLoading ? '加载中...' : '添加'}
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