import { StorageManager } from './storage'
import type { BookmarkItem, BookmarkFolder, NavSphereInstance } from '@/types'
import { getFaviconUrl } from './utils'

export interface SyncResult {
  success: boolean
  message: string
  stats: {
    totalProcessed: number
    newBookmarks: number
    duplicatesSkipped: number
    errors: number
  }
}

export interface SyncProgress {
  phase: 'reading' | 'processing' | 'uploading' | 'completed' | 'error'
  current: number
  total: number
  message: string
}

/**
 * 书签同步管理器
 */
export class BookmarkSyncManager {
  private progressCallback?: (progress: SyncProgress) => void

  constructor(progressCallback?: (progress: SyncProgress) => void) {
    this.progressCallback = progressCallback
  }

  /**
   * 开始同步书签到指定实例
   */
  async syncBookmarks(instanceId: string): Promise<SyncResult> {
    try {
      this.updateProgress('reading', 0, 100, '正在读取浏览器书签...')

      // 1. 获取实例信息
      const instances = await StorageManager.getInstances()
      const instance = instances.find(i => i.id === instanceId)
      
      if (!instance) {
        throw new Error('实例不存在')
      }

      if (!instance.authConfig.isAuthenticated) {
        throw new Error('实例未认证，请先完成GitHub OAuth认证')
      }

      // 2. 获取同步设置
      const settings = await StorageManager.getSettings()
      const syncSettings = settings.syncSettings

      // 3. 读取浏览器书签
      this.updateProgress('reading', 25, 100, '正在获取书签树...')
      const bookmarkTree = await this.getBookmarkTree()
      
      // 4. 过滤和处理书签
      this.updateProgress('processing', 50, 100, '正在处理书签数据...')
      const filteredBookmarks = await this.filterBookmarks(bookmarkTree, syncSettings)
      const processedBookmarks = this.processBookmarks(filteredBookmarks)

      // 5. 获取服务器上的现有书签
      this.updateProgress('processing', 60, 100, '正在检查重复项...')
      const existingBookmarks = await this.getExistingBookmarks(instance)
      
      // 6. 去重处理
      const newBookmarks = this.deduplicateBookmarks(processedBookmarks, existingBookmarks)

      // 7. 上传新书签
      this.updateProgress('uploading', 75, 100, `正在上传 ${newBookmarks.length} 个书签...`)
      const uploadResult = await this.uploadBookmarks(instance, newBookmarks)

      // 8. 更新同步时间
      await StorageManager.updateSettings({
        syncSettings: {
          ...syncSettings,
          lastSyncTime: Date.now()
        }
      })

      this.updateProgress('completed', 100, 100, '同步完成')

      return {
        success: true,
        message: '书签同步成功完成',
        stats: {
          totalProcessed: processedBookmarks.length,
          newBookmarks: uploadResult.uploaded,
          duplicatesSkipped: processedBookmarks.length - newBookmarks.length,
          errors: uploadResult.errors
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.updateProgress('error', 0, 100, `同步失败: ${errorMessage}`)
      
      return {
        success: false,
        message: errorMessage,
        stats: {
          totalProcessed: 0,
          newBookmarks: 0,
          duplicatesSkipped: 0,
          errors: 1
        }
      }
    }
  }

  /**
   * 获取浏览器书签树
   */
  private async getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        resolve(tree)
      })
    })
  }

  /**
   * 根据设置过滤书签
   */
  private async filterBookmarks(
    tree: chrome.bookmarks.BookmarkTreeNode[], 
    syncSettings: any
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const filtered: chrome.bookmarks.BookmarkTreeNode[] = []

    const processNode = (node: chrome.bookmarks.BookmarkTreeNode) => {
      // 跳过排除的文件夹
      if (syncSettings.excludedFolders.includes(node.title)) {
        return
      }

      // 如果指定了特定文件夹，只同步这些文件夹
      if (syncSettings.selectedFolders.length > 0) {
        const isInSelectedFolder = this.isInSelectedFolder(node, syncSettings.selectedFolders)
        if (!isInSelectedFolder) {
          return
        }
      }

      // 处理文件夹
      if (node.children) {
        const processedChildren: chrome.bookmarks.BookmarkTreeNode[] = []
        node.children.forEach(child => {
          const processed = processNode(child)
          if (processed) {
            if (Array.isArray(processed)) {
              processedChildren.push(...processed)
            } else {
              processedChildren.push(processed)
            }
          }
        })
        
        if (processedChildren.length > 0) {
          filtered.push({
            ...node,
            children: processedChildren
          })
        }
      } else if (node.url) {
        // 这是一个书签
        filtered.push(node)
      }
    }

    tree.forEach(rootNode => {
      if (rootNode.children) {
        rootNode.children.forEach(processNode)
      }
    })

    return filtered
  }

  /**
   * 检查节点是否在选定的文件夹中
   */
  private isInSelectedFolder(node: chrome.bookmarks.BookmarkTreeNode, selectedFolders: string[]): boolean {
    // 递归检查父节点
    const checkParent = (currentNode: chrome.bookmarks.BookmarkTreeNode): boolean => {
      if (selectedFolders.includes(currentNode.title)) {
        return true
      }
      
      // 这里需要通过 chrome.bookmarks API 获取父节点
      // 简化实现：如果节点标题在选中列表中则返回true
      return selectedFolders.some(folder => currentNode.title.includes(folder))
    }

    return checkParent(node)
  }

  /**
   * 处理书签数据，转换为标准格式
   */
  private processBookmarks(bookmarks: chrome.bookmarks.BookmarkTreeNode[]): BookmarkItem[] {
    const processed: BookmarkItem[] = []

    const processNode = (node: chrome.bookmarks.BookmarkTreeNode) => {
      if (node.url) {
        // 这是一个书签
        processed.push({
          id: node.id,
          title: node.title,
          url: node.url,
          favicon: getFaviconUrl(node.url),
          dateAdded: node.dateAdded,
          parentId: node.parentId
        })
      }

      // 递归处理子节点
      if (node.children) {
        node.children.forEach(processNode)
      }
    }

    bookmarks.forEach(processNode)
    return processed
  }

  /**
   * 获取服务器上现有的书签
   */
  private async getExistingBookmarks(instance: NavSphereInstance): Promise<BookmarkItem[]> {
    try {
      const response = await fetch(`${instance.apiUrl}/api/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${instance.authConfig.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`获取现有书签失败: ${response.statusText}`)
      }

      const data = await response.json()
      return data.bookmarks || []
    } catch (error) {
      console.warn('无法获取现有书签，将作为全部新增处理:', error)
      return []
    }
  }

  /**
   * 去重处理，返回需要上传的新书签
   */
  private deduplicateBookmarks(
    newBookmarks: BookmarkItem[], 
    existingBookmarks: BookmarkItem[]
  ): BookmarkItem[] {
    const existingUrls = new Set(existingBookmarks.map(b => b.url).filter(Boolean))
    const existingTitles = new Set(existingBookmarks.map(b => b.title.toLowerCase()))

    return newBookmarks.filter(bookmark => {
      // 按URL去重（优先级最高）
      if (bookmark.url && existingUrls.has(bookmark.url)) {
        return false
      }

      // 按标题去重（防止同名但不同URL的重复）
      if (existingTitles.has(bookmark.title.toLowerCase())) {
        return false
      }

      return true
    })
  }

  /**
   * 上传书签到服务器
   */
  private async uploadBookmarks(
    instance: NavSphereInstance, 
    bookmarks: BookmarkItem[]
  ): Promise<{ uploaded: number; errors: number }> {
    if (bookmarks.length === 0) {
      return { uploaded: 0, errors: 0 }
    }

    let uploaded = 0
    let errors = 0

    // 批量上传，每次最多50个
    const batchSize = 50
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize)
      
      try {
        const response = await fetch(`${instance.apiUrl}/api/bookmarks/batch`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${instance.authConfig.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bookmarks: batch.map(bookmark => ({
              title: bookmark.title,
              url: bookmark.url,
              description: '',
              favicon: bookmark.favicon,
              category: 'imported', // 默认分类
              tags: ['browser-sync'] // 标记为浏览器同步的书签
            }))
          })
        })

        if (response.ok) {
          const result = await response.json()
          uploaded += result.created || batch.length
          
          // 更新进度
          const progress = Math.min(75 + (i / bookmarks.length) * 20, 95)
          this.updateProgress('uploading', progress, 100, 
            `已上传 ${Math.min(i + batchSize, bookmarks.length)}/${bookmarks.length} 个书签`)
        } else {
          console.error(`批量上传失败:`, response.statusText)
          errors += batch.length
        }
      } catch (error) {
        console.error('上传书签时出错:', error)
        errors += batch.length
      }
    }

    return { uploaded, errors }
  }

  /**
   * 更新同步进度
   */
  private updateProgress(phase: SyncProgress['phase'], current: number, total: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ phase, current, total, message })
    }
  }
}

/**
 * 检查书签同步权限
 */
export async function checkBookmarkPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.contains({
      permissions: ['bookmarks']
    }, resolve)
  })
}

/**
 * 请求书签权限
 */
export async function requestBookmarkPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.request({
      permissions: ['bookmarks']
    }, resolve)
  })
}

/**
 * 获取书签文件夹列表（用于配置界面）
 */
export async function getBookmarkFolders(): Promise<BookmarkFolder[]> {
  const hasPermission = await checkBookmarkPermission()
  if (!hasPermission) {
    throw new Error('没有书签访问权限')
  }

  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree) => {
      const folders: BookmarkFolder[] = []

      const processNode = (node: chrome.bookmarks.BookmarkTreeNode) => {
        if (node.children) {
          folders.push({
            id: node.id,
            title: node.title,
            parentId: node.parentId
          })

          node.children.forEach(processNode)
        }
      }

      tree.forEach(rootNode => {
        if (rootNode.children) {
          rootNode.children.forEach(processNode)
        }
      })

      resolve(folders)
    })
  })
}