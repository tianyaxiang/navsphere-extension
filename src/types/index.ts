// 从 NavSphere 项目复制的类型定义
export interface NavigationSubItem {
  id: string
  title: string
  href: string
  description?: string
  icon?: string
  enabled: boolean
}

export interface NavigationCategory {
  id: string
  title: string
  icon?: string
  description?: string
  parentId?: string
  items?: NavigationSubItem[]
  enabled?: boolean
}

export interface NavigationItem {
  id: string
  title?: string
  description?: string
  icon?: string
  items?: NavigationSubItem[]
  subCategories?: NavigationCategory[]
  enabled?: boolean
}

export interface NavigationData {
  navigationItems: NavigationItem[]
}

// 扩展插件专用类型
export interface NavSphereInstance {
  id: string
  name: string
  url: string
  apiUrl: string
  isActive: boolean
  favicon?: string
  description?: string
  title?: string
  createdAt: number
  lastUsed: number
}

export interface PageInfo {
  title: string
  url: string
  description?: string
  favicon?: string
  selectedText?: string
}

export interface QuickAddData {
  pageInfo: PageInfo
  instanceId: string
  categoryId: string
  customTitle?: string
  customDescription?: string
}

export interface ExtensionSettings {
  defaultInstanceId?: string
  theme: 'light' | 'dark' | 'system'
  shortcuts: {
    quickAdd: string
  }
}

export interface StorageData {
  instances: NavSphereInstance[]
  settings: ExtensionSettings
  cache: {
    [instanceId: string]: {
      navigationData?: NavigationData
      lastFetch: number
    }
  }
}