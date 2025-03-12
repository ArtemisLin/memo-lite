import { App, TFolder, TFile, moment } from 'obsidian';
import { MemoLiteSettings } from './settings';

export interface Memo {
  id: string;
  content: string;
  tags: string[];
  date: Date;
  filePath: string;
  position: number;
  length: number;
}

export class MemoManager {
  app: App;
  settings: MemoLiteSettings;

  constructor(app: App, settings: MemoLiteSettings) {
    this.app = app;
    this.settings = settings;
  }

  async getAvailableTemplates(): Promise<string[]> {
    if (!this.settings.useObsidianTemplates) {
      return [];
    }

    const templatesFolder = this.app.vault.getAbstractFileByPath(this.settings.templateFolder);
    if (templatesFolder instanceof TFolder) {
      return templatesFolder.children
        .filter(file => file instanceof TFile && file.extension === 'md')
        .map(file => (file as TFile).name.replace('.md', ''));
    }
    return [];
  }

  async getTemplateContent(templateName: string): Promise<string | null> {
    const templatePath = `${this.settings.templateFolder}/${templateName}.md`;
    const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
    
    if (templateFile instanceof TFile) {
      return await this.app.vault.read(templateFile);
    }
    return null;
  }

  async ensureMemoFolder(): Promise<TFolder> {
    const folderPath = this.settings.memoFolder;
    if (!(this.app.vault.getAbstractFileByPath(folderPath) instanceof TFolder)) {
      await this.app.vault.createFolder(folderPath);
    }
    return this.app.vault.getAbstractFileByPath(folderPath) as TFolder;
  }

  async createMemo(content: string): Promise<Memo | null> {
    try {
      // 确保Memo文件夹存在
      await this.ensureMemoFolder();

      // 提取标签
      const tagRegex = /#([^\s#]+)/g;
      const tags: string[] = [];
      let match;
      while ((match = tagRegex.exec(content)) !== null) {
        tags.push(match[1]);
      }

      // 获取当前日期和时间
      const now = new Date();
      const momentDate = moment(now);
      
      // 生成文件名
      const dateString = momentDate.format(this.settings.dailyFilenameFormat);
      const filePath = `${this.settings.memoFolder}/${dateString}.md`;
      
      // 生成Memo ID
      const memoId = momentDate.format(this.settings.fileNameFormat);
      
      // 检查文件是否存在
      let file = this.app.vault.getAbstractFileByPath(filePath);
      
      // 如果文件不存在，创建新文件
      if (!(file instanceof TFile)) {
        let fileContent = this.settings.defaultTemplate;
        fileContent = fileContent.replace(/{{date:([^}]+)}}/g, (_, format) => momentDate.format(format));
        file = await this.app.vault.create(filePath, fileContent);
      }
      
      // 读取文件内容
      let fileContent = await this.app.vault.read(file as TFile);
      
      // 生成Memo内容
      let memoContent = this.settings.memoTemplate;
      memoContent = memoContent.replace('{{content}}', content);
      memoContent = memoContent.replace(/{{time:([^}]+)}}/g, (_, format) => momentDate.format(format));
      
      // 计算插入位置
      const lineCount = fileContent.split('\n').length;
      
      // 添加Memo内容到文件末尾
      fileContent += memoContent;
      
      // 更新文件
      await this.app.vault.modify(file as TFile, fileContent);
      
      // 计算Memo长度
      const memoLines = memoContent.split('\n').length;
      
      // 返回创建的Memo
      return {
        id: memoId,
        content: content,
        tags: tags,
        date: now,
        filePath: filePath,
        position: lineCount,
        length: memoLines
      };
    } catch (error) {
      console.error('创建Memo失败', error);
      return null;
    }
  }

  async getAllMemos(): Promise<Memo[]> {
    try {
      // 确保Memo文件夹存在
      const memoFolder = await this.ensureMemoFolder();
      
      // 存储所有Memo
      const allMemos: Memo[] = [];
      
      // 遍历文件夹中的所有文件
      for (const child of memoFolder.children) {
        if (child instanceof TFile && child.extension === 'md') {
          const fileContent = await this.app.vault.read(child);
          const memos = this.parseMemos(fileContent, child.path);
          allMemos.push(...memos);
        }
      }
      
      // 按日期排序（最新的在前）
      return allMemos.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('获取Memo失败', error);
      return [];
    }
  }

  parseMemos(content: string, filePath: string): Memo[] {
    const memos: Memo[] = [];
    const lines = content.split('\n');
    
    // 跳过YAML前言
    let startLine = 0;
    if (lines[0] === '---') {
      const yamlEndIndex = lines.findIndex((line, index) => index > 0 && line === '---');
      if (yamlEndIndex !== -1) {
        startLine = yamlEndIndex + 1;
      }
    }
    
    // 当前正在解析的Memo
    let currentMemo: {
      content: string;
      startLine: number;
      time: string;
    } | null = null;
    
    // 解析每一行
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      // 如果是Memo标题行（## 时间戳）
      if (line.startsWith('## ')) {
        // 如果已经有正在解析的Memo，保存它
        if (currentMemo) {
          const timeStr = currentMemo.time;
          const dateStr = filePath.split('/').pop()?.replace('.md', '') || '';
          
          let memoDate: Date;
          try {
            memoDate = moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm:ss').toDate();
          } catch (error) {
            memoDate = new Date();
          }
          
          const memoId = `${dateStr}-${currentMemo.startLine}`;
          const memoContent = currentMemo.content.trim();
          const memoTags = this.extractTags(memoContent);
          
          memos.push({
            id: memoId,
            content: memoContent,
            tags: memoTags,
            date: memoDate,
            filePath: filePath,
            position: currentMemo.startLine,
            length: i - currentMemo.startLine
          });
        }
        
        // 开始解析新的Memo
        const timeMatch = line.match(/## (.*)/);
        const time = timeMatch ? timeMatch[1].trim() : '';
        
        currentMemo = {
          content: '',
          startLine: i,
          time: time
        };
      } 
      // 如果不是分隔符，且有正在解析的Memo，添加内容
      else if (currentMemo && line !== '---') {
        currentMemo.content += line + '\n';
      }
    }
    
    // 处理最后一个Memo
    if (currentMemo) {
      const timeStr = currentMemo.time;
      const dateStr = filePath.split('/').pop()?.replace('.md', '') || '';
      
      let memoDate: Date;
      try {
        memoDate = moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm:ss').toDate();
      } catch (error) {
        memoDate = new Date();
      }
      
      const memoId = `${dateStr}-${currentMemo.startLine}`;
      const memoContent = currentMemo.content.trim();
      const memoTags = this.extractTags(memoContent);
      
      memos.push({
        id: memoId,
        content: memoContent,
        tags: memoTags,
        date: memoDate,
        filePath: filePath,
        position: currentMemo.startLine,
        length: lines.length - currentMemo.startLine
      });
    }
    
    return memos;
  }

  extractTags(content: string): string[] {
    const tags: string[] = [];
    const tagRegex = /#([^\s#]+)/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    
    return tags;
  }

  async editMemo(memo: Memo, newContent: string): Promise<Memo | null> {
    try {
      // 获取文件
      const file = this.app.vault.getAbstractFileByPath(memo.filePath);
      if (!(file instanceof TFile)) {
        throw new Error(`找不到文件: ${memo.filePath}`);
      }
      
      // 读取文件内容并分割成行
      const lines = (await this.app.vault.read(file)).split('\n');
      
      // 确定修改范围
      const startLine = memo.position;
      const endLine = startLine + memo.length;
      
      // 获取时间戳行
      const timestampLine = lines[startLine];
      
      // 创建新的Memo内容
      let newMemoContent = this.settings.memoTemplate;
      newMemoContent = newMemoContent.replace('{{content}}', newContent);
      newMemoContent = newMemoContent.replace(/## .+/, timestampLine);
      
      // 构建新的文件内容
      const newLines = [
        ...lines.slice(0, startLine),
        ...newMemoContent.split('\n'),
        ...lines.slice(endLine)
      ];
      
      // 更新文件
      await this.app.vault.modify(file, newLines.join('\n'));
      
      // 提取新的标签
      const newTags = this.extractTags(newContent);
      
      // 返回更新后的Memo
      return {
        ...memo,
        content: newContent,
        tags: newTags
      };
    } catch (error) {
      console.error('编辑Memo失败', error);
      return null;
    }
  }

  validateContent(content: string): boolean {
    // 检查内容是否为空
    if (!content.trim()) {
      return false;
    }
    
    // 检查内容长度
    if (content.length > 10000) { // 设置一个合理的最大长度限制
      return false;
    }
    
    // 检查是否包含可疑HTML或JS代码
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+=/gi
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return false;
      }
    }
    
    return true;
  }
  
  async deleteMemo(memo: Memo): Promise<boolean> {
    try {
      // 获取文件
      const file = this.app.vault.getAbstractFileByPath(memo.filePath);
      if (!(file instanceof TFile)) {
        throw new Error(`找不到文件: ${memo.filePath}`);
      }
      
      // 读取文件内容并分割成行
      const lines = (await this.app.vault.read(file)).split('\n');
      
      // 确定删除范围
      const startLine = memo.position;
      const endLine = startLine + memo.length;
      
      // 删除指定范围的行
      const newLines = [
        ...lines.slice(0, startLine),
        ...lines.slice(endLine)
      ];
      
      // 检查是否删除整个文件
      // 如果只剩下YAML前言，直接删除文件
      if (newLines.length <= 5 && newLines[0] === '---') {
        const yamlEndIndex = newLines.indexOf('---', 1);
        if (yamlEndIndex > 0 && yamlEndIndex === newLines.length - 1) {
          return true;
        }
      }
      
      // 更新文件
      await this.app.vault.modify(file, newLines.join('\n'));
      return true;
    } catch (error) {
      console.error('删除Memo失败', error);
      return false;
    }
  }
  
  async deleteTag(tag: string): Promise<boolean> {
    try {
      // 获取所有包含该标签的Memo
      const allMemos = await this.getAllMemos();
      const memosWithTag = allMemos.filter(memo => memo.tags.includes(tag));
      
      // 如果没有包含此标签的Memo，直接返回成功
      if (memosWithTag.length === 0) {
        return true;
      }
      
      // 为每个包含此标签的Memo移除该标签
      for (const memo of memosWithTag) {
        // 构建新的内容，移除标签
        const newContent = memo.content.replace(
          new RegExp(`#${tag}\\b`, 'g'), 
          ''
        ).trim();
        
        // 更新Memo
        await this.editMemo(memo, newContent);
      }
      
      return true;
    } catch (error) {
      console.error('删除标签失败', error);
      return false;
    }
  }

  async getTagStats(): Promise<{tag: string, count: number}[]> {
    const allMemos = await this.getAllMemos();
    const tagCounts: {[key: string]: number} = {};
    
    // 统计每个标签的使用次数
    allMemos.forEach(memo => {
      memo.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // 转换为数组并按使用次数排序
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getActivityData(days: number = 365): Promise<{date: string, count: number}[]> {
    const allMemos = await this.getAllMemos();
    const activityCounts: {[key: string]: number} = {};
    
    // 初始化日期范围
    const currentDate = moment();
    for (let i = 0; i < days; i++) {
      const dateString = currentDate.clone().subtract(i, 'days').format('YYYY-MM-DD');
      activityCounts[dateString] = 0;
    }
    
    // 统计每天的Memo数量
    allMemos.forEach(memo => {
      const dateString = moment(memo.date).format('YYYY-MM-DD');
      if (activityCounts[dateString] !== undefined) {
        activityCounts[dateString] += 1;
      }
    });
    
    // 转换为数组并按日期排序
    return Object.entries(activityCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMemosByTag(tag: string): Promise<Memo[]> {
    const allMemos = await this.getAllMemos();
    return allMemos.filter(memo => memo.tags.includes(tag));
  }

  async getMemosByDate(dateString: string): Promise<Memo[]> {
    const allMemos = await this.getAllMemos();
    return allMemos.filter(memo => moment(memo.date).format('YYYY-MM-DD') === dateString);
  }

  async searchMemos(query: string): Promise<Memo[]> {
    if (!query || query.trim() === '') {
      return this.getAllMemos();
    }
    
    query = query.toLowerCase();
    const allMemos = await this.getAllMemos();
    
    // 搜索内容和标签
    return allMemos.filter(memo => 
      memo.content.toLowerCase().includes(query) || 
      memo.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

}