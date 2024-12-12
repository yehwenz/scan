<template>
  <div class="scanner">
    <div>
      <label for="productCode">請輸入產品編號：</label>
      <input id="productCode" v-model="productCode" placeholder="輸入產品編號" />
    </div>
    <div>
      <label for="cameraSelect">選擇攝像頭：</label>
      <select id="cameraSelect" v-model="selectedCameraId" @change="switchCamera">
        <option v-for="camera in cameras" :key="camera.deviceId" :value="camera.deviceId">
          {{ camera.label || `Camera ${camera.deviceId}` }}
        </option>
      </select>
    </div>
    <video ref="video" class="video" autoplay muted playsinline hi></video>
    <canvas ref="canvas" class="hidden"></canvas>
    <div
      class="overlay"
      :style="{ borderColor: resultColor, borderWidth: qrCodeDetected ? '4px' : '0px' }"
    ></div>
    <div class="status">{{ statusMessage }}</div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import QrScanner from 'qr-scanner';




const productCode = ref<string>(''); // 使用者輸入的產品編號
const resultColor = ref<string>('transparent'); // 邊框顏色
const qrCodeDetected = ref<boolean>(false); // 是否檢測到 QR Code
const statusMessage = ref<string>('請對準 QR Code 掃描'); // 顯示的狀態訊息
const cameras = ref<MediaDeviceInfo[]>([]); // 可用攝像頭列表
const selectedCameraId = ref<string>(''); // 當前選擇的攝像頭 ID
const canvas = ref<HTMLCanvasElement | null>(null); // 引用 canvas

const video = ref<HTMLVideoElement | null>(null);
let qrScanner: QrScanner | null = null;

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter((device) => device.kind === 'videoinput');
    if (cameras.value.length > 0) {
      selectedCameraId.value = cameras.value[0].deviceId;
    }
  } catch (err) {
    console.error('無法獲取攝像頭列表:', err);
    statusMessage.value = '無法獲取攝像頭列表';
  }
};

const startScanner = () => {
  if (video.value) {
    if (qrScanner) qrScanner.destroy(); // 銷毀舊的掃描器

    qrScanner = new QrScanner(
      video.value,
      (result) => handleScanResult(result),
      {
        preferredCamera: selectedCameraId.value, // 使用選擇的攝像頭
        highlightCodeOutline: true, //標記QRCode
      }
    );
    qrScanner.start().catch((err) => {
      console.error('無法啟動 QR 掃描器:', err);
      statusMessage.value = '無法啟動 QR 掃描器，請檢查權限';
    });

  }
};

const switchCamera = () => {
  startScanner(); // 改變攝像頭後重新啟動掃描器
};

const handleScanResult = (result: QrScanner.ScanResult) => {
  qrCodeDetected.value = true;
  const scannedData = result.data.trim();
  if (scannedData == productCode.value.trim()) {
    resultColor.value = 'green';
    statusMessage.value = `匹配成功: ${scannedData}`;
  } else {
    resultColor.value = 'red';
    statusMessage.value = `匹配失敗: ${scannedData}`;
  }
};

onMounted(() => {
  if (canvas.value) {
    const ctx = canvas.value.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      console.error("Canvas 2D context 無法初始化");
    }
  } else {
    console.error("Canvas 元素未找到");
  }

  startScanner();
  getCameras();
});

onBeforeUnmount(() => {
  if (qrScanner) {
    qrScanner.destroy();
  }
});
</script>
<style lang="scss" scoped>
.scanner {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: auto;
  text-align: center;
}
.video {
  width: 100%;
  height: auto;
  object-fit: cover; // 確保畫面填充整個 video 元素
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  pointer-events: none;
}
.status {
  margin-top: 10px;
  font-size: 1.2rem;
}
.hidden {
  display: none; /* 保留但不完全隱藏 */
  width: 300px; /* 設置明確的寬高 */
  height: 300px;
}
</style>
