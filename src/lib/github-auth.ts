import { StorageManager } from './storage'
import { getInstanceById } from './utils'
import type { NavSphereInstance, GitHubUser } from '@/types'

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USER_URL = 'https://api.github.com/user'

export interface GitHubOAuthConfig {
  clientId: string
  scope?: string
  redirectUri?: string
}

export class GitHubAuth {
  private clientId: string
  private scope: string
  private redirectUri: string

  constructor(config: GitHubOAuthConfig) {
    this.clientId = config.clientId
    this.scope = config.scope || 'user:email'
    this.redirectUri = config.redirectUri || chrome.identity.getRedirectURL()
  }

  /**
   * 启动 OAuth 认证流程
   */
  async authenticate(): Promise<{
    accessToken: string
    userInfo: GitHubUser
  }> {
    try {
      const authUrl = this.buildAuthUrl()
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      })

      if (!redirectUrl) {
        throw new Error('认证被取消')
      }

      const code = this.extractCodeFromUrl(redirectUrl)
      if (!code) {
        throw new Error('无法获取授权码')
      }

      const accessToken = await this.exchangeCodeForToken(code)
      const userInfo = await this.getUserInfo(accessToken)

      return {
        accessToken,
        userInfo
      }
    } catch (error) {
      console.error('GitHub OAuth 认证失败:', error)
      throw error
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<string> {
    // GitHub OAuth 不支持刷新令牌，需要重新认证
    throw new Error('GitHub OAuth 不支持刷新令牌，请重新认证')
  }

  /**
   * 验证访问令牌是否有效
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(GITHUB_USER_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    const response = await fetch(GITHUB_USER_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      throw new Error('无法获取用户信息')
    }

    return await response.json()
  }

  /**
   * 撤销访问令牌
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await fetch(`https://api.github.com/applications/${this.clientId}/grant`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
    } catch (error) {
      console.error('撤销令牌失败:', error)
      throw error
    }
  }

  /**
   * 构建认证 URL
   */
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: this.generateState()
    })

    return `${GITHUB_OAUTH_URL}?${params.toString()}`
  }

  /**
   * 从重定向 URL 中提取授权码
   */
  private extractCodeFromUrl(url: string): string | null {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('code')
  }

  /**
   * 用授权码换取访问令牌
   */
  private async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        code: code,
        redirect_uri: this.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error('无法获取访问令牌')
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`OAuth 错误: ${data.error_description || data.error}`)
    }

    return data.access_token
  }

  /**
   * 生成状态参数用于防止 CSRF
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
}

/**
 * 为实例配置 GitHub OAuth
 */
export async function configureGitHubOAuth(
  instanceId: string, 
  clientId: string
): Promise<void> {
  const instance = await getInstanceById(instanceId)

  await StorageManager.updateInstance(instanceId, {
    authConfig: {
      ...instance.authConfig,
      githubClientId: clientId,
      isAuthenticated: false
    }
  })
}

/**
 * 为实例执行 GitHub OAuth 认证
 */
export async function authenticateGitHub(instanceId: string): Promise<void> {
  const instance = await getInstanceById(instanceId)
  
  if (!instance.authConfig.githubClientId) {
    throw new Error('实例未配置 GitHub OAuth')
  }

  const auth = new GitHubAuth({
    clientId: instance.authConfig.githubClientId
  })

  const { accessToken, userInfo } = await auth.authenticate()

  await StorageManager.updateInstance(instanceId, {
    authConfig: {
      ...instance.authConfig,
      isAuthenticated: true,
      accessToken,
      userInfo,
      tokenExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1年后过期
    }
  })
}

/**
 * 检查实例的认证状态
 */
export async function checkAuthStatus(instanceId: string): Promise<boolean> {
  try {
    const instance = await getInstanceById(instanceId)
    
    if (!instance.authConfig.isAuthenticated || !instance.authConfig.accessToken) {
      return false
    }

  // 检查令牌是否过期
  if (instance.authConfig.tokenExpiry && Date.now() > instance.authConfig.tokenExpiry) {
    return false
  }

  const auth = new GitHubAuth({
    clientId: instance.authConfig.githubClientId || ''
  })

  return await auth.validateToken(instance.authConfig.accessToken)
  } catch (error) {
    console.error('检查认证状态失败:', error)
    return false
  }
}

/**
 * 登出 GitHub
 */
export async function logoutGitHub(instanceId: string): Promise<void> {
  const instance = await getInstanceById(instanceId)

  // 尝试撤销令牌
  if (instance.authConfig.accessToken && instance.authConfig.githubClientId) {
    try {
      const auth = new GitHubAuth({
        clientId: instance.authConfig.githubClientId
      })
      await auth.revokeToken(instance.authConfig.accessToken)
    } catch (error) {
      console.warn('撤销令牌失败:', error)
    }
  }

  // 清除认证信息
  await StorageManager.updateInstance(instanceId, {
    authConfig: {
      ...instance.authConfig,
      isAuthenticated: false,
      accessToken: undefined,
      refreshToken: undefined,
      userInfo: undefined,
      tokenExpiry: undefined
    }
  })
}