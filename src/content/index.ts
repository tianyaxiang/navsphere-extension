// 内容脚本 - 在网页中运行，获取页面信息

// 获取页面元数据 - 通过API调用
async function getPageMetadata() {
  const url = window.location.href
  const selectedText = window.getSelection()?.toString() || ''

  try {
    // 首先尝试通过API获取网站元数据
    const metadata = await fetchWebsiteMetadata(url)

    return {
      title: metadata.title || document.title,
      url,
      description: metadata.description || '',
      favicon: metadata.icon || getFallbackFavicon(),
      selectedText,
    }
  } catch (error) {
    console.warn('API获取元数据失败，使用本地方法:', error)

    // API失败时的备用方案 - 使用原来的DOM读取方式
    return getLocalPageMetadata()
  }
}

// 调用网站API获取元数据
async function fetchWebsiteMetadata(url: string) {
  // 获取当前活跃的NavSphere实例
  const instances = await chrome.storage.local.get('instances')
  const settings = await chrome.storage.local.get('settings')

  if (!instances.instances || instances.instances.length === 0) {
    throw new Error('没有配置的NavSphere实例')
  }

  // 获取默认实例或第一个实例
  const defaultInstanceId = settings.settings?.defaultInstanceId
  const targetInstance = instances.instances.find((i: any) => i.id === defaultInstanceId) || instances.instances[0]

  if (!targetInstance.authConfig?.isAuthenticated) {
    throw new Error('实例未认证')
  }

  const response = await fetch(`${targetInstance.apiUrl}/api/website-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${targetInstance.authConfig.accessToken}`,
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
  }

  const metadata = await response.json()
  return metadata
}

// 备用方案：本地获取页面元数据
function getLocalPageMetadata() {
  const title = document.title
  const url = window.location.href

  // 获取页面描述 - 尝试多种方式
  let description = ''

  // 1. 尝试标准的 meta description
  const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement
  if (descriptionMeta?.content) {
    description = descriptionMeta.content.trim()
  }

  // 2. 如果没有找到，尝试 og:description
  if (!description) {
    const ogDescriptionMeta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
    if (ogDescriptionMeta?.content) {
      description = ogDescriptionMeta.content.trim()
    }
  }

  // 3. 如果还没有找到，尝试 twitter:description
  if (!description) {
    const twitterDescriptionMeta = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement
    if (twitterDescriptionMeta?.content) {
      description = twitterDescriptionMeta.content.trim()
    }
  }

  // 4. 如果仍然没有找到，尝试从页面内容中提取
  if (!description) {
    // 尝试获取第一个段落的文本作为描述
    const firstParagraph = document.querySelector('p')
    if (firstParagraph?.textContent) {
      const text = firstParagraph.textContent.trim()
      if (text.length > 20) { // 确保有足够的内容
        description = text.length > 160 ? text.substring(0, 160) + '...' : text
      }
    }
  }

  // 获取选中文本
  const selectedText = window.getSelection()?.toString() || ''

  return {
    title,
    url,
    description,
    favicon: getFallbackFavicon(),
    selectedText,
  }
}

// 获取备用favicon
function getFallbackFavicon(): string {
  // 1. 尝试获取 favicon
  const iconLink = document.querySelector('link[rel*="icon"]') as HTMLLinkElement
  if (iconLink?.href) {
    return iconLink.href
  }

  // 2. 尝试获取 apple-touch-icon
  const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
  if (appleIconLink?.href) {
    return appleIconLink.href
  }

  // 3. 使用默认 favicon 路径
  return `${window.location.origin}/favicon.ico`
}

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_METADATA':
      // 异步处理元数据获取
      getPageMetadata()
        .then(metadata => {
          sendResponse({ success: true, data: metadata })
        })
        .catch(error => {
          console.error('获取页面元数据失败:', error)
          // 即使API失败，也尝试返回基本信息
          const fallbackMetadata = getLocalPageMetadata()
          sendResponse({ success: true, data: fallbackMetadata })
        })
      break

    case 'FETCH_WEBSITE_METADATA':
      // 通过API获取网站元数据
      fetchWebsiteMetadata(message.url)
        .then(metadata => {
          sendResponse({ success: true, data: metadata })
        })
        .catch(error => {
          console.error('API获取网站元数据失败:', error)
          sendResponse({ success: false, error: error.message })
        })
      break

    case 'HIGHLIGHT_ELEMENT':
      // 高亮页面元素（用于调试）
      highlightElement(message.selector)
      sendResponse({ success: true })
      break

    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }

  return true // 保持消息通道开放以支持异步响应
})

// 高亮元素函数
function highlightElement(selector: string) {
  const element = document.querySelector(selector) as HTMLElement
  if (element) {
    element.style.outline = '2px solid #0066cc'
    element.style.outlineOffset = '2px'

    setTimeout(() => {
      element.style.outline = ''
      element.style.outlineOffset = ''
    }, 2000)
  }
}

// 检测页面变化，动态更新页面信息
let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    // URL 变化时通知后台脚本
    getPageMetadata()
      .then(metadata => {
        chrome.runtime.sendMessage({
          type: 'PAGE_CHANGED',
          data: metadata
        })
      })
      .catch(error => {
        console.error('页面变化时获取元数据失败:', error)
        // 使用备用方案
        const fallbackMetadata = getLocalPageMetadata()
        chrome.runtime.sendMessage({
          type: 'PAGE_CHANGED',
          data: fallbackMetadata
        })
      })
  }
})

// 开始观察页面变化
observer.observe(document.body, {
  childList: true,
  subtree: true
})

// 页面加载完成后发送初始信息
const sendPageLoadedMessage = async () => {
  try {
    const metadata = await getPageMetadata()
    chrome.runtime.sendMessage({
      type: 'PAGE_LOADED',
      data: metadata
    })
  } catch (error) {
    console.error('页面加载时获取元数据失败:', error)
    // 使用备用方案
    const fallbackMetadata = getLocalPageMetadata()
    chrome.runtime.sendMessage({
      type: 'PAGE_LOADED',
      data: fallbackMetadata
    })
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sendPageLoadedMessage)
} else {
  sendPageLoadedMessage()
}

// 快捷键处理
document.addEventListener('keydown', (event) => {
  // Ctrl+Shift+A 或 Cmd+Shift+A
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
    event.preventDefault()

    getPageMetadata()
      .then(metadata => {
        chrome.runtime.sendMessage({
          type: 'QUICK_ADD_SHORTCUT',
          data: metadata
        })
      })
      .catch(error => {
        console.error('快捷键获取元数据失败:', error)
        // 使用备用方案
        const fallbackMetadata = getLocalPageMetadata()
        chrome.runtime.sendMessage({
          type: 'QUICK_ADD_SHORTCUT',
          data: fallbackMetadata
        })
      })
  }
})

console.log('NavSphere content script loaded')