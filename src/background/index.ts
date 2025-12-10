import { StorageManager } from '@/lib/storage'
import type { PageInfo } from '@/types'
import { getFaviconUrl } from '@/lib/utils'

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
