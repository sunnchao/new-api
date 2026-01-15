# 管理员套餐管理页面 - 添加套餐计划功能

## 问题描述
在 `/console/packages` 页面的"计划管理"标签页中，缺少创建、编辑和删除套餐计划的功能入口。

## 解决方案

### 1. 添加的功能

#### 创建套餐计划
- 在"计划管理"标签页添加"创建套餐"按钮
- 点击后打开表单弹窗
- 表单字段包括：
  - 名称 (必填)
  - 类型 (必填，创建后不可修改)
  - 描述
  - 价格 (必填)
  - 货币 (CNY/USD)
  - 额度 (必填)
  - 时长数值
  - 时长单位 (天/月/年)
  - 服务类型 (必填)
  - 启用状态 (开关)
  - 在门户显示 (开关)

#### 编辑套餐计划
- 在套餐列表的"操作"列添加"编辑"按钮
- 点击后打开预填充数据的表单弹窗
- 套餐类型字段禁用编辑

#### 删除套餐计划
- 在套餐列表的"操作"列添加"删除"按钮
- 点击后显示确认对话框
- 确认后调用删除API

### 2. 修改的文件

#### `/web/src/pages/AdminPackages/index.jsx`

**添加的状态：**
```javascript
const [planModalOpen, setPlanModalOpen] = useState(false);
const [editingPlan, setEditingPlan] = useState(null);
```

**添加的函数：**
- `openPlanModal(plan)` - 打开创建/编辑弹窗
- `handleSavePlan(values)` - 保存套餐计划
- `handleDeletePlan(plan)` - 删除套餐计划

**修改的部分：**
- 在 `planColumns` 中添加"操作"列
- 将"管理套餐"按钮替换为"创建套餐"按钮
- 添加创建/编辑套餐的Modal组件

#### `/web/src/i18n/locales/zh.json`

添加的翻译键：
```json
"packages.admin.plans.actions": "操作",
"packages.admin.plans.create": "创建套餐",
"packages.admin.plans.edit": "编辑",
"packages.admin.plans.delete": "删除",
"packages.admin.plans.createTitle": "创建套餐计划",
"packages.admin.plans.editTitle": "编辑套餐计划",
"packages.admin.plans.createSuccess": "创建成功",
"packages.admin.plans.createFailed": "创建失败",
"packages.admin.plans.updateSuccess": "更新成功",
"packages.admin.plans.updateFailed": "更新失败",
"packages.admin.plans.deleteSuccess": "删除成功",
"packages.admin.plans.deleteFailed": "删除失败",
"packages.admin.plans.deleteConfirm": "删除套餐",
"packages.admin.plans.deleteConfirmContent": "确定要删除此套餐吗？",
"packages.admin.plans.saveFailed": "保存失败",
"packages.admin.plans.description": "描述",
"packages.admin.plans.currency": "货币",
"packages.admin.plans.durationValue": "时长数值",
"packages.admin.plans.durationUnit": "时长单位",
"packages.admin.plans.day": "天",
"packages.admin.plans.month": "月",
"packages.admin.plans.year": "年",
"packages.admin.plans.isActive": "启用",
"packages.admin.plans.showInPortal": "在门户显示",
"packages.admin.plans.cancel": "取消",
"packages.admin.plans.save": "保存",
"packages.admin.plans.nameRequired": "请输入套餐名称",
"packages.admin.plans.typeRequired": "请输入套餐类型",
"packages.admin.plans.priceRequired": "请输入价格",
"packages.admin.plans.quotaRequired": "请输入额度",
"packages.admin.plans.serviceRequired": "请输入服务类型"
```

#### `/web/src/i18n/locales/en.json`

添加了对应的英文翻译。

### 3. API端点

使用的后端API：
- `POST /api/packages-admin/plans` - 创建套餐计划
- `PUT /api/packages-admin/plans/:id` - 更新套餐计划
- `DELETE /api/packages-admin/plans/:id` - 删除套餐计划
- `GET /api/packages-admin/plans` - 获取套餐计划列表

### 4. 功能特性

✅ **创建套餐**
- 完整的表单验证
- 必填字段检查
- 数值类型验证
- 成功/失败提示

✅ **编辑套餐**
- 预填充现有数据
- 套餐类型不可修改
- 保留其他字段可编辑

✅ **删除套餐**
- 二次确认对话框
- 防止误删除
- 成功/失败提示

✅ **用户体验**
- 表单布局清晰
- 左对齐标签
- 合理的字段分组
- 响应式设计

### 5. 表单字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | 文本 | ✅ | 套餐名称 |
| type | 文本 | ✅ | 套餐类型（唯一标识） |
| description | 文本域 | ❌ | 套餐描述 |
| price | 数字 | ✅ | 价格（支持小数） |
| currency | 下拉 | ❌ | 货币（CNY/USD） |
| total_quota | 数字 | ✅ | 总额度 |
| duration_value | 数字 | ❌ | 时长数值 |
| duration_unit | 下拉 | ❌ | 时长单位（天/月/年） |
| service_type | 文本 | ✅ | 服务类型 |
| is_active | 开关 | ❌ | 是否启用 |
| show_in_portal | 开关 | ❌ | 是否在门户显示 |

### 6. 使用流程

#### 创建套餐计划
1. 访问 `/console/packages`
2. 切换到"计划管理"标签页
3. 点击"创建套餐"按钮
4. 填写表单字段
5. 点击"保存"按钮
6. 查看成功提示
7. 套餐列表自动刷新

#### 编辑套餐计划
1. 在套餐列表中找到要编辑的套餐
2. 点击"编辑"按钮
3. 修改表单字段（类型字段不可修改）
4. 点击"保存"按钮
5. 查看成功提示
6. 套餐列表自动刷新

#### 删除套餐计划
1. 在套餐列表中找到要删除的套餐
2. 点击"删除"按钮
3. 在确认对话框中点击"确定"
4. 查看成功提示
5. 套餐列表自动刷新

### 7. 注意事项

⚠️ **重要提示：**
1. 套餐类型（type）创建后不可修改，因为它是套餐的唯一标识
2. 删除套餐前请确认没有用户正在使用该套餐
3. 价格支持小数点后两位
4. 额度和时长数值必须为正整数
5. 禁用的套餐不会在用户端显示

### 8. 测试清单

- [ ] 创建新套餐成功
- [ ] 必填字段验证生效
- [ ] 编辑现有套餐成功
- [ ] 套餐类型字段在编辑时禁用
- [ ] 删除套餐显示确认对话框
- [ ] 删除套餐成功
- [ ] 取消操作正常关闭弹窗
- [ ] 表单验证错误提示正确
- [ ] API错误时显示友好提示
- [ ] 操作成功后列表自动刷新
- [ ] 中英文翻译正确显示

## 完成状态

✅ 所有功能已实现
✅ 中英文翻译已添加
✅ 表单验证已配置
✅ API集成已完成
✅ 用户体验已优化
