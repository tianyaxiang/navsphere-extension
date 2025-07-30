// 内容脚本 - 在网页中运行，获取页面信息

// 获取页面元数据
function getPageMetadata() {
  const title = document.title
  const url = window.location.href
  
  // 获取页面描述
  const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement
  const description = descriptionMeta?.content || ''
  
  // 获取页面图标
  let favicon = ''
  const iconLink = document.querySelector('link[rel*="icon"]') as HTMLLinkElement
  if (iconLink?.href) {
    favicon = iconLink.href
  } else {
    favicon = `${window.location.origin}/favicon.ico`
  }
  
  // 获取选中文本
  const selectedText = window.getSelection()?.toString() || ''
  
  return {
    title,
    url,
    description,
    favicon,
    selectedText,
  }
}

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_PAGE_METADATA':
      const metadata = getPageMetadata()
      sendResponse({ success: true, data: metadata })
      break
      
    case 'HIGHLIGHT_ELEMENT':
      // 高亮页面元素（用于调试）
      highlightElement(message.selector)
      sendResponse({ success: true })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
  
  return true
})

// 高亮元素函数
function highlightElement(selector: string) {
  const element = document.querySelector(selector)
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
    chrome.runtime.sendMessage({
      type: 'PAGE_CHANGED',
      data: getPageMetadata()
    })
  }
})

// 开始观察页面变化
observer.observe(document.body, {
  childList: true,
  subtree: true
})

// 页面加载完成后发送初始信息
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({
      type: 'PAGE_LOADED',
      data: getPageMetadata()
    })
  })
} else {
  chrome.runtime.sendMessage({
    type: 'PAGE_LOADED',
    data: getPageMetadata()
  })
}

// 快捷键处理
document.addEventListener('keydown', (event) => {
  // Ctrl+Shift+A 或 Cmd+Shift+A
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
    event.preventDefault()
    
    const metadata = getPageMetadata()
    chrome.runtime.sendMessage({
      type: 'QUICK_ADD_SHORTCUT',
      data: metadata
    })
  }
})

console.log('NavSphere content script loaded')