<template>
  <div class="header">
    <div>
      <TextField v-model="productCode" v-bind="mycomponents.textfield"/>
    </div>
    <div>
      <MySelect v-model="selectedCameraId" v-bind="mycomponents.selector" :action="startScanner"/>
    </div>
  </div>
  <div class="result">
    <MyLabel v-bind="mycomponents.result"/>
  </div>
  <div class="body">
      <video ref="video" class="video" autoplay muted playsinline></video>
      <canvas ref="canvas" class="hidden"></canvas>
  </div>

  <MyDialog v-model="info" v-bind="mycomponents.dialog">
    <template v-slot:actions>
      <v-btn v-bind="{ text: '確定', prependIcon: 'mdi-check', color: 'success', variant: 'elevated' }" @click="info = false"/>
    </template>
  </MyDialog>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import QrScanner from 'qr-scanner'
import TextField, { type textField } from './TextField.vue'
import MySelect, { type mySelect } from './MySelect.vue'
import MyDialog, { type myDialog } from './MyDialog.vue';
import MyLabel, { type myLabel } from './MyLabel.vue';

interface components {
  textfield: textField
  selector: mySelect
  dialog: myDialog
  result: myLabel
}

const mycomponents = ref<components>({
  textfield: {
    label: '產品編號',
    placeholder: '請輸入產品編號',
    variant: 'outlined',
    bgColor: '#FFECB3'
  },
  selector: {
    label: '鏡頭輸入',
    placeholder: '請選擇鏡頭',
    variant: 'outlined',
    bgColor: '#FFECB3',
    itemTitle: 'label',
    itemValue: 'value',
    items: []
  },
  dialog: {
    title: undefined,
    text: undefined,
    prependIcon: undefined,
    prependIconColor: undefined,
    color: undefined
  },
  result: { text: '請對準 QR Code 掃描', color: '#F44336' }
})

const info = ref<boolean>(false)


const productCode = ref<string>(''); // 使用者輸入的產品編號
const resultColor = ref<string>(''); // 邊框顏色
const qrCodeDetected = ref<boolean>(false); // 是否檢測到 QR Code
const statusMessage = ref<string>('請對準 QR Code 掃描'); // 顯示的狀態訊息
const selectedCameraId = ref<string>(); // 當前選擇的攝像頭 ID
const canvas = ref<HTMLCanvasElement | null>(null); // 引用 canvas

const video = ref<HTMLVideoElement | null>(null);
const qrScanner = ref<QrScanner | null>(null);


const getCameras = async () => {
  await navigator.mediaDevices.enumerateDevices()
  .then(device => mycomponents.value.selector.items = device
    .filter(d => d.kind === 'videoinput')
    .map(i => ({ label: i.label ? i.label : `Camera ${i.deviceId}`, value: i.deviceId}))
  )
  .catch(e => { 
    info.value = true
    mycomponents.value.dialog = {
      title: '無法獲取攝像頭列表:',
      text: e,
      prependIcon: 'mdi-cancel',
      prependIconColor: 'error',
      color: '#BDBDBD'
    }
  })
}

const startScanner = () => {
  if (video.value) {
    if (qrScanner.value) qrScanner.value.destroy(); // 銷毀舊的掃描器

    qrScanner.value = new QrScanner(
      video.value,
      (result) => handleScanResult(result),
      {
        preferredCamera: selectedCameraId.value, // 使用選擇的攝像頭
        highlightCodeOutline: true, //標記QRCode
      }
    );
    qrScanner.value.start().catch((err) => {
      info.value = true
      mycomponents.value.dialog = {
        title: '無法啟動 QR 掃描器:',
        text: `錯誤: ${err}。 無法啟動 QR 掃描器，請檢查權限!!!`,
        prependIcon:'mmdi-video-off',
        prependIconColor: 'error',
        color: '#BDBDBD'
      }
    });

  }
};


const handleScanResult = (result: QrScanner.ScanResult) => {
  qrCodeDetected.value = true
  const scannedData = result.data.trim()
  if (scannedData == productCode.value.trim()) {
    mycomponents.value.result = {
      color: '#4CAF50',
      text: `匹配成功: ${scannedData}`
    }
  } else {
    mycomponents.value.result = {
      color: '#B00020',
      text: `匹配失敗: ${scannedData}`
    }
    info.value = true
    mycomponents.value.dialog = {
      title: 'QR Code 的掃描結果:',
      text: `匹配失敗: ${scannedData}`,
      prependIcon:'mdi-qrcode',
      color: 'error'
    }
    playBeep()
  }
};

const  playBeep = () => {
    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine"; // 波形類型: "sine", "square", "sawtooth", "triangle"
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 頻率 (Hz)
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1); // 持續 0.5 秒
  }

onMounted(() => {
  if (canvas.value) {
    const ctx = canvas.value.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      mycomponents.value.dialog = {
        title: '發生錯誤:',
        text: 'Canvas 2D context 無法初始化',
        prependIcon:'mdi-alert',
        color: 'error'
      }
    }
  } else {
    mycomponents.value.dialog = {
        title: '發生錯誤:',
        text: 'Canvas 元素未找到',
        prependIcon:'mdi-alert',
        color: 'error'
      }

  }

  startScanner();
  getCameras();
});

onBeforeUnmount(() => {
  if (qrScanner.value) {
    qrScanner.value.destroy();
  }
});
</script>
<style lang="scss" scoped>
.header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1rem;
}
.body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.result{
  margin: 1rem 0;
  text-align: center;
  font-size: clamp(25px, 2vw, 35px);
}

.video {
  max-width: 800px;
  width: 100%;
}
</style>
