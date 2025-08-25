# NavSphere 实例获取方法重构

## 概述

本次重构的目标是在 `fetchWebsiteMetadata` 方法中使用通用的方法来获取当前活跃的 NavSphere 实例，并在整个项目中统一实例获取的逻辑。

## 新增的通用方法

在 `src/lib/utils.ts` 中新增了以下通用方法：

### 1. `getCurrentActiveInstance()`
```typescript
/**
 * 获取当前活跃的NavSphere实例的通用方法
 * @returns Promise<NavSphereInstance> 当前活跃的实例
 * @throws Error 当没有配置实例或无法找到可用实例时
 */
export async function getCurrentActiveInstance(): Promise<any>
```

- 从存储中获取实例列表和设置
- 根据 `defaultInstanceId` 获取默认实例，如果没有则使用第一个实例
- 如果没有可用实例则抛出错误

### 2. `getCurrentAuthenticatedInstance()`
```typescript
/**
 * 获取当前活跃且已认证的NavSphere实例
 * @returns Promise<NavSphereInstance> 当前活跃且已认证的实例
 * @throws Error 当实例未认证时
 */
export async function getCurrentAuthenticatedInstance(): Promise<any>
```

- 调用 `getCurrentActiveInstance()` 获取实例
- 检查实例是否已认证
- 如果未认证则抛出错误

### 3. `getInstanceById()`
```typescript
/**
 * 根据ID获取NavSphere实例的通用方法
 * @param instanceId 实例ID
 * @returns Promise<NavSphereInstance> 指定的实例
 * @throws Error 当实例不存在时
 */
export async function getInstanceById(instanceId: string): Promise<any>
```

- 根据指定的实例ID获取实例
- 如果实例不存在则抛出错误

### 4. `getAuthenticatedInstanceById()`
```typescript
/**
 * 根据ID获取已认证的NavSphere实例
 * @param instanceId 实例ID
 * @returns Promise<NavSphereInstance> 指定的已认证实例
 * @throws Error 当实例不存在或未认证时
 */
export async function getAuthenticatedInstanceById(instanceId: string): Promise<any>
```

- 调用 `getInstanceById()` 获取实例
- 检查实例是否已认证
- 如果未认证则抛出错误

## 重构的文件

### 1. `src/content/index.ts`
- **重构前**: `fetchWebsiteMetadata` 方法中有重复的实例获取逻辑
- **重构后**: 使用 `getCurrentAuthenticatedInstance()` 方法
- **改进**: 代码更简洁，逻辑统一

### 2. `src/lib/bookmark-sync.ts`
- **重构前**: `syncBookmarks` 方法中有重复的实例获取和认证检查逻辑
- **重构后**: 
  - 添加了对 `getCurrentAuthenticatedInstance()` 的导入
  - 修改 `syncBookmarks` 方法支持可选的 `instanceId` 参数
  - 当没有指定实例ID时，使用当前活跃的已认证实例
- **改进**: 提高了方法的灵活性，支持自动获取当前实例

### 3. `src/lib/github-auth.ts`
- **重构前**: 多个函数中都有重复的 `StorageManager.getInstances()` 和 `instances.find()` 逻辑
- **重构后**: 使用 `getInstanceById()` 方法
- **改进**: 减少了重复代码，统一了错误处理

### 4. `src/popup/PopupApp.tsx`
- **重构前**: 手动获取设置和查找默认实例
- **重构后**: 使用 `getCurrentActiveInstance()` 方法
- **改进**: 代码更简洁，逻辑统一

## 优势

1. **代码复用**: 消除了重复的实例获取逻辑
2. **统一错误处理**: 所有实例获取都有一致的错误处理
3. **易于维护**: 实例获取逻辑集中在一个地方，便于修改和维护
4. **类型安全**: 统一的方法签名和错误处理
5. **灵活性**: 提供了多种获取实例的方式，适应不同的使用场景

## 使用示例

```typescript
// 获取当前活跃实例
const instance = await getCurrentActiveInstance()

// 获取当前活跃且已认证的实例
const authInstance = await getCurrentAuthenticatedInstance()

// 根据ID获取特定实例
const specificInstance = await getInstanceById('instance-id')

// 根据ID获取已认证的特定实例
const authSpecificInstance = await getAuthenticatedInstanceById('instance-id')
```

## 注意事项

1. 所有方法都是异步的，需要使用 `await` 或 `.then()`
2. 方法会抛出错误，需要适当的错误处理
3. 在 content script 中使用时，确保模块导入正确配置
4. 存储键名使用了正确的格式（`navsphere_instances`, `navsphere_settings`）

## 后续改进建议

1. 考虑添加缓存机制，避免频繁读取存储
2. 添加实例健康检查功能
3. 考虑添加实例切换的通知机制
4. 为实例获取添加更详细的日志记录