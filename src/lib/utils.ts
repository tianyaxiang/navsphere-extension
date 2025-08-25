import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(timestamp).toLocaleDateString()
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin
    return `${domain}/favicon.ico`
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik04IDNhNSA1IDAgMCAwLTUgNSA1IDUgMCAwIDAgNSA1IDUgNSAwIDAgMCA1LTUgNSA1IDAgMCAwLTUtNXptMCA4YTMgMyAwIDEgMSAwLTYgMyAzIDAgMCAxIDAgNnoiIGZpbGw9IiM2YjczODAiLz4KPC9zdmc+'
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 获取当前活跃的NavSphere实例的通用方法
 * @returns Promise<NavSphereInstance> 当前活跃的实例
 * @throws Error 当没有配置实例或无法找到可用实例时
 */
export async function getCurrentActiveInstance(): Promise<any> {
  const instances = await chrome.storage.sync.get('navsphere_instances')
  const settings = await chrome.storage.sync.get('navsphere_settings')

  const instanceList = instances.navsphere_instances || []
  
  if (!instanceList || instanceList.length === 0) {
    throw new Error('没有配置的NavSphere实例')
  }

  // 获取默认实例或第一个实例
  const defaultInstanceId = settings.navsphere_settings?.defaultInstanceId
  const targetInstance = instanceList.find((i: any) => i.id === defaultInstanceId) || instanceList[0]

  if (!targetInstance) {
    throw new Error('无法找到可用的NavSphere实例')
  }

  return targetInstance
}

/**
 * 获取当前活跃且已认证的NavSphere实例
 * @returns Promise<NavSphereInstance> 当前活跃且已认证的实例
 * @throws Error 当实例未认证时
 */
export async function getCurrentAuthenticatedInstance(): Promise<any> {
  const instance = await getCurrentActiveInstance()
  
  if (!instance.authConfig?.isAuthenticated) {
    throw new Error('实例未认证，请先完成认证')
  }

  return instance
}

/**
 * 根据ID获取NavSphere实例的通用方法
 * @param instanceId 实例ID
 * @returns Promise<NavSphereInstance> 指定的实例
 * @throws Error 当实例不存在时
 */
export async function getInstanceById(instanceId: string): Promise<any> {
  const instances = await chrome.storage.sync.get('navsphere_instances')
  const instanceList = instances.navsphere_instances || []
  
  const instance = instanceList.find((i: any) => i.id === instanceId)
  
  if (!instance) {
    throw new Error(`实例不存在: ${instanceId}`)
  }

  return instance
}

/**
 * 根据ID获取已认证的NavSphere实例
 * @param instanceId 实例ID
 * @returns Promise<NavSphereInstance> 指定的已认证实例
 * @throws Error 当实例不存在或未认证时
 */
export async function getAuthenticatedInstanceById(instanceId: string): Promise<any> {
  const instance = await getInstanceById(instanceId)
  
  if (!instance.authConfig?.isAuthenticated) {
    throw new Error(`实例未认证: ${instance.name || instanceId}`)
  }

  return instance
}