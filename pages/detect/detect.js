Page({
  data: {
    imageUrl: '',
    detectionResult: null,
    loading: false,
    imageInfo: null,
    originalImageSize: null
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          imageUrl: tempFilePath,
          detectionResult: null,
          imageInfo: null,
          originalImageSize: null
        });
        
        // 获取图片原始尺寸
        wx.getImageInfo({
          src: tempFilePath,
          success: (imgInfo) => {
            this.setData({
              originalImageSize: {
                width: imgInfo.width,
                height: imgInfo.height
              }
            });
            // 如果已有检测结果和显示区域信息，重新计算检测框
            if (this.data.detectionResult && this.data.imageInfo) {
              this.updateDetectionBoxes();
            }
          }
        });
        
        this.uploadImage(tempFilePath);
      }
    });
  },

  // 图片加载完成时的处理
  onImageLoad(e) {
    // 获取图片显示区域信息
    wx.createSelectorQuery()
      .select('.preview-image')
      .boundingClientRect(rect => {
        this.setData({
          imageInfo: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          }
        });
        // 如果已有检测结果和原始图片尺寸，重新计算检测框位置
        if (this.data.detectionResult && this.data.originalImageSize) {
          this.updateDetectionBoxes();
        }
      })
      .exec();
  },

  // 更新检测框位置
  updateDetectionBoxes() {
    const { imageInfo, detectionResult, originalImageSize } = this.data;
    if (!imageInfo || !detectionResult || !originalImageSize) return;

    // 计算图片在显示区域中的实际尺寸和位置
    const scale = Math.min(
      imageInfo.width / originalImageSize.width,
      imageInfo.height / originalImageSize.height
    );
    
    const displayWidth = originalImageSize.width * scale;
    const displayHeight = originalImageSize.height * scale;
    
    // 计算图片在容器中的居中偏移
    const offsetX = (imageInfo.width - displayWidth) / 2;
    const offsetY = (imageInfo.height - displayHeight) / 2;

    const updatedResults = detectionResult.map(item => {
      const [x1, y1, x2, y2] = item.coor;
      
      // 根据原始图片尺寸和显示比例计算检测框位置
      const displayBox = {
        x: (x1 / originalImageSize.width) * displayWidth + offsetX,
        y: (y1 / originalImageSize.height) * displayHeight + offsetY,
        w: ((x2 - x1) / originalImageSize.width) * displayWidth,
        h: ((y2 - y1) / originalImageSize.height) * displayHeight
      };

      return {
        ...item,
        displayBox
      };
    });

    this.setData({
      detectionResult: updatedResults
    });
  },

  // 上传图片到服务器
  uploadImage(filePath) {
    this.setData({ loading: true });
    wx.uploadFile({
      url: 'http://****/predict',  //your flask api
      filePath: filePath,
      name: 'image',
      success: (res) => {
        const detectionResult = JSON.parse(res.data);
        
        this.setData({
          detectionResult,
          loading: false
        });

        // 如果图片已加载完成且有原始尺寸信息，计算检测框位置
        if (this.data.imageInfo && this.data.originalImageSize) {
          this.updateDetectionBoxes();
        }
      },
      fail: (error) => {
        console.error('上传失败：', error);
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        });
        this.setData({ loading: false });
      }
    });
  }
}); 