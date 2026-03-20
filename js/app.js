/**
 * 天枢命理 - App Controller
 * Uses lunar-javascript for BaZi, iztro for ZiWei Dou Shu
 */
(function() {
    'use strict';

    // ===== History: 最近查询记录 =====
    var HISTORY_KEY = 'tianshu_history';
    function getHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch(e) { return []; } }
    function saveHistory(entry) {
      var h = getHistory();
      // Dedup by same birth info
      h = h.filter(function(x) { return !(x.year===entry.year && x.month===entry.month && x.day===entry.day && x.hour===entry.hour && x.gender===entry.gender); });
      h.unshift(entry);
      if (h.length > 10) h = h.slice(0, 10);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
    }
    function deleteHistory(idx) {
      var h = getHistory();
      h.splice(idx, 1);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
      renderHistory();
    }
    function renderHistory() {
      var h = getHistory();
      var container = document.getElementById('history-list');
      if (!container) return;
      if (h.length === 0) { container.style.display = 'none'; container.innerHTML = ''; return; }
      container.innerHTML = '<span style="font-size:.72rem;color:var(--gold-light);margin-right:4px">最近查询：</span>' + h.map(function(item, i) {
        return '<span class="history-item-wrap">' +
          '<button class="history-item" data-idx="'+i+'">' +
          item.year+'-'+item.month+'-'+item.day + ' ' + (item.hour||0)+':'+String(item.minute||0).padStart(2,'0') +
          ' ' + (item.province||'') + (item.city||'') + ' ' + (item.gender==='male'?'男':'女') + '</button>' +
          '<button class="history-del" data-idx="'+i+'" title="删除">×</button>' +
          '</span>';
      }).join('');
      container.style.display = 'flex';
      container.querySelectorAll('.history-item').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var item = h[parseInt(this.dataset.idx)];
          if (!item) return;
          document.getElementById('birth-year').value = item.year;
          document.getElementById('birth-month').value = item.month;
          document.getElementById('birth-day').value = item.day;
          document.getElementById('birth-hour').value = item.hour || 12;
          document.getElementById('birth-minute').value = item.minute || 0;
          if (item.province) { document.getElementById('birth-province').value = item.province; updateCities(); }
          document.querySelector('input[name="birth-gender"][value="'+item.gender+'"]').checked = true;
          document.getElementById('birth-form').dispatchEvent(new Event('submit'));
        });
      });
      container.querySelectorAll('.history-del').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          deleteHistory(parseInt(this.dataset.idx));
        });
      });
    }

    // lunar-javascript exports
    var LunarJS = window.Solar ? window : (window.lunar || {});
    var SolarClass = LunarJS.Solar || (typeof Solar !== 'undefined' ? Solar : null);

    // iztro exports
    var Iztro = window.iztro || {};

    // ===== Cities for true solar time =====
    var CITIES = [
{name:"北京",province:"北京",lng:116.41},
{name:"天津",province:"天津",lng:117.2},
{name:"石家庄",province:"河北",lng:114.51},
{name:"唐山",province:"河北",lng:118.18},
{name:"秦皇岛",province:"河北",lng:119.6},
{name:"邯郸",province:"河北",lng:114.49},
{name:"邢台",province:"河北",lng:114.5},
{name:"保定",province:"河北",lng:115.46},
{name:"张家口",province:"河北",lng:114.88},
{name:"承德",province:"河北",lng:117.96},
{name:"沧州",province:"河北",lng:116.86},
{name:"廊坊",province:"河北",lng:116.68},
{name:"衡水",province:"河北",lng:115.67},
{name:"太原",province:"山西",lng:112.55},
{name:"大同",province:"山西",lng:113.3},
{name:"阳泉",province:"山西",lng:113.58},
{name:"长治",province:"山西",lng:113.12},
{name:"晋城",province:"山西",lng:112.85},
{name:"朔州",province:"山西",lng:112.43},
{name:"晋中",province:"山西",lng:112.75},
{name:"运城",province:"山西",lng:111.01},
{name:"忻州",province:"山西",lng:112.73},
{name:"临汾",province:"山西",lng:111.52},
{name:"吕梁",province:"山西",lng:111.14},
{name:"呼和浩特",province:"内蒙古",lng:111.75},
{name:"包头",province:"内蒙古",lng:109.84},
{name:"乌海",province:"内蒙古",lng:106.79},
{name:"赤峰",province:"内蒙古",lng:118.89},
{name:"通辽",province:"内蒙古",lng:122.24},
{name:"鄂尔多斯",province:"内蒙古",lng:109.99},
{name:"呼伦贝尔",province:"内蒙古",lng:119.77},
{name:"巴彦淖尔",province:"内蒙古",lng:107.39},
{name:"乌兰察布",province:"内蒙古",lng:113.13},
{name:"沈阳",province:"辽宁",lng:123.43},
{name:"大连",province:"辽宁",lng:121.62},
{name:"鞍山",province:"辽宁",lng:122.99},
{name:"抚顺",province:"辽宁",lng:123.96},
{name:"本溪",province:"辽宁",lng:123.77},
{name:"丹东",province:"辽宁",lng:124.38},
{name:"锦州",province:"辽宁",lng:121.13},
{name:"营口",province:"辽宁",lng:122.23},
{name:"阜新",province:"辽宁",lng:121.67},
{name:"辽阳",province:"辽宁",lng:123.17},
{name:"盘锦",province:"辽宁",lng:122.07},
{name:"铁岭",province:"辽宁",lng:123.84},
{name:"朝阳",province:"辽宁",lng:120.45},
{name:"葫芦岛",province:"辽宁",lng:120.84},
{name:"长春",province:"吉林",lng:125.32},
{name:"吉林市",province:"吉林",lng:126.55},
{name:"四平",province:"吉林",lng:124.35},
{name:"辽源",province:"吉林",lng:125.14},
{name:"通化",province:"吉林",lng:125.94},
{name:"白山",province:"吉林",lng:126.42},
{name:"松原",province:"吉林",lng:124.82},
{name:"白城",province:"吉林",lng:122.84},
{name:"哈尔滨",province:"黑龙江",lng:126.63},
{name:"齐齐哈尔",province:"黑龙江",lng:123.95},
{name:"鸡西",province:"黑龙江",lng:130.97},
{name:"鹤岗",province:"黑龙江",lng:130.28},
{name:"双鸭山",province:"黑龙江",lng:131.16},
{name:"大庆",province:"黑龙江",lng:125.1},
{name:"伊春",province:"黑龙江",lng:128.9},
{name:"佳木斯",province:"黑龙江",lng:130.36},
{name:"牡丹江",province:"黑龙江",lng:129.63},
{name:"黑河",province:"黑龙江",lng:127.53},
{name:"绥化",province:"黑龙江",lng:126.97},
{name:"上海",province:"上海",lng:121.47},
{name:"南京",province:"江苏",lng:118.78},
{name:"无锡",province:"江苏",lng:120.3},
{name:"徐州",province:"江苏",lng:117.18},
{name:"常州",province:"江苏",lng:119.97},
{name:"苏州",province:"江苏",lng:120.62},
{name:"南通",province:"江苏",lng:120.86},
{name:"连云港",province:"江苏",lng:119.22},
{name:"淮安",province:"江苏",lng:119.02},
{name:"盐城",province:"江苏",lng:120.16},
{name:"扬州",province:"江苏",lng:119.41},
{name:"镇江",province:"江苏",lng:119.45},
{name:"泰州",province:"江苏",lng:119.92},
{name:"宿迁",province:"江苏",lng:118.28},
{name:"杭州",province:"浙江",lng:120.15},
{name:"宁波",province:"浙江",lng:121.55},
{name:"温州",province:"浙江",lng:120.7},
{name:"嘉兴",province:"浙江",lng:120.76},
{name:"湖州",province:"浙江",lng:120.09},
{name:"绍兴",province:"浙江",lng:120.58},
{name:"金华",province:"浙江",lng:119.65},
{name:"衢州",province:"浙江",lng:118.87},
{name:"舟山",province:"浙江",lng:122.11},
{name:"台州",province:"浙江",lng:121.42},
{name:"丽水",province:"浙江",lng:119.92},
{name:"合肥",province:"安徽",lng:117.28},
{name:"芜湖",province:"安徽",lng:118.38},
{name:"蚌埠",province:"安徽",lng:117.39},
{name:"淮南",province:"安徽",lng:117.02},
{name:"马鞍山",province:"安徽",lng:118.51},
{name:"淮北",province:"安徽",lng:116.79},
{name:"铜陵",province:"安徽",lng:117.81},
{name:"安庆",province:"安徽",lng:117.04},
{name:"黄山",province:"安徽",lng:118.34},
{name:"滁州",province:"安徽",lng:118.32},
{name:"阜阳",province:"安徽",lng:115.81},
{name:"宿州",province:"安徽",lng:116.96},
{name:"六安",province:"安徽",lng:116.52},
{name:"亳州",province:"安徽",lng:115.78},
{name:"池州",province:"安徽",lng:117.49},
{name:"宣城",province:"安徽",lng:118.76},
{name:"福州",province:"福建",lng:119.3},
{name:"厦门",province:"福建",lng:118.09},
{name:"莆田",province:"福建",lng:119.01},
{name:"三明",province:"福建",lng:117.64},
{name:"泉州",province:"福建",lng:118.68},
{name:"漳州",province:"福建",lng:117.65},
{name:"南平",province:"福建",lng:118.18},
{name:"龙岩",province:"福建",lng:117.03},
{name:"宁德",province:"福建",lng:119.53},
{name:"南昌",province:"江西",lng:115.86},
{name:"景德镇",province:"江西",lng:117.21},
{name:"萍乡",province:"江西",lng:113.85},
{name:"九江",province:"江西",lng:116},
{name:"新余",province:"江西",lng:114.92},
{name:"鹰潭",province:"江西",lng:117.07},
{name:"赣州",province:"江西",lng:114.94},
{name:"吉安",province:"江西",lng:114.99},
{name:"宜春",province:"江西",lng:114.39},
{name:"抚州",province:"江西",lng:116.36},
{name:"上饶",province:"江西",lng:117.97},
{name:"济南",province:"山东",lng:117},
{name:"青岛",province:"山东",lng:120.38},
{name:"淄博",province:"山东",lng:118.05},
{name:"枣庄",province:"山东",lng:117.32},
{name:"东营",province:"山东",lng:118.67},
{name:"烟台",province:"山东",lng:121.39},
{name:"潍坊",province:"山东",lng:119.16},
{name:"济宁",province:"山东",lng:116.59},
{name:"泰安",province:"山东",lng:117.09},
{name:"威海",province:"山东",lng:122.12},
{name:"日照",province:"山东",lng:119.46},
{name:"临沂",province:"山东",lng:118.36},
{name:"德州",province:"山东",lng:116.36},
{name:"聊城",province:"山东",lng:115.98},
{name:"滨州",province:"山东",lng:118.02},
{name:"菏泽",province:"山东",lng:115.48},
{name:"郑州",province:"河南",lng:113.65},
{name:"开封",province:"河南",lng:114.35},
{name:"洛阳",province:"河南",lng:112.45},
{name:"平顶山",province:"河南",lng:113.19},
{name:"安阳",province:"河南",lng:114.35},
{name:"鹤壁",province:"河南",lng:114.3},
{name:"新乡",province:"河南",lng:113.88},
{name:"焦作",province:"河南",lng:113.24},
{name:"濮阳",province:"河南",lng:115.03},
{name:"许昌",province:"河南",lng:113.85},
{name:"漯河",province:"河南",lng:114.02},
{name:"三门峡",province:"河南",lng:111.2},
{name:"南阳",province:"河南",lng:112.53},
{name:"商丘",province:"河南",lng:115.65},
{name:"信阳",province:"河南",lng:114.07},
{name:"周口",province:"河南",lng:114.65},
{name:"驻马店",province:"河南",lng:114.02},
{name:"武汉",province:"湖北",lng:114.3},
{name:"黄石",province:"湖北",lng:115.04},
{name:"十堰",province:"湖北",lng:110.8},
{name:"宜昌",province:"湖北",lng:111.29},
{name:"襄阳",province:"湖北",lng:112.14},
{name:"鄂州",province:"湖北",lng:114.89},
{name:"荆门",province:"湖北",lng:112.2},
{name:"孝感",province:"湖北",lng:113.92},
{name:"荆州",province:"湖北",lng:112.24},
{name:"黄冈",province:"湖北",lng:114.87},
{name:"咸宁",province:"湖北",lng:114.32},
{name:"随州",province:"湖北",lng:113.38},
{name:"恩施",province:"湖北",lng:109.49},
{name:"长沙",province:"湖南",lng:112.97},
{name:"株洲",province:"湖南",lng:113.13},
{name:"湘潭",province:"湖南",lng:112.94},
{name:"衡阳",province:"湖南",lng:112.57},
{name:"邵阳",province:"湖南",lng:111.47},
{name:"岳阳",province:"湖南",lng:113.13},
{name:"常德",province:"湖南",lng:111.69},
{name:"张家界",province:"湖南",lng:110.48},
{name:"益阳",province:"湖南",lng:112.36},
{name:"郴州",province:"湖南",lng:113.01},
{name:"永州",province:"湖南",lng:111.61},
{name:"怀化",province:"湖南",lng:110},
{name:"娄底",province:"湖南",lng:112},
{name:"湘西",province:"湖南",lng:109.74},
{name:"广州",province:"广东",lng:113.26},
{name:"韶关",province:"广东",lng:113.6},
{name:"深圳",province:"广东",lng:114.07},
{name:"珠海",province:"广东",lng:113.58},
{name:"汕头",province:"广东",lng:116.68},
{name:"佛山",province:"广东",lng:113.12},
{name:"江门",province:"广东",lng:113.08},
{name:"湛江",province:"广东",lng:110.36},
{name:"茂名",province:"广东",lng:110.92},
{name:"肇庆",province:"广东",lng:112.47},
{name:"惠州",province:"广东",lng:114.42},
{name:"梅州",province:"广东",lng:116.12},
{name:"汕尾",province:"广东",lng:115.37},
{name:"河源",province:"广东",lng:114.7},
{name:"阳江",province:"广东",lng:111.98},
{name:"清远",province:"广东",lng:113.06},
{name:"东莞",province:"广东",lng:113.75},
{name:"中山",province:"广东",lng:113.38},
{name:"潮州",province:"广东",lng:116.62},
{name:"揭阳",province:"广东",lng:116.37},
{name:"云浮",province:"广东",lng:112.04},
{name:"南宁",province:"广西",lng:108.37},
{name:"柳州",province:"广西",lng:109.41},
{name:"桂林",province:"广西",lng:110.29},
{name:"梧州",province:"广西",lng:111.28},
{name:"北海",province:"广西",lng:109.12},
{name:"防城港",province:"广西",lng:108.35},
{name:"钦州",province:"广西",lng:108.65},
{name:"贵港",province:"广西",lng:109.6},
{name:"玉林",province:"广西",lng:110.18},
{name:"百色",province:"广西",lng:106.62},
{name:"贺州",province:"广西",lng:111.55},
{name:"河池",province:"广西",lng:108.06},
{name:"来宾",province:"广西",lng:109.22},
{name:"崇左",province:"广西",lng:107.36},
{name:"海口",province:"海南",lng:110.35},
{name:"三亚",province:"海南",lng:109.51},
{name:"三沙",province:"海南",lng:112.33},
{name:"儋州",province:"海南",lng:109.58},
{name:"重庆",province:"重庆",lng:106.55},
{name:"成都",province:"四川",lng:104.07},
{name:"自贡",province:"四川",lng:104.77},
{name:"攀枝花",province:"四川",lng:101.72},
{name:"泸州",province:"四川",lng:105.44},
{name:"德阳",province:"四川",lng:104.4},
{name:"绵阳",province:"四川",lng:104.73},
{name:"广元",province:"四川",lng:105.84},
{name:"遂宁",province:"四川",lng:105.59},
{name:"内江",province:"四川",lng:105.06},
{name:"乐山",province:"四川",lng:103.77},
{name:"南充",province:"四川",lng:106.08},
{name:"眉山",province:"四川",lng:103.85},
{name:"宜宾",province:"四川",lng:104.64},
{name:"广安",province:"四川",lng:106.63},
{name:"达州",province:"四川",lng:107.5},
{name:"雅安",province:"四川",lng:103},
{name:"巴中",province:"四川",lng:106.76},
{name:"资阳",province:"四川",lng:104.63},
{name:"阿坝",province:"四川",lng:102.22},
{name:"甘孜",province:"四川",lng:101.96},
{name:"凉山",province:"四川",lng:102.27},
{name:"贵阳",province:"贵州",lng:106.71},
{name:"六盘水",province:"贵州",lng:104.83},
{name:"遵义",province:"贵州",lng:106.93},
{name:"安顺",province:"贵州",lng:105.95},
{name:"毕节",province:"贵州",lng:105.28},
{name:"铜仁",province:"贵州",lng:109.19},
{name:"黔西南",province:"贵州",lng:104.9},
{name:"黔东南",province:"贵州",lng:107.98},
{name:"黔南",province:"贵州",lng:107.52},
{name:"昆明",province:"云南",lng:102.73},
{name:"曲靖",province:"云南",lng:103.8},
{name:"玉溪",province:"云南",lng:102.55},
{name:"保山",province:"云南",lng:99.17},
{name:"昭通",province:"云南",lng:103.72},
{name:"丽江",province:"云南",lng:100.23},
{name:"普洱",province:"云南",lng:101.04},
{name:"临沧",province:"云南",lng:100.09},
{name:"大理",province:"云南",lng:100.23},
{name:"红河",province:"云南",lng:103.38},
{name:"文山",province:"云南",lng:104.24},
{name:"西双版纳",province:"云南",lng:100.8},
{name:"德宏",province:"云南",lng:98.58},
{name:"迪庆",province:"云南",lng:99.7},
{name:"拉萨",province:"西藏",lng:91.13},
{name:"日喀则",province:"西藏",lng:88.88},
{name:"昌都",province:"西藏",lng:97.17},
{name:"林芝",province:"西藏",lng:94.36},
{name:"山南",province:"西藏",lng:91.77},
{name:"那曲",province:"西藏",lng:92.05},
{name:"西安",province:"陕西",lng:108.94},
{name:"铜川",province:"陕西",lng:108.94},
{name:"宝鸡",province:"陕西",lng:107.14},
{name:"咸阳",province:"陕西",lng:108.71},
{name:"渭南",province:"陕西",lng:109.5},
{name:"延安",province:"陕西",lng:109.49},
{name:"汉中",province:"陕西",lng:107.03},
{name:"榆林",province:"陕西",lng:109.73},
{name:"安康",province:"陕西",lng:109.03},
{name:"商洛",province:"陕西",lng:109.94},
{name:"兰州",province:"甘肃",lng:103.83},
{name:"嘉峪关",province:"甘肃",lng:98.29},
{name:"金昌",province:"甘肃",lng:102.19},
{name:"白银",province:"甘肃",lng:104.17},
{name:"天水",province:"甘肃",lng:105.72},
{name:"武威",province:"甘肃",lng:102.64},
{name:"张掖",province:"甘肃",lng:100.45},
{name:"平凉",province:"甘肃",lng:106.67},
{name:"酒泉",province:"甘肃",lng:98.49},
{name:"庆阳",province:"甘肃",lng:107.64},
{name:"定西",province:"甘肃",lng:104.63},
{name:"陇南",province:"甘肃",lng:104.92},
{name:"西宁",province:"青海",lng:101.77},
{name:"海东",province:"青海",lng:102.1},
{name:"海北",province:"青海",lng:100.9},
{name:"海南州",province:"青海",lng:100.62},
{name:"果洛",province:"青海",lng:100.24},
{name:"玉树",province:"青海",lng:97.01},
{name:"海西",province:"青海",lng:97.37},
{name:"银川",province:"宁夏",lng:106.27},
{name:"石嘴山",province:"宁夏",lng:106.38},
{name:"吴忠",province:"宁夏",lng:106.2},
{name:"固原",province:"宁夏",lng:106.28},
{name:"中卫",province:"宁夏",lng:105.2},
{name:"乌鲁木齐",province:"新疆",lng:87.62},
{name:"克拉玛依",province:"新疆",lng:84.87},
{name:"吐鲁番",province:"新疆",lng:89.19},
{name:"哈密",province:"新疆",lng:93.51},
{name:"昌吉",province:"新疆",lng:87.31},
{name:"博尔塔拉",province:"新疆",lng:82.07},
{name:"巴音郭楞",province:"新疆",lng:86.15},
{name:"阿克苏",province:"新疆",lng:80.26},
{name:"克孜勒苏",province:"新疆",lng:76.17},
{name:"喀什",province:"新疆",lng:75.99},
{name:"和田",province:"新疆",lng:79.93},
{name:"伊犁",province:"新疆",lng:81.33},
{name:"塔城",province:"新疆",lng:82.99},
{name:"阿勒泰",province:"新疆",lng:88.13},
{name:"台北",province:"台湾",lng:121.56},
{name:"新北",province:"台湾",lng:121.47},
{name:"桃园",province:"台湾",lng:121.3},
{name:"台中",province:"台湾",lng:120.68},
{name:"台南",province:"台湾",lng:120.23},
{name:"高雄",province:"台湾",lng:120.31},
{name:"基隆",province:"台湾",lng:121.74},
{name:"新竹",province:"台湾",lng:120.97},
{name:"嘉义",province:"台湾",lng:120.45},
{name:"花莲",province:"台湾",lng:121.6},
{name:"台东",province:"台湾",lng:121.15},
{name:"宜兰",province:"台湾",lng:121.76},
{name:"屏东",province:"台湾",lng:120.49},
{name:"彰化",province:"台湾",lng:120.54},
{name:"南投",province:"台湾",lng:120.69},
{name:"云林",province:"台湾",lng:120.53},
{name:"苗栗",province:"台湾",lng:120.82},
{name:"香港",province:"香港",lng:114.17},
{name:"澳门",province:"澳门",lng:113.54},
{name:"新加坡",province:"海外",lng:103.82},
{name:"吉隆坡",province:"海外",lng:101.69},
{name:"曼谷",province:"海外",lng:100.5},
{name:"东京",province:"海外",lng:139.69},
{name:"首尔",province:"海外",lng:126.98},
{name:"悉尼",province:"海外",lng:151.21},
{name:"墨尔本",province:"海外",lng:144.96},
{name:"纽约",province:"海外",lng:-74.01},
{name:"洛杉矶",province:"海外",lng:-118.24},
{name:"旧金山",province:"海外",lng:-122.42},
{name:"温哥华",province:"海外",lng:-123.12},
{name:"多伦多",province:"海外",lng:-79.38},
{name:"伦敦",province:"海外",lng:-0.12}
];

    // ===== Tab Switching =====
    document.querySelectorAll('.tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // ===== Populate Selectors =====
    function populateSelectors() {
        var currentYear = new Date().getFullYear();
        var yearSel = document.getElementById('birth-year');
        for (var y = currentYear; y >= 1924; y--) {
            var opt = document.createElement('option');
            opt.value = y; opt.textContent = y + '年';
            yearSel.appendChild(opt);
        }
        yearSel.value = 1990;

        var monthSel = document.getElementById('birth-month');
        for (var m = 1; m <= 12; m++) {
            var opt2 = document.createElement('option');
            opt2.value = m; opt2.textContent = m + '月';
            monthSel.appendChild(opt2);
        }

        var daySel = document.getElementById('birth-day');
        for (var d = 1; d <= 31; d++) {
            var opt3 = document.createElement('option');
            opt3.value = d; opt3.textContent = d + '日';
            daySel.appendChild(opt3);
        }

        var hourSel = document.getElementById('birth-hour');
        for (var h = 0; h < 24; h++) {
            var opt4 = document.createElement('option');
            opt4.value = h; opt4.textContent = String(h).padStart(2,'0') + '时';
            hourSel.appendChild(opt4);
        }
        hourSel.value = 12;

        var minSel = document.getElementById('birth-minute');
        for (var mi = 0; mi < 60; mi += 5) {
            var opt5 = document.createElement('option');
            opt5.value = mi; opt5.textContent = String(mi).padStart(2,'0') + '分';
            minSel.appendChild(opt5);
        }

        // Province + City cascade
        var provSel = document.getElementById('birth-province');
        var citySel = document.getElementById('birth-city');
        var provGroups = {};
        var provOrder = [];
        CITIES.forEach(function(c) {
            if (!provGroups[c.province]) { provGroups[c.province] = []; provOrder.push(c.province); }
            provGroups[c.province].push(c);
        });
        provOrder.forEach(function(prov) {
            var o = document.createElement('option');
            o.value = prov; o.textContent = prov;
            provSel.appendChild(o);
        });
        window.updateCities = function() {
            var prov = provSel.value;
            citySel.innerHTML = '';
            (provGroups[prov] || []).forEach(function(c) {
                var o = document.createElement('option');
                o.value = c.lng; o.textContent = c.name;
                citySel.appendChild(o);
            });
        }
        provSel.addEventListener('change', updateCities);
        provSel.value = '北京';
        updateCities();
    }
    populateSelectors();
    renderHistory();

    // ===== True Solar Time =====
    function calcTrueSolarTime(year, month, day, hour, minute, lng) {
        var refMeridian = (lng >= 73 && lng <= 135) ? 120 : Math.round(lng / 15) * 15;
        var doy = Math.floor((new Date(year, month-1, day) - new Date(year, 0, 0)) / 86400000);
        var B = 2 * Math.PI * (doy - 81) / 364;
        var eot = 9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
        var lngCorr = (lng - refMeridian) * 4;
        var offset = Math.round(lngCorr + eot);
        var total = hour * 60 + minute + offset;
        var dayOff = 0;
        if (total < 0) { dayOff = -1; total += 1440; }
        else if (total >= 1440) { dayOff = 1; total -= 1440; }
        var tH = Math.floor(total / 60), tM = total % 60;
        return {
            trueHour: tH, trueMinute: tM, dayOffset: dayOff, offset: offset,
            str: String(tH).padStart(2,'0') + ':' + String(tM).padStart(2,'0'),
            desc: '经度修正' + (lngCorr>=0?'+':'') + lngCorr.toFixed(1) + '分 + 时差修正' + (eot>=0?'+':'') + eot.toFixed(1) + '分 = 共' + (offset>=0?'+':'') + offset + '分'
        };
    }

    // ===== Birth Form Submit =====
    document.getElementById('birth-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var year = parseInt(document.getElementById('birth-year').value);
        var month = parseInt(document.getElementById('birth-month').value);
        var day = parseInt(document.getElementById('birth-day').value);
        var hour = parseInt(document.getElementById('birth-hour').value);
        var minute = parseInt(document.getElementById('birth-minute').value);
        var lng = parseFloat(document.getElementById('birth-city').value);
        var gender = document.querySelector('input[name="birth-gender"]:checked').value;

        var testDate = new Date(year, month-1, day);
        if (testDate.getMonth() !== month-1 || testDate.getDate() !== day) {
            alert('请输入有效的日期'); return;
        }

        // True solar time
        var tst = calcTrueSolarTime(year, month, day, hour, minute, lng);
        // Get city name
        var cityOpt = document.getElementById('birth-city').selectedOptions[0];
        tst.cityName = cityOpt ? cityOpt.textContent : '';
        tst.longitude = lng;
        // Shichen names
        var scNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
        var stdShichen = Math.floor(((hour + 1) % 24) / 2);
        var trueShichen = Math.floor(((tst.trueHour + 1) % 24) / 2);
        tst.stdShichen = scNames[stdShichen] + '时';
        tst.trueShichen = scNames[trueShichen] + '时';
        tst.shichenChanged = (stdShichen !== trueShichen);
        var sY = year, sM = month, sD = day;
        if (tst.dayOffset !== 0) {
            var dd = new Date(year, month-1, day + tst.dayOffset);
            sY = dd.getFullYear(); sM = dd.getMonth()+1; sD = dd.getDate();
        }

        // Show TST info
        var infoDiv = document.getElementById('solar-time-info');
        infoDiv.style.display = 'block';

        // Use lunar-javascript for accurate lunar conversion
        var lunarInfo = '';
        if (SolarClass) {
            try {
                var solar = SolarClass.fromYmd(sY, sM, sD);
                var lunarObj = solar.getLunar();
                lunarInfo = '<br><span class="tst-label">农历：</span><strong>' +
                    lunarObj.getYearInGanZhi() + '年（' + lunarObj.getYearShengXiao() + '）' +
                    (lunarObj.getMonthInChinese()) + '月' + lunarObj.getDayInChinese() + '</strong>';
            } catch(e2) { console.error('Lunar conversion error:', e2); }
        }

        infoDiv.innerHTML = '<span class="tst-label">真太阳时：</span><strong>' + tst.str + '</strong>' +
            '<span class="tst-detail"> ' + tst.desc + '</span>' + lunarInfo +
            (tst.dayOffset ? '<span class="tst-warn">真太阳时跨日，实际日期为' + sM + '月' + sD + '日</span>' : '');

        // Save to history
        var provEl = document.getElementById('birth-province');
        saveHistory({ year:year, month:month, day:day, hour:hour, minute:minute, province:provEl?provEl.value:'', city:cityOpt?cityOpt.textContent:'', gender:gender });
        renderHistory();

        // Record analytics (async, non-blocking)
        try {
            fetch('/api/record', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    year: year, month: month, day: day, hour: hour, minute: minute,
                    province: provEl ? provEl.value : '', city: cityOpt ? cityOpt.textContent : '',
                    gender: gender, feature: 'paipan'
                })
            }).catch(function(){});
        } catch(e) {}

        // Loading
        ['bazi-result','ziwei-result','fengshui-result'].forEach(function(id) {
            document.getElementById(id).innerHTML = '<div class="loading">排盘中</div>';
        });

        setTimeout(function() {
            // ========== BAZI using lunar-javascript ==========
            try {
                if (SolarClass) {
                    var solar2 = SolarClass.fromYmdHms(sY, sM, sD, tst.trueHour, tst.trueMinute, 0);
                    var lunar2 = solar2.getLunar();
                    var ec = lunar2.getEightChar();
                    var baziData = {
                        ec: ec, lunar: lunar2, solar: solar2, gender: gender,
                        _tst: tst, _stdTime: String(hour).padStart(2,'0') + ':' + String(minute).padStart(2,'0')
                    };
                    document.getElementById('bazi-result').innerHTML = BaZi.render(baziData);

                    // Store for personalized daily fortune
                    _lastBaziData = baziData;
                    renderDaily();

                    // Auto-scroll dayun/liuyue timelines to current position
                    setTimeout(function() {
                        ['bz-dayun-scroll','bz-liuyue-scroll'].forEach(function(id) {
                            var s = document.getElementById(id);
                            if (s) {
                                var c = s.querySelector('.dayun-item.current');
                                if (c) s.scrollLeft = c.offsetLeft - s.offsetWidth/2 + c.offsetWidth/2;
                            }
                        });
                    }, 100);

                    // Feng Shui
                    try {
                        var fsResult = FengShui.analyze(baziData);
                        document.getElementById('fengshui-result').innerHTML = FengShui.render(fsResult);
                    } catch(fe) {
                        document.getElementById('fengshui-result').innerHTML = '<div class="interp-card"><p style="color:red">风水分析出错：' + fe.message + '</p></div>';
                        console.error('FengShui error:', fe);
                    }
                } else {
                    // Fallback to old BaZi engine
                    var bzResult = BaZi.calculate(sY, sM, sD, Math.floor(((tst.trueHour+1)%24)/2), gender);
                    bzResult._tst = tst;
                    bzResult._stdTime = String(hour).padStart(2,'0') + ':' + String(minute).padStart(2,'0');
                    document.getElementById('bazi-result').innerHTML = BaZi.render(bzResult);
                }
            } catch(be) {
                document.getElementById('bazi-result').innerHTML = '<div class="interp-card"><p style="color:red">八字排盘出错：' + be.message + '</p></div>';
                console.error('BaZi error:', be);
            }

            // ========== ZIWEI using iztro ==========
            try {
                if (Iztro && Iztro.astro) {
                    var dateStr = sY + '-' + sM + '-' + sD;
                    var genderStr = gender === 'male' ? '男' : '女';
                    // iztro hour parameter: 0=早子(00-01), 1=丑(01-03), ..., 12=晚子(23-00)
                    var th = tst.trueHour;
                    var iztroHour;
                    if (th >= 23) iztroHour = 12;       // 晚子时
                    else if (th < 1) iztroHour = 0;     // 早子时
                    else iztroHour = Math.ceil(th / 2);  // 1-2→1(丑), 3-4→2(寅), ...
                    var astrolabe = Iztro.astro.bySolar(dateStr, iztroHour, genderStr, true, 'zh-CN');
                    document.getElementById('ziwei-result').innerHTML = ZiWei.renderIztro(astrolabe, gender, tst);
                } else {
                    // Fallback to old ZiWei engine
                    var lunarFb = Lunar.solarToLunar(sY, sM, sD);
                    var hourIdx = Math.floor(((tst.trueHour+1)%24)/2);
                    var zwResult = ZiWei.calculate(lunarFb.year, lunarFb.month, lunarFb.day, hourIdx, gender);
                    document.getElementById('ziwei-result').innerHTML = ZiWei.render(zwResult);
                }
            } catch(ze) {
                document.getElementById('ziwei-result').innerHTML = '<div class="interp-card"><p style="color:red">紫微排盘出错：' + ze.message + '</p></div>';
                console.error('ZiWei error:', ze);
            }
        }, 150);
    });

    // ===== MeiHua =====
    var methodRadios = document.querySelectorAll('input[name="meihua-method"]');
    var numberInput = document.getElementById('number-input');
    methodRadios.forEach(function(r) {
        r.addEventListener('change', function() {
            numberInput.style.display = this.value === 'number' ? 'flex' : 'none';
        });
    });

    document.getElementById('meihua-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var method = document.querySelector('input[name="meihua-method"]:checked').value;
        var question = document.getElementById('meihua-question').value;
        var nums = [];
        if (method === 'number') {
            var n1 = document.getElementById('meihua-num1').value;
            if (!n1) { alert('请至少输入一个数字'); return; }
            nums.push(parseInt(n1));
            var n2 = document.getElementById('meihua-num2').value;
            var n3 = document.getElementById('meihua-num3').value;
            if (n2) nums.push(parseInt(n2));
            if (n3) nums.push(parseInt(n3));
        }
        var resultDiv = document.getElementById('meihua-result');
        resultDiv.innerHTML = '<div class="loading">起卦中</div>';
        setTimeout(function() {
            try {
                var result = MeiHua.calculate(method, nums, question);
                resultDiv.innerHTML = MeiHua.render(result);
            } catch(err) {
                resultDiv.innerHTML = '<div class="interp-card"><p style="color:red">起卦出错：' + err.message + '</p></div>';
            }
        }, 100);
    });

    // ===== 观音灵签 =====
    document.getElementById('btn-draw-qian').addEventListener('click', function() {
        var btn = this;
        var resultDiv = document.getElementById('qian-result');
        var question = document.getElementById('qian-question').value.trim();
        btn.disabled = true; btn.textContent = '诚心祈请中...';
        // Shaking sign tube animation
        resultDiv.innerHTML = '<div class="interp-card" style="text-align:center"><div class="qian-tube-shake" style="font-size:5rem;display:inline-block">🏮</div><p style="margin-top:12px;font-family:var(--font-h);color:var(--ink-light)">虔心摇签中...</p></div>';

        setTimeout(function() {
            var qian = LingQian.drawQian();
            try { fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feature:'lingqian',result:qian.n})}); } catch(e) {}
            resultDiv.innerHTML = LingQian.renderQian(qian, question);
            // Add 掷筊确认 button after sign result
            resultDiv.innerHTML += '<div class="interp-card" style="text-align:center;border:2px dashed var(--gold);background:rgba(197,146,46,.03)"><p style="font-family:var(--font-h);color:var(--gold);margin-bottom:10px">传统习俗：抽签后需掷筊向神明确认此签</p><button class="btn btn-primary" id="btn-confirm-jiao" style="padding:10px 30px">掷筊确认此签</button><div id="confirm-jiao-result" style="margin-top:12px"></div></div>';
            // Bind confirm jiao handler
            var confirmBtn = document.getElementById('btn-confirm-jiao');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', function() {
                    var cb = this;
                    cb.disabled = true; cb.textContent = '掷筊中...';
                    var cResults = [];
                    var cDiv = document.getElementById('confirm-jiao-result');
                    var JR = LingQian.JIAO_RESULT;
                    function doConfirm(ci) {
                        setTimeout(function() {
                            cResults.push(LingQian.throwJiao());
                            // Show progress
                            var ph = '<div class="jiao-results" style="justify-content:center;margin:8px 0">';
                            for (var k = 0; k < 3; k++) {
                                ph += '<div class="jiao-throw" style="min-width:70px;padding:8px 12px">';
                                ph += '<div class="jiao-num" style="font-size:.75rem">第'+(k+1)+'筊</div>';
                                if (k < cResults.length) {
                                    var jr = JR[cResults[k]];
                                    ph += '<div style="font-size:1.8rem">'+jr.symbol+'</div><div style="color:'+jr.color+';font-weight:700;font-size:.9rem">'+jr.name+'</div>';
                                } else {
                                    ph += '<div style="font-size:1.8rem;opacity:.2">🌙☀️</div>';
                                }
                                ph += '</div>';
                            }
                            ph += '</div>';
                            cDiv.innerHTML = ph;
                            if (ci < 2) {
                                doConfirm(ci + 1);
                            } else {
                                cb.style.display = 'none';
                                var sc = cResults.filter(function(r){return r==='sheng'}).length;
                                var cvh = '';
                                if (sc >= 2) {
                                    cvh = '<p style="color:var(--jade);font-weight:700;font-size:1.05rem;margin-top:8px">✅ 神明确认此签有效！可依签意行事。</p>';
                                } else if (sc === 1) {
                                    cvh = '<p style="color:var(--gold);font-weight:700;font-size:1.05rem;margin-top:8px">⚠️ 神明态度不明确，建议重新抽签。</p>';
                                } else {
                                    cvh = '<p style="color:var(--vermillion);font-weight:700;font-size:1.05rem;margin-top:8px">❌ 神明未确认此签，建议重新抽签。</p>';
                                }
                                cDiv.innerHTML += cvh;
                            }
                        }, 900);
                    }
                    doConfirm(0);
                });
            }
            btn.disabled = false; btn.textContent = '再抽一签';
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 2000);
    });

    // ===== 观音灵签：查签 =====
    var lookupBtn = document.getElementById('btn-lookup-qian');
    if (lookupBtn) {
        lookupBtn.addEventListener('click', function() {
            var numInput = document.getElementById('qian-lookup-num');
            var num = parseInt(numInput.value);
            var resultDiv = document.getElementById('qian-result');
            if (!num || num < 1 || num > 100) {
                resultDiv.innerHTML = '<div class="interp-card" style="text-align:center;color:var(--vermillion)">请输入1-100之间的签号</div>';
                return;
            }
            var qian = LingQian.lookupQian(num);
            if (qian) {
                resultDiv.innerHTML = LingQian.renderQian(qian);
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // ===== 掷筊（逐次动画 + 深度解读） =====
    document.getElementById('btn-throw-jiao').addEventListener('click', function() {
        var btn = this;
        var question = document.getElementById('jiao-question').value.trim();
        var resultDiv = document.getElementById('jiao-result');
        btn.disabled = true;
        var results = [];
        var JR = LingQian.JIAO_RESULT;

        // Show initial state with jiao toss animation
        resultDiv.innerHTML = '<div class="interp-card" style="text-align:center">' +
          (question ? '<p style="font-style:italic;color:var(--ink-light);margin-bottom:12px">所问：' + question + '</p>' : '') +
          '<div class="jiao-results" id="jiao-live"></div>' +
          '<div id="jiao-verdict" style="margin-top:16px"></div></div>';

        var liveDiv = document.getElementById('jiao-live');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

        var throwContext = ['起始之象','过程之象','结果之象'];

        function renderLiveThrow(idx) {
          var html = '';
          for (var i = 0; i < 3; i++) {
            html += '<div class="jiao-throw">';
            html += '<div class="jiao-num">第 ' + (i+1) + ' 筊 <span style="font-size:.7rem;color:var(--ink-light)">'+throwContext[i]+'</span></div>';
            if (i < results.length) {
              var j = JR[results[i]];
              html += '<div class="jiao-symbol" style="font-size:2.5rem">' + j.symbol + '</div>';
              html += '<div class="jiao-name" style="color:' + j.color + ';font-weight:700;font-size:1.1rem">' + j.name + '</div>';
              if (j.detail) html += '<div style="font-size:.75rem;color:var(--ink-light);margin-top:2px">' + j.detail + '</div>';
            } else if (i === results.length) {
              html += '<div class="jiao-symbol jiao-toss-anim" style="font-size:2.5rem">🌙☀️</div>';
              html += '<div class="jiao-name" style="color:var(--ink-light);font-size:.9rem">掷筊中...</div>';
            } else {
              html += '<div class="jiao-symbol" style="font-size:2.5rem;opacity:.2">🌙☀️</div>';
              html += '<div class="jiao-name" style="color:var(--ink-light);opacity:.3">等待中</div>';
            }
            html += '</div>';
          }
          liveDiv.innerHTML = html;
        }

        function doThrow(idx) {
          btn.textContent = '第 ' + (idx+1) + ' 筊...';
          renderLiveThrow(idx);

          setTimeout(function() {
            results.push(LingQian.throwJiao());
            renderLiveThrow(idx + 1);

            if (idx < 2) {
              setTimeout(function() { doThrow(idx + 1); }, 800);
            } else {
              // All 3 done — use enhanced renderJiao for verdict
              btn.disabled = false; btn.textContent = '再掷一次';
              try { fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feature:'jiaobei',results:results})}); } catch(e) {}

              var verdict = document.getElementById('jiao-verdict');
              verdict.innerHTML = LingQian.renderJiao(results, question);
            }
          }, 1200);
        }

        setTimeout(function() { doThrow(0); }, 500);
    });

    // ===== 掷筊：填充问法指导 =====
    var guideDiv = document.getElementById('jiao-guide-content');
    if (guideDiv && LingQian.getJiaoGuide) {
        guideDiv.innerHTML = LingQian.getJiaoGuide();
    }

    // ===== UX: Auto scroll to result after paipan =====
    // (Already handled in setTimeout callbacks above)

    // ===== 今日宜忌 =====
    var _lastBaziData = null; // Store for personalized daily fortune
    function renderDaily() {
        var dailyDiv = document.getElementById('daily-result');
        if (dailyDiv && typeof Daily !== 'undefined') {
            try { dailyDiv.innerHTML = Daily.render(_lastBaziData); }
            catch(e) { dailyDiv.innerHTML = '<div class="interp-card"><p style="color:red">今日宜忌加载出错：'+e.message+'</p></div>'; }
        }
    }
    // Render on page load
    setTimeout(renderDaily, 200);

    // ===== 合婚/合盘：初始化表单选项 =====
    function initPairForm(prefix) {
        [1,2].forEach(function(n) {
            var yearSel = document.getElementById(prefix+'-year'+n);
            var monthSel = document.getElementById(prefix+'-month'+n);
            var daySel = document.getElementById(prefix+'-day'+n);
            var hourSel = document.getElementById(prefix+'-hour'+n);
            if (!yearSel) return;
            // Years
            for (var y = 2010; y >= 1940; y--) {
                var o = document.createElement('option'); o.value = y; o.textContent = y+'年';
                if (y === 1990) o.selected = true;
                yearSel.appendChild(o);
            }
            // Months
            for (var m = 1; m <= 12; m++) {
                var o2 = document.createElement('option'); o2.value = m; o2.textContent = m+'月';
                monthSel.appendChild(o2);
            }
            // Days
            for (var d = 1; d <= 31; d++) {
                var o3 = document.createElement('option'); o3.value = d; o3.textContent = d+'日';
                daySel.appendChild(o3);
            }
            // Hours (时辰)
            var shichen = ['子时(23-1)','丑时(1-3)','寅时(3-5)','卯时(5-7)','辰时(7-9)','巳时(9-11)',
                           '午时(11-13)','未时(13-15)','申时(15-17)','酉时(17-19)','戌时(19-21)','亥时(21-23)'];
            var shichenHours = [0,2,4,6,8,10,12,14,16,18,20,22];
            shichen.forEach(function(s, i) {
                var o4 = document.createElement('option'); o4.value = shichenHours[i]; o4.textContent = s;
                hourSel.appendChild(o4);
            });
        });
    }
    initPairForm('hh');
    initPairForm('pt');

    function getPairPerson(prefix, n) {
        return {
            year: parseInt(document.getElementById(prefix+'-year'+n).value),
            month: parseInt(document.getElementById(prefix+'-month'+n).value),
            day: parseInt(document.getElementById(prefix+'-day'+n).value),
            hour: parseInt(document.getElementById(prefix+'-hour'+n).value),
            minute: 0,
            gender: document.querySelector('input[name="'+prefix+'-gender'+n+'"]:checked').value,
            name: document.getElementById(prefix+'-name'+n).value || (n===1?'甲方':'乙方')
        };
    }

    // ===== 八字合婚 =====
    var hhForm = document.getElementById('hehun-form');
    if (hhForm) {
        hhForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var resultDiv = document.getElementById('hehun-result');
            resultDiv.innerHTML = '<div class="loading">合婚分析中</div>';
            setTimeout(function() {
                try {
                    var p1 = getPairPerson('hh', 1);
                    var p2 = getPairPerson('hh', 2);
                    var result = HeHun.analyze(p1, p2);
                    resultDiv.innerHTML = HeHun.render(result);
                    try { fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feature:'hehun'})}); } catch(e2){}
                } catch(err) {
                    resultDiv.innerHTML = '<div class="interp-card"><p style="color:red">合婚分析出错：'+err.message+'</p></div>';
                    console.error('HeHun error:', err);
                }
                resultDiv.scrollIntoView({behavior:'smooth',block:'start'});
            }, 500);
        });
    }

    // ===== 事业合盘 =====
    var ptForm = document.getElementById('partner-form');
    if (ptForm) {
        ptForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var resultDiv = document.getElementById('partner-result');
            resultDiv.innerHTML = '<div class="loading">合盘分析中</div>';
            setTimeout(function() {
                try {
                    var p1 = getPairPerson('pt', 1);
                    var p2 = getPairPerson('pt', 2);
                    var result = Partner.analyze(p1, p2);
                    resultDiv.innerHTML = Partner.render(result);
                    try { fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feature:'partner'})}); } catch(e2){}
                } catch(err) {
                    resultDiv.innerHTML = '<div class="interp-card"><p style="color:red">合盘分析出错：'+err.message+'</p></div>';
                    console.error('Partner error:', err);
                }
                resultDiv.scrollIntoView({behavior:'smooth',block:'start'});
            }, 500);
        });
    }

    // ===== UX: Back to top button =====
    var topBtn = document.getElementById('back-to-top');
    if (topBtn) {
        window.addEventListener('scroll', function() {
            topBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
        });
        topBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== UX: Auto scroll to result after birth form submit =====
    // Add scroll behavior after paipan completes
    var origSubmit = document.getElementById('birth-form');
    if (origSubmit) {
        origSubmit.addEventListener('submit', function() {
            setTimeout(function() {
                var activeTab = document.querySelector('.tab-content.active');
                if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        });
    }
})();
