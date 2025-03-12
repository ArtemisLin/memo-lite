import { Plugin, WorkspaceLeaf, addIcon } from 'obsidian';
import { MemoView, MEMO_VIEW_TYPE } from './view';
import { MemoLiteSettings, MemoLiteSettingTab, DEFAULT_SETTINGS } from './settings';
import { MemoManager } from './memo-manager';

// 定义一个灯泡图标 - 表示灵感
const MEMO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M50 10 C30 10, 20 30, 20 45 C20 60, 30 70, 35 75 C37 76, 38 78, 38 80 L62 80 C62 78, 63 76, 65 75 C70 70, 80 60, 80 45 C80 30, 70 10, 50 10 Z" fill="rgba(255, 255, 0, 0.2)" />
  <path d="M38 80 L62 80" />
  <path d="M40 87 L60 87" />
  <path d="M44 94 L56 94" />
  <path d="M50 10 C30 10, 20 30, 20 45 C20 60, 30 70, 35 75 C37 76, 38 78, 38 80 L62 80 C62 78, 63 76, 65 75 C70 70, 80 60, 80 45 C80 30, 70 10, 50 10 Z" />
  <circle cx="50" cy="45" r="22" fill="rgba(255, 255, 0, 0.1)" stroke="none" />
</svg>`;

export default class MemoLitePlugin extends Plugin {
  settings: MemoLiteSettings;
  memoManager: MemoManager;

  async onload() {
    await this.loadSettings();

    // 添加自定义图标
    addIcon('memo-lite', MEMO_ICON);

    // 创建备忘录管理器
    this.memoManager = new MemoManager(this.app, this.settings);

    // 注册一个视图类型
    this.registerView(
      MEMO_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new MemoView(leaf, this.memoManager)
    );

    // 添加侧边栏图标
    this.addRibbonIcon('memo-lite', 'Memo Lite', () => {
      this.activateView();
    });

    // 添加命令
    this.addCommand({
      id: 'open-memo-lite',
      name: '打开 Memo Lite',
      callback: () => {
        this.activateView();
      },
    });

    // 添加设置面板
    this.addSettingTab(new MemoLiteSettingTab(this.app, this));
    
    // 确保 Memo 文件夹存在
    this.app.workspace.onLayoutReady(async () => {
      await this.memoManager.ensureMemoFolder();
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(MEMO_VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // 当设置改变时，通知所有打开的视图更新
    this.app.workspace.getLeavesOfType(MEMO_VIEW_TYPE).forEach(leaf => {
      if (leaf.view instanceof MemoView) {
        // 更新视图的设置
        (leaf.view as MemoView).onClose();
        
        // 如果需要立即应用某些设置
        if ((leaf.view as MemoView).submitButton) {
          (leaf.view as MemoView).submitButton.setText(this.settings.saveButtonText || DEFAULT_SETTINGS.saveButtonText);
        }
      }
    });
      // 然后分离叶子
    this.app.workspace.detachLeavesOfType(MEMO_VIEW_TYPE);

  }

  async activateView() {
    const { workspace } = this.app;
    
    // 如果视图已经打开，激活它
    let leaf = workspace.getLeavesOfType(MEMO_VIEW_TYPE)[0];
    
    if (leaf) {
      workspace.revealLeaf(leaf);
      return;
    }

    // 否则，创建一个新的视图
    // 优先尝试获取右侧叶子
    const rightLeaf = workspace.getRightLeaf(false);
    if (rightLeaf) {
      await rightLeaf.setViewState({
        type: MEMO_VIEW_TYPE,
        active: true,
      });

      leaf = workspace.getLeavesOfType(MEMO_VIEW_TYPE)[0];
      if (leaf) {
        workspace.revealLeaf(leaf);
      }
      return;
    }
    
    // 如果无法获取右侧叶子，尝试创建新的叶子
    leaf = workspace.getLeaf('tab');
    await leaf.setViewState({
      type: MEMO_VIEW_TYPE,
      active: true,
    });
    
    workspace.revealLeaf(leaf);
  }
}