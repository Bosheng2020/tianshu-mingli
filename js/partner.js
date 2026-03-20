/**
 * 事业合盘 (Business Partnership Compatibility Analysis)
 * 依赖: lunar-javascript (Solar/Lunar global), js/lunar.js (Lunar helper)
 */
var Partner = (function () {
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

  /* 相刑 */
  var XIANG_XING = { '寅': '巳', '巳': '申', '申': '寅',
                     '丑': '戌', '戌': '未', '未': '丑',
                     '子': '卯', '卯': '子' };

  /* ====================================================================
   *  工具函数
   * ==================================================================== */

  function ganWx(g) { return ganWxMap[g] || ''; }
  function zhiWx(z) { return zhiWxMap[z] || ''; }

  function ganIdx(g) {
    for (var i = 0; i < TIAN_GAN.length; i++) { if (TIAN_GAN[i] === g) return i; }
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
    return naYinStr.charAt(naYinStr.length - 1);
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
   *  排盘 & 身强弱 & 用神 & 十神统计
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

    var yearGan  = ec.getYearGan();
    var yearZhi  = ec.getYearZhi();
    var monthGan = ec.getMonthGan();
    var monthZhi = ec.getMonthZhi();
    var dayGan   = ec.getDayGan();
    var dayZhi   = ec.getDayZhi();
    var hourGan  = '', hourZhi = '';
    try { hourGan = ec.getTimeGan(); hourZhi = ec.getTimeZhi(); } catch (e2) {}

    var yearPillar  = ec.getYear();
    var monthPillar = ec.getMonth();
    var dayPillar   = ec.getDay();
    var hourPillar  = '';
    try { hourPillar = ec.getTime(); } catch (e3) { hourPillar = ''; }

    var dayMaster = dayGan;
    var dayMasterWx = ganWx(dayMaster);

    var yearNaYin = '';
    try { yearNaYin = ec.getYearNaYin(); } catch (e4) {}

    var shengXiao = '';
    try { shengXiao = lunar.getYearShengXiao(); } catch (e5) {}

    /* 身强弱 */
    var allGans = [yearGan, monthGan, dayGan, hourGan];
    var allZhis = [yearZhi, monthZhi, dayZhi, hourZhi];
    var helpCount = 0;

    for (var i = 0; i < allGans.length; i++) {
      if (!allGans[i]) continue;
      var wx = ganWx(allGans[i]);
      if (wx === dayMasterWx || WX_SHENG[wx] === dayMasterWx) helpCount++;
    }
    for (var j = 0; j < allZhis.length; j++) {
      if (!allZhis[j]) continue;
      var zwx = zhiWx(allZhis[j]);
      if (zwx === dayMasterWx || WX_SHENG[zwx] === dayMasterWx) helpCount++;
    }

    var isStrong = helpCount >= 4;

    /* 用神 (扶抑法) */
    var yongShen = '';
    var jiShen = '';
    if (isStrong) {
      yongShen = WX_KE[dayMasterWx] || '';
      if (!yongShen) yongShen = WX_SHENG[dayMasterWx];
      jiShen = dayMasterWx;
    } else {
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
      if (!allGans[k] || k === 2) continue;
      var ss = shiShenLocal(dayGanI, ganIdx(allGans[k]));
      if (ss && shiShenCount.hasOwnProperty(ss)) shiShenCount[ss]++;
    }
    for (var m = 0; m < allZhis.length; m++) {
      if (!allZhis[m]) continue;
      var cg = CANG_GAN[allZhis[m]] || [];
      for (var n = 0; n < cg.length; n++) {
        var ss2 = shiShenLocal(dayGanI, ganIdx(cg[n]));
        if (ss2 && shiShenCount.hasOwnProperty(ss2)) shiShenCount[ss2]++;
      }
    }

    /* 十神角色判定 */
    var biJie = shiShenCount['比肩'] + shiShenCount['劫财'];
    var shiShang = shiShenCount['食神'] + shiShenCount['伤官'];
    var caiXing = shiShenCount['偏财'] + shiShenCount['正财'];
    var guanSha = shiShenCount['七杀'] + shiShenCount['正官'];
    var yinXing = shiShenCount['偏印'] + shiShenCount['正印'];

    var dominantType = '';
    var dominantCount = 0;
    var types = [
      { name: '比劫旺', count: biJie },
      { name: '食伤旺', count: shiShang },
      { name: '财星旺', count: caiXing },
      { name: '官杀旺', count: guanSha },
      { name: '印星旺', count: yinXing }
    ];
    for (var t = 0; t < types.length; t++) {
      if (types[t].count > dominantCount) {
        dominantCount = types[t].count;
        dominantType = types[t].name;
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
      dominantType: dominantType,
      biJie: biJie, shiShang: shiShang,
      caiXing: caiXing, guanSha: guanSha, yinXing: yinXing,
      ec: ec, lunar: lunar
    };
  }

  /* ====================================================================
   *  十神角色描述
   * ==================================================================== */

  var ROLE_MAP = {
    '比劫旺': { role: '执行者/冲锋型', desc: '执行力强，适合冲锋陷阵，开拓市场', suitable: '销售、业务拓展、项目执行' },
    '食伤旺': { role: '创意者/策划型', desc: '创意丰富，适合策划和产品设计', suitable: '产品设计、营销策划、内容创作' },
    '财星旺': { role: '商务者/市场型', desc: '商业嗅觉敏锐，适合市场和销售', suitable: '市场营销、商务拓展、财务管理' },
    '官杀旺': { role: '管理者/统筹型', desc: '管理能力突出，适合统筹运营', suitable: '公司管理、运营统筹、风控合规' },
    '印星旺': { role: '技术者/研发型', desc: '学习能力强，适合技术研发', suitable: '技术研发、后端开发、专业顾问' }
  };

  /* ====================================================================
   *  事业合盘分析核心
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

    /* --- 1. 日主配合·事业角度 (25%) --- */
    var rel = wxRelation(bz1.dayMasterWx, bz2.dayMasterWx);
    var dayMasterScore = 0;
    var dayMasterDesc = '';
    var dayMasterType = 'neutral';
    var name1 = bz1.name || '甲方';
    var name2 = bz2.name || '乙方';

    if (rel === '比和') {
      dayMasterScore = 20;
      dayMasterDesc = name1 + '(' + bz1.dayMaster + bz1.dayMasterWx + ') 与 ' + name2 + '(' + bz2.dayMaster + bz2.dayMasterWx + ') 日主五行相同，属于「比和」。实力相当，适合平等合伙，股权可五五分或对等。但需注意避免意见不合时的僵持。';
      dayMasterType = 'neutral';
    } else if (rel === '我生' || rel === '生我') {
      dayMasterScore = 23;
      var resource = rel === '我生' ? name1 : name2;
      var receiver = rel === '我生' ? name2 : name1;
      dayMasterDesc = resource + '是' + receiver + '的资源或助力。在事业合作中，' + resource + '自然地为' + receiver + '提供支持和能量。建议' + resource + '侧重后方支援、资源调配，' + receiver + '侧重前方执行、业务推进。';
      dayMasterType = 'good';
    } else if (rel === '我克' || rel === '克我') {
      dayMasterScore = 10;
      dayMasterDesc = name1 + ' 与 ' + name2 + ' 日主五行相克。在事业合作中，可能存在权力斗争或理念冲突。必须明确分工，划分各自权责范围。建议引入第三方协调机制或制度约束。';
      dayMasterType = 'bad';
    }
    totalScore += dayMasterScore;
    result.sections.push({
      title: '日主配合·事业角度',
      weight: '25%',
      score: dayMasterScore,
      maxScore: 25,
      relation: rel,
      desc: dayMasterDesc,
      type: dayMasterType
    });

    /* --- 2. 财星配合 (20%) --- */
    var caiScore = 0;
    var caiDesc = '';
    var caiType = 'neutral';

    var cai1 = bz1.caiXing;
    var cai2 = bz2.caiXing;
    var guan1 = bz1.guanSha;
    var guan2 = bz2.guanSha;
    var yin1 = bz1.yinXing;
    var yin2 = bz2.yinXing;

    if (cai1 >= 3 && cai2 >= 3) {
      caiScore = 18;
      caiDesc = '双方财星皆旺，赚钱能力强！两人合伙做生意有很好的财运基础。建议将利润分配规则提前约定，避免因财生嫌隙。';
      caiType = 'good';
    } else if ((cai1 >= 3 && (guan2 >= 3 || yin2 >= 3)) || (cai2 >= 3 && (guan1 >= 3 || yin1 >= 3))) {
      caiScore = 20;
      var moneyPerson = cai1 >= 3 ? name1 : name2;
      var managePerson = cai1 >= 3 ? name2 : name1;
      caiDesc = moneyPerson + '财星旺，擅长开拓市场、创造收入；' + managePerson + '官印旺，擅长管理和技术。一个赚钱一个管理，绝佳搭配！';
      caiType = 'good';
    } else if (cai1 >= 2 || cai2 >= 2) {
      caiScore = 12;
      caiDesc = '有一方财星尚可，合伙有一定财运基础。建议财星较弱的一方侧重非财务领域，各展所长。';
      caiType = 'neutral';
    } else {
      caiScore = 6;
      caiDesc = '双方财星均不突出，合伙创业需谨慎评估财务风险。建议引入财星旺的合伙人或顾问，或选择轻资产模式起步。';
      caiType = 'bad';
    }
    totalScore += caiScore;
    result.sections.push({
      title: '财星配合',
      weight: '20%',
      score: caiScore,
      maxScore: 20,
      desc: caiDesc,
      type: caiType
    });

    /* --- 3. 用神互补·事业维度 (25%) --- */
    var yongShenScore = 0;
    var yongShenDesc = '';
    var yongShenType = 'neutral';

    var a_helps_b = false;
    var b_helps_a = false;

    if (bz1.dayMasterWx === bz2.yongShen || ganWx(bz1.yearGan) === bz2.yongShen) {
      a_helps_b = true;
    }
    if (bz2.dayMasterWx === bz1.yongShen || ganWx(bz2.yearGan) === bz1.yongShen) {
      b_helps_a = true;
    }

    if (a_helps_b && b_helps_a) {
      yongShenScore = 25;
      yongShenDesc = '双方用神完美互补！' + name1 + '需要「' + bz1.yongShen + '」，' + name2 + '恰好提供；反之亦然。合伙后双方运势均有提升，事业发展如虎添翼。';
      yongShenType = 'good';
    } else if (a_helps_b || b_helps_a) {
      yongShenScore = 16;
      var helper = a_helps_b ? name1 : name2;
      var helped = a_helps_b ? name2 : name1;
      yongShenDesc = helper + '能为' + helped + '补充所需五行能量。' + helped + '在合作中获益更多。建议在利益分配上适当向' + helper + '倾斜，以保持合作平衡。';
      yongShenType = 'neutral';
    } else {
      yongShenScore = 8;
      yongShenDesc = '双方用神未形成互补。' + name1 + '需「' + bz1.yongShen + '」，' + name2 + '需「' + bz2.yongShen + '」。建议办公环境中融入双方用神五行的元素（如方位、颜色、装饰）来弥补。';
      yongShenType = 'bad';
    }
    totalScore += yongShenScore;
    result.sections.push({
      title: '用神互补·事业维度',
      weight: '25%',
      score: yongShenScore,
      maxScore: 25,
      yongShen1: bz1.yongShen,
      yongShen2: bz2.yongShen,
      desc: yongShenDesc,
      type: yongShenType
    });

    /* --- 4. 十神角色分析 (15%) --- */
    var role1 = ROLE_MAP[bz1.dominantType] || { role: '综合型', desc: '十神分布均匀，综合能力强', suitable: '综合管理' };
    var role2 = ROLE_MAP[bz2.dominantType] || { role: '综合型', desc: '十神分布均匀，综合能力强', suitable: '综合管理' };
    var roleScore = 0;
    var roleDesc = '';
    var roleType = 'neutral';

    if (bz1.dominantType !== bz2.dominantType && bz1.dominantType && bz2.dominantType) {
      roleScore = 14;
      roleDesc = name1 + '为「' + role1.role + '」——' + role1.desc + '，适合负责：' + role1.suitable + '。\n' +
                 name2 + '为「' + role2.role + '」——' + role2.desc + '，适合负责：' + role2.suitable + '。\n' +
                 '两人角色互补，分工明确，是理想的合伙搭配。';
      roleType = 'good';
    } else if (bz1.dominantType === bz2.dominantType && bz1.dominantType) {
      roleScore = 8;
      roleDesc = '双方均为「' + role1.role + '」类型，能力方向相似。优势是默契度高，劣势是缺乏互补。建议其中一人主动调整角色定位，或引入不同类型的第三方合伙人。';
      roleType = 'neutral';
    } else {
      roleScore = 10;
      roleDesc = name1 + '为「' + role1.role + '」，' + name2 + '为「' + role2.role + '」。分工尚可，建议根据实际业务需要灵活调整。';
      roleType = 'neutral';
    }
    totalScore += roleScore;
    result.sections.push({
      title: '十神角色分析',
      weight: '15%',
      score: roleScore,
      maxScore: 15,
      role1: role1,
      role2: role2,
      dominant1: bz1.dominantType,
      dominant2: bz2.dominantType,
      desc: roleDesc,
      type: roleType
    });

    /* --- 5. 年支关系 (15%) --- */
    var yz1 = bz1.yearZhi;
    var yz2 = bz2.yearZhi;
    var yearScore = 8;
    var yearRel = '无特殊关系';
    var yearDesc = '';
    var yearType = 'neutral';

    if (LIU_HE[yz1] === yz2) {
      yearScore = 15;
      yearRel = '六合';
      yearDesc = yz1 + '与' + yz2 + '为「六合」，代表双方天生信任度高，沟通顺畅。在合作中能建立深厚的信任基础，决策效率高。';
      yearType = 'good';
    } else if (checkSanHe(yz1, yz2)) {
      yearScore = 12;
      yearRel = '三合';
      yearDesc = yz1 + '与' + yz2 + '为「三合」关系，志同道合，目标一致。合作中容易达成共识，团队凝聚力强。';
      yearType = 'good';
    } else if (LIU_CHONG[yz1] === yz2) {
      yearScore = 2;
      yearRel = '六冲';
      yearDesc = yz1 + '与' + yz2 + '为「六冲」，合作中容易出现理念分歧和信任危机。建议制定详细的合伙协议，明确退出机制，以制度化方式管控风险。';
      yearType = 'bad';
    } else if (XIANG_XING[yz1] === yz2 || XIANG_XING[yz2] === yz1) {
      yearScore = 4;
      yearRel = '相刑';
      yearDesc = yz1 + '与' + yz2 + '存在「相刑」关系，合作中容易互相挑剔，产生摩擦。建议设立定期沟通机制，有问题及时摊开讨论。';
      yearType = 'bad';
    } else if (LIU_HAI[yz1] === yz2) {
      yearScore = 4;
      yearRel = '六害';
      yearDesc = yz1 + '与' + yz2 + '为「六害」，暗中消耗，合作过程中可能出现暗流。建议财务透明，重要决策留书面记录。';
      yearType = 'bad';
    } else {
      yearDesc = yz1 + '与' + yz2 + '之间无特殊关系，合作关系中性偏稳。信任需要靠长期磨合建立。';
    }
    totalScore += yearScore;
    result.sections.push({
      title: '年支关系',
      weight: '15%',
      score: yearScore,
      maxScore: 15,
      relation: yearRel,
      desc: yearDesc,
      type: yearType
    });

    /* --- 综合评价 --- */
    totalScore = Math.min(100, Math.max(0, totalScore));
    result.totalScore = totalScore;

    if (totalScore >= 90) {
      result.rating = '黄金搭档';
    } else if (totalScore >= 80) {
      result.rating = '优势互补';
    } else if (totalScore >= 70) {
      result.rating = '合作可行';
    } else if (totalScore >= 60) {
      result.rating = '需要磨合';
    } else {
      result.rating = '慎重考虑';
    }

    /* --- 合作建议 --- */
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

  function generateAdvice(result) {
    var advice = [];
    var p1 = result.person1;
    var p2 = result.person2;
    var name1 = p1.name || '甲方';
    var name2 = p2.name || '乙方';

    /* 角色分工建议 */
    var role1 = ROLE_MAP[p1.dominantType] || { role: '综合型', suitable: '综合管理' };
    var role2 = ROLE_MAP[p2.dominantType] || { role: '综合型', suitable: '综合管理' };

    advice.push('分工建议：' + name1 + '适合负责' + role1.suitable + '；' + name2 + '适合负责' + role2.suitable + '。');

    /* 潜在摩擦点 */
    var rel = wxRelation(p1.dayMasterWx, p2.dayMasterWx);
    if (rel === '我克' || rel === '克我') {
      advice.push('潜在摩擦：日主相克可能导致决策分歧。建议设立「重大决策投票机制」，避免一人独断。');
    }

    if (p1.dominantType === p2.dominantType && p1.dominantType) {
      advice.push('角色重叠：双方类型相同（' + role1.role + '），容易在同一领域争夺话语权。建议明确划分负责范围。');
    }

    /* 年支冲刑建议 */
    if (LIU_CHONG[p1.yearZhi] === p2.yearZhi) {
      advice.push('信任风险：年支六冲，合伙务必签订详细协议，约定股权、分红、退出机制。建议定期对账，财务公开透明。');
    }

    /* 用神建议 */
    if (result.sections[2] && result.sections[2].score < 15) {
      advice.push('能量补充：用神互补不足，建议办公室朝向、装修色彩融入「' + p1.yongShen + '」和「' + p2.yongShen + '」元素。');
    }

    /* 身强弱组合 */
    if (p1.isStrong && p2.isStrong) {
      advice.push('双方皆身强，决策果断但易僵持。建议引入独立顾问或董事作为仲裁。');
    } else if (!p1.isStrong && !p2.isStrong) {
      advice.push('双方皆身弱，执行力可能不足。建议招募身强型员工来弥补，或选择稳健保守的经营策略。');
    }

    if (result.totalScore >= 80) {
      advice.push('综合评估：两人八字配合度较高，适合长期合作。珍惜搭档缘分，共创事业！');
    } else if (result.totalScore < 60) {
      advice.push('综合评估：八字配合度偏低，如确需合作，务必完善制度建设，降低人际依赖，以规则驱动合作。');
    }

    return advice;
  }

  /* ====================================================================
   *  渲染
   * ==================================================================== */

  function render(result, container) {
    if (!container) return;
    if (result.error) {
      container.innerHTML = '<div class="partner-error" style="color:#c00;padding:20px;text-align:center;">' + result.message + '</div>';
      return;
    }

    var html = [];
    var score = result.totalScore;
    var gaugeColor = score >= 80 ? '#27ae60' : score >= 60 ? '#e67e22' : '#c0392b';
    var deg = Math.round(score * 3.6);

    html.push('<div class="partner-result">');

    /* Score gauge */
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
    html.push('<div class="partner-bazi-compare" style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin:24px 0;">');
    html.push(renderBaziCard(p1));
    html.push(renderBaziCard(p2));
    html.push('</div>');

    /* Sections */
    for (var i = 0; i < result.sections.length; i++) {
      var sec = result.sections[i];
      var borderColor = sec.type === 'good' ? '#27ae60' : sec.type === 'bad' ? '#c0392b' : '#d4a017';
      var bgColor = sec.type === 'good' ? '#eafaf1' : sec.type === 'bad' ? '#fdedec' : '#fef9e7';
      html.push('<div style="border-left:4px solid ' + borderColor + ';background:' + bgColor + ';padding:16px 20px;margin:12px 0;border-radius:6px;">');
      html.push('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">');
      html.push('<strong style="font-size:16px;">' + sec.title + '</strong>');
      html.push('<span style="font-size:13px;color:#888;">权重: ' + sec.weight + ' | 得分: ' + sec.score + '/' + sec.maxScore + '</span>');
      html.push('</div>');
      if (sec.relation) {
        html.push('<div style="margin-bottom:6px;"><span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:13px;background:' + borderColor + ';color:#fff;">' + sec.relation + '</span></div>');
      }
      /* Role badges for 十神角色分析 */
      if (sec.role1 && sec.role2) {
        html.push('<div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap;">');
        html.push('<span style="display:inline-block;padding:4px 12px;border-radius:14px;font-size:13px;background:#3498db;color:#fff;">' + (p1.name || '甲方') + ': ' + sec.role1.role + '</span>');
        html.push('<span style="display:inline-block;padding:4px 12px;border-radius:14px;font-size:13px;background:#9b59b6;color:#fff;">' + (p2.name || '乙方') + ': ' + sec.role2.role + '</span>');
        html.push('</div>');
      }
      html.push('<div style="font-size:14px;line-height:1.8;color:#444;white-space:pre-line;">' + sec.desc + '</div>');
      html.push('</div>');
    }

    /* Advice */
    html.push('<div style="background:#eaf2f8;border-radius:8px;padding:20px;margin:20px 0;">');
    html.push('<h3 style="margin:0 0 12px;color:#2c3e50;">合作建议</h3>');
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
    /* Pillars */
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
    /* Info row */
    var dmColor = wxColorMap[bz.dayMasterWx] || '#333';
    h.push('<div style="margin-top:10px;text-align:center;font-size:13px;color:#666;">');
    h.push('日主: <strong style="color:' + dmColor + ';">' + bz.dayMaster + '(' + bz.dayMasterWx + ')</strong>');
    h.push(' | ' + (bz.isStrong ? '身强' : '身弱'));
    h.push(' | 用神: <strong>' + bz.yongShen + '</strong>');
    h.push('</div>');
    /* Role type */
    var roleInfo = ROLE_MAP[bz.dominantType] || { role: '综合型' };
    h.push('<div style="text-align:center;font-size:12px;color:#888;margin-top:4px;">类型: ' + roleInfo.role + ' | ' + bz.dominantType + '</div>');
    if (bz.yearNaYin) {
      h.push('<div style="text-align:center;font-size:12px;color:#999;margin-top:2px;">纳音: ' + bz.yearNaYin + '</div>');
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
