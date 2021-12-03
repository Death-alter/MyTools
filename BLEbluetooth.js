/**
 * @description
 * 兼容UNIAPP和浏览器的低功耗蓝牙，解决UNIAPP控制台输出不方便调试的问题。
 * 在浏览器中使用时需要浏览器支持WebBluetooth API。
 * 仅支持浏览器环境和UNIAPP低功耗蓝牙APi支持的平台。不支持IOS，不支持IOS，不支持IOS。
 */

//枚举类型
class Enum {
  constructor(arg) {
    const obj = {}
    if (Object.prototype.toString.call(arg).slice(8, -1) === "Object") {
      Object.entries(arg).forEach(([k, v]) => obj[obj[k] = v] = k)
    } else if (Array.isArray(arg)) {
      arg.forEach((v, index) => obj[obj[v] = index] = v)
    } else {
      throw new TypeError('class Enum should receive a plain object or a array')
    }
    return obj
  }
}

//字符串转化为ArrayBuffer
function strToArrayBuffer(str) {
  let buf = new ArrayBuffer(str.length);
  let bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// #ifdef APP-PLUS
const Toast = plus.android.importClass("android.widget.Toast");
// #endif

/**
 * 无参数的回调
 * @callback callback
 */
/**
 * 蓝牙对象状态改变时触发的回调
 * @callback onStateChange
 * @param {object} state - 蓝牙状态
 */
/**
 * 发现蓝牙设备时触发的回调
 * @callback onDeviceFound
 * @param {object} deviceInfo - 发现的蓝牙设备的信息
 */
/**
 * 蓝牙特征值改变时触发的回调
 * @callback onCharacteristicChange
 * @param {string} value - 蓝牙设备返回的值
 */
/**
 * 写入特征值时触发的回调
 * @callback onCharacteristicWritten 
 * @param {string} value - 写入的值
 */

/**
 * 创建BLE蓝牙对象。
 * @class
 * @param {Object} object - 配置对象
 * @param {string} [object.write_serviceId] - 写入服务的Id，如果创建对象时未传，需要调用setId方法手动设置
 * @param {string} [object.write_characteristicId] - 写入服务的特征值，如果创建对象时未传，需要调用setId方法手动设置
 * @param {string} [object.notify_serviceId] - 读取服务的Id，如果创建对象时未传，需要调用setId方法手动设置
 * @param {string} [object.notify_characteristicId] - 读取服务的特征值，如果创建对象时未传，需要调用setId方法手动设置
 * @param {object} object.options - H5调用蓝牙requestDevice方法时传入的参数，具体参照WebBluetooth API
 * @param {callback} [object.onInit] - 蓝牙对象初始化时触发的回调
 * @param {onStateChange} [object.onStateChange] - 蓝牙对象状态改变时触发的回调
 * @param {onDeviceFound} [object.onDeviceFound] - 发现蓝牙设备时触发的回调,会覆盖startSearchDevice的回调
 * @param {callback} [object.onConnect] - 蓝牙连接成功时触发的回调
 * @param {callback} [object.onDisconnect] - 蓝牙断开连接时触发的回调
 * @param {onCharacteristicChange} [object.onCharacteristicChange] - 蓝牙特征值改变时触发的回调,会覆盖startListenValueChange的回调
 * @param {onCharacteristicWritten} [object.onCharacteristicWritten] - 写入特征值时触发的回调
 * @param {callback} [object.onDestory] - 蓝牙对象销毁时触发的回调
 */
export default function PrativeClass(object) {
  //私有属性
  this.stateType = new Enum({
    discovering: -2, //未连接，正在搜索蓝牙设备
    unconnected: -1, //未连接，闲置
    connecting: 0, //连接中
    connected: 1, //已连接，闲置
    listening: 2, //已连接，正在监听
  })
  this.state = -1;
  this.device = {};
  this.stateBefore = null;

  const eventList = ["onInit", "onStateChange", "onDeviceFound", "onConnect", "onDisconnect", "onCharacteristicChange", "onCharacteristicWritten", "onDestory"];
  for (let item of eventList) {
    if (object[item] && object[item] instanceof Function) {
      this[item] = object[item];
      delete object[item];
    }
  }

  const __this = this;
  class BLEbluetooth {
    constructor(object) {
      for (let i in object) {
        this[i] = object[i];
      }
      // #ifndef H5
      __this.init();
      // #endif
      if (__this.onInit) {
        __this.onInit();
      }
    }

    get state() {
      return __this.stateType[__this.state];
    }

    get connected() {
      return __this.state > 0;
    }

    /**
     * 获取蓝牙对象状态。
     * @return {string} 蓝牙对象状态
     */
    getState() {
      return this.state;
    }

    /**
     * 设置serverId和characteristicId。
     * @param {string} operationName - notify或write，也可以是其他自定义的操作名称，不能重复。
     * @param {string} idType - id类型，server或characteristic。
     * @param {string} value - id的值。
     */
    setId(operationName, idType, value) {
      this[operationName + "_" + idType + "Id"] = value;
      // #ifdef H5
      if (idType === "service") {
        __this.getService(operationName, value);
      } else if (idType === "characteristic") {
        const service = __this.device[operationName + "_service"];
        __this.getCharacteristic(service, operationName, value);
      }
      // #endif
    }

    /**
     * 获取蓝牙对象状态码。
     * @return {number} 蓝牙对象状态码
     */
    getStateCode() {
      return __this.state;
    }

    // #ifndef H5

    /**
     * 获取要连接设备的deviceId，H5环境无此方法。
     * @return {string} 设备的deviceId
     */
    getDeviceId() {
      return __this.device.deviceId;
    }

    /**
     * 设置要连接设备的deviceId，H5环境无此方法。
     * @param {string} id - 设备的deviceId
     */
    setDeviceId(id) {
      __this.device.deviceId = id;
    }

    /**
     * 开始搜索附近的蓝牙设备，H5环境无此方法。
     * @param {onDeviceFound} callback - 发现蓝牙设备时触发的回调，创建对象时传入onDeviceFound时失效
     * @return {Promise}
     */
    startSearchDevice(callback) {
      if (__this.onDeviceFound) {
        callback = __this.onDeviceFound;
      }
      uni.onBluetoothDeviceFound(callback);
      return new Promise((reslove, reject) => {
        uni.startBluetoothDevicesDiscovery({
          success: (res) => {
            __this.setState(-2);
            reslove(res);
          },
          fail: (err) => {
            reject(err);
          },
        });
      });
    }

    /**
     * 停止搜索附近的蓝牙设备，H5环境无此方法。
     */
    stopSearchDevice() {
      return new Promise((reslove, reject) => {
        uni.stopBluetoothDevicesDiscovery({
          success: (res) => {
            __this.setState(-1);
            reslove(res);
          },
          fail: (err) => {
            reject(err);
          },
        });
      })
    }

    /**
     * 获取设备的serviceId列表，需要先设置deviceId，H5环境无此方法。
     * @return {Promise} 异步返回获取的serviceId列表
     */
    getService() {
      return new Promise((reslove, reject) => {
        uni.getBLEDeviceServices({
          deviceId: __this.device.deviceId,
          success: (res) => {
            __this.device.services = res.services;
            reslove(res.services);
          },
          fail: (err) => {
            console.log(err);
            reject(err);
          },
        });
      });
    }

    /**
     * 获取设备某个serviceId下的characteristicId列表，需要先设置deviceId，H5环境无此方法。
     * @param {string} serviceId 需要获取的characteristicId所属的serviceId
     * @return {Promise} 异步返回获取的characteristicId列表
     */
    getCharacteristics(serviceId) {
      return new Promise((reslove, reject) => {
        uni.getBLEDeviceCharacteristics({
          deviceId: __this.device.deviceId,
          serviceId,
          success: (res) => {
            this.characteristic[serviceId] = res.characteristics;
            reslove(res.characteristics);
          },
          fail: (err) => {
            console.log(err);
            reject(err);
          },
        });
      });
    }

    /**
     * 获取当前设备的信号强度，需要先设置deviceId，H5环境无此方法。
     * @return {Promise} 异步返回获取的信号强度
     */
    getDeviceRSSI() {
      return new Promise((reslove, reject) => {
        uni.getBLEDeviceRSSI({
          deviceId: __this.device.deviceId,
          success: (res) => {
            reslove(res);
          },
          fail: (err) => {
            reject(err);
          },
        });
      });
    }
    // #endif

    /**
     * 连接蓝牙，APP环境需要先设置deviceId，H5环境需要在事件中调用。
     * @return {Promise}
     */
    connect() {
      if (this.connected) {
        return;
      }
      // #ifndef H5
      __this.setState(0);
      return new Promise((reslove, reject) => {
        uni.createBLEConnection({
          deviceId: __this.device.deviceId,
          success: (res) => {
            setTimeout(() => {
              if (this.mtu) {
                __this.setMTU().then(async () => {
                  if (__this.onConnect) {
                    await __this.onConnect();
                  }
                  __this.setState(1);
                  reslove(res);
                });
              }
            }, 1000)
          },
          fail: (err) => {
            __this.setState(-1);
            reject(err);
          },
        });
      });
      // #endif

      // #ifdef H5
      if (!navigator.bluetooth) {
        throw new Error("浏览器不支持蓝牙功能！");
      } else {
        return new Promise((reslove, reject) => {
          __this.setState(-2);
          try {
            __this.selectDevice(this.options).then((server) => {
              __this.setState(0)
              __this.getService("write", this.write_serviceId).then(service => {
                return __this.getCharacteristic(service, "write", this
                  .write_characteristicId);
              }).then(async characteristic => {
                if (__this.device.notify_characteristic) {
                  if (__this.onConnect) {
                    await __this.onConnect();
                  }
                  __this.setState(1);
                  reslove();
                }
              })
              __this.getService("notify", this.notify_serviceId).then(service => {
                return __this.getCharacteristic(service, "notify", this
                  .notify_characteristicId);
              }).then(async characteristic => {
                if (__this.device.write_characteristic) {
                  if (__this.onConnect) {
                    await __this.onConnect();
                    __this.setState(1);
                  }
                  reslove();
                }
              })
            }).catch(err => {
              __this.setState(-1);
              reject(err);
            })
          } catch (err) {
            __this.setState(-1);
            throw new Error(err);
          }
        });
      }
      // #endif

    }

    /**
     * 断开蓝牙。
     * @return {Promise}
     */
    disconnect() {
      if (!this.connected) {
        return;
      }
      // #ifndef H5
      return new Promise((reslove, reject) => {
        uni.closeBLEConnection({
          deviceId: __this.device.deviceId,
          success: (res) => {
            __this.device = {};
            if (__this.onDisconnect) {
              __this.onDisconnect();
            }
            __this.setState(-1);
            reslove(res);
          },
          fail: (err) => {
            console.log(err);
            reject(err);
          },
        });
      })
      // #endif
      // #ifdef H5
      return new Promise((reslove, reject) => {
        __this.device.server.disconnect();
        if (__this.onDisconnect) {
          __this.onDisconnect();
        }
        __this.setState(-1);
        reslove();
      });
      // #endif
    }

    /**
     * 写入特征值，需要设置过write_characteristicId。
     * @param {string} str - 要写入的数据 
     * @return {Promise}
     */
    writeBLECharacteristic(str) {
      const buffer = strToArrayBuffer(str);
      // #ifndef H5
      return new Promise((reslove, reject) => {
        uni.writeBLECharacteristicValue({
          deviceId: __this.device.deviceId,
          serviceId: this.write_serviceId,
          characteristicId: this.write_characteristicId,
          value: buffer,
          success: (res) => {
            if (__this.onCharacteristicWritten) {
              __this.onCharacteristicWritten(str);
            }
            reslove(res);
          },
          fail: (err) => {
            reject(err);
          },
        });
      })
      // #endif

      // #ifdef H5
      return new Promise((reslove, reject) => {
        if (!__this.device.write_characteristic) {
          throw new Error("未找到写入特征值!")
        }
        __this.device.write_characteristic
          .writeValue(buffer)
          .then((res) => {
            if (__this.onCharacteristicWritten) {
              __this.onCharacteristicWritten(str);
            }
            reslove(res);
          })
          .catch((err) => {
            reject(err);
          });
      })
      // #endif
    }

    /**
     * 开始监听特征值变化，需要设置过notify_characteristicId。
     * @param {onCharacteristicChange} callback - 蓝牙特征值改变时触发的回调，创建对象时传入onCharacteristicChange时失效
     * @return {Promise}
     */
    startListenValueChange(callback) {
      __this.setState(2);
      if (__this.onCharacteristicChange) {
        callback = __this.onCharacteristicChange;
      }
      // #ifndef H5
      if (callback instanceof Function) {
        uni.onBLECharacteristicValueChange((res) => {
          const value = String.fromCharCode.apply(
            null,
            new Uint8Array(res.value)
          );
          callback(value);
        });
      }
      return __this.notifyBLECharacteristicValueChange(true, this.notify_characteristicId);
      // #endif

      // #ifdef H5
      if (callback instanceof Function) {
        __this.device.notify_characteristic.addEventListener('characteristicvaluechanged', (e) => {
          const value = String.fromCharCode.apply(
            null,
            new Uint8Array(e.target.value.buffer)
          );
          callback(value);
        });
      }
      return __this.device.notify_characteristic.startNotifications();
      // #endif
    }

    /**
     * 停止监听特征值变化。
     * @return {Promise}
     */
    stopListenValueChange() {
      return new Promise((reslove, reject) => {
        // #ifndef H5
        return __this.notifyBLECharacteristicValueChange(false)
          .then((res) => {
            __this.restoreState();
            reslove(res)
          }).catch(err => {
            reject(err);
          });
        // #endif
        // #ifdef H5
        return __this.device.notify_characteristic.stopNotifications()
          .then((res) => {
            __this.restoreState();
            reslove(res)
          }).catch(err => {
            reject(err);
          });
        // #endif
      })
    }

    /**
     * 输出错误信息，安卓端为原生提示，其他为控制台输出。
     */
    logMessage(code) {
      if (code == 0) {
        return;
      }
      switch (code) {
        case 10000:
          __this.toast("未初始化蓝牙适配器");
          break;
        case 10001:
          __this.toast("未检测到蓝牙，请打开蓝牙重试！");
          break;
        case 10002:
          __this.toast("没有找到指定设备");
          break;
        case 10003:
          __this.toast("连接失败");
          break;
        case 10004:
          __this.toast("没有找到指定服务");
          break;
        case 10005:
          __this.toast("没有找到指定特征值");
          break;
        case 10006:
          __this.toast("当前连接已断开");
          break;
        case 10007:
          __this.toast("当前特征值不支持此操作");
          break;
        case 10008:
          __this.toast("其余所有系统上报的异常");
          break;
        case 10009:
          __this.toast("Android系统版本低于 4.3 不支持 BLE");
          break;
        default:
          __this.toast(code);
      }
    }

    /**
     * 销毁蓝牙对象。
     */
    destory() {
      this.disconnect();
      if (__this.onDestory) {
        __this.onDestory();
      }
      // #ifndef H5
      __this.closeAdapter();
      // #endif
      delete this;
    }
  }

  this.public = new BLEbluetooth(object);
  return this.public;
}


//私有方法

/**
 * @prative
 */
PrativeClass.prototype.setState = function (state) {
  this.stateBefore = this.state;
  if (typeof state === "string") {
    this.state = stateType[state] || -1;
  } else if (typeof state === "number") {
    this.state = state;
  } else {
    this.state = -1;
  }
  if (this.onStateChange) {
    this.onStateChange({ state: this.public.state, connected: this.public.connected });
  }
}

/**
 * @prative
 */
PrativeClass.prototype.restoreState = function (state) {
  this.setState(this.stateBefore);
}

/**
 * @prative
 */
PrativeClass.prototype.toast = function (content) {
  // #ifdef APP-PLUS
  Toast.makeText(
    plus.android.runtimeMainActivity(),
    content,
    Toast.LENGTH_SHORT
  ).show();
  // #endif
  // #ifndef APP-PLUS
  console.log(content)
  // #endif
}

// #ifndef H5
/**
 * @prative
 */
PrativeClass.prototype.openAdapter = function () {
  return new Promise((reslove, reject) => {
    uni.openBluetoothAdapter({
      success: (res) => {
        reslove(res);
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * @prative
 */
PrativeClass.prototype.closeAdapter = function () {
  return new Promise((reslove, reject) => {
    uni.closeBluetoothAdapter({
      success: (res) => {
        reslove(res);
      },
      fail: (err) => {
        reject(err);
      }
    });
  })
}

/**
 * @prative
 */
PrativeClass.prototype.init = function () {
  return new Promise((reslove, reject) => {
    this.openAdapter().then((res) => {
      uni.onBLEConnectionStateChange((res) => {
        if (!res.connected) {
          if (this.onDisconnect) {
            this.onDisconnect();
          }
          this.setState(-1);
        }
      });
      reslove(res);
    }).catch((err) => {
      reject(err);
    });
  })
}

/**
 * @prative
 */
PrativeClass.prototype.setMTU = function () {
  return new Promise((reslove, reject) => {
    uni.setBLEMTU({
      deviceId: this.device.deviceId,
      mtu: this.public.mtu,
      success: (res) => {
        reslove(res);
      },
      fail: (err) => {
        reject(err)
      },
    });
  });
}

/**
 * @prative
 */
PrativeClass.prototype.notifyBLECharacteristicValueChange = function (state) {
  return new Promise((reslove, reject) => {
    uni.notifyBLECharacteristicValueChange({
      deviceId: this.device.deviceId,
      serviceId: this.public.notify_serviceId,
      characteristicId: this.public.notify_characteristicId,
      state,
      success: (res) => {
        reslove(res);
      },
      fail: (err) => {
        reject(err);
      },
    });
  })
}
// #endif

// #ifdef H5
/**
 * @prative
 */
PrativeClass.prototype.selectDevice = function (options) {
  this.device = {};
  return new Promise((reslove, reject) => {
    navigator.bluetooth.requestDevice(options).then((device) => {
      return device.gatt.connect();
    }).then(server => {
      this.device.server = server;
      reslove(server);
    }).catch(err => {
      reject(err);
    });
  });
}

/**
 * @prative
 */
PrativeClass.prototype.getService = function (operationName, serviceId) {
  if (!this.device.server) {
    throw new Error("未选择蓝牙！");
  }
  serviceId = serviceId.toLowerCase();
  return new Promise((reslove, reject) => {
    this.device.server.getPrimaryService(serviceId).then(service => {
      this.device[operationName + "_service"] = service;
      reslove(service);
    }).catch(err => {
      reject(err);
    })
  });
}

/**
 * @prative
 */
PrativeClass.prototype.getCharacteristic = function (service, operationName, characteristicId) {
  if (!service) {
    throw new Error("未指定服务！");
  }
  characteristicId = characteristicId.toLowerCase();
  return new Promise((reslove, reject) => {
    service.getCharacteristic(characteristicId).then(characteristic => {
      this.device[operationName + "_characteristic"] = characteristic;
      reslove(characteristic);
    }).catch(err => {
      reject(err);
    })
  });
}
// #endif
