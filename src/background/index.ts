import { StorageManager } from '@/lib/storage'
import type { PageInfo, NavSphereInstance } from '@/types'
import { getFaviconUrl } from '@/lib/utils'
import { checkAuthStatus } from '@/lib/github-auth'

// 初始化扩展
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // 首次安装时的初始化
    console.log('NavSphere Extension installed')
    
    // 初始化默认实例
    await StorageManager.initializeDefaultInstance()
    
    // 创建右键菜单
    createContextMenus()
    
    // 打开欢迎页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/index.html?tab=welcome')
    })
  } else if (details.reason === 'update') {
    // 更新时的处理
    console.log('NavSphere Extension updated')
    
    // 确保默认实例存在（用于从旧版本升级的用户）
    await StorageManager.initializeDefaultInstance()
    
    createContextMenus()
  }
})

// 创建右键菜单
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'add-to-navsphere',
      title: '添加到 NavSphere',
      contexts: ['page', 'link', 'selection'],
    })

    chrome.contextMenus.create({
      id: 'add-link-to-navsphere',
      title: '添加链接到 NavSphere',
      contexts: ['link'],
    })
  })
}

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  const instances = await StorageManager.getInstances()
  if (instances.length === 0) {
    // 没有配置实例，打开设置页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/index.html?tab=instances')
    })
    return
  }

  const pageInfo: PageInfo = {
    title: tab.title || '',
    url: info.linkUrl || tab.url || '',
    description: '',
    favicon: tab.favIconUrl || getFaviconUrl(tab.url || ''),
    selectedText: info.selectionText,
  }

  // 打开快速添加弹窗
  openQuickAddPopup(pageInfo)
})

// 处理快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-add') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    const pageInfo: PageInfo = {
      title: tab.title || '',
      url: tab.url || '',
      description: '',
      favicon: tab.favIconUrl || getFaviconUrl(tab.url || ''),
    }

    openQuickAddPopup(pageInfo)
  }
})

// 打开快速添加弹窗
async function openQuickAddPopup(pageInfo: PageInfo) {
  const instances = await StorageManager.getInstances()
  const settings = await StorageManager.getSettings()
  
  const defaultInstance = instances.find(i => i.id === settings.defaultInstanceId) || instances[0]
  
  if (!defaultInstance) {
    // 没有可用实例
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/index.html?tab=instances')
    })
    return
  }

  // 存储待添加的页面信息
  await chrome.storage.session.set({
    quickAddData: {
      pageInfo,
      instanceId: defaultInstance.id,
    }
  })

  // 打开弹窗
  chrome.action.openPopup()
}

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_INFO':
      handleGetPageInfo(sender.tab, sendResponse)
      break
    case 'QUICK_ADD':
      handleQuickAdd(message.data, sendResponse)
      break
    case 'CHECK_INSTANCE':
      handleCheckInstance(message.url, sendResponse)
      break
    case 'CHECK_AUTH_STATUS':
      handleCheckAuthStatus(message.instanceId, sendResponse)
      break
    case 'VALIDATE_TOKEN':
      handleValidateToken(message.instanceId, sendResponse)
      break
    case 'MANUAL_SYNC':
      handleManualSync(message.instanceId, sendResponse)
      break
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
  
  return true // 保持消息通道开放
})

async function handleGetPageInfo(tab: chrome.tabs.Tab | undefined, sendResponse: (response: any) => void) {
  if (!tab) {
    sendResponse({ success: false, error: 'No active tab' })
    return
  }

  const pageInfo: PageInfo = {
    title: tab.title || '',
    url: tab.url || '',
    description: '', // 将从内容脚本获取
    favicon: tab.favIconUrl || getFaviconUrl(tab.url || ''),
  }

  sendResponse({ success: true, data: pageInfo })
}

async function handleQuickAdd(data: any, sendResponse: (response: any) => void) {
  try {
    // 这里实现快速添加逻辑
    // 实际添加到 NavSphere 的逻辑将在后续实现
    console.log('Quick add data:', data)
    sendResponse({ success: true })
  } catch (error) {
    console.error('Failed to quick add:', error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

async function handleCheckInstance(url: string, sendResponse: (response: any) => void) {
  try {
    const healthUrl = url.endsWith('/') ? `${url}api/health` : `${url}/api/health`
    const response = await fetch(healthUrl)
    const data = await response.json()
    const isNavSphere = data.service === 'NavSphere'
    
    sendResponse({ success: true, isNavSphere })
  } catch (error) {
    sendResponse({ success: false, error: (error as Error).message })
  }
}

async function handleCheckAuthStatus(instanceId: string, sendResponse: (response: any) => void) {
  try {
    const isAuthenticated = await checkAuthStatus(instanceId)
    sendResponse({ success: true, isAuthenticated })
  } catch (error) {
    console.error('检查认证状态失败:', error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

async function handleValidateToken(instanceId: string, sendResponse: (response: any) => void) {
  try {
    const instances = await StorageManager.getInstances()
    const instance = instances.find(i => i.id === instanceId)
    
    if (!instance || !instance.authConfig.accessToken) {
      sendResponse({ success: false, error: '实例未认证' })
      return
    }

    // 检查令牌是否即将过期（提前1天检查）
    const oneDayInMs = 24 * 60 * 60 * 1000
    const willExpireSoon = instance.authConfig.tokenExpiry && 
                          (Date.now() + oneDayInMs) > instance.authConfig.tokenExpiry

    if (willExpireSoon) {
      // 令牌即将过期，需要重新认证
      await StorageManager.updateInstance(instanceId, {
        authConfig: {
          ...instance.authConfig,
          isAuthenticated: false
        }
      })
      sendResponse({ success: false, error: '访问令牌即将过期，请重新认证' })
      return
    }

    const isValid = await checkAuthStatus(instanceId)
    if (!isValid) {
      // 令牌无效，清除认证状态
      await StorageManager.updateInstance(instanceId, {
        authConfig: {
          ...instance.authConfig,
          isAuthenticated: false,
          accessToken: undefined,
          userInfo: undefined
        }
      })
    }

    sendResponse({ success: true, isValid })
  } catch (error) {
    console.error('验证令牌失败:', error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

async function handleManualSync(instanceId: string, sendResponse: (response: any) => void) {
  try {
    const { BookmarkSyncManager } = await import('@/lib/bookmark-sync')
    const syncManager = new BookmarkSyncManager()
    const result = await syncManager.syncBookmarks(instanceId)
    
    sendResponse({ success: true, result })
  } catch (error) {
    console.error('手动同步失败:', error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// 定期同步书签（如果启用）
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'bookmark-sync') {
    const settings = await StorageManager.getSettings()
    if (settings.syncSettings.enabled && settings.syncSettings.autoSync) {
      console.log('开始执行定期书签同步')
      
      try {
        // 获取默认实例或第一个已认证的实例
        const instances = await StorageManager.getInstances()
        const authenticatedInstances = instances.filter(i => i.authConfig.isAuthenticated)
        
        if (authenticatedInstances.length === 0) {
          console.log('没有已认证的实例，跳过自动同步')
          return
        }

        const targetInstance = instances.find(i => i.id === settings.defaultInstanceId) 
                              || authenticatedInstances[0]

        // 执行同步
        const { BookmarkSyncManager } = await import('@/lib/bookmark-sync')
        const syncManager = new BookmarkSyncManager()
        const result = await syncManager.syncBookmarks(targetInstance.id)
        
        console.log('自动同步完成:', result)

        // 可以选择发送通知
        if (result.success && result.stats.newBookmarks > 0) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'NavSphere 书签同步',
            message: `成功同步 ${result.stats.newBookmarks} 个新书签`
          })
        }

      } catch (error) {
        console.error('自动同步失败:', error)
      }
    }
  }
})

// 设置定期同步闹钟
async function setupSyncAlarm() {
  const settings = await StorageManager.getSettings()
  
  // 清除现有闹钟
  chrome.alarms.clear('bookmark-sync')
  
  if (settings.syncSettings.enabled && settings.syncSettings.autoSync) {
    // 创建新的定期闹钟
    chrome.alarms.create('bookmark-sync', {
      delayInMinutes: settings.syncSettings.interval / (1000 * 60),
      periodInMinutes: settings.syncSettings.interval / (1000 * 60),
    })
  }
}

// 监听存储变化，更新同步设置
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.navsphere_settings) {
    setupSyncAlarm()
  }
})

// 初始化同步设置
setupSyncAlarm()