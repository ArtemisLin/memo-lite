import { App, PluginSettingTab, Setting } from 'obsidian';
import MemoLitePlugin from './main';
import { MEMO_VIEW_TYPE } from './view';

export interface MemoLiteSettings {
  memoFolder: string;
  dailyFilenameFormat: string;
  fileNameFormat: string;
  defaultTemplate: string;
  memoTemplate: string;
  dateFormat: string;
  saveButtonText: string;
  templateFolder: string;        // 新增：模板文件夹路径
  useObsidianTemplates: boolean; // 新增：是否使用Obsidian模板
}

export const DEFAULT_SETTINGS: MemoLiteSettings = {
  memoFolder: 'Memos',
  dailyFilenameFormat: 'YYYY-MM-DD',
  fileNameFormat: 'HH:mm:ss',
  defaultTemplate: '---\ntitle: {{date:YYYY-MM-DD}} 日记\n---\n\n',
  memoTemplate: '## {{time:HH:mm:ss}}\n{{content}}\n\n---\n\n',
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  saveButtonText: '保存',
  templateFolder: 'templates',   // 新增：默认模板文件夹
  useObsidianTemplates: false    // 新增：默认不使用
};

export class MemoLiteSettingTab extends PluginSettingTab {
  plugin: MemoLitePlugin;

  constructor(app: App, plugin: MemoLitePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Memo Lite 设置' });

    new Setting(containerEl)
      .setName('Memo 文件夹')
      .setDesc('指定存储 Memo 的文件夹路径')
      .addText(text => text
        .setPlaceholder('Memos')
        .setValue(this.plugin.settings.memoFolder)
        .onChange(async (value) => {
          this.plugin.settings.memoFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('日期文件名格式')
      .setDesc('指定日期文件名格式，使用 Moment.js 格式')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD')
        .setValue(this.plugin.settings.dailyFilenameFormat)
        .onChange(async (value) => {
          this.plugin.settings.dailyFilenameFormat = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Memo ID 格式')
      .setDesc('指定 Memo ID 格式，使用 Moment.js 格式')
      .addText(text => text
        .setPlaceholder('HH:mm:ss')
        .setValue(this.plugin.settings.fileNameFormat)
        .onChange(async (value) => {
          this.plugin.settings.fileNameFormat = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('默认文件模板')
      .setDesc('指定日记文件的默认模板。可用变量：{{date:format}}')
      .addTextArea(text => text
        .setPlaceholder('---\ntitle: {{date:YYYY-MM-DD}} 日记\n---\n\n')
        .setValue(this.plugin.settings.defaultTemplate)
        .onChange(async (value) => {
          this.plugin.settings.defaultTemplate = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Memo 模板')
      .setDesc('指定 Memo 项的模板格式。可用变量：{{time:format}}, {{content}}')
      .addTextArea(text => text
        .setPlaceholder('## {{time:HH:mm:ss}}\n{{content}}\n\n---\n\n')
        .setValue(this.plugin.settings.memoTemplate)
        .onChange(async (value) => {
          this.plugin.settings.memoTemplate = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('日期显示格式')
      .setDesc('指定日期显示格式，使用 Moment.js 格式')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD HH:mm:ss')
        .setValue(this.plugin.settings.dateFormat)
        .onChange(async (value) => {
          this.plugin.settings.dateFormat = value;
          await this.plugin.saveSettings();
        }));
        
    new Setting(containerEl)
      .setName('保存按钮文本')
      .setDesc('自定义保存按钮上显示的文字')
      .addText(text => text
        .setPlaceholder('保存')
        .setValue(this.plugin.settings.saveButtonText || DEFAULT_SETTINGS.saveButtonText)
        .onChange(async (value) => {
          this.plugin.settings.saveButtonText = value;
          await this.plugin.saveSettings();
          
          // 如果视图已经打开，更新按钮文本
          const leaves = this.app.workspace.getLeavesOfType(MEMO_VIEW_TYPE);
          if (leaves.length > 0) {
            const memoView = leaves[0].view as any;
            if (memoView && memoView.submitButton) {
              memoView.submitButton.setText(value || DEFAULT_SETTINGS.saveButtonText);
            }
          }
        }));

    // 新增：模板文件夹设置
    new Setting(containerEl)
      .setName('模板文件夹')
      .setDesc('指定Obsidian模板文件夹路径')
      .addText(text => text
        .setPlaceholder('templates')
        .setValue(this.plugin.settings.templateFolder)
        .onChange(async (value) => {
          this.plugin.settings.templateFolder = value;
          await this.plugin.saveSettings();
        }));

    // 新增：是否使用Obsidian模板设置
    new Setting(containerEl)
      .setName('使用Obsidian模板')
      .setDesc('启用后可以从Obsidian模板文件夹中选择模板')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.useObsidianTemplates)
        .onChange(async (value) => {
          this.plugin.settings.useObsidianTemplates = value;
          await this.plugin.saveSettings();
          
          // 如果视图已打开，刷新模板选择器
          const leaves = this.app.workspace.getLeavesOfType(MEMO_VIEW_TYPE);
          if (leaves.length > 0) {
            const memoView = leaves[0].view as any;
            if (memoView && memoView.refreshTemplateSelector) {
              memoView.refreshTemplateSelector();
            }
          }
        }));
  }
}