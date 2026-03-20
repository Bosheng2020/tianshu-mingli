/**
 * 八字合婚 (Marriage Compatibility Analysis)
 * 依赖: lunar-javascript (Solar/Lunar global), js/lunar.js (Lunar helper)
 */
var HeHun = (function () {
  'use strict';

  /* ====================================================================
   *  常量 & 映射表
   * ==================================================================== */

  var ganWxMap = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
  };

  var zhiWxMap = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };

  var TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  var WX_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  var WX_KE   = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  var SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

  var CANG_GAN = {
    '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'],
    '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'], '午': ['丁', '己'], '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'], '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
  };

  /* 六合 */
  var LIU_HE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯',
                 '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };

  /* 三合局 */
  var SAN_HE = [
    ['申', '子', '辰'], ['寅', '午', '戌'],
    ['巳', '酉', '丑'], ['亥', '卯', '未']
  ];

  /* 六冲 */
  var LIU_CHONG = { '子': '午', '午': '子', '丑': '未', '未': '丑',
                    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
                    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };

  /* 六害 */
  var LIU_HAI = { '子': '未', '未': '子', '丑': '午', '午': '丑',
                  '寅': '巳', '巳': '寅', '卯': '辰', '辰': '卯',
                  '申': '亥', '亥': '申', '酉': '戌', '戌': '酉' };

  /* 相刑 (simplified) */
  var XIANG_XING = { '寅': '巳', '巳': '申', '申': '寅',
                     '丑': '戌', '戌': '未', '未': '丑',
                     '子': '卯', '卯': '子' };

  /* 纳音五行 from pillar string */
  var NA_YIN_WX_MAP = {};
  (function () {
    var naYinList = [
      '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木', '路旁土', '路旁土', '剑锋金', '剑锋金',
      '山头火', '山头火', '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金', '杨柳木', '杨柳木',
      '泉中水', '泉中水', '屋上土', '屋上土', '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
      '砂石金', '砂石金', '山下火', '山下火', '平地木', '平地木', '壁上土', '壁上土', '金箔金', '金箔金',
      '覆灯火', '覆灯火', '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金', '桑柘木', '桑柘木',
      '大溪水', '大溪水', '沙中土', '沙中土', '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
    ];
    for (var i = 0; i < 60; i++) {
      var g = TIAN_GAN[i % 10];
      var z = DI_ZHI[i % 12];
      NA_YIN_WX_MAP[g + z] = naYinList[i];
    }
  })();

  /* 属相配对 - 三合 */
  var ZODIAC_SAN_HE = [
    ['猴', '鼠', '龙'], ['虎', '马', '狗'],
    ['蛇', '鸡', '牛'], ['猪', '兔', '羊']
  ];

  /* 属相配对 - 六合 */
  var ZODIAC_LIU_HE = { '鼠': '牛', '牛': '鼠', '虎': '猪', '猪': '虎',
                         '兔': '狗', '狗': '兔', '龙': '鸡', '鸡': '龙',
                         '蛇': '猴', '猴': '蛇', '马': '羊', '羊': '马' };

  /* 属相六冲 */
  var ZODIAC_LIU_CHONG = { '鼠': '马', '马': '鼠', '牛': '羊', '羊': '牛',
                            '虎': '猴', '猴': '虎', '兔': '鸡', '鸡': '兔',
                            '龙': '狗', '狗': '龙', '蛇': '猪', '猪': '蛇' };

  /* 属相相害 */
  var ZODIAC_HAI = { '鼠': '羊', '羊': '鼠', '牛': '马', '马': '牛',
                     '虎': '蛇', '蛇': '虎', '兔': '龙', '龙': '兔',
                     '猴': '猪', '猪': '猴', '鸡': '狗', '狗': '鸡' };

  /* ====================================================================
   *  工具函数
   * ==================================================================== */

  function ganWx(g) { return ganWxMap[g] || ''; }
  function zhiWx(z) { return zhiWxMap[z] || ''; }

  function ganIdx(g) {
    for (var i = 0; i < TIAN_GAN.length; i++) { if (TIAN_GAN[i] === g) return i; }
    return -1;
  }
  function zhiIdx(z) {
    for (var i = 0; i < DI_ZHI.length; i++) { if (DI_ZHI[i] === z) return i; }
    return -1;
  }

  function wxRelation(wx1, wx2) {
    if (wx1 === wx2) return '比和';
    if (WX_SHENG[wx1] === wx2) return '我生';
    if (WX_SHENG[wx2] === wx1) return '生我';
    if (WX_KE[wx1] === wx2) return '我克';
    if (WX_KE[wx2] === wx1) return '克我';
    return '无';
  }

  function naYinWx(naYinStr) {
    if (!naYinStr) return '';
    var last = naYinStr.charAt(naYinStr.length - 1);
    return last;
  }

  function shiShenLocal(dayGanI, otherGanI) {
    if (typeof Lunar !== 'undefined' && typeof Lunar.shiShen === 'function') {
      return Lunar.shiShen(dayGanI, otherGanI);
    }
    var dWx = ganWxMap[TIAN_GAN[dayGanI]];
    var oWx = ganWxMap[TIAN_GAN[otherGanI]];
    var same = (dayGanI % 2) === (otherGanI % 2);
    var map = {
      '木木': same ? '比肩' : '劫财', '木火': same ? '食神' : '伤官', '木土': same ? '偏财' : '正财',
      '木金': same ? '七杀' : '正官', '木水': same ? '偏印' : '正印',
      '火火': same ? '比肩' : '劫财', '火土': same ? '食神' : '伤官', '火金': same ? '偏财' : '正财',
      '火水': same ? '七杀' : '正官', '火木': same ? '偏印' : '正印',
      '土土': same ? '比肩' : '劫财', '土金': same ? '食神' : '伤官', '土水': same ? '偏财' : '正财',
      '土木': same ? '七杀' : '正官', '土火': same ? '偏印' : '正印',
      '金金': same ? '比肩' : '劫财', '金水': same ? '食神' : '伤官', '金木': same ? '偏财' : '正财',
      '金火': same ? '七杀' : '正官', '金土': same ? '偏印' : '正印',
      '水水': same ? '比肩' : '劫财', '水木': same ? '食神' : '伤官', '水火': same ? '偏财' : '正财',
      '水土': same ? '七杀' : '正官', '水金': same ? '偏印' : '正印'
    };
    return map[dWx + oWx] || '';
  }

  /* ====================================================================
   *  排盘 & 身强弱 & 用神
   * ==================================================================== */

  function extractBazi(person) {
    var solar, lunar, ec;
    try {
      solar = Solar.fromYmd(person.year, person.month, person.day);
      lunar = solar.getLunar();
      ec = lunar.getEightChar();
    } catch (e) {
      return null;
    }

    var yearPillar  = ec.getYear();
    var monthPillar = ec.getMonth();
    var dayPillar   = ec.getDay();
    var hourPillar  = '';
    try { hourPillar = ec.getTime(); } catch (e2) { hourPillar = ''; }

    var yearGan  = ec.getYearGan();
    var yearZhi  = ec.getYearZhi();
    var monthGan = ec.getMonthGan();
    var monthZhi = ec.getMonthZhi();
    var dayGan   = ec.getDayGan();
    var dayZhi   = ec.getDayZhi();
    var hourGan  = '', hourZhi = '';
    try { hourGan = ec.getTimeGan(); hourZhi = ec.getTimeZhi(); } catch (e3) {}

    var dayMaster = dayGan;
    var dayMasterWx = ganWx(dayMaster);

    var yearNaYin = '';
    try { yearNaYin = ec.getYearNaYin(); } catch (e4) {}

    var shengXiao = '';
    try { shengXiao = lunar.getYearShengXiao(); } catch (e5) {}

    /* 身强弱判定 (简化: 同我/生我 >= 4 则身强) */
    var allGans = [yearGan, monthGan, dayGan, hourGan];
    var allZhis = [yearZhi, monthZhi, dayZhi, hourZhi];
    var helpCount = 0;
    var totalCount = 0;

    for (var i = 0; i < allGans.length; i++) {
      if (!allGans[i]) continue;
      totalCount++;
      var wx = ganWx(allGans[i]);
      if (wx === dayMasterWx || WX_SHENG[wx] === dayMasterWx) helpCount++;
    }
    for (var j = 0; j < allZhis.length; j++) {
      if (!allZhis[j]) continue;
      totalCount++;
      var zwx = zhiWx(allZhis[j]);
      if (zwx === dayMasterWx || WX_SHENG[zwx] === dayMasterWx) helpCount++;
    }

    var isStrong = helpCount >= 4;

    /* 用神 (扶抑法简化) */
    var yongShen = '';
    var jiShen = '';
    if (isStrong) {
      /* 身强: 用神为克我/泄我/耗我 */
      yongShen = WX_KE[dayMasterWx] || '';   /* 克我者 - 官杀 */
      if (!yongShen) yongShen = WX_SHENG[dayMasterWx]; /* 泄我者 - 食伤 */
      jiShen = dayMasterWx; /* 忌神: 同我 */
    } else {
      /* 身弱: 用神为生我/帮我 */
      for (var wx2 in WX_SHENG) {
        if (WX_SHENG[wx2] === dayMasterWx) { yongShen = wx2; break; }
      }
      if (!yongShen) yongShen = dayMasterWx;
      jiShen = WX_KE[dayMasterWx] || '';
    }

    /* 十神统计 */
    var shiShenCount = { '比肩': 0, '劫财': 0, '食神': 0, '伤官': 0,
                         '偏财': 0, '正财': 0, '七杀': 0, '正官': 0,
                         '偏印': 0, '正印': 0 };
    var dayGanI = ganIdx(dayGan);
    for (var k = 0; k < allGans.length; k++) {
      if (!allGans[k] || k === 2) continue; /* skip day master itself */
      var ss = shiShenLocal(dayGanI, ganIdx(allGans[k]));
      if (ss && shiShenCount.hasOwnProperty(ss)) shiShenCount[ss]++;
    }
    /* 藏干十神 */
    for (var m = 0; m < allZhis.length; m++) {
      if (!allZhis[m]) continue;
      var cg = CANG_GAN[allZhis[m]] || [];
      for (var n = 0; n < cg.length; n++) {
        var ss2 = shiShenLocal(dayGanI, ganIdx(cg[n]));
        if (ss2 && shiShenCount.hasOwnProperty(ss2)) shiShenCount[ss2]++;
      }
    }

    return {
      name: person.name || '',
      gender: person.gender || '',
      yearPillar: yearPillar, monthPillar: monthPillar,
      dayPillar: dayPillar, hourPillar: hourPillar,
      yearGan: yearGan, yearZhi: yearZhi,
      monthGan: monthGan, monthZhi: monthZhi,
      dayGan: dayGan, dayZhi: dayZhi,
      hourGan: hourGan, hourZhi: hourZhi,
      dayMaster: dayMaster, dayMasterWx: dayMasterWx,
      isStrong: isStrong, helpCount: helpCount,
      yongShen: yongShen, jiShen: jiShen,
      yearNaYin: yearNaYin, shengXiao: shengXiao,
      shiShenCount: shiShenCount,
      ec: ec, lunar: lunar
    };
  }

  /* ====================================================================
   *  合婚分析核心
   * ==================================================================== */

  function analyze(person1, person2) {
    var bz1 = extractBazi(person1);
    var bz2 = extractBazi(person2);

    if (!bz1 || !bz2) {
      return { error: true, message: '无法解析八字信息，请检查出生日期。' };
    }

    var result = {
      error: false,
      person1: bz1,
      person2: bz2,
      sections: [],
      totalScore: 0,
      rating: ''
    };

    var totalScore = 0;

    /* --- 1. 日主配合 (25%) --- */
    var rel = wxRelation(bz1.dayMasterWx, bz2.dayMasterWx);
    var dayMasterScore = 0;
    var dayMasterDesc = '';
    if (rel === '比和') {
      dayMasterScore = 18;
      dayMasterDesc = bz1.dayMaster + '(' + bz1.dayMasterWx + ') 与 ' + bz2.dayMaster + '(' + bz2.dayMasterWx + ') 五行相同，属于「比和」关系。志同道合，容易产生共鸣，但也可能因性格相似而产生争执。建议各自保留独立空间。';
    } else if (rel === '我生' || rel === '生我') {
      dayMasterScore = 23;
      var shengFang = rel === '我生' ? (bz1.name || '甲方') : (bz2.name || '乙方');
      var beiSheng = rel === '我生' ? (bz2.name || '乙方') : (bz1.name || '甲方');
      dayMasterDesc = bz1.dayMaster + '(' + bz1.dayMasterWx + ') 与 ' + bz2.dayMaster + '(' + bz2.dayMasterWx + ') 为「相生」关系。' + shengFang + '滋养' + beiSheng + '，感情自然流畅，一方付出一方接纳，互动良好。';
    } else if (rel === '我克' || rel === '克我') {
      dayMasterScore = 12;
      dayMasterDesc = bz1.dayMaster + '(' + bz1.dayMasterWx + ') 与 ' + bz2.dayMaster + '(' + bz2.dayMasterWx + ') 为「相克」关系。需要较多磨合，但相克也意味着互补。建议遇事多沟通，以包容化解矛盾。';
    }
    totalScore += dayMasterScore;
    result.sections.push({
      title: '日主配合',
      weight: '25%',
      score: dayMasterScore,
      maxScore: 25,
      relation: rel,
      desc: dayMasterDesc,
      type: rel === '我生' || rel === '生我' ? 'good' : rel === '比和' ? 'neutral' : 'bad'
    });

    /* --- 2. 年支合冲 (20%) --- */
    var yz1 = bz1.yearZhi;
    var yz2 = bz2.yearZhi;
    var yearBranchScore = 10; /* base */
    var yearBranchRel = '无特殊关系';
    var yearBranchDesc = '';
    var yearBranchType = 'neutral';

    if (LIU_HE[yz1] === yz2) {
      yearBranchScore = 20;
      yearBranchRel = '六合';
      yearBranchDesc = yz1 + '与' + yz2 + '为「六合」，天作之合！年支六合代表两人天生有缘分，感情基础深厚，彼此容易理解和包容。';
      yearBranchType = 'good';
    } else if (checkSanHe(yz1, yz2)) {
      yearBranchScore = 15;
      yearBranchRel = '三合';
      yearBranchDesc = yz1 + '与' + yz2 + '为「三合」局中成员，志趣相投，合作默契，有共同的目标和方向。';
      yearBranchType = 'good';
    } else if (LIU_CHONG[yz1] === yz2) {
      yearBranchScore = 0;
      yearBranchRel = '六冲';
      yearBranchDesc = yz1 + '与' + yz2 + '为「六冲」，相冲代表意见分歧较大，容易发生冲突。需要双方共同努力化解，可通过五行通关来调和。';
      yearBranchType = 'bad';
    } else if (XIANG_XING[yz1] === yz2 || XIANG_XING[yz2] === yz1) {
      yearBranchScore = 5;
      yearBranchRel = '相刑';
      yearBranchDesc = yz1 + '与' + yz2 + '存在「相刑」关系，相处时容易产生摩擦和矛盾，需要更多耐心和包容。';
      yearBranchType = 'bad';
    } else if (LIU_HAI[yz1] === yz2) {
      yearBranchScore = 5;
      yearBranchRel = '六害';
      yearBranchDesc = yz1 + '与' + yz2 + '为「六害」，暗中相害，容易在不经意间伤害对方感情。需要坦诚沟通，避免猜疑。';
      yearBranchType = 'bad';
    } else {
      yearBranchDesc = yz1 + '与' + yz2 + '之间无特殊合冲刑害关系，属于中性组合，婚姻运势平稳。';
    }
    totalScore += yearBranchScore;
    result.sections.push({
      title: '年支合冲',
      weight: '20%',
      score: yearBranchScore,
      maxScore: 20,
      relation: yearBranchRel,
      desc: yearBranchDesc,
      type: yearBranchType
    });

    /* --- 3. 用神互补 (25%) --- */
    var yongShenScore = 0;
    var yongShenDesc = '';
    var yongShenType = 'neutral';

    var a_helps_b = false;
    var b_helps_a = false;

    /* Check if person1's strong elements match person2's yongShen */
    if (bz1.isStrong && bz1.dayMasterWx === bz2.yongShen) {
      a_helps_b = true;
    }
    if (bz2.isStrong && bz2.dayMasterWx === bz1.yongShen) {
      b_helps_a = true;
    }
    /* Also check: one's yongShen element is the other's strong element */
    if (bz1.dayMasterWx === bz2.yongShen || ganWx(bz1.yearGan) === bz2.yongShen) {
      a_helps_b = true;
    }
    if (bz2.dayMasterWx === bz1.yongShen || ganWx(bz2.yearGan) === bz1.yongShen) {
      b_helps_a = true;
    }

    if (a_helps_b && b_helps_a) {
      yongShenScore = 25;
      yongShenDesc = '双方用神互补，堪称绝配！' + (bz1.name || '甲方') + '需要「' + bz1.yongShen + '」，' + (bz2.name || '乙方') + '恰好能提供；反之亦然。两人在一起彼此成就，运势互相提升。';
      yongShenType = 'good';
    } else if (a_helps_b || b_helps_a) {
      yongShenScore = 16;
      var helper = a_helps_b ? (bz1.name || '甲方') : (bz2.name || '乙方');
      var helped = a_helps_b ? (bz2.name || '乙方') : (bz1.name || '甲方');
      yongShenDesc = helper + '能为' + helped + '带来所需的五行能量，单方面互补。' + helped + '在' + helper + '身边运势会有提升。建议' + helped + '也多关注' + helper + '的需求。';
      yongShenType = 'neutral';
    } else {
      yongShenScore = 8;
      yongShenDesc = '双方用神未形成明显互补关系。' + (bz1.name || '甲方') + '需「' + bz1.yongShen + '」，' + (bz2.name || '乙方') + '需「' + bz2.yongShen + '」。建议通过风水布局、佩戴饰品等方式弥补不足。';
      yongShenType = 'bad';
    }
    totalScore += yongShenScore;
    result.sections.push({
      title: '用神互补',
      weight: '25%',
      score: yongShenScore,
      maxScore: 25,
      yongShen1: bz1.yongShen,
      yongShen2: bz2.yongShen,
      desc: yongShenDesc,
      type: yongShenType
    });

    /* --- 4. 属相配对 (15%) --- */
    var sx1 = bz1.shengXiao;
    var sx2 = bz2.shengXiao;
    var zodiacScore = 8; /* default neutral */
    var zodiacRel = '普通';
    var zodiacDesc = '';
    var zodiacType = 'neutral';

    if (ZODIAC_LIU_HE[sx1] === sx2) {
      zodiacScore = 15;
      zodiacRel = '六合';
      zodiacDesc = sx1 + '与' + sx2 + '为「六合」生肖，婚配大吉！民间素有「' + sx1 + sx2 + '合」之说，两人感情深厚，白头偕老。';
      zodiacType = 'good';
    } else if (checkZodiacSanHe(sx1, sx2)) {
      zodiacScore = 12;
      zodiacRel = '三合';
      zodiacDesc = sx1 + '与' + sx2 + '为「三合」生肖，性格互补，合作融洽。虽不如六合亲密，但也是上佳组合。';
      zodiacType = 'good';
    } else if (ZODIAC_LIU_CHONG[sx1] === sx2) {
      zodiacScore = 2;
      zodiacRel = '六冲';
      zodiacDesc = sx1 + '与' + sx2 + '为「六冲」生肖，传统认为不宜婚配。但现代命理学认为，只要八字整体配合得当，亦可化解。切勿因此轻言放弃。';
      zodiacType = 'bad';
    } else if (ZODIAC_HAI[sx1] === sx2) {
      zodiacScore = 4;
      zodiacRel = '相害';
      zodiacDesc = sx1 + '与' + sx2 + '存在「相害」关系，暗中不利，容易在生活细节中产生矛盾。建议多培养共同兴趣爱好。';
      zodiacType = 'bad';
    } else {
      zodiacDesc = sx1 + '与' + sx2 + '之间无特殊生肖关系，属于普通组合，婚配可行，关键看八字整体配合。';
    }
    totalScore += zodiacScore;
    result.sections.push({
      title: '属相配对',
      weight: '15%',
      score: zodiacScore,
      maxScore: 15,
      zodiac1: sx1,
      zodiac2: sx2,
      relation: zodiacRel,
      desc: zodiacDesc,
      type: zodiacType
    });

    /* --- 5. 纳音配合 (15%) --- */
    var ny1 = bz1.yearNaYin;
    var ny2 = bz2.yearNaYin;
    var nyWx1 = naYinWx(ny1);
    var nyWx2 = naYinWx(ny2);
    var naYinScore = 8;
    var naYinRel = wxRelation(nyWx1, nyWx2);
    var naYinDesc = '';
    var naYinType = 'neutral';

    if (naYinRel === '比和') {
      naYinScore = 10;
      naYinDesc = (bz1.name || '甲方') + '年柱纳音「' + ny1 + '」与' + (bz2.name || '乙方') + '年柱纳音「' + ny2 + '」五行相同，属于比和，平稳和谐。';
      naYinType = 'neutral';
    } else if (naYinRel === '我生' || naYinRel === '生我') {
      naYinScore = 14;
      naYinDesc = '「' + ny1 + '」与「' + ny2 + '」为相生关系，纳音五行互相滋养，有利于感情和家运的长远发展。';
      naYinType = 'good';
    } else if (naYinRel === '我克' || naYinRel === '克我') {
      naYinScore = 4;
      naYinDesc = '「' + ny1 + '」与「' + ny2 + '」为相克关系，纳音五行冲突，可能在财运和家运方面产生摩擦。建议通过通关五行来化解。';
      naYinType = 'bad';
    } else {
      naYinScore = 8;
      naYinDesc = '纳音五行关系中性。「' + ny1 + '」与「' + ny2 + '」无明显吉凶。';
    }
    totalScore += naYinScore;
    result.sections.push({
      title: '纳音配合',
      weight: '15%',
      score: naYinScore,
      maxScore: 15,
      naYin1: ny1,
      naYin2: ny2,
      relation: naYinRel,
      desc: naYinDesc,
      type: naYinType
    });

    /* --- 综合评价 --- */
    totalScore = Math.min(100, Math.max(0, totalScore));
    result.totalScore = totalScore;

    if (totalScore >= 90) {
      result.rating = '天作之合';
    } else if (totalScore >= 80) {
      result.rating = '佳偶天成';
    } else if (totalScore >= 70) {
      result.rating = '和睦相处';
    } else if (totalScore >= 60) {
      result.rating = '需要磨合';
    } else {
      result.rating = '挑战较多';
    }

    /* --- 婚姻建议 --- */
    result.advice = generateAdvice(result);

    return result;
  }

  function checkSanHe(z1, z2) {
    for (var i = 0; i < SAN_HE.length; i++) {
      var group = SAN_HE[i];
      var has1 = false, has2 = false;
      for (var j = 0; j < group.length; j++) {
        if (group[j] === z1) has1 = true;
        if (group[j] === z2) has2 = true;
      }
      if (has1 && has2) return true;
    }
    return false;
  }

  function checkZodiacSanHe(sx1, sx2) {
    for (var i = 0; i < ZODIAC_SAN_HE.length; i++) {
      var group = ZODIAC_SAN_HE[i];
      var has1 = false, has2 = false;
      for (var j = 0; j < group.length; j++) {
        if (group[j] === sx1) has1 = true;
        if (group[j] === sx2) has2 = true;
      }
      if (has1 && has2) return true;
    }
    return false;
  }

  function generateAdvice(result) {
    var advice = [];
    var p1 = result.person1;
    var p2 = result.person2;
    var name1 = p1.name || '甲方';
    var name2 = p2.name || '乙方';

    if (result.totalScore >= 80) {
      advice.push('两人八字配合度较高，婚姻基础良好。珍惜这份缘分，多关心对方的感受。');
    }

    /* 日主相克建议 */
    var rel = wxRelation(p1.dayMasterWx, p2.dayMasterWx);
    if (rel === '我克' || rel === '克我') {
      var tongGuan = WX_SHENG[p1.dayMasterWx] === p2.dayMasterWx ? p2.dayMasterWx : WX_SHENG[p2.dayMasterWx];
      advice.push('日主相克，建议在家居中增添「' + (tongGuan || '土') + '」属性的元素作为通关，缓解冲突。');
    }

    /* 年支六冲建议 */
    if (LIU_CHONG[p1.yearZhi] === p2.yearZhi) {
      advice.push('年支六冲，建议选择合适的结婚年份（选合年支的年份），婚礼可设在对双方有利的方位。');
    }

    /* 用神不补建议 */
    if (result.sections[2] && result.sections[2].score < 15) {
      advice.push('用神互补不足，建议双方在事业方向上互相支持。' + name1 + '可多接触「' + p1.yongShen + '」相关的行业和活动，' + name2 + '可多接触「' + p2.yongShen + '」相关的行业和活动。');
    }

    /* 身强弱组合建议 */
    if (p1.isStrong && p2.isStrong) {
      advice.push('双方皆身强，个性都较强势。婚姻中需学会退让和妥协，避免争强好胜。');
    } else if (!p1.isStrong && !p2.isStrong) {
      advice.push('双方皆身弱，需要互相扶持鼓励。建议多参加社交活动，拓展人脉资源。');
    } else {
      advice.push('一强一弱，互补得当。身强的一方自然承担更多，身弱的一方要学会感恩与回馈。');
    }

    if (advice.length === 0) {
      advice.push('整体配合尚可，保持良好的沟通习惯，互相尊重是长久之道。');
    }

    return advice;
  }

  /* ====================================================================
   *  渲染
   * ==================================================================== */

  function render(result, container) {
    if (!container) return;
    if (result.error) {
      container.innerHTML = '<div class="hehun-error" style="color:#c00;padding:20px;text-align:center;">' + result.message + '</div>';
      return;
    }

    var html = [];

    /* Score gauge */
    var score = result.totalScore;
    var gaugeColor = score >= 80 ? '#2ecc71' : score >= 60 ? '#f39c12' : '#e74c3c';
    var deg = Math.round(score * 3.6);
    html.push('<div class="hehun-result">');
    html.push('<div style="text-align:center;margin:30px 0;">');
    html.push('<div style="display:inline-block;position:relative;width:180px;height:180px;border-radius:50%;background:conic-gradient(' + gaugeColor + ' 0deg ' + deg + 'deg, #e0e0e0 ' + deg + 'deg 360deg);padding:12px;box-sizing:border-box;">');
    html.push('<div style="width:100%;height:100%;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">');
    html.push('<span style="font-size:42px;font-weight:bold;color:' + gaugeColor + ';">' + score + '</span>');
    html.push('<span style="font-size:14px;color:#888;">/ 100分</span>');
    html.push('</div></div>');
    html.push('<div style="margin-top:12px;font-size:22px;font-weight:bold;color:' + gaugeColor + ';">' + result.rating + '</div>');
    html.push('</div>');

    /* Side by side BaZi */
    var p1 = result.person1;
    var p2 = result.person2;
    html.push('<div class="hehun-bazi-compare" style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin:24px 0;">');
    html.push(renderBaziCard(p1));
    html.push(renderBaziCard(p2));
    html.push('</div>');

    /* Sections */
    for (var i = 0; i < result.sections.length; i++) {
      var sec = result.sections[i];
      var borderColor = sec.type === 'good' ? '#2ecc71' : sec.type === 'bad' ? '#e74c3c' : '#f0c040';
      var bgColor = sec.type === 'good' ? '#f0fff4' : sec.type === 'bad' ? '#fff5f5' : '#fffdf0';
      html.push('<div style="border-left:4px solid ' + borderColor + ';background:' + bgColor + ';padding:16px 20px;margin:12px 0;border-radius:6px;">');
      html.push('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">');
      html.push('<strong style="font-size:16px;">' + sec.title + '</strong>');
      html.push('<span style="font-size:13px;color:#888;">权重: ' + sec.weight + ' | 得分: ' + sec.score + '/' + sec.maxScore + '</span>');
      html.push('</div>');
      if (sec.relation) {
        html.push('<div style="margin-bottom:6px;"><span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:13px;background:' + borderColor + ';color:#fff;">' + sec.relation + '</span></div>');
      }
      html.push('<div style="font-size:14px;line-height:1.8;color:#444;">' + sec.desc + '</div>');
      html.push('</div>');
    }

    /* Advice */
    html.push('<div style="background:#f0f7ff;border-radius:8px;padding:20px;margin:20px 0;">');
    html.push('<h3 style="margin:0 0 12px;color:#2c3e50;">婚姻建议</h3>');
    html.push('<ul style="margin:0;padding-left:20px;line-height:2;">');
    for (var a = 0; a < result.advice.length; a++) {
      html.push('<li style="color:#555;">' + result.advice[a] + '</li>');
    }
    html.push('</ul></div>');

    html.push('</div>');
    container.innerHTML = html.join('');
  }

  function renderBaziCard(bz) {
    var name = bz.name || '命主';
    var wxColorMap = { '木': '#4caf50', '火': '#f44336', '土': '#c8a415', '金': '#ffc107', '水': '#2196f3' };
    var h = [];
    h.push('<div style="background:#fafafa;border:1px solid #e0e0e0;border-radius:10px;padding:16px 20px;min-width:240px;max-width:320px;">');
    h.push('<div style="text-align:center;font-weight:bold;font-size:16px;margin-bottom:10px;">' + name);
    if (bz.shengXiao) h.push(' <span style="color:#888;font-size:13px;">属' + bz.shengXiao + '</span>');
    h.push('</div>');
    /* Pillars table */
    h.push('<table style="width:100%;text-align:center;border-collapse:collapse;">');
    h.push('<tr style="color:#888;font-size:12px;"><td>年柱</td><td>月柱</td><td>日柱</td><td>时柱</td></tr>');
    h.push('<tr style="font-size:20px;font-weight:bold;">');
    var pillars = [
      [bz.yearGan, bz.yearZhi], [bz.monthGan, bz.monthZhi],
      [bz.dayGan, bz.dayZhi], [bz.hourGan, bz.hourZhi]
    ];
    for (var i = 0; i < pillars.length; i++) {
      var g = pillars[i][0] || '?';
      var z = pillars[i][1] || '?';
      var gColor = wxColorMap[ganWx(g)] || '#333';
      var zColor = wxColorMap[zhiWx(z)] || '#333';
      h.push('<td><span style="color:' + gColor + ';">' + g + '</span><br><span style="color:' + zColor + ';">' + z + '</span></td>');
    }
    h.push('</tr></table>');
    /* Day master info */
    var dmColor = wxColorMap[bz.dayMasterWx] || '#333';
    h.push('<div style="margin-top:10px;text-align:center;font-size:13px;color:#666;">');
    h.push('日主: <strong style="color:' + dmColor + ';">' + bz.dayMaster + '(' + bz.dayMasterWx + ')</strong>');
    h.push(' | ' + (bz.isStrong ? '身强' : '身弱'));
    h.push(' | 用神: <strong>' + bz.yongShen + '</strong>');
    h.push('</div>');
    if (bz.yearNaYin) {
      h.push('<div style="text-align:center;font-size:12px;color:#999;margin-top:4px;">纳音: ' + bz.yearNaYin + '</div>');
    }
    h.push('</div>');
    return h.join('');
  }

  /* ====================================================================
   *  导出
   * ==================================================================== */

  return {
    analyze: analyze,
    render: render
  };
})();
