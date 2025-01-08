<template>
  <v-navigation-drawer>
    <v-list>
      <v-list-item>
        <div class="font-weight-black">功能選單</div>
      </v-list-item>
      <v-divider></v-divider>
      <v-list-item>
        <div>
          <div class="font-weight-black">鏡頭選擇</div>
          <MySelect v-model="selectedCameraId" v-bind="mycomponents.cameraSelector" :action="startScanner"/>
        </div>
      </v-list-item>
      <v-list-item>
        <div>
          <div class="font-weight-black">延遲掃描</div>
            <v-number-input v-model="waitSeconds" variant="outlined" density="compact" controlVariant="split" :step="0.5" :min="0">
              <template v-slot:prepend>
                <v-icon icon="mdi-clock-outline"/>
              </template>
              <template v-slot:append>
                <span>秒</span>
              </template>
            </v-number-input>
        </div>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
  <div class="result">
    <MyLabel v-bind="mycomponents.result"/>
  </div>
  <div class="body">
      <video ref="video" class="video" autoplay muted playsinline></video>
      <v-btn class="my-4" :color="isScan ? 'red' : 'green'" :text="isScan ? '停止掃描' : '開始掃描'" block @click="isScan = !isScan" />
      <!-- <canvas ref="canvas" class="hidden"></canvas> -->
  </div>

  <div class="history">
    <!-- 表頭 -->
     <div class="history-header">
      <div>序號</div>
      <div>結果</div>
      <div>時間</div>
     </div>



    <!-- 滾動內容 -->
     <div class="history-content">
      <template v-for="(record, index) in scanHistory" :key="`history-${index}`">
        <div :class="record.result ? 'isTrue' : 'isFalse'">{{ index + 1 }}</div>
        <div :class="record.result ? 'isTrue' : 'isFalse'">{{ record.data }}</div>
        <div :class="record.result ? 'isTrue' : 'isFalse'">{{ record.time }}</div>
      </template>
     </div>


    <!-- 表尾 -->
    <div class="history-footer">
      <span style="color: green;">正確: {{ trueCount }} 筆</span> / 
      <span style="color: red;">錯誤: {{ falseCount }} 筆</span>
    </div>
  </div>

  <v-fab
      v-if="mdAndDown"
      location="bottom right"
      size="large"
      app
      icon
    >
    <v-icon>mdi-menu</v-icon>
    <v-bottom-sheet activator="parent">
      <v-card title="功能選單">
        <v-list>
          <v-list-item>
            <div>
              <div class="font-weight-black">鏡頭選擇</div>
              <MySelect v-model="selectedCameraId" v-bind="mycomponents.cameraSelector" :action="startScanner"/>
            </div>
          </v-list-item>
          <v-list-item>
            <div>
              <div class="font-weight-black">延遲掃描</div>
              <v-number-input v-model="waitSeconds" variant="outlined" density="compact" controlVariant="split" :step="0.5" :min="0">
                <template v-slot:prepend>
                  <v-icon icon="mdi-clock-outline"/>
                </template>
                <template v-slot:append>
                  <span>秒</span>
                </template>
              </v-number-input>
            </div>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>
  </v-fab>
  
  <MyDialog v-model="info" v-bind="mycomponents.dialog">
    <template v-slot:actions>
      <v-btn v-for="(btn, index) in btns" v-bind="btn" :key="`btn-${index}`" variant="elevated"  @click="info = false"/>
    </template>
  </MyDialog>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import QrScanner from 'qr-scanner'
import MySelect, { type mySelect } from './MySelect.vue'
import MyDialog, { type myDialog } from './MyDialog.vue'
import MyLabel, { type myLabel } from './MyLabel.vue'
import type { VBtn } from 'vuetify/components'
import { useDisplay } from 'vuetify'

interface components {
  timeSelector: mySelect
  cameraSelector: mySelect
  dialog: myDialog
  result: myLabel
}

const { mdAndDown } = useDisplay()

const waitSeconds = ref<number>(0)
const trueCount = ref<number>(0)
const falseCount = ref<number>(0)

const mycomponents = ref<components>({
  timeSelector: {
    label: '產品編號',
    placeholder: '請輸入產品編號',
    variant: 'outlined',
    bgColor: '#FFECB3'
  },
  cameraSelector: {
    placeholder: '請選擇鏡頭',
    variant: 'outlined',
    density: 'compact',
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
const btns = ref<Array<Record<string, unknown>>>([])


const productCode = ref<Array<string>>(['D08 HEADLAMP', 'BRL HEADLAMP']); // 使用者輸入的產品編號

const isScan = ref<boolean>(false)
const qrCodeDetected = ref<boolean>(false); // 是否檢測到 QR Code
const selectedCameraId = ref<string>(); // 當前選擇的攝像頭 ID
const canvas = ref<HTMLCanvasElement | null>(null); // 引用 canvas

const video = ref<HTMLVideoElement | null>(null);
const qrScanner = ref<QrScanner | null>(null);

const scanHistory = ref<Array<{ data: string, time: string, result: boolean}>>([]); // 掃描紀錄

const lastScanTime = ref<number>(0); // 儲存上次掃描的時間戳

const getCameras = async () => {
  await navigator.mediaDevices.enumerateDevices()
  .then(device => mycomponents.value.cameraSelector.items = device
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
    btns.value = [{ text: '確定', color: 'blue', prependIcon: 'mdi-check' }]
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
      btns.value = [{ text: '確定', color: 'blue', prependIcon: 'mdi-check' }]
    });

  }
};


const handleScanResult = (result: QrScanner.ScanResult) => {
  if (!isScan.value) {
    // 暫停掃描直到使用者確認
    return;
  }

  const currentTime = Date.now();
  if (currentTime - lastScanTime.value < waitSeconds.value * 1000) {
    // 忽略1秒內的重複掃描
    return;
  }

  lastScanTime.value = currentTime; // 更新上次掃描時間戳

  qrCodeDetected.value = true
  const scannedData = result.data.trim()
  const currentTimeStr = new Date().toLocaleString()

  if (productCode.value.includes(scannedData)) {
    trueCount.value++
    mycomponents.value.result = {
      color: '#4CAF50',
      text: `匹配成功: ${scannedData}`
    }

    info.value = true
    isScan.value = false
    mycomponents.value.dialog = {
      title: 'QR Code 的掃描結果:',
      text: `匹配成功: ${scannedData}`,
      prependIcon:'mdi-check-circle',
      color: 'success'
    }

    scanHistory.value.push({ data: scannedData, time: currentTimeStr, result: true})

    setTimeout(() => {
      info.value = false
    }, 1000);
  } else {
    falseCount.value++
    mycomponents.value.result = {
      color: '#B00020',
      text: `匹配失敗: ${scannedData}`
    }
    info.value = true
    isScan.value = false
    mycomponents.value.dialog = {
      title: 'QR Code 的掃描結果:',
      text: `匹配失敗: ${scannedData}`,
      prependIcon:'mdi-cancel',
      color: 'error'
    }

    scanHistory.value.push({ data: scannedData, time: currentTimeStr, result: false })

    btns.value = [{ text: '確定', color: 'blue', prependIcon:'mdi-check'}]
    playBeep()
  }
};

const  playBeep = () => {
    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine"; // 波形類型: "sine", "square", "sawtooth", "triangle"
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 頻率 (Hz)
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
  getCameras();
  startScanner();
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
  margin: auto auto;
  max-width: clamp(300px, 600px, 800px);
}
.result{
  margin: 1rem 0;
  text-align: center;
}

.video {
  max-width: 800px;
  width: 100%;
}

.history {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr 2fr 2fr;
  height: 350px;
  border-radius: 30px;
  border-radius: 10px; /* 外框圓角 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06); /* 提升效果 */
  overflow: hidden; /* 確保圓角不被內容覆蓋 */

  div{
    padding: .3rem;
    text-align: center;
  }

  &-header{
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;
    display: grid;
    grid-template-columns: subgrid;
    background: #cecece;
    >div{
      text-align: center;
      font-weight: bolder;
      // padding: .2rem;
      border-right: 1px solid #000;

      &:last-child{
        border-right: none;
      }
    }
  }

  &-content{
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 2;
    grid-row-end: 3;
    display: grid;
    grid-template-columns: subgrid;
    background-color: #f2f2f2;
    overflow-y: auto; /* 使內容可以滾動 */
    >div{
      text-align: center;
      border-bottom: 1px solid #bbb; /* 每行的分隔線 */
    }
  }
  
  &-footer{
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 3;
    grid-row-end: 4;
    text-align: center;
    padding: 10px;
    background-color: #a6a6a6;
  }
}

.isTure {
  color: green;
}

.isFalse{
  color: red;
}

// 自訂義滾動條樣式
::-webkit-scrollbar {
    width: 8px; // 滾動條寬度（未 hover）
    height: 8px; // 可橫向滾動時的高度
}

::-webkit-scrollbar-thumb {
  background-color: #cecece; // 滾動條顏色（淺灰接近白色）
  border-radius: 10px; // 滾動條圓角
}

::-webkit-scrollbar-thumb:hover {
  background-color: #a6a6a6; // 滾動條顏色（hover 深灰色）
}

::-webkit-scrollbar-track {
  background-color: #f2f2f2; // 滾動條軌道背景色
}

</style>
