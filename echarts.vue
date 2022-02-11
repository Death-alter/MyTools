<template>
  <view class="content" v-if="chartshow">
    <!-- #ifdef APP-PLUS || H5 -->
    <view
      :prop="chartOption"
      :onclick="clickCallback"
      :change:prop="echarts.updateEcharts"
      :change:onclick="echarts.setClick"
      id="echarts"
      class="echarts"
    ></view>
    <!-- #endif -->
    <!-- #ifndef APP-PLUS || H5 -->
    <view>非 APP、H5 环境不支持</view>
    <!-- #endif -->
  </view>
</template>
<script>
function mapObject(obj, func) {
  let newObj;
  if (Array.isArray(obj)) {
    newObj = [];
  } else if (isObject(obj)) {
    newObj = {};
  } else {
    return {};
  }
  for (let i in obj) {
    if (Array.isArray(obj[i]) || isObject(obj[i])) {
      newObj[i] = mapObject(obj[i], func);
    } else {
      newObj[i] = func(obj[i]);
    }
  }
  return newObj;
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

export default {
  data() {
    return {
      chartshow: false,
      clickCallback: null,
      chartOption: {},
    };
  },
  props: {
    option: {
      type: Object,
      default: () => {
        return {};
      },
    },
    onclick: {
      type: Function,
    },
  },
  watch: {
    option(newValue) {
      const funcArr = [];
      const option = mapObject(newValue, (item) => {
        if (item instanceof Function) {
          funcArr.push(String(item));
          return "chart-func" + funcArr.length;
        } else {
          return item;
        }
      });
      this.chartOption = {
        func: funcArr,
        option,
      };
    },
  },
  mounted() {
    this.chartshow = true;
    this.$nextTick(() => {
      this.clickCallback = String(this.onclick);
    });
  },
};
</script>

<script module="echarts" lang="renderjs">
function mapObject(obj, func) {
  let newObj
  if (Array.isArray(obj)) {
    newObj = []
  } else if (isObject(obj)) {
    newObj = {}
  } else {
    return {}
  }
  for (let i in obj) {
    if (Array.isArray(obj[i]) || isObject(obj[i])) {
      newObj[i] = mapObject(obj[i], func)
    } else {
      newObj[i] = func(obj[i])
    }
  }
  return newObj
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}
let myChart
let pending = false
let option = {}
let onclick = null

export default {
	mounted() {
		if (typeof window.echarts === 'function') {
			this.initEcharts()
		} else {
			// 动态引入较大类库避免影响页面展示
			const script = document.createElement('script')
			// view 层的页面运行在 www 根目录，其相对路径相对于 www 计算
			script.src = 'static/echarts.js'
			script.onload = this.initEcharts.bind(this);
			document.head.appendChild(script);
		}
	},
	methods: {
	  initEcharts() {
      const dom = document.getElementById('echarts');
      if(!dom){
        setTimeout(() => {
          this.initEcharts();
        }, 100)
        return;
      }else{
        myChart = echarts.init(dom)
      }
			
			// 观测更新的数据在 view 层可以直接访问到
      if(option){
        myChart.setOption(option)
      }
      if(onclick){
        myChart.on('click', onclick)
      }
		},
    parseOption(chartOption){
      if(!chartOption){
        return {}
      }
      if(chartOption.func.length > 0){
        return mapObject(chartOption.option, (item) => {
          if (typeof item == "string" && item.indexOf("chart-func") !== -1) {
            return eval(`(${chartOption.func[item[item.length-1]-1]})`) || (()=>{})
          } else {
            return item
          }
        })
      }else{
        return chartOption.option
      }
    },
		updateEcharts(newValue, oldValue, ownerInstance, instance) {
			// 监听 service 层数据变更
      option = newValue
      this.setOption(newValue)
		},
    setClick(newValue, oldValue, ownerInstance, instance){
      onclick = eval(`(${newValue})`)
      if(myChart){
        myChart.on('click', onclick)
      }
    },
    setOption(value){
      if(pending){
        setTimeout(() => {
          this.setOption(value)
        }, 100)
        return
      }
      pending = true
      if(myChart){
        myChart.setOption(this.parseOption(value))
      }
      pending = false
    },
	}
}
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.echarts {
  width: 100%;
  height: 100%;
}
</style>
