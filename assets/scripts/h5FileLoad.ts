const { ccclass, property } = cc._decorator;
declare global {
    interface Window {
        spineSkeletonData: string | null;
        spineAtlasData: string | null;
        spineTextureData: string | null;
        spineSkeletonType: 'json' | 'skel' | null;
        textureSrc: cc.Texture2D | null;
    }
}
window.spineSkeletonData = null;
window.spineAtlasData = null;
window.spineTextureData = null;
window.spineSkeletonType = null;
window.textureSrc = null;

@ccclass
export default class H5FileUploader extends cc.Component {
    // 组件属性（拖入 Cocos 编辑器）
    @property(cc.Button)
    uploadBtn: cc.Button = null!; // 上传文件按钮（支持多选）

    @property(cc.Button)
    uploadFolderBtn: cc.Button = null!; // 上传文件夹按钮（可选）

    @property(cc.Label)
    showLabel: cc.Label = null!; // 显示文本内容的 Label

    @property(cc.Sprite)
    showSprite: cc.Sprite = null!; // 显示图片的 Sprite

    @property(sp.Skeleton)
    showSkeleton: sp.Skeleton = null!; // 显示骨骼动画的 Skeleton


    @property(cc.Button)
    slotBtn: cc.Button = null!; // 切换slot的按钮
    slotScorllView: cc.ScrollView;
    slotContent: cc.Node;
    btnCloseScorllView: cc.Node
    slotItem: cc.Node;
    btnRefreshScorllView: cc.Node;
    onLoad(): void {
        // 绑定文件上传按钮（多选模式）
        this.uploadBtn.node.on('click', () => {
            this.createFileInput(false); // false 表示文件多选模式
        }, this);
        this.slotScorllView = this.node.getChildByName("SlotScrollView").getComponent(cc.ScrollView)
        this.slotContent = this.slotScorllView.content;
        this.btnCloseScorllView = cc.find("view/btnClose", this.slotScorllView.node);
        this.btnRefreshScorllView = cc.find("view/btnRefresh", this.slotScorllView.node);
        // 如果设置了文件夹上传按钮，绑定文件夹上传事件
        if (this.uploadFolderBtn) {
            this.uploadFolderBtn.node.on('click', () => {
                this.createFileInput(true); // true 表示文件夹模式
            }, this);
        }
        this.slotItem = this.node.getChildByName("SlotItem");
        this.slotBtn.node.on('click', () => {
            this.showSlotMgr();
        }, this);

        this.btnCloseScorllView.on(cc.Node.EventType.TOUCH_END, () => {
            this.slotScorllView.node.active = false;
        }, this);
        this.btnRefreshScorllView.on(cc.Node.EventType.TOUCH_END, () => {
            this.showSlotMgr();
        }, this);
    }

    showSlotMgr() {

        let slotData = this.showSkeleton.skeletonData;
        if (!slotData) {
            cc.log(this.showSkeleton)
            cc.log("请先导入spine文件再进行卡槽管理-------------")
            return;
        }
        this.slotScorllView.node.active = true;
        let skeletonJson = slotData.skeletonJson;
        let slots = skeletonJson.slots;
        this.slotContent.removeAllChildren();
        // this.scheduleOnce(()=>{

        // })
        for (let i = 0; i < slots.length; i++) {
            if (this.slotContent.childrenCount <= i) {
                let slotNode = cc.instantiate(this.slotItem);
                slotNode.parent = this.slotContent;
                this.scheduleOnce(() => {
                    slotNode.position = cc.v3(0, 0, 0);
                }, 0)
                slotNode.active = true;
                cc.log(slotNode, "slotNode")
            }
            let item = this.slotContent.children[i];
            // item.position=cc.v3(0,0,0);
            let slot = slots[i];
            item.getChildByName("Label").getComponent(cc.Label).string = slot.name;
            item.name = slot.name;
            item.opacity = 255;
            item.color = cc.Color.WHITE;
            // 保存 slot.name 到局部变量，避免闭包问题
            let slotName = slot.name;
            // 如果没有 Button 组件，使用触摸事件
            item.on(cc.Node.EventType.TOUCH_END, (e: cc.Event.EventTouch) => {
                try {
                    if (e.target.opacity === 100) {
                        cc.log("显示卡槽", e.target.name);
                        e.target.opacity = 255;
                        e.target.color = cc.Color.WHITE;
                        this.showSkeleton.setAttachment(e.target.name, e.target.name);
                    }
                    else if (e.target.opacity === 255) {
                        cc.log("隐藏卡槽", e.target.name);
                        e.target.opacity = 100;
                        e.target.color = cc.Color.YELLOW;
                        this.showSkeleton.setAttachment(e.target.name, null);
                    }
                }
                catch (err) {
                    this.showSlotMgr();
                }
            }, this);
        }

    }

    /**
     * 动态创建隐藏的文件选择器
     * @param isFolderMode 是否为文件夹模式（true=文件夹模式，false=文件多选模式）
     */
    private createFileInput(isFolderMode: boolean = false): void {
        // 创建 input[type="file"] 元素
        const fileInput: HTMLInputElement = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';

        if (isFolderMode) {
            // 文件夹模式：支持直接选择文件夹
            fileInput.setAttribute('webkitdirectory', '');
            fileInput.setAttribute('directory', '');
        } else {
            // 文件多选模式：支持在文件选择对话框中浏览并多选文件
            fileInput.multiple = true;
        }

        // 限制文件类型：txt、json、png、jpg
        fileInput.accept = '.txt,.json,.png,.jpg,.jpeg,.atlas';

        // 绑定文件选择事件
        fileInput.onchange = (e: Event) => {
            this.handleFileSelect(e, isFolderMode);
        };

        // 触发文件选择对话框
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    /**
     * 处理用户选择的文件（支持单个文件、多选文件或文件夹）
     * @param e 文件选择事件
     * @param isFolderMode 是否为文件夹模式
     */
    private handleFileSelect(e: Event, isFolderMode: boolean = false): void {
        const target = e.target as HTMLInputElement;
        const files: FileList | null = target.files;

        if (!files || files.length === 0) {
            cc.log('未选择任何文件');
            this.updateLabel('未选择任何文件');
            return;
        }

        // 如果是文件夹模式，直接按文件夹处理
        if (isFolderMode) {
            this.handleFolderUpload(files);
            return;
        }

        // 文件多选模式：如果选择了多个文件，按文件夹模式处理（筛选 Spine 文件）
        // 如果只选择了一个文件，按单个文件处理
        if (files.length > 1) {
            this.handleFolderUpload(files);
            return;
        }

        // 单个文件处理（保持原有逻辑）
        const file = files[0];
        this.processSingleFile(file);
    }

    /**
     * 处理文件夹上传（筛选并处理 Spine 所需的文件：json、atlas、png）
     * @param files 文件列表
     */
    private handleFolderUpload(files: FileList): void {
        cc.log(`检测到文件夹上传，共 ${files.length} 个文件`);

        // 先显示文件夹中的所有文件列表
        const allFileNames: string[] = [];
        const fileInfoList: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileInfo = `${file.name} (${(file.size / 1024).toFixed(2)}KB)`;
            allFileNames.push(file.name);
            fileInfoList.push(fileInfo);
            cc.log(`文件 ${i + 1}: ${fileInfo}`);
        }

        // 在界面上显示文件夹中的所有文件（限制显示数量，避免过长）
        const maxDisplayFiles = 10;
        let fileListText = `文件夹内容 (共${files.length}个文件):\n`;
        if (files.length <= maxDisplayFiles) {
            fileListText += fileInfoList.join('\n');
        } else {
            fileListText += fileInfoList.slice(0, maxDisplayFiles).join('\n');
            fileListText += `\n... 还有 ${files.length - maxDisplayFiles} 个文件`;
        }
        this.updateLabel(fileListText);
        cc.log('文件夹中的所有文件:', allFileNames);

        // 筛选出 Spine 所需的文件类型
        const jsonFiles: File[] = [];
        const atlasFiles: File[] = [];
        const pngFiles: File[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith('.json')) {
                jsonFiles.push(file);
            } else if (fileName.endsWith('.atlas')) {
                atlasFiles.push(file);
            } else if (fileName.endsWith('.png')) {
                pngFiles.push(file);
            }
        }

        cc.log(`筛选结果：JSON(${jsonFiles.length})、Atlas(${atlasFiles.length})、PNG(${pngFiles.length})`);

        // 显示筛选结果
        let filterResult = `\n\n筛选结果:\nJSON: ${jsonFiles.length}个`;
        if (jsonFiles.length > 0) {
            filterResult += ` (${jsonFiles.map(f => f.name).join(', ')})`;
        }
        filterResult += `\nAtlas: ${atlasFiles.length}个`;
        if (atlasFiles.length > 0) {
            filterResult += ` (${atlasFiles.map(f => f.name).join(', ')})`;
        }
        filterResult += `\nPNG: ${pngFiles.length}个`;
        if (pngFiles.length > 0) {
            filterResult += ` (${pngFiles.map(f => f.name).join(', ')})`;
        }
        this.updateLabel(fileListText + filterResult);

        // 验证必要的文件是否存在
        if (jsonFiles.length === 0) {
            this.updateLabel(fileListText + filterResult + '\n\n❌ 未找到 JSON 骨架文件');
            return;
        }
        if (atlasFiles.length === 0) {
            this.updateLabel(fileListText + filterResult + '\n\n❌ 未找到 Atlas 图集文件');
            return;
        }
        if (pngFiles.length === 0) {
            this.updateLabel(fileListText + filterResult + '\n\n❌ 未找到 PNG 纹理文件');
            return;
        }

        // 如果有多组文件，使用第一组（可以根据需要扩展为支持多组）
        const jsonFile = jsonFiles[0];
        const atlasFile = atlasFiles[0];
        const pngFile = pngFiles[0];

        this.updateLabel(`正在加载文件夹中的 Spine 文件...`);

        // 按顺序加载：JSON -> Atlas -> PNG
        this.loadFileAsText(jsonFile, (content: string) => {
            window.spineSkeletonData = content;
            window.spineSkeletonType = 'json';
            cc.log(`Spine 骨架文件 ${jsonFile.name} 读取成功`);

            this.loadFileAsText(atlasFile, (content: string) => {
                window.spineAtlasData = content;
                cc.log(`Spine 图集文件 ${atlasFile.name} 读取成功`);

                this.loadFileAsDataURL(pngFile, (dataUrl: string) => {
                    window.spineTextureData = dataUrl;
                    this.loadImageToTexture(dataUrl);
                    cc.log(`Spine 纹理图 ${pngFile.name} 读取成功`);
                    this.updateLabel(`✅ Spine 文件加载成功！\nJSON: ${jsonFile.name}\nAtlas: ${atlasFile.name}\nPNG: ${pngFile.name}`);
                });
            });
        });
    }

    /**
     * 处理单个文件
     * @param file 文件对象
     */
    private processSingleFile(file: File): void {
        // 文件大小校验（限制 10MB 以内）
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.updateLabel(`文件过大（${(file.size / 1024 / 1024).toFixed(2)}MB），最大支持 10MB`);
            return;
        }

        cc.log(`选中文件：${file.name}，大小：${(file.size / 1024).toFixed(2)}KB`);
        const reader = new FileReader();

        // 1. 文本文件（txt/json）
        if (file.type.includes('text') && !file.name.endsWith('.atlas') && !file.name.endsWith('.skel')) {
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const content = event.target?.result as string;
                this.updateLabel(`文本内容：${content.substring(0, 100)}...`);
                if (file.name.endsWith('.json') && !file.name.includes('spine')) {
                    try {
                        JSON.parse(content);
                        this.updateLabel('JSON 解析成功');
                    } catch (err) {
                        this.updateLabel('JSON 解析失败：' + (err as Error).message);
                    }
                }
            };
            reader.onerror = (err) => this.handleFileError(err);
            reader.readAsText(file);
        }

        // 2. Spine 骨架文件（.json/.skel）
        else if (file.name.endsWith('.json') || file.name.endsWith('.skel')) {
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const content = event.target?.result as string;
                window.spineSkeletonData = content;
                window.spineSkeletonType = file.name.endsWith('.json') ? 'json' : 'skel';
                this.updateLabel(`Spine 骨架文件 ${file.name} 读取成功`);
                this.checkSpineFilesReady();
            };
            reader.onerror = (err) => this.handleFileError(err);
            reader.readAsText(file);
        }

        // 3. Spine 图集文件（.atlas）
        else if (file.name.endsWith('.atlas')) {
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const content = event.target?.result as string;
                window.spineAtlasData = content;
                cc.log("设置图集成功", window.spineAtlasData)
                this.updateLabel(`Spine 图集文件 ${file.name} 读取成功`);
                this.checkSpineFilesReady();
            };
            reader.onerror = (err) => this.handleFileError(err);
            reader.readAsText(file);
        }

        // 4. Spine 纹理图 / 普通图片
        else if (file.type.includes('image')) {
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const dataUrl = event.target?.result as string;
                // 判断是否为 Spine 纹理图
                if (file.name.includes('spine') || window.spineAtlasData) {
                    window.spineTextureData = dataUrl;
                    // 同时创建 Texture2D 对象供 Spine 使用
                    this.loadImageToTexture(dataUrl);
                    this.updateLabel(`Spine 纹理图 ${file.name} 读取成功`);
                } else {
                    this.loadImageToSprite(dataUrl);
                    this.updateLabel(`普通图片 ${file.name} 上传成功`);
                }
            };
            reader.onerror = (err) => this.handleFileError(err);
            reader.readAsDataURL(file);
        }

        // 5. 不支持的文件类型
        else {
            this.updateLabel(`暂不支持 ${file.name.split('.').pop()} 类型文件`);
        }
    }

    /**
     * 以文本形式加载文件
     * @param file 文件对象
     * @param callback 成功回调
     */
    private loadFileAsText(file: File, callback: (content: string) => void): void {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const content = event.target?.result as string;
            callback(content);
        };
        reader.onerror = (err) => this.handleFileError(err);
        reader.readAsText(file);
    }

    /**
     * 以 DataURL 形式加载文件
     * @param file 文件对象
     * @param callback 成功回调
     */
    private loadFileAsDataURL(file: File, callback: (dataUrl: string) => void): void {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const dataUrl = event.target?.result as string;
            callback(dataUrl);
        };
        reader.onerror = (err) => this.handleFileError(err);
        reader.readAsDataURL(file);
    }

    /**
     * 将 Base64 图片导入到 Sprite 组件
     * @param dataUrl 图片的 Base64 编码
     */
    private loadImageToSprite(dataUrl: string): void {
        const image = new Image();
        // 解决跨域问题
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            // 创建 Cocos 2.x 纹理
            window.textureSrc = new cc.Texture2D();

            window.textureSrc.initWithElement(image);
            window.textureSrc.handleLoadedTexture();

            // 设置到 Sprite
            if (this.showSprite) {
                this.showSprite.spriteFrame = new cc.SpriteFrame(window.textureSrc);
            }
            cc.log("设置图片成功", window.textureSrc)
        };

        image.onerror = () => {
            this.updateLabel('图片加载失败');
        };

        image.src = dataUrl;
    }

    /**
     * 将 Base64 图片加载为 Texture2D（用于 Spine 纹理）
     * @param dataUrl 图片的 Base64 编码
     */
    private loadImageToTexture(dataUrl: string): void {
        const image = new Image();
        // 解决跨域问题"
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            try {
                // 创建 Cocos 2.x 纹理
                window.textureSrc = new cc.Texture2D();
                window.textureSrc.initWithElement(image);
                window.textureSrc.handleLoadedTexture();
                // 纹理名称将在设置 SkeletonData 时根据 atlas 页面名称设置
                // 确保纹理完全初始化（检查 width 和 height 属性）
                if (window.textureSrc && window.textureSrc.width > 0 && window.textureSrc.height > 0) {
                    cc.log('Spine 纹理对象创建成功', window.textureSrc, '纹理尺寸:', window.textureSrc.width, 'x', window.textureSrc.height);

                    // 使用下一帧确保纹理完全准备好
                    this.scheduleOnce(() => {
                        this.checkSpineFilesReady();
                    }, 0);
                } else {
                    throw new Error('纹理对象创建后未正确初始化');
                }
            } catch (err) {
                const errMsg = `纹理创建失败：${(err as Error).message}`;
                this.updateLabel(errMsg);
                cc.error(errMsg);
                window.textureSrc = null;
            }
        };

        image.onerror = (err) => {
            const errMsg = 'Spine 纹理图加载失败';
            this.updateLabel(errMsg);
            cc.error(errMsg, err);
            window.textureSrc = null;
        };

        image.src = dataUrl;
    }

    /**
     * 更新 Label 显示内容
     * @param text 要显示的文本
     */
    private updateLabel(text: string): void {
        if (this.showLabel) {
            this.showLabel.string = text;
        }
    }


    /**
     * 检查 Spine 三大文件是否全部加载完成
     */
    private checkSpineFilesReady(): void {
        // 检查所有必要的资源，包括 Texture2D 对象
        if (window.spineSkeletonData && window.spineAtlasData && window.spineTextureData && window.textureSrc) {
            cc.log('所有 Spine 资源已就绪，开始初始化...');
            this.loadSpineToGame();
        } else {
            const lackFiles: string[] = [];
            if (!window.spineSkeletonData) lackFiles.push('骨架文件(.json/.skel)');
            if (!window.spineAtlasData) lackFiles.push('图集文件(.atlas)');
            if (!window.spineTextureData) lackFiles.push('纹理图数据');
            if (!window.textureSrc) lackFiles.push('纹理对象');
            const statusMsg = `待上传：${lackFiles.join('、')}`;
            this.updateLabel(statusMsg);
            cc.log('Spine 资源状态:', {
                skeleton: !!window.spineSkeletonData,
                atlas: !!window.spineAtlasData,
                textureData: !!window.spineTextureData,
                textureSrc: !!window.textureSrc
            });
        }
    }

    /**
     * 从 Atlas 文件中提取页面名称（第一行）
     * @param atlasText Atlas 文件内容
     * @returns 页面名称，如果无法提取则返回 null
     */
    private extractPageNameFromAtlas(atlasText: string): string | null {
        if (!atlasText) return null;
        const lines = atlasText.split(/\r?\n/);
        if (lines.length === 0) return null;
        let firstLine = lines[0].trim();
        if (!firstLine) {
            cc.log("第一行为null", firstLine)
            firstLine = lines[1].trim();
        }
        if (!firstLine) {
            cc.error("altas信息如下", atlasText)
            return null;
        }
        return firstLine;
    }

    /**
     * 处理 Atlas 文件内容
     * 注意：在 Cocos Creator 中，atlas 文件的第一行是页面名称（page name），
     * 必须保留，因为 Spine 用它来匹配 textures 数组中的纹理。
     * 当使用 textures 数组时，不需要移除任何行，只需要保留完整的 atlas 内容。
     * @param atlasText 原始 atlas 文件内容
     * @returns 处理后的 atlas 文件内容（实际上不需要处理，直接返回）
     */
    private processAtlasText(atlasText: string): string {
        // Atlas 文件格式：
        // 1. 页面名称（第一行，如 "1.png"）- 必须保留，Spine 用它匹配 textures 数组
        // 2. size: width, height
        // 3. format: RGBA8888
        // 4. filter: Linear,Linear
        // 5. repeat: none
        // 6. 区域名称（region name）
        // 7. xy, size, orig, offset, rotate, bounds, index 等属性

        // 在 Cocos Creator 中，当通过 textures 数组提供纹理时，
        // Spine 会根据第一行的页面名称来匹配 textures 数组中的纹理。
        // 如果 textures 数组只有一个纹理，它会自动匹配第一个纹理。
        // 因此，我们需要保留完整的 atlas 内容，包括第一行的页面名称。

        cc.log('Atlas 文件内容保留完整（包括页面名称）');
        return atlasText;
    }

    /**
     * 初始化 Spine 动画并添加到场景
     */
    private loadSpineToGame(): void {
        try {
            // 检查必要的资源是否都已加载
            if (!window.spineSkeletonData || !window.spineAtlasData || !window.textureSrc) {
                const errMsg = 'Spine 资源未完全加载';
                this.updateLabel(errMsg);
                cc.error(errMsg, {
                    skeleton: !!window.spineSkeletonData,
                    atlas: !!window.spineAtlasData,
                    texture: !!window.textureSrc
                });
                return;
            }

            // 验证纹理对象是否有效（检查 width 和 height）
            if (!window.textureSrc || window.textureSrc.width <= 0 || window.textureSrc.height <= 0) {
                const errMsg = '纹理对象无效或未完全加载';
                this.updateLabel(errMsg);
                cc.error(errMsg, {
                    texture: !!window.textureSrc,
                    width: window.textureSrc ? window.textureSrc.width : 0,
                    height: window.textureSrc ? window.textureSrc.height : 0
                });
                return;
            }

            cc.log('开始创建 SkeletonData...');

            // 再次验证纹理对象，确保它完全准备好
            if (!window.textureSrc) {
                const errMsg = '纹理对象为空';
                this.updateLabel(errMsg);
                cc.error(errMsg);
                return;
            }

            // 使用 requestAnimationFrame 确保纹理完全初始化
            // 在浏览器环境中，这样可以确保纹理对象已经完全准备好
            const initSpine = () => {
                try {
                    // 再次验证纹理对象
                    if (!window.textureSrc || window.textureSrc.width <= 0 || window.textureSrc.height <= 0) {
                        cc.error('纹理对象验证失败', {
                            texture: !!window.textureSrc,
                            width: window.textureSrc ? window.textureSrc.width : 0,
                            height: window.textureSrc ? window.textureSrc.height : 0
                        });
                        this.updateLabel('纹理对象未准备好，请重试');
                        return;
                    }

                    const skeletonData = new sp.SkeletonData();
                    skeletonData.skeletonJson = window.spineSkeletonData;

                    // 处理 atlas 文件（保留完整内容）
                    const processedAtlasText = this.processAtlasText(window.spineAtlasData);
                    skeletonData.atlasText = processedAtlasText;

                    // 从 atlas 中提取页面名称
                    const pageName = this.extractPageNameFromAtlas(processedAtlasText);
                    cc.log('Atlas 页面名称:', pageName);
                    cc.log('Atlas 文件内容:', processedAtlasText.substring(0, 100) + '...');
                    cc.log('Atlas 文件已处理，原始长度:', window.spineAtlasData.length, '处理后长度:', processedAtlasText.length);

                    // 设置纹理名称以匹配 atlas 页面名称
                    if (pageName) {
                        window.textureSrc.name = pageName;
                        cc.log('纹理名称已设置为:', pageName);
                    }

                    // 创建纹理数组 - 确保顺序正确
                    const texture2D: cc.Texture2D[] = [];
                    texture2D.push(window.textureSrc);
                    skeletonData.textures = texture2D;

                    // 如果 SkeletonData 支持 textureNames 属性，设置它
                    if (pageName && (skeletonData as any).textureNames !== undefined) {
                        (skeletonData as any).textureNames = [pageName];
                        cc.log('已设置 textureNames:', [pageName]);
                    }

                    cc.log('SkeletonData 创建完成，纹理数量:', texture2D.length);
                    cc.log('纹理详细信息:', {
                        width: window.textureSrc.width,
                        height: window.textureSrc.height,
                        name: window.textureSrc.name || '(未命名)',
                        texture: window.textureSrc
                    });

                    // 创建 Spine 节点
                    const spineComp = this.showSkeleton;
                    if (!spineComp) {
                        const errMsg = 'Spine Skeleton 组件未设置';
                        this.updateLabel(errMsg);
                        cc.error(errMsg);
                        return;
                    }

                    cc.log('设置 SkeletonData 到组件...');
                    spineComp.skeletonData = skeletonData;

                    // 继续后续的动画设置
                    this.setupSpineAnimation(spineComp);
                } catch (err) {
                    const errMsg = `Spine 初始化失败：${(err as Error).message}`;
                    this.updateLabel(errMsg);
                    cc.error(errMsg, err);
                    if ((err as Error).stack) {
                        cc.error('错误堆栈:', (err as Error).stack);
                    }
                }
            };

            // 延迟执行，确保纹理完全准备好
            // 使用多次 requestAnimationFrame 确保纹理完全初始化
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        initSpine();
                    });
                });
            } else {
                // 如果不在浏览器环境，使用 scheduleOnce
                this.scheduleOnce(initSpine, 0.2);
            }
        } catch (err) {
            const errMsg = `Spine 初始化失败：${(err as Error).message}`;
            this.updateLabel(errMsg);
            cc.error(errMsg, err);
            // 打印堆栈信息以便调试
            if ((err as Error).stack) {
                cc.error('错误堆栈:', (err as Error).stack);
            }
        }
    }

    /**
     * 设置 Spine 动画
     * @param spineComp Spine Skeleton 组件
     */
    private setupSpineAnimation(spineComp: sp.Skeleton): void {
        // 从 JSON 数据中解析动画名称
        let animationName = 'animation'; // 默认动画名
        try {
            const skeletonJson = JSON.parse(window.spineSkeletonData!);
            if (skeletonJson.animations && Object.keys(skeletonJson.animations).length > 0) {
                animationName = Object.keys(skeletonJson.animations)[0];
                cc.log('可用动画列表:', Object.keys(skeletonJson.animations));
                cc.log(`使用动画: ${animationName}`);
            } else {
                cc.log('未找到动画，使用默认动画名: animation');
            }
        } catch (err) {
            cc.warn('解析动画名称失败，使用默认动画名', err);
        }

        spineComp.setAnimation(0, animationName, true);

        spineComp.loop = true;
        spineComp.premultipliedAlpha = false; // 适配纹理透明度
        this.updateLabel('Spine 动画初始化成功！');
        cc.log('Spine 动画初始化成功！');

        // 清空暂存数据
        window.spineSkeletonData = null;
        window.spineAtlasData = null;
        window.spineTextureData = null;
        window.spineSkeletonType = null;
        window.textureSrc = null;
    }

    /**
    * Base64 转 ArrayBuffer（解析 .skel 文件用）
    */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * 文件读取错误处理
     * @param err 错误对象
     */
    private handleFileError(err: ProgressEvent<FileReader>): void {
        const errorMsg = `文件读取失败：${(err.target?.error as Error).message}`;
        cc.error(errorMsg);
        this.updateLabel(errorMsg);
    }
}