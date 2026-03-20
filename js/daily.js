/**
 * 今日宜忌 — Daily Fortune / Almanac Module
 *
 * Uses lunar-javascript v1.7.7 global (Solar, Lunar, etc.) for almanac data,
 * plus the local Lunar helper for GanZhi / ShiShen calculations.
 * IIFE pattern, returns { render }.
 */
var Daily = (function () {
  'use strict';

  /* ====================================================================
   *  Constants & Helper Maps
   * ==================================================================== */

  var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var DI_ZHI   = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  var GAN_WUXING  = ['木','木','火','火','土','土','金','金','水','水'];
  var ZHI_WUXING  = ['水','土','木','木','土','火','火','土','金','金','土','水'];
  var GAN_YINYANG = [0,1,0,1,0,1,0,1,0,1]; // 0=阳 1=阴

  var WUXING_COLOR = { '木':'var(--wood)', '火':'var(--fire)', '土':'var(--earth)', '金':'var(--metal)', '水':'var(--water)' };
  var WUXING_LUCKY_COLOR = {
    '木': '绿色、青色',
    '火': '红色、紫色',
    '土': '黄色、棕色',
    '金': '白色、银色',
    '水': '黑色、深蓝色'
  };
  var WUXING_DIR = {
    '木': '东方',
    '火': '南方',
    '土': '中宫',
    '金': '西方',
    '水': '北方'
  };

  var WEEK_NAMES = ['日','一','二','三','四','五','六'];

  // 十二时辰名
  var SHICHEN_NAMES = ['子时','丑时','寅时','卯时','辰时','巳时',
                       '午时','未时','申时','酉时','戌时','亥时'];
  var SHICHEN_RANGE = ['23-01','01-03','03-05','05-07','07-09','09-11',
                       '11-13','13-15','15-17','17-19','19-21','21-23'];

  // 黄道十二神 (fixed cycle, based on day branch)
  // Index in this array = (day branch index + offset) % 12 for each 时辰
  var TIAN_SHEN_NAMES = ['青龙','明堂','天刑','朱雀','金匮','天德',
                         '白虎','玉堂','天牢','玄武','司命','勾陈'];
  // 黄道吉神 set
  var HUANG_DAO = { '青龙':1, '明堂':1, '金匮':1, '天德':1, '玉堂':1, '司命':1 };

  // 日支 → 起青龙的时辰序号
  // 子午日起青龙在子时(0), 丑未日起在寅(2), 寅申日起在辰(4),
  // 卯酉日起在午(6), 辰戌日起在申(8), 巳亥日起在戌(10)
  var QINGLONG_START = [0, 2, 4, 6, 8, 10, 0, 2, 4, 6, 8, 10];

  // 十神 daily interpretation
  var SHISHEN_DAY_TIPS = {
    '比肩': { label:'竞争日', tip:'独立处事为佳，不宜合伙' },
    '劫财': { label:'花费日', tip:'守财为上，避免冲动消费' },
    '食神': { label:'灵感日', tip:'创意满满，适合文艺创作' },
    '伤官': { label:'表现日', tip:'锋芒毕露，注意言辞分寸' },
    '偏财': { label:'偏财日', tip:'社交生财，利外出洽谈' },
    '正财': { label:'正财日', tip:'踏实收获，利签约交易' },
    '七杀': { label:'压力日', tip:'迎难而上，化压力为动力' },
    '正官': { label:'贵人日', tip:'得遇提携，利求职面试' },
    '偏印': { label:'学习日', tip:'充电进步，利考试进修' },
    '正印': { label:'福气日', tip:'长辈助力，利办理证件' }
  };

  /* ====================================================================
   *  十神 calculation (fallback if Lunar.shiShen unavailable)
   * ==================================================================== */

  function calcShiShen(dayGanIdx, otherGanIdx) {
    // Try the global Lunar helper first
    if (typeof Lunar !== 'undefined' && typeof Lunar.shiShen === 'function') {
      return Lunar.shiShen(dayGanIdx, otherGanIdx);
    }
    var d = GAN_WUXING[dayGanIdx], o = GAN_WUXING[otherGanIdx];
    var same = GAN_YINYANG[dayGanIdx] === GAN_YINYANG[otherGanIdx];
    var map = {
      '木木': same ? '比肩' : '劫财', '木火': same ? '食神' : '伤官',
      '木土': same ? '偏财' : '正财', '木金': same ? '七杀' : '正官',
      '木水': same ? '偏印' : '正印',
      '火火': same ? '比肩' : '劫财', '火土': same ? '食神' : '伤官',
      '火金': same ? '偏财' : '正财', '火水': same ? '七杀' : '正官',
      '火木': same ? '偏印' : '正印',
      '土土': same ? '比肩' : '劫财', '土金': same ? '食神' : '伤官',
      '土水': same ? '偏财' : '正财', '土木': same ? '七杀' : '正官',
      '土火': same ? '偏印' : '正印',
      '金金': same ? '比肩' : '劫财', '金水': same ? '食神' : '伤官',
      '金木': same ? '偏财' : '正财', '金火': same ? '七杀' : '正官',
      '金土': same ? '偏印' : '正印',
      '水水': same ? '比肩' : '劫财', '水木': same ? '食神' : '伤官',
      '水火': same ? '偏财' : '正财', '水土': same ? '七杀' : '正官',
      '水金': same ? '偏印' : '正印'
    };
    return map[d + o] || '';
  }

  /* ====================================================================
   *  Safe wrappers around lunar-javascript (may not have all methods)
   * ==================================================================== */

  function safeCall(obj, method, fallback) {
    try {
      if (obj && typeof obj[method] === 'function') {
        return obj[method]();
      }
    } catch (e) { /* swallow */ }
    return fallback;
  }

  function safeCallArr(obj, method) {
    var result = safeCall(obj, method, null);
    return Array.isArray(result) ? result : [];
  }

  /* ====================================================================
   *  NaYin lookup (reuse Lunar helper or compute locally)
   * ==================================================================== */

  var NA_YIN_TABLE = [
    '海中金','海中金','炉中火','炉中火','大林木','大林木','路旁土','路旁土','剑锋金','剑锋金',
    '山头火','山头火','涧下水','涧下水','城头土','城头土','白蜡金','白蜡金','杨柳木','杨柳木',
    '泉中水','泉中水','屋上土','屋上土','霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
    '砂石金','砂石金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金',
    '覆灯火','覆灯火','天河水','天河水','大驿土','大驿土','钗钏金','钗钏金','桑柘木','桑柘木',
    '大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'
  ];

  function getNaYin(ganIdx, zhiIdx) {
    if (typeof Lunar !== 'undefined' && typeof Lunar.getNaYin === 'function') {
      return Lunar.getNaYin(ganIdx, zhiIdx);
    }
    // Build sexagenary cycle and find index
    var cycle = [];
    for (var g = 0; g < 10; g++) {
      for (var z = 0; z < 12; z++) {
        if (g % 2 === z % 2) cycle.push({ g: g, z: z });
      }
    }
    for (var i = 0; i < 60; i++) {
      if (cycle[i].g === ganIdx && cycle[i].z === zhiIdx) return NA_YIN_TABLE[i];
    }
    return '';
  }

  /* ====================================================================
   *  Hour GanZhi calculation (local fallback)
   * ==================================================================== */

  function getHourGanZhi(dayGanIdx, hourIdx) {
    if (typeof Lunar !== 'undefined' && typeof Lunar.hourGanZhi === 'function') {
      return Lunar.hourGanZhi(dayGanIdx, hourIdx);
    }
    var startGan = [0, 2, 4, 6, 8];
    var gIdx = (startGan[dayGanIdx % 5] + hourIdx) % 10;
    return { gan: TIAN_GAN[gIdx], zhi: DI_ZHI[hourIdx], ganIdx: gIdx, zhiIdx: hourIdx, text: TIAN_GAN[gIdx] + DI_ZHI[hourIdx] };
  }

  /* ====================================================================
   *  Generate 12-hour 天神 (TianShen) for given day branch
   * ==================================================================== */

  function getHourTianShen(dayZhiIdx) {
    var start = QINGLONG_START[dayZhiIdx];
    var result = [];
    for (var h = 0; h < 12; h++) {
      var shenIdx = (h - start + 12) % 12;
      var name = TIAN_SHEN_NAMES[shenIdx];
      result.push({
        name: name,
        lucky: !!HUANG_DAO[name]
      });
    }
    return result;
  }

  /* ====================================================================
   *  Star rating helper
   * ==================================================================== */

  function starRating(n) {
    var full = Math.min(Math.max(Math.round(n), 0), 5);
    var s = '';
    for (var i = 0; i < 5; i++) {
      s += i < full ? '\u2605' : '\u2606';
    }
    return s;
  }

  /* ====================================================================
   *  Personalized fortune calculation
   * ==================================================================== */

  function calcPersonalFortune(baziData, todayGanIdx, todayZhiIdx) {
    if (!baziData) return null;

    var dayMaster = baziData.dayMaster;
    var yongShen = baziData.finalYongShen || (Array.isArray(baziData.yongShen) ? baziData.yongShen[0] : baziData.yongShen);
    var jiShen = Array.isArray(baziData.jiShen) ? baziData.jiShen[0] : baziData.jiShen;

    if (!dayMaster && !yongShen) return null;

    // Determine day master GanIdx
    var dmGanIdx = -1;
    if (typeof dayMaster === 'string') {
      for (var i = 0; i < 10; i++) {
        if (TIAN_GAN[i] === dayMaster) { dmGanIdx = i; break; }
      }
    } else if (baziData.pillars && baziData.pillars.day) {
      dmGanIdx = baziData.pillars.day.ganIdx;
    }
    if (dmGanIdx < 0) return null;

    // 十神 for today
    var ss = calcShiShen(dmGanIdx, todayGanIdx);
    var ssInfo = SHISHEN_DAY_TIPS[ss] || { label: '平常日', tip: '安稳度日即可' };

    // Today's stem element
    var todayElement = GAN_WUXING[todayGanIdx];
    var todayBranchElement = ZHI_WUXING[todayZhiIdx];

    // Is today favorable? Compare with yongShen/jiShen
    var favorScore = 3; // neutral
    if (yongShen) {
      if (todayElement === yongShen) favorScore = 5;
      else if (isGenerating(todayElement, yongShen)) favorScore = 4;
      else if (todayElement === jiShen) favorScore = 1;
      else if (isGenerating(todayElement, jiShen)) favorScore = 2;
    }

    // Category scores (based on favorScore with slight variation)
    var career  = Math.min(5, Math.max(1, favorScore + randomOffset(ss, 0)));
    var wealth  = Math.min(5, Math.max(1, favorScore + randomOffset(ss, 1)));
    var love    = Math.min(5, Math.max(1, favorScore + randomOffset(ss, 2)));
    var health  = Math.min(5, Math.max(1, favorScore + randomOffset(ss, 3)));

    // Lucky color based on yongShen
    var luckyElement = yongShen || todayElement;
    var luckyColor = WUXING_LUCKY_COLOR[luckyElement] || '白色';
    var luckyDir = WUXING_DIR[luckyElement] || '中宫';

    return {
      shiShen: ss,
      ssInfo: ssInfo,
      favorScore: favorScore,
      career: career,
      wealth: wealth,
      love: love,
      health: health,
      luckyColor: luckyColor,
      luckyDir: luckyDir,
      luckyElement: luckyElement,
      todayElement: todayElement,
      dayMaster: TIAN_GAN[dmGanIdx],
      yongShen: yongShen,
      jiShen: jiShen
    };
  }

  // Deterministic "randomness" based on shiShen name for slight score variation
  function randomOffset(ss, seed) {
    if (!ss) return 0;
    var hash = 0;
    for (var i = 0; i < ss.length; i++) {
      hash = ((hash << 5) - hash) + ss.charCodeAt(i) + seed;
      hash = hash & hash;
    }
    var offsets = [-1, 0, 0, 1, 0, -1, 1, 0];
    return offsets[Math.abs(hash) % offsets.length];
  }

  function isGenerating(e1, e2) {
    var gen = { '木':'火', '火':'土', '土':'金', '金':'水', '水':'木' };
    return gen[e1] === e2 || gen[e2] === e1;
  }

  /* ====================================================================
   *  Render — main entry point
   * ==================================================================== */

  function render(baziData) {
    var html = '';
    var now = new Date();

    // === Get today's Solar / Lunar from lunar-javascript global ===
    var solar = null, lunar = null;
    var lunarDateStr = '', solarDateStr = '';
    var yearGZ = '', monthGZ = '', dayGZ = '';
    var dayGanIdx = 0, dayZhiIdx = 0;
    var jieQiStr = '';

    try {
      solar = Solar.fromDate(now);
      lunar = solar.getLunar();
    } catch (e) { /* lunar-javascript not available */ }

    // Solar date string
    var sy = now.getFullYear(), sm = now.getMonth() + 1, sd = now.getDate();
    var weekDay = WEEK_NAMES[now.getDay()];
    solarDateStr = sy + '年' + sm + '月' + sd + '日 星期' + weekDay;

    // Lunar date string
    if (lunar) {
      try {
        var lunarYearCN = safeCall(lunar, 'getYearInChinese', '');
        var lunarMonthCN = safeCall(lunar, 'getMonthInChinese', '');
        var lunarDayCN = safeCall(lunar, 'getDayInChinese', '');
        lunarDateStr = lunarYearCN + '年' + lunarMonthCN + '月' + lunarDayCN;
      } catch (e) {
        lunarDateStr = '';
      }
    }
    // Fallback using local Lunar
    if (!lunarDateStr && typeof Lunar !== 'undefined' && typeof Lunar.solarToLunar === 'function') {
      try {
        var localLunar = Lunar.solarToLunar(sy, sm, sd);
        lunarDateStr = Lunar.formatLunar(localLunar);
      } catch (e2) { /* ignore */ }
    }

    // GanZhi — from lunar-javascript
    if (lunar) {
      try {
        yearGZ = safeCall(lunar, 'getYearInGanZhi', '');
        monthGZ = safeCall(lunar, 'getMonthInGanZhi', '');
        dayGZ = safeCall(lunar, 'getDayInGanZhi', '');
      } catch (e) { /* ignore */ }
    }

    // Parse dayGZ to get indices
    if (dayGZ && dayGZ.length >= 2) {
      for (var gi = 0; gi < 10; gi++) {
        if (TIAN_GAN[gi] === dayGZ.charAt(0)) { dayGanIdx = gi; break; }
      }
      for (var zi = 0; zi < 12; zi++) {
        if (DI_ZHI[zi] === dayGZ.charAt(1)) { dayZhiIdx = zi; break; }
      }
    }

    // Fallback GanZhi from local Lunar
    if (!dayGZ && typeof Lunar !== 'undefined' && typeof Lunar.dayGanZhi === 'function') {
      try {
        var dg = Lunar.dayGanZhi(sy, sm, sd);
        dayGZ = dg.text;
        dayGanIdx = dg.ganIdx;
        dayZhiIdx = dg.zhiIdx;
        if (!yearGZ) {
          var ll = Lunar.solarToLunar(sy, sm, sd);
          var yg = Lunar.yearGanZhi(ll.year);
          yearGZ = yg.text;
          var mg = Lunar.monthGanZhi(yg.ganIdx, ll.month);
          monthGZ = mg.text;
        }
      } catch (e) { /* ignore */ }
    }

    // JieQi
    if (lunar) {
      try {
        var currentJQ = safeCall(lunar, 'getJieQi', '');
        if (currentJQ) {
          jieQiStr = currentJQ;
        } else {
          // Try next JieQi
          var nextJQ = safeCall(lunar, 'getNextJieQi', null);
          if (nextJQ && typeof nextJQ.getName === 'function') {
            jieQiStr = '将至: ' + nextJQ.getName();
          }
        }
      } catch (e) { /* ignore */ }

      // Alternate approach if the above did not work
      if (!jieQiStr) {
        try {
          var prevJQ = safeCall(lunar, 'getPrevJieQi', null);
          var nextJQ2 = safeCall(lunar, 'getNextJieQi', null);
          if (prevJQ && typeof prevJQ.getName === 'function') {
            jieQiStr = prevJQ.getName();
          }
          if (nextJQ2 && typeof nextJQ2.getName === 'function') {
            jieQiStr += (jieQiStr ? ' → ' : '') + nextJQ2.getName();
          }
        } catch (e) { /* ignore */ }
      }
    }

    // Day element
    var dayGanElement = GAN_WUXING[dayGanIdx];
    var dayZhiElement = ZHI_WUXING[dayZhiIdx];

    /* ------------------------------------------------------------------
     *  Section 1: 今日日期信息
     * ------------------------------------------------------------------ */

    html += '<div class="interp-card" style="border-left:4px solid var(--gold)">';
    html += '<h2 style="display:flex;align-items:center;gap:8px">';
    html += '<span style="font-size:1.5rem">\u2600\uFE0F</span> 今日运势';
    html += '</h2>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:12px 0">';

    // Solar
    html += '<div style="padding:10px 14px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
    html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">阳历</div>';
    html += '<div style="font-size:1rem;font-weight:600;margin-top:2px">' + solarDateStr + '</div>';
    html += '</div>';

    // Lunar
    html += '<div style="padding:10px 14px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
    html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">农历</div>';
    html += '<div style="font-size:1rem;font-weight:600;margin-top:2px">' + (lunarDateStr || '—') + '</div>';
    html += '</div>';

    // GanZhi
    html += '<div style="padding:10px 14px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
    html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">干支</div>';
    html += '<div style="font-size:1rem;font-weight:600;margin-top:2px">';
    html += (yearGZ || '—') + '年 ' + (monthGZ || '—') + '月 ' + (dayGZ || '—') + '日';
    html += '</div>';
    html += '</div>';

    // JieQi
    if (jieQiStr) {
      html += '<div style="padding:10px 14px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
      html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">节气</div>';
      html += '<div style="font-size:1rem;font-weight:600;margin-top:2px">' + jieQiStr + '</div>';
      html += '</div>';
    }

    html += '</div>'; // end grid
    html += '</div>'; // end card

    /* ------------------------------------------------------------------
     *  Section 2: 今日宜忌
     * ------------------------------------------------------------------ */

    var dayYi = [], dayJi = [];
    if (lunar) {
      dayYi = safeCallArr(lunar, 'getDayYi');
      dayJi = safeCallArr(lunar, 'getDayJi');
    }

    html += '<div class="interp-card">';
    html += '<h3 style="color:var(--ink);font-size:1.15rem;margin-top:0">今日宜忌</h3>';

    // 宜
    html += '<div style="margin-bottom:14px">';
    html += '<div style="font-family:var(--font-h);font-size:.85rem;color:var(--jade);font-weight:700;margin-bottom:6px">\u2714 宜</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    if (dayYi.length > 0) {
      for (var yi = 0; yi < dayYi.length; yi++) {
        html += '<span style="display:inline-block;padding:3px 10px;font-size:.8rem;background:rgba(45,143,111,.1);color:var(--jade);border:1px solid rgba(45,143,111,.25);border-radius:20px">';
        html += dayYi[yi] + '</span>';
      }
    } else {
      html += '<span style="color:var(--ink-light);font-size:.84rem">暂无数据</span>';
    }
    html += '</div></div>';

    // 忌
    html += '<div>';
    html += '<div style="font-family:var(--font-h);font-size:.85rem;color:var(--vermillion);font-weight:700;margin-bottom:6px">\u2716 忌</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    if (dayJi.length > 0) {
      for (var ji = 0; ji < dayJi.length; ji++) {
        html += '<span style="display:inline-block;padding:3px 10px;font-size:.8rem;background:rgba(197,61,67,.08);color:var(--vermillion);border:1px solid rgba(197,61,67,.2);border-radius:20px">';
        html += dayJi[ji] + '</span>';
      }
    } else {
      html += '<span style="color:var(--ink-light);font-size:.84rem">暂无数据</span>';
    }
    html += '</div></div>';

    html += '</div>'; // end card

    /* ------------------------------------------------------------------
     *  Section 3: 今日吉凶时辰
     * ------------------------------------------------------------------ */

    var hourTianShen = getHourTianShen(dayZhiIdx);

    html += '<div class="interp-card">';
    html += '<h3 style="color:var(--ink);font-size:1.15rem;margin-top:0">今日吉凶时辰</h3>';
    html += '<p style="font-size:.8rem;color:var(--ink-light);margin-bottom:10px">';
    html += '<span style="display:inline-block;width:10px;height:10px;background:var(--jade);border-radius:50%;margin-right:4px;vertical-align:middle"></span>黄道吉时 ';
    html += '<span style="display:inline-block;width:10px;height:10px;background:var(--vermillion);border-radius:50%;margin-right:4px;vertical-align:middle;margin-left:12px"></span>黑道凶时';
    html += '</p>';

    html += '<div style="display:flex;overflow-x:auto;gap:8px;padding-bottom:8px;-webkit-overflow-scrolling:touch">';

    for (var h = 0; h < 12; h++) {
      var hGZ = getHourGanZhi(dayGanIdx, h);
      var ts = hourTianShen[h];
      var isLucky = ts.lucky;
      var borderColor = isLucky ? 'var(--jade)' : 'var(--vermillion)';
      var bgColor = isLucky ? 'rgba(45,143,111,.06)' : 'rgba(197,61,67,.04)';
      var labelColor = isLucky ? 'var(--jade)' : 'var(--vermillion)';

      // Highlight current hour
      var currentHour = now.getHours();
      var isCurrentHour = false;
      if (h === 0) {
        isCurrentHour = currentHour >= 23 || currentHour < 1;
      } else {
        isCurrentHour = currentHour >= (h * 2 - 1) && currentHour < (h * 2 + 1);
      }
      var highlightStyle = isCurrentHour ? 'box-shadow:0 0 0 2px var(--gold);' : '';

      html += '<div style="flex:0 0 auto;width:76px;text-align:center;padding:10px 6px;';
      html += 'border:1px solid ' + borderColor + ';border-radius:var(--r-lg);';
      html += 'background:' + bgColor + ';' + highlightStyle + '">';
      html += '<div style="font-family:var(--font-h);font-weight:700;font-size:.85rem">' + SHICHEN_NAMES[h] + '</div>';
      html += '<div style="font-size:.7rem;color:var(--ink-light)">' + SHICHEN_RANGE[h] + '</div>';
      html += '<div style="font-size:.82rem;margin:4px 0;font-weight:600">' + hGZ.text + '</div>';
      html += '<div style="font-size:.72rem;color:' + labelColor + ';font-weight:600">' + ts.name + '</div>';
      html += '<div style="font-size:.68rem;color:' + labelColor + '">' + (isLucky ? '吉' : '凶') + '</div>';
      html += '</div>';
    }

    html += '</div>'; // end scroll row
    html += '</div>'; // end card

    /* ------------------------------------------------------------------
     *  Section 4: 今日五行/纳音
     * ------------------------------------------------------------------ */

    var dayNaYin = getNaYin(dayGanIdx, dayZhiIdx);
    var naYinWX = '';
    if (dayNaYin) {
      // Extract element from nayin name (last character)
      var lastChar = dayNaYin.charAt(dayNaYin.length - 1);
      var naYinMap = { '金':'金', '木':'木', '水':'水', '火':'火', '土':'土' };
      naYinWX = naYinMap[lastChar] || '';
    }

    html += '<div class="interp-card">';
    html += '<h3 style="color:var(--ink);font-size:1.15rem;margin-top:0">今日五行纳音</h3>';

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">';

    // NaYin
    html += '<div style="text-align:center;padding:12px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
    html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">日柱纳音</div>';
    html += '<div style="font-size:1.05rem;font-weight:700;margin-top:4px;color:' + (WUXING_COLOR[naYinWX] || 'var(--ink)') + '">';
    html += (dayNaYin || '—') + '</div>';
    html += '</div>';

    // Day Stem Element
    html += '<div style="text-align:center;padding:12px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
    html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">日干五行</div>';
    html += '<div style="font-size:1.05rem;font-weight:700;margin-top:4px;color:' + (WUXING_COLOR[dayGanElement] || 'var(--ink)') + '">';
    html += TIAN_GAN[dayGanIdx] + ' — ' + dayGanElement + '</div>';
    html += '</div>';

    // Day Branch Element
    html += '<div style="text-align:center;padding:12px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
    html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">日支五行</div>';
    html += '<div style="font-size:1.05rem;font-weight:700;margin-top:4px;color:' + (WUXING_COLOR[dayZhiElement] || 'var(--ink)') + '">';
    html += DI_ZHI[dayZhiIdx] + ' — ' + dayZhiElement + '</div>';
    html += '</div>';

    html += '</div>'; // end grid
    html += '</div>'; // end card

    /* ------------------------------------------------------------------
     *  Section 5: 今日冲煞
     * ------------------------------------------------------------------ */

    var dayChong = '', daySha = '', dayChongSX = '';
    if (lunar) {
      dayChong = safeCall(lunar, 'getDayChong', '');
      daySha = safeCall(lunar, 'getDaySha', '');
      dayChongSX = safeCall(lunar, 'getDayChongShengXiao', '');
    }

    if (dayChong || daySha || dayChongSX) {
      html += '<div class="interp-card">';
      html += '<h3 style="color:var(--ink);font-size:1.15rem;margin-top:0">今日冲煞</h3>';

      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">';

      if (dayChong) {
        html += '<div style="text-align:center;padding:14px;background:rgba(197,61,67,.04);border-radius:var(--r-lg);border:1px solid rgba(197,61,67,.15)">';
        html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">冲</div>';
        html += '<div style="font-size:1.1rem;font-weight:700;margin-top:4px;color:var(--vermillion)">' + dayChong + '</div>';
        html += '</div>';
      }

      if (dayChongSX) {
        html += '<div style="text-align:center;padding:14px;background:rgba(197,61,67,.04);border-radius:var(--r-lg);border:1px solid rgba(197,61,67,.15)">';
        html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">冲生肖</div>';
        html += '<div style="font-size:1.1rem;font-weight:700;margin-top:4px;color:var(--vermillion)">' + dayChongSX + '</div>';
        html += '</div>';
      }

      if (daySha) {
        html += '<div style="text-align:center;padding:14px;background:rgba(197,61,67,.04);border-radius:var(--r-lg);border:1px solid rgba(197,61,67,.15)">';
        html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">煞方</div>';
        html += '<div style="font-size:1.1rem;font-weight:700;margin-top:4px;color:var(--vermillion)">煞' + daySha + '</div>';
        html += '</div>';
      }

      html += '</div>';
      html += '</div>'; // end card
    }

    /* ------------------------------------------------------------------
     *  Section 6: 个人化运势 (only if baziData provided)
     * ------------------------------------------------------------------ */

    var pf = calcPersonalFortune(baziData, dayGanIdx, dayZhiIdx);

    if (pf) {
      html += '<div class="interp-card" style="border-left:4px solid var(--vermillion)">';
      html += '<h3 style="color:var(--vermillion);font-size:1.15rem;margin-top:0">个人化运势</h3>';

      // 十神 & Daily Theme
      html += '<div style="background:linear-gradient(135deg,rgba(197,61,67,.06),rgba(197,146,46,.06));border-radius:var(--r-lg);padding:16px;margin-bottom:14px">';
      html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
      html += '<span style="font-family:var(--font-h);font-size:1.2rem;font-weight:700;color:var(--vermillion)">' + (pf.ssInfo.label || '') + '</span>';
      html += '<span style="font-size:.82rem;padding:2px 10px;background:var(--card);border-radius:20px;border:1px solid var(--border)">';
      html += '十神: ' + (pf.shiShen || '—') + '</span>';
      html += '</div>';
      html += '<p style="font-size:.88rem;color:var(--ink);margin:0">';
      html += '今日 <strong>' + TIAN_GAN[dayGanIdx] + '(' + dayGanElement + ')</strong> 日，';
      html += '对于 <strong>' + pf.dayMaster + '</strong> 日主而言为 <strong>' + (pf.shiShen || '—') + '</strong>。';
      html += (pf.ssInfo.tip || '') + '</p>';
      html += '</div>';

      // Overall rating
      var overallLabel = pf.favorScore >= 4 ? '今日运势较旺' : (pf.favorScore <= 2 ? '今日宜守不宜攻' : '今日运势平稳');
      var overallColor = pf.favorScore >= 4 ? 'var(--jade)' : (pf.favorScore <= 2 ? 'var(--vermillion)' : 'var(--gold)');
      html += '<div style="text-align:center;margin-bottom:14px;padding:10px;background:var(--cream);border-radius:var(--r-lg)">';
      html += '<div style="font-size:.8rem;color:var(--ink-light)">综合运势</div>';
      html += '<div style="font-size:1.3rem;color:' + overallColor + ';letter-spacing:4px;margin:4px 0">' + starRating(pf.favorScore) + '</div>';
      html += '<div style="font-size:.85rem;font-weight:600;color:' + overallColor + '">' + overallLabel + '</div>';
      html += '</div>';

      // Category ratings grid
      var categories = [
        { name:'事业', score: pf.career, icon:'\uD83D\uDCBC' },
        { name:'财运', score: pf.wealth, icon:'\uD83D\uDCB0' },
        { name:'感情', score: pf.love, icon:'\u2764\uFE0F' },
        { name:'健康', score: pf.health, icon:'\uD83C\uDF3F' }
      ];
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">';
      for (var c = 0; c < categories.length; c++) {
        var cat = categories[c];
        var catColor = cat.score >= 4 ? 'var(--jade)' : (cat.score <= 2 ? 'var(--vermillion)' : 'var(--gold)');
        html += '<div style="text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
        html += '<div style="font-size:1.1rem">' + cat.icon + '</div>';
        html += '<div style="font-family:var(--font-h);font-size:.85rem;margin:2px 0">' + cat.name + '</div>';
        html += '<div style="font-size:.95rem;color:' + catColor + ';letter-spacing:2px">' + starRating(cat.score) + '</div>';
        html += '</div>';
      }
      html += '</div>';

      // Lucky Color & Direction
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';

      html += '<div style="text-align:center;padding:12px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
      html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">今日幸运色</div>';
      html += '<div style="font-size:.95rem;font-weight:600;margin-top:4px;color:' + (WUXING_COLOR[pf.luckyElement] || 'var(--ink)') + '">';
      html += pf.luckyColor + '</div>';
      html += '</div>';

      html += '<div style="text-align:center;padding:12px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
      html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">今日吉方</div>';
      html += '<div style="font-size:.95rem;font-weight:600;margin-top:4px">' + pf.luckyDir + '</div>';
      html += '</div>';

      html += '</div>';

      // Yongshen/Jishen note
      if (pf.yongShen || pf.jiShen) {
        html += '<p class="section-note" style="font-size:.78rem;color:var(--ink-light);margin-top:12px;margin-bottom:0">';
        html += '* 用神: ' + (pf.yongShen || '—') + '，忌神: ' + (pf.jiShen || '—');
        html += '。今日天干五行为<strong>' + pf.todayElement + '</strong>，';
        if (pf.favorScore >= 4) {
          html += '与用神相合，今日运势加分。';
        } else if (pf.favorScore <= 2) {
          html += '与忌神相应，宜低调行事。';
        } else {
          html += '五行力量中性，平常心对待。';
        }
        html += '</p>';
      }

      html += '</div>'; // end card
    }

    /* ------------------------------------------------------------------
     *  Section 7: 二十八宿 & 十二建星
     * ------------------------------------------------------------------ */

    var xiu = '', zheng = '', xiuLuck = '', xiuSong = '';
    if (lunar) {
      xiu = safeCall(lunar, 'getXiu', '');
      zheng = safeCall(lunar, 'getZheng', '');
      xiuLuck = safeCall(lunar, 'getXiuLuck', '');
      xiuSong = safeCall(lunar, 'getXiuSong', '');
    }

    var jianDesc = '';
    var jian = '';
    if (lunar) {
      jian = safeCall(lunar, 'getJianStar', '');
    }

    // 十二建星 interpretation
    var JIAN_INTERP = {
      '建': '万事开头之日，宜动工、开业。忌诉讼。',
      '除': '除旧布新之日，宜扫除、就医。忌婚嫁。',
      '满': '丰满之日，宜祈福、开市。忌动土。',
      '平': '平常之日，宜修整、收纳。忌大事。',
      '定': '安定之日，宜订婚、签约。忌诉讼、出行。',
      '执': '执守之日，宜祭祀、捕捉。忌搬迁。',
      '破': '破败之日，宜拆除、求医。忌开张、婚嫁。',
      '危': '危机之日，宜祈福、安床。忌登高、冒险。',
      '成': '成就之日，宜开业、交易、嫁娶。诸事皆宜。',
      '收': '收获之日，宜收债、纳财。忌开工。',
      '开': '开放之日，宜开市、动工。诸事皆宜。',
      '闭': '关闭之日，宜安葬、收藏。忌开张、出行。'
    };

    if (xiu || zheng || jian) {
      html += '<div class="interp-card">';
      html += '<h3 style="color:var(--ink);font-size:1.15rem;margin-top:0">二十八宿 & 建星</h3>';

      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">';

      if (xiu) {
        html += '<div style="padding:14px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
        html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">二十八宿</div>';
        html += '<div style="font-size:1.05rem;font-weight:700;margin-top:4px">' + xiu + '宿</div>';
        if (xiuLuck) {
          html += '<div style="font-size:.8rem;color:var(--ink-light);margin-top:4px">' + xiuLuck + '</div>';
        }
        html += '</div>';
      }

      if (jian) {
        jianDesc = JIAN_INTERP[jian] || '';
        html += '<div style="padding:14px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
        html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">建星</div>';
        html += '<div style="font-size:1.05rem;font-weight:700;margin-top:4px">' + jian + '日</div>';
        if (jianDesc) {
          html += '<div style="font-size:.8rem;color:var(--ink-light);margin-top:4px">' + jianDesc + '</div>';
        }
        html += '</div>';
      }

      if (zheng) {
        html += '<div style="padding:14px;background:var(--cream);border-radius:var(--r-lg);border:1px solid var(--border)">';
        html += '<div style="font-size:.75rem;color:var(--ink-light);font-family:var(--font-h)">月相</div>';
        html += '<div style="font-size:1.05rem;font-weight:700;margin-top:4px">' + zheng + '</div>';
        html += '</div>';
      }

      html += '</div>'; // end grid

      if (xiuSong) {
        html += '<p style="font-size:.82rem;color:var(--ink-light);margin-top:10px;font-style:italic;line-height:1.6">' + xiuSong + '</p>';
      }

      html += '</div>'; // end card
    }

    /* ------------------------------------------------------------------
     *  Prompt to enter birth data (if no baziData)
     * ------------------------------------------------------------------ */

    if (!pf) {
      html += '<div class="interp-card" style="text-align:center;border:1px dashed var(--border);background:var(--cream)">';
      html += '<p style="font-family:var(--font-h);font-size:1rem;color:var(--ink-light);margin:8px 0">';
      html += '输入您的出生信息，获取个人化每日运势分析';
      html += '</p>';
      html += '<p style="font-size:.82rem;color:var(--ink-light);margin:0">';
      html += '包括：十神日运、事业/财运/感情/健康评分、幸运色、吉方位';
      html += '</p>';
      html += '</div>';
    }

    return html;
  }

  /* ====================================================================
   *  Public API
   * ==================================================================== */

  return { render: render };

})();
