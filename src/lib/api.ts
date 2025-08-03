import type { NavSphereInstance, NavigationData, NavigationSubItem } from '@/types'

export class NavSphereAPI {
  private instance: NavSphereInstance

  constructor(instance: NavSphereInstance) {
    this.instance = instance
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.instance.apiUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.instance.authConfig.accessToken) {
      headers['Authorization'] = `Bearer ${this.instance.authConfig.accessToken}`
      console.log('添加认证头:', `Bearer ${this.instance.authConfig.accessToken.slice(0, 10)}...`)
    } else {
      console.log('⚠️ 没有认证token - 这可能导致请求失败')
    }

    console.log('🚀 发起请求:', url)
    console.log('📋 请求选项:', { ...options, headers })

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log('📡 响应状态:', response.status, response.statusText)
      console.log('📋 响应头:', [...response.headers.entries()])

      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = '无法读取错误响应'
        }
        console.error('❌ API请求失败:', response.status, response.statusText, errorText)
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      let result
      try {
        result = await response.json()
        console.log('✅ 响应数据:', result)
      } catch (e) {
        console.log('⚠️ 响应不是JSON格式，返回空对象')
        result = {}
      }
      
      return result
    } catch (error) {
      console.error('🔥 网络请求异常:', error)
      throw error
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.instance.apiUrl}/api/health`)
      const data = await response.json()
      return data.service === 'NavSphere' 
    } catch {
      return false
    }
  }

  async getNavigationData(): Promise<NavigationData> {
    return this.request('/api/navigation')
  }

  async addNavigationItem(categoryId: string, item: Omit<NavigationSubItem, 'id' | 'enabled'>): Promise<void> {
    console.log('🚀 NavSphereAPI.addNavigationItem - 开始添加书签')
    console.log('📂 分类ID:', categoryId)
    console.log('📄 书签项目:', item)
    
    // 验证必要字段
    if (!categoryId || !categoryId.trim()) {
      throw new Error('分类ID不能为空')
    }
    
    if (!item.title || !item.title.trim()) {
      throw new Error('书签标题不能为空')
    }
    
    if (!item.href || !item.href.trim()) {
      throw new Error('书签链接不能为空')
    }
    
    // 移除认证状态验证，允许未认证的实例提交站点
    
    const newItem: NavigationSubItem = {
      id: `item-${Date.now()}`,
      enabled: true,
      ...item,
    }
    console.log('✨ 处理后的书签项目:', newItem)

    const endpoint = `/api/navigation/${categoryId}/items`
    console.log('🎯 请求端点:', `${this.instance.apiUrl}${endpoint}`)
    console.log('🏠 请求实例:', this.instance.name)
    
    try {
      const result = await this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(newItem),
      })
      
      console.log('✅ 书签添加成功，API响应:', result)
      return result
    } catch (error) {
      console.error('❌ 添加书签失败:', error)
      throw error
    }
  }

  async updateNavigationData(data: NavigationData): Promise<void> {
    await this.request('/api/navigation', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async createCategory(category: {
    title: string
    description?: string
    icon?: string
  }): Promise<void> {
    const newCategory = {
      id: `category-${Date.now()}`,
      items: [],
      enabled: true,
      ...category,
    }

    const navigationData = await this.getNavigationData()
    navigationData.navigationItems.push(newCategory)
    await this.updateNavigationData(navigationData)
  }
}

export async function getSiteMetadata(url: string): Promise<{
  title?: string
  description?: string
  favicon?: string
}> {
  try {
    const cleanUrl = url.replace(/\/$/, '')
    
    // 尝试获取网站首页的HTML来提取元数据
    const response = await fetch(cleanUrl, {
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // 解析HTML获取元数据
    const metadata: {
      title?: string
      description?: string
      favicon?: string
    } = {}
    
    // 获取title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim()
    }
    
    // 获取description (meta description)
    const descMatch = html.match(/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"']+)["\'][^>]*>/i) ||
                      html.match(/<meta[^>]+content=["\']([^"']+)["\'][^>]+name=["\']description["\'][^>]*>/i)
    if (descMatch) {
      metadata.description = descMatch[1].trim()
    }
    
    // 获取favicon
    const faviconMatches = [
      html.match(/<link[^>]+rel=["\'](?:shortcut )?icon["\'][^>]+href=["\']([^"']+)["\'][^>]*>/i),
      html.match(/<link[^>]+href=["\']([^"']+)["\'][^>]+rel=["\'](?:shortcut )?icon["\'][^>]*>/i),
      html.match(/<link[^>]+rel=["\']apple-touch-icon["\'][^>]+href=["\']([^"']+)["\'][^>]*>/i)
    ]
    
    for (const match of faviconMatches) {
      if (match) {
        let faviconUrl = match[1]
        
        // 处理相对URL
        if (faviconUrl.startsWith('//')) {
          faviconUrl = new URL(cleanUrl).protocol + faviconUrl
        } else if (faviconUrl.startsWith('/')) {
          faviconUrl = cleanUrl + faviconUrl
        } else if (!faviconUrl.startsWith('http')) {
          faviconUrl = cleanUrl + '/' + faviconUrl
        }
        
        metadata.favicon = faviconUrl
        break
      }
    }
    
    // 如果没有找到favicon，尝试默认路径
    if (!metadata.favicon) {
      try {
        const faviconResponse = await fetch(`${cleanUrl}/favicon.ico`, {
          method: 'HEAD',
          mode: 'cors',
          signal: AbortSignal.timeout(5000)
        })
        
        if (faviconResponse.ok) {
          metadata.favicon = `${cleanUrl}/favicon.ico`
        }
      } catch {
        // 忽略错误
      }
    }
    
    return metadata
  } catch (error) {
    console.error('获取站点元数据失败:', error)
    return {}
  }
}

export async function detectNavSphereInstance(url: string): Promise<boolean> {
  try {
    // 清理URL，移除末尾斜杠
    const cleanUrl = url.replace(/\/$/, '')
    
    // 尝试多个可能的健康检查端点
    const possibleEndpoints = [
      `${cleanUrl}/api/health`,
      `${cleanUrl}/health`,
      `${cleanUrl}/api/status`,
      `${cleanUrl}/api/navigation`, // NavSphere特有的端点
      `${cleanUrl}/api/info`
    ]
    
    let foundNavSphere = false
    let hasHealthCheck = false
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`尝试连接: ${endpoint}`)
        
        const response = await fetch(endpoint, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // 设置超时
          signal: AbortSignal.timeout(10000) // 10秒超时
        })
        
        console.log(`响应状态: ${response.status}`)
        
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            console.log('响应数据:', data)
            
            // 检查多种可能的响应格式
            if (data.service === 'NavSphere' || 
                data.name === 'NavSphere' || 
                data.app === 'NavSphere' ||
                data.application === 'NavSphere' ||
                (data.status === 'ok' && (
                  endpoint.includes('navsphere') || 
                  endpoint.includes('NavSphere') ||
                  // 检查是否有NavSphere相关的其他字段
                  JSON.stringify(data).toLowerCase().includes('navsphere')
                ))) {
              console.log('✅ 检测到NavSphere实例!')
              foundNavSphere = true
              break
            }
            
            // 检查是否是NavSphere的导航数据端点
            if (endpoint.includes('/api/navigation') && (
                data.navigationItems || 
                (Array.isArray(data) && data.some(item => item.title || item.items))
              )) {
              console.log('✅ 检测到NavSphere导航API!')
              foundNavSphere = true
              break
            }
            
            // 如果是标准的健康检查响应，记录但继续检查其他端点
            if (data.status === 'ok' && (data.timestamp || data.uptime)) {
              console.log('发现健康检查端点，继续验证其他特征...')
              hasHealthCheck = true
            }
          }
        }
      } catch (endpointError) {
        console.log(`端点 ${endpoint} 连接失败:`, endpointError)
        continue
      }
    }
    
    // 如果找到了NavSphere特征，直接返回成功
    if (foundNavSphere) {
      return true
    }
    
    // 如果有健康检查端点响应，但没有明确的NavSphere标识
    // 尝试更深入的检测
    if (hasHealthCheck) {
      console.log('检测到健康检查端点，进行更深入的验证...')
      
      // 尝试访问可能的NavSphere特有路径
      const navSphereEndpoints = [
        `${cleanUrl}/api/navigation`,
        `${cleanUrl}/api/bookmarks`,
        `${cleanUrl}/api/categories`
      ]
      
      for (const endpoint of navSphereEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          })
          
          if (response.ok) {
            console.log(`✅ 检测到NavSphere特有端点: ${endpoint}`)
            return true
          }
        } catch (error) {
          // 忽略错误，继续尝试
        }
      }
      
      // 如果有健康检查但没有找到NavSphere特有端点
      // 作为潜在的NavSphere实例返回true，让用户决定
      console.log('⚠️ 检测到健康检查端点，假设为NavSphere实例')
      return true
    }
    
    // 如果所有端点都失败，尝试直接访问根路径检查是否是NavSphere
    try {
      console.log(`尝试访问根路径: ${cleanUrl}/`)
      const response = await fetch(`${cleanUrl}/`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(10000)
      })
      
      if (response.ok) {
        const html = await response.text()
        // 检查HTML中是否包含NavSphere相关标识
        if (html.includes('NavSphere') || 
            html.includes('navsphere') ||
            html.includes('导航球') ||
            html.includes('navigation-sphere')) {
          console.log('在HTML中发现NavSphere标识')
          return true
        }
      }
    } catch (rootError) {
      console.log('根路径访问失败:', rootError)
    }
    
    return false
  } catch (error) {
    console.error('NavSphere实例检测失败:', error)
    return false
  }
}