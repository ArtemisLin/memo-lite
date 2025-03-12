import { ItemView, WorkspaceLeaf, moment, TFile, Menu, Notice, Modal, Platform } from 'obsidian';
import { MemoManager, Memo } from './memo-manager';
import { MemoLiteSettings } from './settings';

export const MEMO_VIEW_TYPE = 'memo-lite-view';

// 确认删除对话框
// 在view.ts文件中修改DeleteConfirmModal类
class DeleteConfirmModal extends Modal {
    memo: Memo;
    onConfirm: (memo: Memo) => void;
    doNotRemindCheckbox: HTMLInputElement;
  
    constructor(app: any, memo: Memo, onConfirm: (memo: Memo) => void) {
      super(app);
      this.memo = memo;
      this.onConfirm = onConfirm;
    }
  
    onOpen() {
      const { contentEl } = this;
      
      // 使用更强调的标题
      contentEl.createEl('h2', { text: '⚠️ 确认删除', cls: 'memo-lite-delete-warning-title' });
      
      // 强调不可恢复的风险
      contentEl.createEl('p', { 
        text: '您即将删除这条笔记。此操作不可撤销，删除后将无法恢复！', 
        cls: 'memo-lite-delete-warning-text' 
      });
      
      // 显示部分内容预览
      const preview = contentEl.createEl('div', { cls: 'memo-lite-delete-preview' });
      const contentPreview = this.memo.content.slice(0, 100) + (this.memo.content.length > 100 ? '...' : '');
      preview.setText(contentPreview);
  
      // 添加"不再提醒"选项
      const checkboxContainer = contentEl.createDiv({ cls: 'memo-lite-checkbox-container' });
      this.doNotRemindCheckbox = checkboxContainer.createEl('input', {
        type: 'checkbox',
        cls: 'memo-lite-do-not-remind'
      });
      const checkboxLabel = checkboxContainer.createEl('label', { 
        text: '不再提醒',
        cls: 'memo-lite-checkbox-label'
      });
      checkboxLabel.prepend(this.doNotRemindCheckbox);
  
      // 按钮区
      const buttonContainer = contentEl.createDiv({ 
        cls: 'memo-lite-modal-buttons',
        attr: {
          style: 'position: relative !important; bottom: 0 !important; padding: 10px !important; background-color: var(--background-primary) !important; z-index: 100 !important;'
        }
      });
      
      // 取消按钮
      const cancelButton = buttonContainer.createEl('button', { 
        cls: 'memo-lite-modal-button memo-lite-cancel-button',
        text: '取消' 
      });
      cancelButton.addEventListener('click', () => {
        this.close();
      });
      
      // 确认按钮 - 使用更明确的文字
      const confirmButton = buttonContainer.createEl('button', { 
        cls: 'memo-lite-modal-button memo-lite-confirm-button memo-lite-delete-button',
        text: '确认删除' 
      });
      confirmButton.addEventListener('click', () => {
        // 保存"不再提醒"选项
        if (this.doNotRemindCheckbox.checked) {
          localStorage.setItem('memo-lite-do-not-remind-delete', 'true');
        }
        
        this.onConfirm(this.memo);
        this.close();
      });
    }
  
    onClose() {
      const { contentEl } = this;
      contentEl.empty();
    }
  }

// 删除标签确认对话框
class DeleteTagConfirmModal extends Modal {
  tag: string;
  onConfirm: (tag: string) => void;

  constructor(app: any, tag: string, onConfirm: (tag: string) => void) {
    super(app);
    this.tag = tag;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '确认删除标签' });
    contentEl.createEl('p', { text: `你确定要删除标签 #${this.tag} 吗？这将会从所有笔记中移除此标签。` });
    
    // 按钮区
    const buttonContainer = contentEl.createDiv({ cls: 'memo-lite-modal-buttons' });
    
    // 取消按钮
    const cancelButton = buttonContainer.createEl('button', { 
      cls: 'memo-lite-modal-button memo-lite-cancel-button',
      text: '取消' 
    });
    cancelButton.addEventListener('click', () => {
      this.close();
    });
    
    // 确认按钮
    const confirmButton = buttonContainer.createEl('button', { 
      cls: 'memo-lite-modal-button memo-lite-confirm-button',
      text: '删除' 
    });
    confirmButton.addEventListener('click', () => {
      this.onConfirm(this.tag);
      this.close();
    });
  // 打印模态框结构，以便调试
    console.log('Modal structure:', this.modalEl);
    console.log('Button container:', buttonContainer);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// 在view.ts文件中修改EditMemoModal类
/*
class EditMemoModal extends Modal {
    memo: Memo;
    onSave: (memo: Memo, content: string) => void;
    textArea: HTMLTextAreaElement;
  
    constructor(app: any, memo: Memo, onSave: (memo: Memo, content: string) => void) {
      super(app);
      this.memo = memo;
      this.onSave = onSave;
    }
  
    onOpen() {
      const { contentEl } = this;
      
      // 设置标题
      contentEl.createEl('h2', { text: '编辑笔记', cls: 'memo-lite-edit-title' });
      
      // 创建文本框容器
      const textAreaContainer = contentEl.createDiv({ cls: 'memo-lite-edit-textarea-container' });
      
      // 创建文本框
      this.textArea = textAreaContainer.createEl('textarea', { 
        cls: 'memo-lite-edit-textarea',
        attr: { 
          placeholder: '在此输入笔记内容...',
          spellcheck: 'false'
        }
      });
      this.textArea.value = this.memo.content;
      
      // 创建一个明确的分隔线
      contentEl.createEl('hr');
      
      // 按钮区域 - 使用更明显的样式
      const buttonContainer = contentEl.createDiv();
      buttonContainer.style.padding = '10px';
      buttonContainer.style.marginTop = '10px';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.gap = '10px';
      buttonContainer.style.borderTop = '1px solid #ccc';
      buttonContainer.style.backgroundColor = '#f5f5f5';
      
      // 取消按钮 - 使用更明显的样式
      const cancelButton = buttonContainer.createEl('button', { text: '取消' });
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.backgroundColor = '#e0e0e0';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.addEventListener('click', () => {
        this.close();
      });
      
      // 保存按钮 - 使用更明显的样式
      const saveButton = buttonContainer.createEl('button', { text: '保存' });
      saveButton.style.padding = '8px 16px';
      saveButton.style.backgroundColor = '#4caf50';
      saveButton.style.color = 'white';
      saveButton.style.border = 'none';
      saveButton.style.borderRadius = '4px';
      saveButton.style.cursor = 'pointer';
      saveButton.addEventListener('click', () => {
        this.onSave(this.memo, this.textArea.value);
        this.close();
      });
      
      // 聚焦到文本框
      setTimeout(() => {
        this.textArea.focus();
      }, 10);
      
      // 设置模态框宽度和高度 - 简化设置
      this.modalEl.classList.add('memo-lite-edit-modal');
      this.modalEl.style.width = '80%';
      this.modalEl.style.maxWidth = '700px';
      this.modalEl.style.height = '70vh';
      
      // 确保内容区域有足够的高度
      contentEl.style.display = 'flex';
      contentEl.style.flexDirection = 'column';
      contentEl.style.height = '100%';
    }
  
    onClose() {
      const { contentEl } = this;
      contentEl.empty();
    }
  }
*/
// 标签自动补全菜单
class TagSuggestionMenu {
  containerEl: HTMLElement;
  suggestionEls: HTMLElement[] = [];
  suggestions: string[] = [];
  selectedIndex: number = 0;
  onSelectTag: (tag: string) => void;
  inputEl: HTMLTextAreaElement;
  menuEl: HTMLElement | null = null;
  
  constructor(containerEl: HTMLElement, inputEl: HTMLTextAreaElement, onSelectTag: (tag: string) => void) {
    // 使用输入框的父元素作为容器，确保菜单可以相对于输入框定位
    this.containerEl = inputEl.parentElement || containerEl;
    this.onSelectTag = onSelectTag;
    this.inputEl = inputEl;
    
    // 创建建议菜单元素
    this.menuEl = this.containerEl.createDiv({ cls: 'memo-lite-tag-suggestion-menu' });
  }
  
  // 显示建议菜单
  // 修改TagSuggestionMenu类中的show方法
// 修改TagSuggestionMenu类的show方法
  // 修改TagSuggestionMenu类的show方法，添加null检查
  show(suggestions: string[], tagPrefix: string): void {
    this.hide();
    this.suggestions = suggestions;
    
    if (suggestions.length === 0) {
      return;
    }
    
    // 创建或获取菜单元素
    if (!this.menuEl) {
      this.menuEl = this.containerEl.createDiv({ cls: 'memo-lite-tag-suggestion-menu' });
    }
    
    this.menuEl.empty();
    this.menuEl.style.display = 'block';
    
    // 添加建议项
    this.suggestionEls = suggestions.map((tag, index) => {
      const suggestionEl = this.menuEl!.createDiv({ cls: `memo-lite-tag-suggestion ${index === 0 ? 'selected' : ''}` });
      const highlightedTag = `<strong>#${tagPrefix}</strong>${tag.slice(tagPrefix.length)}`;
      suggestionEl.innerHTML = highlightedTag;
      
      suggestionEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onSelectTag(tag);
        this.hide();
      });
      
      suggestionEl.addEventListener('mouseenter', () => {
        this.setSelectedIndex(index);
      });
      
      return suggestionEl;
    });
    
    this.selectedIndex = 0;
    
    // 统一定位方法，不区分中英文
    const inputRect = this.inputEl.getBoundingClientRect();
    
    // 始终将菜单定位在输入框的下方、偏左位置
    // 这样无论输入什么内容，菜单位置都是一致的
    this.menuEl.style.position = 'fixed';
    this.menuEl.style.left = `${inputRect.left}px`;
    this.menuEl.style.top = `${inputRect.top + 30}px`; // 输入框下方30px处
    
    // 确保菜单不超出视口
    setTimeout(() => {
      if (!this.menuEl) return;
      
      const menuRect = this.menuEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 水平调整
      if (menuRect.right > viewportWidth - 10) {
        this.menuEl.style.left = `${viewportWidth - menuRect.width - 10}px`;
      }
      
      // 垂直调整
      if (menuRect.bottom > viewportHeight - 10) {
        this.menuEl.style.top = `${inputRect.top - menuRect.height - 10}px`; // 放在输入框上方
      }
    }, 0);
  }
  
  // 隐藏建议菜单
  hide(): void {
    if (this.menuEl) {
      this.menuEl.style.display = 'none';
      this.menuEl.empty();
    }
    this.suggestionEls = [];
    this.suggestions = [];
  }
  
  // 选择下一个建议
  selectNext(): void {
    if (this.suggestions.length === 0) return;
    this.setSelectedIndex((this.selectedIndex + 1) % this.suggestions.length);
  }
  
  // 选择上一个建议
  selectPrevious(): void {
    if (this.suggestions.length === 0) return;
    this.setSelectedIndex((this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length);
  }
  
  // 设置选中的建议索引
  setSelectedIndex(index: number): void {
    if (this.suggestions.length === 0) return;
    
    // 移除之前的选中状态
    if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestionEls.length) {
      this.suggestionEls[this.selectedIndex].removeClass('selected');
    }
    
    this.selectedIndex = index;
    
    // 添加新的选中状态
    if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestionEls.length) {
      this.suggestionEls[this.selectedIndex].addClass('selected');
      
      // 确保选中项在可视范围内
      this.suggestionEls[this.selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  // 获取当前选中的建议
  getSelectedSuggestion(): string | null {
    if (this.suggestions.length === 0 || this.selectedIndex < 0 || this.selectedIndex >= this.suggestions.length) {
      return null;
    }
    return this.suggestions[this.selectedIndex];
  }
  
  // 获取光标位置坐标
  getCursorCoordinates(): { left: number; top: number } | null {
    // 创建一个临时元素来测量位置
    const tempEl = document.createElement('div');
    tempEl.style.position = 'absolute';
    tempEl.style.visibility = 'hidden';
    tempEl.style.whiteSpace = 'pre-wrap';
    tempEl.style.wordWrap = 'break-word';
    tempEl.style.width = `${this.inputEl.offsetWidth}px`;
    tempEl.style.fontSize = window.getComputedStyle(this.inputEl).fontSize;
    tempEl.style.fontFamily = window.getComputedStyle(this.inputEl).fontFamily;
    tempEl.style.lineHeight = window.getComputedStyle(this.inputEl).lineHeight;
    tempEl.style.padding = window.getComputedStyle(this.inputEl).padding;
    
    // 在光标位置插入一个标记
    const cursorPos = this.inputEl.selectionStart || 0;
    const textBeforeCursor = this.inputEl.value.substring(0, cursorPos);
    const textAfterCursor = this.inputEl.value.substring(cursorPos);
    tempEl.innerHTML = textBeforeCursor + '<span id="cursor-marker">|</span>' + textAfterCursor;
    
    document.body.appendChild(tempEl);
    
    // 获取标记位置
    const markerEl = document.getElementById('cursor-marker');
    if (!markerEl) {
      document.body.removeChild(tempEl);
      return null;
    }
    
    const markerRect = markerEl.getBoundingClientRect();
    const inputRect = this.inputEl.getBoundingClientRect();
    
    document.body.removeChild(tempEl);
    
    return {
      left: markerRect.left,
      top: markerRect.top - inputRect.top + this.inputEl.offsetTop
    };
  }
    // 在 TagSuggestionMenu 类的 destroy 方法中
  destroy() {
    this.hide(); // 确保菜单隐藏
    
    // 移除所有建议元素及其事件监听器
    this.suggestionEls.forEach(el => {
      // 使用标准 DOM 方法移除事件
      const clickListeners = el.getAttribute('data-click-listeners');
      if (clickListeners) {
        el.removeEventListener('click', JSON.parse(clickListeners));
      }
      
      const mouseenterListeners = el.getAttribute('data-mouseenter-listeners');
      if (mouseenterListeners) {
        el.removeEventListener('mouseenter', JSON.parse(mouseenterListeners));
      }
      
      // 直接移除元素
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // 清空引用
    this.suggestionEls = [];
    this.suggestions = [];
    
    // 从DOM中移除菜单元素
    if (this.menuEl && this.menuEl.parentNode) {
      this.menuEl.parentNode.removeChild(this.menuEl);
      this.menuEl = null;
    }
  }
}
    // 更新备忘录列表显示

export class MemoView extends ItemView {
  memoManager: MemoManager;
  settings: MemoLiteSettings;
  memos: Memo[] = [];
  tagStats: {tag: string, count: number}[] = [];
  activityData: {date: string, count: number}[] = [];
  weekdays: string[] = ['一', '二', '三', '四', '五', '六', '日'];
  contentEl: HTMLElement;
  inputEl: HTMLTextAreaElement;
  memoListEl: HTMLElement;
  tagListEl: HTMLElement;
  statsEl: HTMLElement;
  searchEl: HTMLInputElement;
  heatmapEl: HTMLElement;
  submitButton: HTMLElement;
  activeTag: string | null = null;
  activeDate: string | null = null;
  isTagsExpanded: boolean = false;
  tagSuggestionMenu: TagSuggestionMenu | null;
  documentClickHandler: (e: MouseEvent) => void;
  templateSelectorEl: HTMLSelectElement;
  availableTemplates: string[] = [];
  tagsContainer: HTMLElement;
  currentEditingCard: HTMLElement | null = null;
  
    // 在 MemoView 类中添加属性来存储绑定后的事件处理函数
  private boundHandleTagAutocompletion: (e: Event) => void;
  private boundHighlightTagsInInput: (e: Event) => void;
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  // 添加缺失的属性声明
  cardEventHandlers: WeakMap<Element, (e: MouseEvent) => void>;
  styleElement: HTMLStyleElement | null = null;
  boundSubmitButtonClick: () => Promise<void>;
  boundTagsHeaderClick: () => void;
  boundSearchInput: () => void;

  constructor(leaf: WorkspaceLeaf, memoManager: MemoManager) {
    super(leaf);
    this.memoManager = memoManager;
    this.settings = memoManager.settings;
    // 初始化点击事件处理器
    this.documentClickHandler = this.handleDocumentClick.bind(this);
    // 初始化卡片事件处理器集合
    this.cardEventHandlers = new WeakMap();
  }
  getViewType(): string {
    return MEMO_VIEW_TYPE;
  }
  getDisplayText(): string {
    return 'Memo Lite';
  }
  getIcon(): string {
    return 'memo-lite';
  }


  async onOpen() {
    // 在 MemoView 类的构造函数中修改或添加这行
    this.weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    // 创建主视图结构
    this.contentEl = this.containerEl.createDiv({ cls: 'memo-lite-container' });
    
    // 创建固定部分（包含统计、热力图、输入框）
    const topSection = this.contentEl.createDiv({ cls: 'memo-lite-top-section' });
    
    // 创建顶部统计信息
    this.statsEl = topSection.createDiv({ cls: 'memo-lite-stats' });
    
    // 创建热力图区域
    const heatmapContainer = topSection.createDiv({ cls: 'memo-lite-heatmap-container' });
    heatmapContainer.createEl('h4', { text: '活跃度' });
    this.heatmapEl = heatmapContainer.createDiv({ cls: 'memo-lite-heatmap' });
    
    // 创建输入区域
    const inputContainer = topSection.createDiv({ cls: 'memo-lite-input-container' });
    
    // 添加模板选择器（如果启用了Obsidian模板）
    if (this.settings.useObsidianTemplates) {
      const templateSelectorContainer = inputContainer.createDiv({ cls: 'memo-lite-template-selector-container' });
      templateSelectorContainer.createEl('label', { text: '选择模板:', cls: 'memo-lite-template-label' });
      this.templateSelectorEl = templateSelectorContainer.createEl('select', { cls: 'memo-lite-template-selector' });
      
      // 添加默认选项
      this.templateSelectorEl.createEl('option', {
        text: '-- 选择模板 --',
        value: ''
      });
      
      // 加载可用模板
      await this.loadAvailableTemplates();
      
      // 添加模板选择事件 - 保存引用以便清理
      const templateChangeHandler = (e: Event) => {
        const selectedTemplate = (e.target as HTMLSelectElement).value;
        if (selectedTemplate) {
          this.applyTemplate(selectedTemplate);
        }
      };
      
      this.templateSelectorEl.addEventListener('change', templateChangeHandler);
      
      // 保存引用以便后续清理
      this.templateSelectorEl.dataset.handlerId = 'templateChange';
      (this as any).templateChangeHandler = templateChangeHandler;
    }
    
    // 创建输入框 - 确保只创建一次
    const inputWrapper = inputContainer.createDiv({ cls: 'memo-lite-input-wrapper' });
    inputWrapper.style.position = 'relative';

    this.inputEl = inputWrapper.createEl('textarea', { 
      cls: 'memo-lite-input',
      attr: { placeholder: '记录你的灵感...\n使用 #标签 来分类' }
    });
    
    this.restoreInputBox();
    
    // 在onOpen方法中，创建输入框后添加这个样式
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .memo-lite-tag {
        color: var(--interactive-accent) !important;
        font-weight: 500 !important;
      }
    `;
    document.head.appendChild(this.styleElement);

    // 添加一个容器来显示已添加的标签
    this.tagsContainer = inputContainer.createDiv({ 
      cls: 'memo-lite-input-tags-container' 
    });
    
    // 绑定事件处理函数，确保在清理时可以正确移除
    this.boundHandleTagAutocompletion = this.handleTagAutocompletion.bind(this);
    this.boundHighlightTagsInInput = this.highlightTagsInInput.bind(this);
    
    // 添加输入事件监听，实时高亮标签
    this.inputEl.addEventListener('input', this.boundHandleTagAutocompletion);
    this.inputEl.addEventListener('input', this.boundHighlightTagsInInput);
    
    // 同时，在滚动和焦点事件中也调用高亮函数
    this.inputEl.addEventListener('scroll', this.boundHighlightTagsInInput);
    this.inputEl.addEventListener('focus', this.boundHighlightTagsInInput);
    
    // 绑定键盘事件处理函数
    this.boundHandleKeydown = (e: KeyboardEvent) => {
      // Ctrl+Enter 提交
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const content = this.inputEl.value.trim();
        if (content) {
          this.memoManager.createMemo(content).then(() => {
            this.inputEl.value = '';
            this.loadData();
            new Notice('笔记已保存');
          });
        }
        return;
      }
      
      // 处理标签建议导航
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
        // 如果建议菜单可见
        if (this.tagSuggestionMenu && this.tagSuggestionMenu.menuEl && 
            this.tagSuggestionMenu.menuEl.style.display !== 'none' && 
            this.tagSuggestionMenu.suggestions.length > 0) {
          e.preventDefault();
          
          if (e.key === 'ArrowUp') {
            this.tagSuggestionMenu.selectPrevious();
          } else if (e.key === 'ArrowDown') {
            this.tagSuggestionMenu.selectNext();
          } else if (e.key === 'Enter' || e.key === 'Tab') {
            const selectedTag = this.tagSuggestionMenu.getSelectedSuggestion();
            if (selectedTag) {
              this.insertTagAtCursor(selectedTag);
              this.tagSuggestionMenu.hide();
            }
          } else if (e.key === 'Escape') {
            this.tagSuggestionMenu.hide();
          }
        }
      }
    };
    
    this.inputEl.addEventListener('keydown', this.boundHandleKeydown);

    // 创建提交按钮
    this.submitButton = inputContainer.createEl('button', {
      cls: 'memo-lite-submit',
      text: this.settings.saveButtonText || '保存'
    });
    
    // 绑定提交按钮点击事件
    this.boundSubmitButtonClick = async () => {
      // 获取所有可视化标签的内容
      const visualTags = Array.from(this.tagsContainer.querySelectorAll('.memo-lite-visual-tag'))
        .map(el => '#' + el.getAttribute('data-content') + ' ');
      
      // 获取输入框内容
      const inputContent = this.inputEl.value.trim();
      
      // 合并内容
      const fullContent = visualTags.join('') + ' ' + inputContent;
      
      // 检查内容是否为空
      if (fullContent.trim()) {
        // 添加内容验证
        if (!this.memoManager.validateContent(fullContent.trim())) {
          new Notice('内容包含不允许的字符或格式');
          return;
        }
        // 创建备忘录
        await this.memoManager.createMemo(fullContent.trim());
        // 清空输入框和标签容器
        this.inputEl.value = '';
        this.tagsContainer.empty();
        // 重置高亮
        this.highlightTagsInInput();
        // 重新加载数据
        await this.loadData();
        // 重新设置高亮（关键！）
        this.setupRealTimeTagHighlight();
        // 显示通知
        new Notice('笔记已保存');
      }
    };
    
    this.submitButton.addEventListener('click', this.boundSubmitButtonClick);
    
    // 创建标签列表区域
    const tagsContainer = topSection.createDiv({ cls: 'memo-lite-tags-container' });
    
    // 创建标签标题和展开/收起按钮
    const tagsHeader = tagsContainer.createDiv({ cls: 'memo-lite-tags-header' });
    tagsHeader.createEl('h4', { text: '标签' });
    const toggleButton = tagsHeader.createEl('span', { 
      cls: 'memo-lite-tags-toggle',
      text: '展开'
    });
    
    // 绑定展开/收起功能
    this.boundTagsHeaderClick = () => {
      this.isTagsExpanded = !this.isTagsExpanded;
      // 设置不同的高度值
      if (this.isTagsExpanded) {
        this.tagListEl.style.maxHeight = '180px'; // 展开状态
        toggleButton.setText('收起');
      } else {
        this.tagListEl.style.maxHeight = '90px';  // 收起状态
        toggleButton.setText('展开');
      }
    };
    
    tagsHeader.addEventListener('click', this.boundTagsHeaderClick);
    
    this.tagListEl = tagsContainer.createDiv({ cls: 'memo-lite-tags' });
    // 设置初始高度
    this.tagListEl.style.maxHeight = '90px';
    
    // 创建Memo列表区域（使用剩余空间）
    const contentSection = this.contentEl.createDiv({ cls: 'memo-lite-content-section' });
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.height = '60vh'; // 固定高度
    contentSection.style.overflow = 'hidden'; // 防止整体溢出
    
    // 创建搜索框 - 移到卡片栏上方
    const searchContainer = contentSection.createDiv({ cls: 'memo-lite-search-container' });
    this.searchEl = searchContainer.createEl('input', {
      cls: 'memo-lite-search',
      attr: { placeholder: '搜索内容或标签...' }
    });
    
    // 绑定搜索事件
    this.boundSearchInput = () => {
      const searchText = this.searchEl.value.toLowerCase();
      // 过滤符合搜索条件的备忘录
      const filteredMemos = this.memos.filter(memo => {
        const content = memo.content.toLowerCase();
        return content.includes(searchText);
      });
      // 更新备忘录列表显示
      // 清空备忘录列表
      this.memoListEl.empty();
      
      // 遍历并显示过滤后的备忘录
      filteredMemos.forEach(memo => {
        const memoEl = this.memoListEl.createDiv({ cls: 'memo-lite-memo' });
        
        // 创建备忘录内容区域
        const contentEl = memoEl.createDiv({ cls: 'memo-lite-memo-content' });
        this.safelyRenderContent(contentEl, memo.content);
        
        // 创建备忘录元信息区域
        const metaEl = memoEl.createDiv({ cls: 'memo-lite-memo-meta' });
        metaEl.createEl('span', { 
          cls: 'memo-lite-memo-date',
          text: moment(memo.date).format('YYYY-MM-DD HH:mm:ss')
        });
        
        // 创建操作按钮区域
        const actionsEl = memoEl.createDiv({ cls: 'memo-lite-memo-actions' });
        
        // 编辑按钮
        const editButton = actionsEl.createEl('button', {
          cls: 'memo-lite-memo-action',
          text: '编辑'
        });
        
        // 使用自定义数据属性存储事件处理函数引用
        const editClickHandler = () => {
          memoEl.dispatchEvent(new MouseEvent('dblclick'));
        };
        
        editButton.addEventListener('click', editClickHandler);
        (editButton as any).memoLiteHandler = editClickHandler;
        
        // 删除按钮
        const deleteButton = actionsEl.createEl('button', {
          cls: 'memo-lite-memo-action',
          text: '删除'
        });
        
        const deleteClickHandler = () => {
          const doNotRemind = localStorage.getItem('memo-lite-do-not-remind-delete') === 'true';
          
          if (doNotRemind) {
            this.memoManager.deleteMemo(memo).then(() => {
              this.loadData();
              new Notice('笔记已删除');
            });
          } else {
            new DeleteConfirmModal(this.app, memo, async (memo) => {
              await this.memoManager.deleteMemo(memo);
              await this.loadData();
              new Notice('笔记已删除');
            }).open();
          }
        };
        
        deleteButton.addEventListener('click', deleteClickHandler);
        (deleteButton as any).memoLiteHandler = deleteClickHandler;
      });
    };
    
    this.searchEl.addEventListener('input', this.boundSearchInput);
    
    const memosContainer = contentSection.createDiv({ cls: 'memo-lite-memos-container' });
    memosContainer.style.flex = '1';
    memosContainer.style.overflow = 'hidden';
    memosContainer.style.display = 'flex';
    memosContainer.style.flexDirection = 'column';
    
    this.memoListEl = memosContainer.createDiv({ cls: 'memo-lite-memos' });
    this.memoListEl.style.overflowY = 'auto';
    this.memoListEl.style.flex = '1';
    this.memoListEl.style.paddingRight = '5px'; // 为滚动条留出空间
    
    // 初始化标签建议菜单
    this.tagSuggestionMenu = new TagSuggestionMenu(this.contentEl, this.inputEl, (tag) => {
      this.insertTagAtCursor(tag);
    });
    
    // 点击其他地方隐藏标签建议
    document.addEventListener('click', this.documentClickHandler);
    
    // 加载数据
    await this.loadData();

    // 设置实时标签高亮 - 确保这是最后调用的方法
    this.setupRealTimeTagHighlight();
  }
// 添加可视化标签
  addVisualTag(tagContent: string): void {
    // 创建标签元素
    const tagEl = this.tagsContainer.createDiv({ cls: 'memo-lite-visual-tag' });
    tagEl.setAttribute('data-content', tagContent);
    
    // 创建标签内容
    const contentEl = tagEl.createSpan({ text: '#' + tagContent });
    
    // 创建删除按钮
    const removeBtn = tagEl.createSpan({ cls: 'memo-lite-visual-tag-remove', text: '×' });
    
    // 添加删除事件
    removeBtn.addEventListener('click', () => {
      tagEl.remove();
    });
    
    // 显示标签容器
    this.tagsContainer.style.display = 'flex';
  }

// 移除最后一个可视化标签
  removeLastVisualTag(): boolean {
    const tags = this.tagsContainer.querySelectorAll('.memo-lite-visual-tag');
    if (tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      lastTag.remove();
      
      // 如果没有标签了，隐藏容器
      if (this.tagsContainer.children.length === 0) {
        this.tagsContainer.style.display = 'none';
      }
      
      return true;
    }
    return false;
  }

// 在需要时清空所有标签
  clearVisualTags(): void {
    this.tagsContainer.empty();
    this.tagsContainer.style.display = 'none';
  }
  // 加载可用模板
  async loadAvailableTemplates() {
    if (!this.settings.useObsidianTemplates || !this.templateSelectorEl) {
      return;
    }
    // 清空当前选项（保留默认选项）
    while (this.templateSelectorEl.options.length > 1) {
      this.templateSelectorEl.remove(1);
    }
    // 获取可用的模板
    this.availableTemplates = await this.memoManager.getAvailableTemplates();
    // 添加到下拉列表
    this.availableTemplates.forEach(template => {
      this.templateSelectorEl.createEl('option', {
        text: template,
        value: template
      });
    });
  }
  // 刷新模板选择器（供外部调用）
  async refreshTemplateSelector() {
    await this.loadAvailableTemplates();
  }
  // 应用选定的模板
  async applyTemplate(templateName: string) {
    const templateContent = await this.memoManager.getTemplateContent(templateName);
    if (templateContent) {
      // 解析模板内容（可能需要去除前置YAML等）
      const cleanContent = this.cleanTemplateContent(templateContent);
      // 应用到输入框
      this.inputEl.value = cleanContent;
      // 聚焦到输入框
      this.inputEl.focus();
    }
  }
  // 清理模板内容（去除前置YAML等）
  cleanTemplateContent(content: string): string {
    // 去除前置YAML
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (yamlMatch) {
      content = content.replace(yamlMatch[0], '');
    }
    // 去除前后空白
    return content.trim();
  }
  // 处理文档点击事件
  handleDocumentClick(e: MouseEvent) {
    if (this.inputEl && !e.composedPath().includes(this.inputEl) && this.tagSuggestionMenu) {
      this.tagSuggestionMenu.hide();
    }
  }
  // 处理标签自动补全
  handleTagAutocompletion() {
    const cursorPos = this.inputEl.selectionStart || 0;
    const text = this.inputEl.value;
    // 查找光标位置之前的最后一个 # 字符
    let startPos = cursorPos - 1;
    while (startPos >= 0 && text[startPos] !== '#' && text[startPos] !== ' ' && text[startPos] !== '\n') {
      startPos--;
    }
    // 如果找到 # 字符，并且它前面是空格或在行首
    if (startPos >= 0 && text[startPos] === '#' && (startPos === 0 || /\s/.test(text[startPos - 1]))) {
      // 提取已输入的标签前缀
      const tagPrefix = text.substring(startPos + 1, cursorPos);
      // 只有当前缀非空时才显示建议
      if (tagPrefix.length > 0 && this.tagSuggestionMenu) {
        // 根据前缀查找匹配的标签
        const matchingTags = this.tagStats
          .map(tagStat => tagStat.tag)
          .filter(tag => tag.toLowerCase().startsWith(tagPrefix.toLowerCase()));
        // 显示建议菜单
        this.tagSuggestionMenu.show(matchingTags, tagPrefix);
        return;
      }
    }
    // 隐藏建议菜单
    if (this.tagSuggestionMenu) {
      this.tagSuggestionMenu.hide();
    }
  }
  // 添加在类的其他方法旁边，比如在handleTagAutocompletion方法后面
  // 简化版的高亮函数
  highlightTagsInInput() {
    // 如果输入框不可见，先恢复它
    this.inputEl.style.opacity = '1';
    this.inputEl.style.color = '';  // 恢复默认颜色
    
    // 获取输入框内容
    const text = this.inputEl.value;
    
    // 确保父元素存在
    const parentElement = this.inputEl.parentElement;
    if (!parentElement) return;
    
    // 移除任何之前添加的预览层
    const existingPreview = parentElement.querySelector('.memo-lite-input-preview');
    if (existingPreview) {
      parentElement.removeChild(existingPreview);
    }
    
    // 移除任何假光标
    const fakeCursor = parentElement.querySelector('.memo-lite-fake-cursor');
    if (fakeCursor) {
      parentElement.removeChild(fakeCursor);
    }
    
    // 创建一个简单的正则来查找标签
    const tagRegex = /#([^\s#]+)/g;
    
    // 如果没有标签，直接返回，不应用任何特殊样式
    if (!text.match(tagRegex)) return;
    
    // 否则，应用特殊样式
    // 修改输入框本身的CSS规则来处理标签
    const style = document.createElement('style');
    style.textContent = `
      .memo-lite-input-wrapper .memo-lite-input {
        color: var(--text-normal);
      }
      
      /* 这里不会直接高亮标签，但会设置输入框的基本样式 */
    `;
    document.head.appendChild(style);
  }
  // 在MemoView类中添加这个方法
  setupRealTimeTagHighlight() {
    // 确保必要的元素存在
    if (!this.inputEl || !this.inputEl.parentElement) return;
    
    const parentElement = this.inputEl.parentElement;
    
    // 1. 查找是否已经存在显示层，如果存在则移除它
    const existingDisplayLayer = parentElement.querySelector('.memo-lite-display-layer');
    if (existingDisplayLayer) {
      parentElement.removeChild(existingDisplayLayer);
    }
    
    // 2. 创建一个新的显示层
    const displayLayer = document.createElement('div');
    displayLayer.className = 'memo-lite-display-layer';
    
    // 复制输入框的关键样式
    const inputStyle = window.getComputedStyle(this.inputEl);
    displayLayer.style.position = 'absolute';
    displayLayer.style.top = '0';
    displayLayer.style.left = '0';
    displayLayer.style.width = '100%';
    displayLayer.style.height = '100%';
    displayLayer.style.padding = inputStyle.padding;
    displayLayer.style.fontFamily = inputStyle.fontFamily;
    displayLayer.style.fontSize = inputStyle.fontSize;
    displayLayer.style.lineHeight = inputStyle.lineHeight;
    displayLayer.style.backgroundColor = 'transparent';
    displayLayer.style.overflow = 'auto';
    displayLayer.style.whiteSpace = 'pre-wrap';
    displayLayer.style.wordBreak = 'break-word';
    displayLayer.style.zIndex = '2';
    displayLayer.style.pointerEvents = 'none'; // 确保点击事件穿透到输入框
    
    parentElement.appendChild(displayLayer);
    
    // 3. 清除之前可能存在的样式
    const existingStyles = document.head.querySelectorAll('style.memo-lite-tag-styles');
    existingStyles.forEach(style => document.head.removeChild(style));
    
    // 4. 添加新样式
    const styleElement = document.createElement('style');
    styleElement.className = 'memo-lite-tag-styles';
    styleElement.textContent = `
      .memo-lite-input-wrapper .memo-lite-input {
        color: transparent !important;
        caret-color: var(--text-normal) !important;
        background-color: transparent !important;
      }
      
      .memo-lite-input-wrapper .memo-lite-input::placeholder {
        color: transparent !important; /* 确保占位符也是透明的 */
      }
      
      .memo-lite-display-layer .memo-lite-tag {
        color: #40c463 !important; /* 浅绿色 */
        font-weight: 500 !important;
        background-color: rgba(64, 196, 99, 0.1) !important;
        border-radius: 4px !important;
        padding: 0 !important;
      }
      
      /* 自定义占位符样式 */
      .memo-lite-display-placeholder {
        color: var(--text-muted) !important;
        opacity: 0.7 !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // 5. 优化高亮处理函数
    const updateHighlight = () => {
      // 获取输入文本和滚动位置
      const text = this.inputEl.value;
      const scrollTop = this.inputEl.scrollTop;
      
      // 如果输入框为空，显示自定义占位符
      // 如果输入框为空，显示自定义占位符
    if (!text) {
      displayLayer.empty();
      const placeholder = displayLayer.createSpan({ cls: 'memo-lite-display-placeholder' });
      placeholder.setText('记录你的灵感...\n使用 #标签 来分类');
    } else {
      // 否则高亮标签
      displayLayer.empty();
      const parts = text.split(/(#[^\s#]+)/g);
      parts.forEach(part => {
        if (part.startsWith('#')) {
          // 这是一个标签
          const tagSpan = displayLayer.createSpan({ cls: 'memo-lite-tag' });
          tagSpan.setText(part);
        } else if (part) {
          // 这是普通文本
          displayLayer.createSpan().setText(part);
        }
      });
    }
      
      // 同步滚动位置
      displayLayer.scrollTop = scrollTop;
    };
    
    // 6. 清理和重新添加事件监听器
    // 首先移除可能存在的旧监听器以避免重复
    this.inputEl.removeEventListener('input', updateHighlight);
    this.inputEl.removeEventListener('scroll', updateHighlight);
    this.inputEl.removeEventListener('focus', updateHighlight);
    this.inputEl.removeEventListener('blur', updateHighlight);
    
    // 添加新的监听器
    this.inputEl.addEventListener('input', updateHighlight);
    this.inputEl.addEventListener('scroll', () => {
      displayLayer.scrollTop = this.inputEl.scrollTop;
    });
    this.inputEl.addEventListener('focus', updateHighlight);
    this.inputEl.addEventListener('blur', updateHighlight);
    
    // 7. 初始化（确保立即更新）
    updateHighlight();
  }
  // 在setupRealTimeTagHighlight之后添加这个方法
  calibrateDisplayLayer() {
    const displayLayer = this.inputEl.parentElement?.querySelector('.memo-lite-display-layer') as HTMLElement;
    if (!displayLayer) return;
    
    // 创建测试元素进行精确校准
    const testString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    // 创建用于测量的span
    const measureSpan = document.createElement('span');
    measureSpan.style.visibility = 'hidden';
    measureSpan.style.position = 'absolute';
    measureSpan.style.whiteSpace = 'pre';
    measureSpan.style.fontFamily = window.getComputedStyle(this.inputEl).fontFamily;
    measureSpan.style.fontSize = window.getComputedStyle(this.inputEl).fontSize;
    measureSpan.textContent = testString;
    document.body.appendChild(measureSpan);
    
    // 创建用于测量高亮文本的span
    const highlightSpan = document.createElement('span');
    highlightSpan.style.visibility = 'hidden';
    highlightSpan.style.position = 'absolute';
    highlightSpan.style.whiteSpace = 'pre';
    highlightSpan.style.fontFamily = window.getComputedStyle(displayLayer).fontFamily;
    highlightSpan.style.fontSize = window.getComputedStyle(displayLayer).fontSize;
    highlightSpan.innerHTML = `<span class="memo-lite-tag">${testString}</span>`;
    document.body.appendChild(highlightSpan);
    
    // 计算宽度差异
    const normalWidth = measureSpan.getBoundingClientRect().width;
    const highlightWidth = highlightSpan.getBoundingClientRect().width;
    const widthDiff = highlightWidth - normalWidth;
    
    // 如果有显著差异，应用校正
    if (Math.abs(widthDiff) > 1) {
      const correction = -widthDiff / testString.length;
      displayLayer.style.letterSpacing = `${correction}px`;
    }
    
    // 清理测试元素
    document.body.removeChild(measureSpan);
    document.body.removeChild(highlightSpan);
  }
// 恢复输入框并设置基本样式
  restoreInputBox() {
  // 直接使用 this.inputEl
  if (this.inputEl) {
    // 恢复输入框的基本样式
    this.inputEl.style.opacity = '1';
    this.inputEl.style.color = 'var(--text-normal)';
    this.inputEl.style.caretColor = 'var(--text-normal)';
    this.inputEl.style.backgroundColor = 'var(--background-primary)';
    
    // 移除父元素中可能影响输入框的元素
    const parentElement = this.inputEl.parentElement;
    if (parentElement) {
      const preview = parentElement.querySelector('.memo-lite-input-preview');
      if (preview) preview.remove();
      
      const fakeCursor = parentElement.querySelector('.memo-lite-fake-cursor');
      if (fakeCursor) fakeCursor.remove();
    }
  }
  
  // 添加新的样式，确保所有标签都使用绿色
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .memo-lite-tag {
      color: #40c463 !important; /* 浅绿色 */
      font-weight: 500 !important;
    }
    
    .memo-lite-memo-content .memo-lite-tag {
      background-color: rgba(64, 196, 99, 0.1) !important;
      border-radius: 4px !important;
      padding: 0px 2px !important;
    }
  `;
  document.head.appendChild(styleElement);
  }
// 在onOpen方法中，修改输入框创建部分代码，增加一个包装容器
// 找到创建输入框的代码，例如:
// this.inputEl = inputContainer.createEl('textarea', { 
//   cls: 'memo-lite-input',
//   attr: { placeholder: '记录你的灵感...\n使用 #标签 来分类' }
// });

// 修改为:

  // 在handleTagAutocompletion方法后面，添加这个函数
  insertTagAtCursor(tag: string) {
    const cursorPos = this.inputEl.selectionStart || 0;
    const text = this.inputEl.value;
    
    // 查找光标位置之前的最后一个 # 字符
    let startPos = cursorPos - 1;
    while (startPos >= 0 && text[startPos] !== '#' && text[startPos] !== ' ' && text[startPos] !== '\n') {
      startPos--;
    }
    
    // 如果找到 # 字符
    if (startPos >= 0 && text[startPos] === '#') {
      // 替换已输入的标签前缀
      const newText = text.substring(0, startPos + 1) + tag + ' ' + text.substring(cursorPos);
      this.inputEl.value = newText;
      
      // 将光标移到插入的标签后面
      const newCursorPos = startPos + 1 + tag.length + 1;
      this.inputEl.selectionStart = newCursorPos;
      this.inputEl.selectionEnd = newCursorPos;
      
      // 重要：手动触发输入事件，确保显示层更新
      const inputEvent = new Event('input', { bubbles: true });
      this.inputEl.dispatchEvent(inputEvent);
      
      // 额外添加：强制重新计算显示层
      if (this.inputEl.parentElement) {
        const displayLayer = this.inputEl.parentElement.querySelector('.memo-lite-display-layer');
        if (displayLayer) {
          // 更新显示层内容
          const highlightedText = newText.replace(/#([^\s#]+)/g, '<span class="memo-lite-tag">#$1</span>');
          displayLayer.innerHTML = highlightedText || '<br>';
        }
      }
      
      // 额外触发一次滚动事件，确保显示同步
      const scrollEvent = new Event('scroll', { bubbles: true });
      this.inputEl.dispatchEvent(scrollEvent);
    }
  }
  async loadData() {
    this.currentEditingCard = null;
    // 加载所有Memo
    this.memos = await this.memoManager.getAllMemos();
    // 加载标签统计
    this.tagStats = await this.memoManager.getTagStats();
    // 加载活跃度数据
    this.activityData = await this.memoManager.getActivityData();
    //应用高亮效果
    this.highlightTagsInInput();
    // 更新UI
    // 更新统计信息
  
    this.statsEl.empty();
  
    // 创建统计卡片容器
    const statsWrapper = this.statsEl.createDiv({ cls: 'memo-lite-stats-wrapper' });

    // 笔记数量统计卡片
    const memoStatItem = statsWrapper.createDiv({ cls: 'memo-lite-stat-item' });
    memoStatItem.createEl('h2', { text: String(this.memos.length) });
    memoStatItem.createEl('p', { text: 'Memos' });

    // 标签数量统计卡片
    const tagStatItem = statsWrapper.createDiv({ cls: 'memo-lite-stat-item' });
    tagStatItem.createEl('h2', { text: String(this.tagStats.length) });
    tagStatItem.createEl('p', { text: '标签' });

    // 添加天数统计卡片
    // 计算有记录的天数
    const activeDaysCount = new Set(this.memos.map(memo => 
    moment(memo.date).format('YYYY-MM-DD')
    )).size;

    const daysStatItem = statsWrapper.createDiv({ cls: 'memo-lite-stat-item' });
    daysStatItem.createEl('h2', { text: String(activeDaysCount) });
    daysStatItem.createEl('p', { text: '天' });
    
// 更新热力图
    // 渲染热力图
    this.updateHeatmap();
    this.updateTagsList();
    // 根据筛选条件获取要显示的备忘录
    const filteredMemos = this.memos.filter(memo => {
      // 按日期筛选
      if (this.activeDate) {
        const memoDate = moment(memo.date).format('YYYY-MM-DD');
        if (memoDate !== this.activeDate) return false;
      }
      // 按标签筛选
      if (this.activeTag) {
        if (!memo.tags.includes(this.activeTag)) return false;
      }
      return true;
    });
    // 更新备忘录列表
    // 清空备忘录列表
    this.memoListEl.empty();
    
// 找到遍历备忘录的代码，替换为以下代码

// 遍历并显示过滤后的备忘录
// 遍历并显示过滤后的备忘录
  filteredMemos.forEach(memo => {
    const memoEl = this.memoListEl.createDiv({ cls: 'memo-lite-memo-item' });
    
    // 创建备忘录内容区域
    const contentEl = memoEl.createDiv({ cls: 'memo-lite-memo-content' });
    
    // 处理内容中的标签，使其高亮显示
    const processedContent = memo.content.replace(/#([^\s#]+)/g, '<span class="memo-lite-tag">#$1</span>');
    contentEl.innerHTML = processedContent;
    
    // 创建备忘录日期显示
    const dateEl = memoEl.createDiv({ cls: 'memo-lite-memo-date' });
    dateEl.setText(moment(memo.date).format(this.settings.dateFormat));

    // 绑定卡片事件
    this.attachCardEvents(memoEl, memo);
  });
    //设置实时标签高亮
    this.setupRealTimeTagHighlight();
    // 校准显示层
    setTimeout(() => this.calibrateDisplayLayer(), 100);
  
  }
 
  // 添加辅助方法
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // 更新标签列表
  updateTagsList() {
    // 清空标签列表
    this.tagListEl.empty();
    // 如果没有标签，显示提示
    if (this.tagStats.length === 0) {
      this.tagListEl.createEl('div', { 
        cls: 'memo-lite-empty-tags',
        text: '暂无标签' 
      });
      return;
    }
    // 创建"全部"标签
    const allTagEl = this.tagListEl.createEl('div', { 
      cls: `memo-lite-tag-item ${this.activeTag === null ? 'active' : ''}`,
    });
    allTagEl.createEl('span', { text: '全部' });
    allTagEl.addEventListener('click', () => {
      this.activeTag = null;
      this.activeDate = null; // 同时清除日期筛选
      this.loadData();
    });
    // 添加所有标签
    this.tagStats.forEach(tagStat => {
      const tagEl = this.tagListEl.createEl('div', { 
        cls: `memo-lite-tag-item ${this.activeTag === tagStat.tag ? 'active' : ''}`,
      });
      tagEl.createEl('span', { text: `#${tagStat.tag}` });
      tagEl.createEl('span', { cls: 'memo-lite-tag-count', text: String(tagStat.count) });
      // 点击标签时筛选备忘录
      tagEl.addEventListener('click', () => {
        this.activeTag = tagStat.tag;
        this.activeDate = null; // 切换标签时清除日期筛选
        this.loadData();
      });
      // 添加右键菜单（只有当标签下没有备忘录时才允许删除）
      tagEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const menu = new Menu();
        // 只有当标签计数为0时才显示删除选项
        if (tagStat.count === 0) {
          menu.addItem((item) => {
            item
              .setTitle('删除标签')
              .setIcon('trash')
              .onClick(() => {
                
                new DeleteTagConfirmModal(this.app, tagStat.tag, async (tag) => {
                  await this.memoManager.deleteTag(tag);
                  await this.loadData();
                  new Notice(`标签 #${tag} 已删除`);
                }).open();
                
                
              });
          });
        }
        menu.showAtMouseEvent(e);
         });
        });
   }
      // 更新热力图
    // 更新热力图
  updateHeatmap(): void {
        // 清空原有内容
        this.heatmapEl.empty();
        
        // 如果没有数据，显示提示
        if (this.activityData.length === 0) {
          this.heatmapEl.createEl('div', { text: '暂无活跃数据', cls: 'memo-lite-empty-data' });
          return;
        }
        
        // 创建热力图容器结构
        const heatmapContainerInner = this.heatmapEl.createDiv({ cls: 'memo-lite-heatmap-container-inner' });
        
        // 创建星期标签列
        const weekdaysCol = heatmapContainerInner.createDiv({ cls: 'memo-lite-heatmap-weekdays' });
        
        // 星期标签 - 只显示周一、周三、周五
        const displayWeekdays = [1, 3, 5]; // 周一、周三、周五的索引
        for (let i = 0; i < 7; i++) {
          // 创建标签元素
          const labelEl = weekdaysCol.createEl('div', {
            cls: 'memo-lite-heatmap-weekday-label'
          });
          
          // 只在特定行显示文字
          if (displayWeekdays.includes(i)) {
            labelEl.setText(this.weekdays[i]);
          }
        }
        
        // 创建主热力图区域
        const heatmapMain = heatmapContainerInner.createDiv({ cls: 'memo-lite-heatmap-main' });
        
        // 创建月份标签行
        const monthsRow = heatmapMain.createDiv({ cls: 'memo-lite-heatmap-months' });
        
        // 创建日期网格
        const daysGrid = heatmapMain.createDiv({ cls: 'memo-lite-heatmap-days-grid' });
        
        // 计算日期范围 - 显示最近4个月的数据 (当前月和前3个月)
        const now = moment();
        const startDate = moment().subtract(3, 'months').startOf('month').startOf('week');
        const endDate = now.endOf('month').endOf('week');
        
        // 确保有足够的空间显示完整日期范围
        const totalDays = endDate.diff(startDate, 'days') + 7; // 额外加一周确保完全显示
        
        // 创建日期到活动数据的映射
        const dateActivityMap = new Map();
        this.activityData.forEach(data => {
          dateActivityMap.set(data.date, data.count);
        });
        
        // 计算最大值，用于颜色渐变
        const maxCount = Math.max(...this.activityData.map(d => d.count), 1);
        
        // 先确定需要显示的月份
        const months = [];
        let currentMonthDate = moment().startOf('month');
        
        // 获取当前月和前3个月
        for (let i = 0; i < 4; i++) {
          months.unshift({
            key: currentMonthDate.format('YYYY-MM'),
            label: currentMonthDate.format('M月')
          });
          currentMonthDate.subtract(1, 'month');
        }
        
        // 计算总周数
        const totalWeeks = Math.ceil(endDate.diff(startDate, 'days') / 7);
        const weeksPerMonth = Math.floor(totalWeeks / 4);
        
        // 创建月份标签，确保均匀分布
        // 固定位置的月份标签 - 使用百分比布局代替网格
        monthsRow.style.display = 'flex';
        monthsRow.style.width = '100%';
        monthsRow.style.justifyContent = 'space-between';
        monthsRow.style.paddingLeft = '5%';
        monthsRow.style.paddingRight = '5%';
        
        // 创建4个均匀分布的月份标签
        for (let i = 0; i < months.length; i++) {
          const monthLabel = monthsRow.createDiv({
            cls: 'memo-lite-heatmap-month-label',
            text: months[i].label
          });
          
          // 使用flex布局，均匀分布
          monthLabel.style.flex = '1';
          monthLabel.style.textAlign = 'center';
        }
        
        // 重置日期指针，开始填充日期格子
        let currentDate = startDate.clone();
        
        // 初始化周计数
        let weekIndex = 0;
        let lastDay = -1;
        
        // 创建日期格子
        while (currentDate.isSameOrBefore(endDate)) {
          const dateStr = currentDate.format('YYYY-MM-DD');
          const count = dateActivityMap.get(dateStr) || 0;
          const dayOfWeek = currentDate.day(); // 0是周日，1是周一，...
          
          // 每当遇到周一，增加周计数
          if (dayOfWeek === 1 && lastDay !== 1) {
            weekIndex++;
          }
          lastDay = dayOfWeek;
          
          // 修正星期索引：在CSS网格中，调整让周日在最下面
          const rowIndex = dayOfWeek === 0 ? 7 : dayOfWeek;
          
          // 计算颜色强度
          const intensity = count / maxCount;
          
          // 创建日期格子
          const dayEl = daysGrid.createEl('div', {
            cls: `memo-lite-heatmap-day ${this.activeDate === dateStr ? 'active' : ''}`,
            attr: {
              'data-date': dateStr,
              'data-count': String(count)
            }
          });
          
          // 设置网格位置 - 行是星期几，列是第几周
          dayEl.style.gridRow = rowIndex.toString();
          dayEl.style.gridColumn = weekIndex.toString();
          
          // 设置背景颜色
          dayEl.style.backgroundColor = this.getHeatmapColor(intensity);
          
          // 添加点击事件
          dayEl.addEventListener('click', () => {
            if (this.activeDate === dateStr) {
              this.activeDate = null;
            } else {
              this.activeDate = dateStr;
            }
            this.loadData();
          });
          
          // 添加提示
          dayEl.setAttribute('title', `${dateStr}: ${count} 条笔记`);
          
          currentDate.add(1, 'day');
        }
        
        // 添加图例
        const legendContainer = this.heatmapEl.createDiv({ cls: 'memo-lite-heatmap-legend' });
        legendContainer.createEl('span', { text: '少' });
        
        // 创建颜色方块
        const colorSteps = 5;
        for (let i = 0; i < colorSteps; i++) {
          const intensity = i / (colorSteps - 1);
          const colorBox = legendContainer.createEl('div', { cls: 'memo-lite-heatmap-legend-box' });
          colorBox.style.backgroundColor = this.getHeatmapColor(intensity);
        }
        
        legendContainer.createEl('span', { text: '多' });
  }
  // 获取热力图颜色
  getHeatmapColor(intensity: number): string {
      // 使用GitHub风格的颜色渐变
          if (intensity === 0) {
          return '#ebedf0'; // 最浅的颜色，几乎是白色
          } else if (intensity < 0.25) {
          return '#9be9a8'; // 非常浅的绿色
          } else if (intensity < 0.5) {
          return '#40c463'; // 浅绿色
          } else if (intensity < 0.75) {
          return '#30a14e'; // 中等绿色
          } else {
          return '#216e39'; // 深绿色
          }
  }

    // 辅助方法：给卡片绑定事件
  attachCardEvents(memoEl: HTMLElement, memo: Memo) {
      // 绑定右键菜单事件 - 放在顶层，不要嵌套在其他事件内
      memoEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const menu = new Menu();
        
        // 添加编辑选项
        menu.addItem((item) => {
          item
            .setTitle('编辑')
            .setIcon('pencil')
            .onClick(() => {
              // 触发双击事件
              memoEl.dispatchEvent(new MouseEvent('dblclick'));
            });
        });
        
        // 添加删除选项
        menu.addItem((item) => {
          item
            .setTitle('删除')
            .setIcon('trash')
            .onClick(() => {
              const doNotRemind = localStorage.getItem('memo-lite-do-not-remind-delete') === 'true';
              
              if (doNotRemind) {
                this.memoManager.deleteMemo(memo).then(() => {
                  this.loadData();
                  new Notice('笔记已删除');
                });
              } else {
                new DeleteConfirmModal(this.app, memo, async (memo) => {
                  await this.memoManager.deleteMemo(memo);
                  await this.loadData();
                  new Notice('笔记已删除');
                }).open();
              }
            });
        });
        
        menu.showAtMouseEvent(e);
      });
    
      // 绑定双击事件
      memoEl.addEventListener('dblclick', (e) => {
        e.preventDefault();
        
        // 如果已有正在编辑的卡片，先关闭它
        if (this.currentEditingCard && this.currentEditingCard !== memoEl) {
          // 找到编辑卡片上的取消按钮并模拟点击它
          const cancelButton = this.currentEditingCard.querySelector('.memo-lite-memo-edit-cancel');
          if (cancelButton) {
            (cancelButton as HTMLElement).click();
          }
        }
        
        // 标记当前卡片为编辑状态
        this.currentEditingCard = memoEl;
        
        // 保存原始内容，以便取消时恢复
        const originalContent = memo.content;
        const processedContent = memo.content.replace(/#([^\s#]+)/g, '<span class="memo-lite-tag">#$1</span>');
        
        // 清空卡片内容
        memoEl.empty();
        
        // 添加固定尺寸的编辑容器
        const editContainer = memoEl.createDiv({ cls: 'memo-lite-edit-container' });

        // 添加这段代码：暂时禁用右键菜单
        const originalContextMenuHandler = function(e: MouseEvent) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        };
        
        // 添加拦截右键菜单的事件处理器
        memoEl.addEventListener('contextmenu', originalContextMenuHandler, true);
        editContainer.style.display = 'flex';
        editContainer.style.flexDirection = 'column';
        editContainer.style.height = '200px'; // 固定高度
        editContainer.style.backgroundColor = 'var(--background-primary)';
        editContainer.style.border = '1px solid var(--interactive-accent)';
        editContainer.style.borderRadius = '5px';
        editContainer.style.zIndex = '10';
        editContainer.style.position = 'relative'; // 用于定位内容
    
        // 创建可编辑div，替代textarea和高亮层方案
        const editableDiv = editContainer.createEl('div', {
          cls: 'memo-lite-memo-edit-editable',
          attr: { 
            contenteditable: 'true',
            placeholder: '在此输入笔记内容...'
          }
        });
        
        // 将原始内容中的标签包装在span元素中，实现高亮
        const taggedContent = originalContent.replace(/#([^\s#]+)/g, '<span class="memo-lite-tag">#$1</span>');
        editableDiv.innerHTML = taggedContent;
        
        // 样式设置
        editableDiv.style.width = '100%';
        editableDiv.style.height = '100%';
        editableDiv.style.flex = '1';
        editableDiv.style.overflowY = 'auto';
        editableDiv.style.padding = '10px';
        editableDiv.style.border = 'none';
        editableDiv.style.outline = 'none';
        editableDiv.style.backgroundColor = 'var(--background-primary)';
        editableDiv.style.color = 'var(--text-normal)';
        editableDiv.style.fontFamily = 'inherit';
        editableDiv.style.fontSize = 'inherit';
        editableDiv.style.lineHeight = 'inherit';
        
        // 添加CSS样式，确保标签高亮显示
        const styleEl = document.createElement('style');
        styleEl.id = 'memo-lite-edit-styles-' + Date.now();
        styleEl.textContent = `
          .memo-lite-memo-edit-editable .memo-lite-tag {
            color: #40c463 !important;
            font-weight: 500 !important;
            background-color: rgba(64, 196, 99, 0.1) !important;
            border-radius: 4px !important;
            padding: 0px 2px !important;
          }
          
          .memo-lite-memo-edit-editable:empty:before {
            content: attr(placeholder);
            color: var(--text-muted);
            opacity: 0.6;
          }
        `;
        document.head.appendChild(styleEl);
        
        // 辅助函数：保存选择状态 - 添加类型标注
        function saveSelection(containerEl: HTMLElement): Range[] | null {
          const sel = window.getSelection();
          if (sel && sel.getRangeAt && sel.rangeCount) {
            const ranges: Range[] = [];
            for (let i = 0; i < sel.rangeCount; i++) {
              ranges.push(sel.getRangeAt(i));
            }
            return ranges;
          }
          return null;
        }
        
        // 辅助函数：恢复选择状态 - 添加类型标注
        function restoreSelection(savedSelection: Range[] | null): boolean {
          const sel = window.getSelection();
          if (savedSelection && sel) {
            sel.removeAllRanges();
            for (let i = 0; i < savedSelection.length; i++) {
              sel.addRange(savedSelection[i]);
            }
            return true;
          }
          return false;
        }
        
        // 处理标签高亮的函数
        // 替换processHighlightTags函数
        const processHighlightTags = () => {
          // 保存当前光标在文本中的位置（字符偏移量）
          const selection = window.getSelection();
          if (!selection || !selection.rangeCount) return;
          
          const range = selection.getRangeAt(0);
          const startContainer = range.startContainer;
          const startOffset = range.startOffset;
          
          // 如果光标不在editableDiv中，不处理
          if (!editableDiv.contains(startContainer)) return;
          
          // 计算光标在整个文本中的绝对位置
          let absoluteOffset = 0;
          const calculateOffset = (node: Node, targetNode: Node, targetOffset: number): number | null => {
            if (node === targetNode) {
              return absoluteOffset + targetOffset;
            }
            
            if (node.nodeType === Node.TEXT_NODE) {
              absoluteOffset += node.textContent?.length || 0;
            } else {
              for (let i = 0; i < node.childNodes.length; i++) {
                const childNode = node.childNodes[i];
                const result = calculateOffset(childNode, targetNode, targetOffset);
                if (result !== null) {
                  return result;
                }
              }
            }
            return null;
          };
          
          const cursorPosition = calculateOffset(editableDiv, startContainer, startOffset);
          if (cursorPosition === null) return;
          
          // 获取纯文本内容
          const textContent = editableDiv.innerText;
          
          // 使用正则表达式找出所有标签，但保持HTML结构
          const parts: string[] = [];
          let lastIndex = 0;
          const tagRegex = /#([^\s#]+)/g;
          let match;
          
          while ((match = tagRegex.exec(textContent)) !== null) {
            // 添加标签前的文本
            parts.push(textContent.substring(lastIndex, match.index));
            // 添加带标签的文本
            parts.push(`<span class="memo-lite-tag">${match[0]}</span>`);
            lastIndex = match.index + match[0].length;
          }
          
          // 添加剩余文本
          parts.push(textContent.substring(lastIndex));
          
          // 只有在内容有变化时才更新
          const newHtml = parts.join('');
          if (newHtml !== editableDiv.innerHTML) {
            // 更新HTML
            this.safelySetEditableContent(editableDiv, originalContent);
            
            // 恢复光标位置
            const setCaretPosition = (element: HTMLElement, position: number) => {
                let currentPos = 0;
                const walker = document.createTreeWalker(
                  element,
                  NodeFilter.SHOW_TEXT,
                  null
                );
                
                let node: Node | null = walker.nextNode();
                while (node) {
                  const nodeLength = node.textContent?.length || 0;
                  if (currentPos + nodeLength >= position) {
                    const range = document.createRange();
                    range.setStart(node, position - currentPos);
                    range.collapse(true);
                    
                    const selection = window.getSelection();
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                    return;
                  }
                  
                  currentPos += nodeLength;
                  node = walker.nextNode();
                }
              };
              
              // 设置光标位置
              setCaretPosition(editableDiv, cursorPosition);
          }
        };
        
        // 监听输入事件以应用标签高亮
        // 注意：这种方法可能会影响光标位置，使用节流函数减少处理频率
        let inputTimer: number | null = null;
        editableDiv.addEventListener('input', (e) => {
          // 清除上一个定时器
          if (inputTimer !== null) {
            clearTimeout(inputTimer);
          }
          
          // 设置新的定时器，延迟处理高亮
          inputTimer = window.setTimeout(() => {
            // 只在没有选择文本时处理高亮
            const selection = window.getSelection();
            if (selection && selection.toString() === '') {
              processHighlightTags();
            }
          }, 300); // 300ms延迟，避免频繁处理
        });
        
        // 失去焦点时处理高亮
        editableDiv.addEventListener('blur', () => {
          processHighlightTags();
        });
        
        // 创建按钮容器
        const buttonContainer = editContainer.createDiv({ cls: 'memo-lite-memo-edit-buttons' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.padding = '5px';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.borderTop = '1px solid var(--background-modifier-border)';
        
        // 添加取消按钮
        const cancelButton = buttonContainer.createEl('button', {
          text: '取消',
          cls: 'memo-lite-memo-edit-cancel'
        });
        cancelButton.style.padding = '5px 15px';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.backgroundColor = '#e0e0e0';
        cancelButton.style.cursor = 'pointer';
        
        // 添加保存按钮
        const saveButton = buttonContainer.createEl('button', {
          text: '保存',
          cls: 'memo-lite-memo-edit-save'
        });
        saveButton.style.padding = '5px 15px';
        saveButton.style.border = 'none';
        saveButton.style.borderRadius = '4px';
        saveButton.style.backgroundColor = '#4caf50';
        saveButton.style.color = 'white';
        saveButton.style.cursor = 'pointer';
        
        // 滚动到这个位置确保可见
        memoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // 聚焦到可编辑div
        setTimeout(() => {
          editableDiv.focus();
          
          // 将光标移到末尾
          const range = document.createRange();
          range.selectNodeContents(editableDiv);
          range.collapse(false); // false means collapse to end
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }, 10);
        
        // 添加取消事件
        cancelButton.addEventListener('click', () => {
          // 移除右键菜单拦截器
        memoEl.removeEventListener('contextmenu', originalContextMenuHandler, true);
          // 移除添加的样式
          if (styleEl.parentNode) {
            document.head.removeChild(styleEl);
          }
          
          // 恢复原始卡片
          memoEl.empty();
          
          // 恢复内容区域
          const contentEl = memoEl.createDiv({ cls: 'memo-lite-memo-content' });
          this.safelyRenderContent(contentEl, memo.content);
          
          // 恢复日期显示
          const dateEl = memoEl.createDiv({ cls: 'memo-lite-memo-date' });
          dateEl.setText(moment(memo.date).format(this.settings.dateFormat));
          
          // 重新绑定事件
          this.attachCardEvents(memoEl, memo);
          
          // 清除当前编辑卡片引用
          this.currentEditingCard = null;
        });
        
        // 添加保存事件
        saveButton.addEventListener('click', async () => {
          // 移除右键菜单拦截器
          memoEl.removeEventListener('contextmenu', originalContextMenuHandler, true);
          // 移除添加的样式
          if (styleEl.parentNode) {
            document.head.removeChild(styleEl);
          }
          
          // 获取纯文本内容（不包含HTML标签）
          const newContent = editableDiv.innerText.trim();
          
          if (newContent) {
            // 添加内容验证
            if (!this.memoManager.validateContent(newContent)) {
              new Notice('内容包含不允许的字符或格式');
              return;
    }
            // 保存新内容
            await this.memoManager.editMemo(memo, newContent);
            // 重新加载数据
            await this.loadData();
            // 显示通知
            new Notice('笔记已更新');
          } else {
            // 如果内容为空，恢复原始内容
            memoEl.empty();
            
            const contentEl = memoEl.createDiv({ cls: 'memo-lite-memo-content' });
            contentEl.innerHTML = processedContent;
            
            const dateEl = memoEl.createDiv({ cls: 'memo-lite-memo-date' });
            dateEl.setText(moment(memo.date).format(this.settings.dateFormat));
            
            this.attachCardEvents(memoEl, memo);
            
            // 清除当前编辑卡片引用
            this.currentEditingCard = null;
          }
        });
        
        // 添加点击外部关闭事件
        const handleDocumentClick = (evt: MouseEvent) => {
          if (!editContainer.contains(evt.target as Node) && this.currentEditingCard === memoEl) {
            // 如果点击在编辑区域外且当前正在编辑，自动取消
            cancelButton.click();
            document.removeEventListener('click', handleDocumentClick);
          }
        };
        
        // 延迟添加点击事件，避免当前点击立即触发
        setTimeout(() => {
          document.addEventListener('click', handleDocumentClick);
          
          // 保存这个事件处理函数，以便在视图关闭时清除
          // 可以使用WeakMap或其他方式关联元素和事件处理函数
          if (!this.cardEventHandlers) {
            this.cardEventHandlers = new WeakMap();
          }
          this.cardEventHandlers.set(memoEl, handleDocumentClick);
        }, 100);
      });
  }
 // 在 MemoView 类中添加 onClose 方法
  // 添加 onClose 方法来清理事件监听器
  async onClose() {
    // 移除文档点击事件监听器
    document.removeEventListener('click', this.documentClickHandler);
    
    // 移除样式元素
    if (this.styleElement && document.head.contains(this.styleElement)) {
      document.head.removeChild(this.styleElement);
    }
    
    // 移除输入框相关的事件监听器
    if (this.inputEl) {
      this.inputEl.removeEventListener('input', this.boundHandleTagAutocompletion);
      this.inputEl.removeEventListener('input', this.boundHighlightTagsInInput);
      this.inputEl.removeEventListener('scroll', this.boundHighlightTagsInInput);
      this.inputEl.removeEventListener('focus', this.boundHighlightTagsInInput);
      this.inputEl.removeEventListener('keydown', this.boundHandleKeydown);
    }
    
    // 移除提交按钮事件监听器
    if (this.submitButton) {
      this.submitButton.removeEventListener('click', this.boundSubmitButtonClick);
    }
    
    // 移除标签头部事件监听器
    const tagsHeader = this.contentEl.querySelector('.memo-lite-tags-header');
    if (tagsHeader) {
      tagsHeader.removeEventListener('click', this.boundTagsHeaderClick);
    }
    
    // 移除搜索框事件监听器
    if (this.searchEl) {
      this.searchEl.removeEventListener('input', this.boundSearchInput);
    }
    
    // 移除模板选择器事件监听器
    if (this.templateSelectorEl && (this as any).templateChangeHandler) {
      this.templateSelectorEl.removeEventListener('change', (this as any).templateChangeHandler);
    }
    
    // 移除卡片上的事件监听器
    this.memoListEl?.querySelectorAll('.memo-lite-memo-action').forEach(button => {
      const handler = (button as any).memoLiteHandler;
      if (handler) {
        button.removeEventListener('click', handler);
        delete (button as any).memoLiteHandler;
      }
    });
    
    // 清除可能正在编辑的卡片
    if (this.currentEditingCard) {
      const cancelButton = this.currentEditingCard.querySelector('.memo-lite-memo-edit-cancel');
      if (cancelButton) {
        (cancelButton as HTMLElement).click();
      }
      this.currentEditingCard = null;
    }
    
    // 清理标签建议菜单
    // 清理标签建议菜单
    if (this.tagSuggestionMenu) { 
      // 如果TagSuggestionMenu类中有destroy方法，调用它
      if (typeof this.tagSuggestionMenu.destroy === 'function') {
        this.tagSuggestionMenu.destroy();
      } else {
        // 否则至少隐藏菜单
        this.tagSuggestionMenu.hide();
      }
      this.tagSuggestionMenu = null;
    }
    // 清理所有卡片相关的临时事件监听器
    if (this.cardEventHandlers) {
      this.memoListEl?.querySelectorAll('.memo-lite-memo-item').forEach(card => {
        const handler = this.cardEventHandlers.get(card);
        if (handler) {
          document.removeEventListener('click', handler);
        }
      });
    }
    // 清空DOM元素
    this.contentEl.empty();
  }

    // 在MemoView类中添加一个新的辅助方法：
  safelyRenderContent(container: HTMLElement, content: string) {
    container.empty(); // 清空容器
    
    // 分割文本并安全处理标签
    const parts = content.split(/(#[^\s#]+)/g);
    parts.forEach(part => {
      if (part.startsWith('#')) {
        // 这是一个标签
        const tagSpan = container.createSpan({ cls: 'memo-lite-tag' });
        tagSpan.setText(part);
      } else if (part) {
        // 这是普通文本
        container.createSpan().setText(part);
      }
    });
  }

  // 添加到MemoView类中
  safelySetEditableContent(editableDiv: HTMLElement, content: string) {
    // 清空现有内容
    editableDiv.empty();
    
    // 分割内容，分离普通文本和标签
    const parts = content.split(/(#[^\s#]+)/g);
    
    // 处理每一部分
    parts.forEach(part => {
      if (part.startsWith('#')) {
        // 创建标签span
        const tagSpan = document.createElement('span');
        tagSpan.className = 'memo-lite-tag';
        tagSpan.textContent = part;
        editableDiv.appendChild(tagSpan);
      } else if (part) {
        // 创建文本节点
        const textNode = document.createTextNode(part);
        editableDiv.appendChild(textNode);
      }
    });
  }
}