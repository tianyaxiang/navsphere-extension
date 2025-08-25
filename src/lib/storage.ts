import type { StorageData, NavSphereInstance, ExtensionSettings } from '@/types'

const STORAGE_KEYS = {
  INSTANCES: 'navsphere_instances',
  SETTINGS: 'navsphere_settings',
  CACHE: 'navsphere_cache',
} as const

// 默认设置
const DEFAULT_SETTINGS: ExtensionSettings = {
  defaultInstanceId: 'default-official',
  theme: 'system',
  syncSettings: {
    enabled: false,
    interval: 3600000, // 1小时
    selectedFolders: [],
    excludedFolders: ['其他书签', 'Mobile Bookmarks'],
    lastSyncTime: 0,
    autoSync: false,
  },
  shortcuts: {
    quickAdd: 'Ctrl+Shift+A',
  },
}

// 默认实例配置
const DEFAULT_INSTANCE: NavSphereInstance = {
  id: 'default-official',
  name: '官方实例',
  url: 'https://dh.leti.ltd',
  apiUrl: 'https://dh.leti.ltd',
  isActive: true,
  favicon: 'https://dh.leti.ltd/favicon.ico',
  description: 'NavSphere 官方实例',
  title: 'NavSphere 官方导航',
  authConfig: {
    isAuthenticated: true,
  },
  createdAt: Date.now(),
  lastUsed: Date.now(),
}

export class StorageManager {
  static async getInstances(): Promise<NavSphereInstance[]> {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.INSTANCES)
    const instances = result[STORAGE_KEYS.INSTANCES] || []

    // 如果没有实例，自动添加默认实例
    if (instances.length === 0) {
      await this.setInstances([DEFAULT_INSTANCE])
      return [DEFAULT_INSTANCE]
    }

    return instances
  }

  static async setInstances(instances: NavSphereInstance[]): Promise<void> {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.INSTANCES]: instances,
    })
  }

  static async addInstance(instance: NavSphereInstance): Promise<void> {
    console.log('StorageManager.addInstance - 开始添加实例:', instance)
    const instances = await this.getInstances()
    console.log('StorageManager.addInstance - 当前实例列表:', instances)
    instances.push(instance)
    console.log('StorageManager.addInstance - 新实例列表:', instances)
    await this.setInstances(instances)
    console.log('StorageManager.addInstance - 保存完成')
  }

  static async updateInstance(instanceId: string, updates: Partial<NavSphereInstance>): Promise<void> {
    const instances = await this.getInstances()
    const index = instances.findIndex(i => i.id === instanceId)
    if (index !== -1) {
      instances[index] = { ...instances[index], ...updates }
      await this.setInstances(instances)
    }
  }

  static async removeInstance(instanceId: string): Promise<void> {
    const instances = await this.getInstances()
    const filtered = instances.filter(i => i.id !== instanceId)
    await this.setInstances(filtered)
  }

  static async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS)
    return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] }
  }

  static async setSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.SETTINGS]: settings,
    })
  }

  static async updateSettings(updates: Partial<ExtensionSettings>): Promise<void> {
    const settings = await this.getSettings()
    await this.setSettings({ ...settings, ...updates })
  }

  static async getCache(): Promise<any> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHE)
    return result[STORAGE_KEYS.CACHE] || {}
  }

  static async setCache(cache: any): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.CACHE]: cache,
    })
  }

  static async getCacheForInstance(instanceId: string): Promise<any> {
    const cache = await this.getCache()
    return cache[instanceId] || {}
  }

  static async setCacheForInstance(instanceId: string, data: any): Promise<void> {
    const cache = await this.getCache()
    cache[instanceId] = data
    await this.setCache(cache)
  }

  static async clearCache(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.CACHE)
  }

  static async initializeDefaultInstance(): Promise<void> {
    const instances = await chrome.storage.sync.get(STORAGE_KEYS.INSTANCES)
    const existingInstances = instances[STORAGE_KEYS.INSTANCES] || []

    // 检查是否已存在默认实例
    const hasDefaultInstance = existingInstances.some((instance: NavSphereInstance) =>
      instance.id === DEFAULT_INSTANCE.id
    )

    if (!hasDefaultInstance) {
      existingInstances.push(DEFAULT_INSTANCE)
      await this.setInstances(existingInstances)
      console.log('StorageManager.initializeDefaultInstance - 已添加默认实例')
    }
  }

  static async clearAll(): Promise<void> {
    await chrome.storage.sync.clear()
    await chrome.storage.local.clear()
  }
}