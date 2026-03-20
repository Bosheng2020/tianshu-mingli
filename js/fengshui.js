/**
 * 风水堪舆 — 八宅命卦 + 九宫飞星 + 命理风水
 */
const FengShui = (() => {

  // ===== 1. 八宅风水：命卦计算 =====
  // 命卦: 坎1 坤2 震3 巽4 中5(男→坤2,女→艮8) 乾6 兑7 艮8 离9
  var GUA_NAMES = {1:'坎',2:'坤',3:'震',4:'巽',5:'',6:'乾',7:'兑',8:'艮',9:'离'};
  var GUA_GROUP = {1:'东四命',2:'西四命',3:'东四命',4:'东四命',6:'西四命',7:'西四命',8:'西四命',9:'东四命'};
  var GUA_ELEMENT = {1:'水',2:'土',3:'木',4:'木',6:'金',7:'金',8:'土',9:'火'};

  function calcMingGua(year, gender) {
    var isMale = gender === 'male';
    var num;
    if (year < 2000) {
      var sum = year % 100;
      while (sum >= 10) sum = Math.floor(sum/10) + sum%10;
      num = isMale ? ((11 - sum) % 9 || 9) : ((sum + 4) % 9 || 9);
    } else {
      var sum2 = year % 100;
      while (sum2 >= 10) sum2 = Math.floor(sum2/10) + sum2%10;
      num = isMale ? ((9 - sum2) % 9 || 9) : ((sum2 + 6) % 9 || 9);
    }
    if (num === 5) num = isMale ? 2 : 8;
    return num;
  }

  // 八宅吉凶方位表: guaNum -> {方位: 星名}
  // 方位顺序: 北(坎1) 西南(坤2) 东(震3) 东南(巽4) 西北(乾6) 西(兑7) 东北(艮8) 南(离9)
  var BA_ZHAI = {
    1: {N:'伏位',SW:'绝命',E:'天医',SE:'生气',NW:'六煞',W:'祸害',NE:'五鬼',S:'延年'},
    2: {N:'绝命',SW:'伏位',E:'祸害',SE:'五鬼',NW:'延年',W:'生气',NE:'天医',S:'六煞'},
    3: {N:'天医',SW:'祸害',E:'伏位',SE:'延年',NW:'五鬼',W:'绝命',NE:'六煞',S:'生气'},
    4: {N:'生气',SW:'五鬼',E:'延年',SE:'伏位',NW:'祸害',W:'六煞',NE:'绝命',S:'天医'},
    6: {N:'六煞',SW:'延年',E:'五鬼',SE:'祸害',NW:'伏位',W:'天医',NE:'生气',S:'绝命'},
    7: {N:'祸害',SW:'生气',E:'绝命',SE:'六煞',NW:'天医',W:'伏位',NE:'延年',S:'五鬼'},
    8: {N:'五鬼',SW:'天医',E:'六煞',SE:'绝命',NW:'生气',W:'延年',NE:'伏位',S:'祸害'},
    9: {N:'延年',SW:'六煞',E:'生气',SE:'天医',NW:'绝命',W:'五鬼',NE:'祸害',S:'伏位'}
  };

  var DIR_CN = {N:'北',S:'南',E:'东',W:'西',NE:'东北',NW:'西北',SE:'东南',SW:'西南'};
  var DIR_ORDER = ['SE','S','SW','E','','W','NE','N','NW']; // 九宫格顺序

  var STAR_INFO = {
    '生气': {level:'大吉',color:'#16a34a',star:'贪狼木',use:'旺财旺丁，最宜开门、书房、办公室。',icon:'★'},
    '延年': {level:'中吉',color:'#2563eb',star:'武曲金',use:'利感情、利健康长寿。最宜主卧室。',icon:'★'},
    '天医': {level:'小吉',color:'#0891b2',star:'巨门土',use:'利健康康复、人际和谐。宜厨房、餐厅。',icon:'★'},
    '伏位': {level:'平吉',color:'#65a30d',star:'辅弼木',use:'平稳安宁。宜休息区、次卧。',icon:'☆'},
    '祸害': {level:'小凶',color:'#d97706',star:'禄存土',use:'口舌是非。宜做储物间、杂物房。',icon:'✗'},
    '六煞': {level:'中凶',color:'#9333ea',star:'文曲水',use:'烂桃花、不安定。不宜卧室，宜卫生间。',icon:'✗'},
    '五鬼': {level:'大凶',color:'#dc2626',star:'廉贞火',use:'灾祸破财。宜厕所镇压，忌做卧室书房。',icon:'✗'},
    '绝命': {level:'至凶',color:'#991b1b',star:'破军金',use:'血光之灾。绝不宜住人，宜做厕所或空置。',icon:'✗'}
  };

  // ===== 2. 九宫飞星 =====
  // 流年飞星: 年份 -> 中宫星数 (逆推: 2024中宫=3, 每年-1)
  function yearCenterStar(year) {
    var base = ((2024 - year) % 9 + 9) % 9;
    var center = (3 - ((year - 2024) % 9) + 9) % 9;
    if (center === 0) center = 9;
    return center;
  }

  // 飞星飞布顺序 (洛书轨迹): 中→西北→西→东北→南→北→西南→东→东南
  var FLY_ORDER = [4,3,8,7,6,1,2,9,5]; // center=idx4, then NW=3,W=8,...
  // 九宫位置索引: 0=SE,1=S,2=SW,3=E,4=center,5=W,6=NE,7=N,8=NW
  var FLY_SEQ = [4,8,3,7,2,6,1,5,0]; // 飞星顺序对应九宫位置

  function getYearFlyStars(year) {
    var center = yearCenterStar(year);
    var grid = new Array(9);
    for (var i = 0; i < 9; i++) {
      var starNum = ((center - 1 + i) % 9) + 1;
      grid[FLY_SEQ[i]] = starNum;
    }
    return grid; // grid[0]=SE, grid[1]=S, ..., grid[4]=center, ..., grid[8]=NW
  }

  var NINE_STARS = {
    1: {name:'一白贪狼',short:'一白',wx:'水',nature:'吉',color:'#2563eb',
        meaning:'桃花人缘星。主感情、人缘、出门运。',
        good:'催旺桃花和人缘，放粉水晶或鲜花。',
        bad:'无需化解。'},
    2: {name:'二黑巨门',short:'二黑',wx:'土',nature:'凶',color:'#1a1a1a',
        meaning:'病符星。主疾病、伤痛、灾祸。',
        good:'',
        bad:'挂六帝铜钱或放铜葫芦化解。忌动土装修。'},
    3: {name:'三碧禄存',short:'三碧',wx:'木',nature:'凶',color:'#15803d',
        meaning:'是非星。主口舌、争吵、官非诉讼。',
        good:'',
        bad:'放红色物品（红地毯）泄木气。忌放绿植。'},
    4: {name:'四绿文昌',short:'四绿',wx:'木',nature:'吉',color:'#16a34a',
        meaning:'文昌星。主学业、考试、功名。',
        good:'放文昌塔、四支毛笔催旺。学生书桌宜设此方。',
        bad:'无需化解。'},
    5: {name:'五黄廉贞',short:'五黄',wx:'土',nature:'大凶',color:'#dc2626',
        meaning:'五黄煞。全年最凶之位！主大灾大祸、破财伤身。',
        good:'',
        bad:'挂铜风铃或放五帝钱化解。绝对忌动土、装修、放红色物品！'},
    6: {name:'六白武曲',short:'六白',wx:'金',nature:'吉',color:'#c5922e',
        meaning:'权力驿马星。主事业权力、贵人、升迁。',
        good:'放金属饰品催旺。利求官求职。',
        bad:'无需化解。'},
    7: {name:'七赤破军',short:'七赤',wx:'金',nature:'凶',color:'#9333ea',
        meaning:'破军星。主破财、盗贼、口舌。',
        good:'',
        bad:'放清水一杯化解金气。忌放金属利器。'},
    8: {name:'八白左辅',short:'八白',wx:'土',nature:'大吉',color:'#c5922e',
        meaning:'正财星。主财运、置业、添丁。当运最旺之星！',
        good:'放黄色物品或陶瓷催旺。是全年最佳财位！',
        bad:'无需化解。'},
    9: {name:'九紫右弼',short:'九紫',wx:'火',nature:'吉',color:'#dc2626',
        meaning:'喜庆星。主婚嫁、添丁、升职等喜事。',
        good:'放红色装饰或灯光催旺。利结婚、怀孕。',
        bad:'无需化解。'}
  };

  var GRID_DIRS = ['东南','正南','西南','正东','中宫','正西','东北','正北','西北'];

  // ===== 2.5 流月飞星 =====
  // 年支分三组决定正月中宫起始星：子午卯酉→8, 辰戌丑未→5, 寅申巳亥→2
  // 每月中宫星逐月递减1（逆飞）
  function getMonthFlyStars(yearZhi, lunarMonth) {
    var g1 = '子午卯酉', g2 = '辰戌丑未';
    var start = g1.indexOf(yearZhi) >= 0 ? 8 : g2.indexOf(yearZhi) >= 0 ? 5 : 2;
    var center = ((start - (lunarMonth - 1)) % 9 + 9) % 9;
    if (center === 0) center = 9;
    var grid = new Array(9);
    for (var i = 0; i < 9; i++) {
      var starNum = ((center - 1 + i) % 9) + 1;
      grid[FLY_SEQ[i]] = starNum;
    }
    return { grid: grid, center: center, lunarMonth: lunarMonth };
  }

  // ===== 3. 命理风水数据 =====
  var WX_DATA = {
    '木':{dir:'东',dir2:'东南',color:'绿色、青色',num:'3、8',material:'实木、竹制品、棉麻',plant:'发财树、富贵竹、绿萝',bedHead:'东',bedAvoid:'西（金克木）',industry:'教育、文化、医药、林业、服装'},
    '火':{dir:'南',dir2:'南',color:'红色、紫色、橙色',num:'2、7',material:'灯饰、蜡烛、皮革',plant:'红掌、一品红、三角梅',bedHead:'南',bedAvoid:'北（水克火）',industry:'能源、电子、餐饮、传媒、美容'},
    '土':{dir:'东北/西南',dir2:'中宫',color:'黄色、棕色、米色',num:'5、0',material:'陶瓷、石材、大理石',plant:'多肉、仙人掌、虎皮兰',bedHead:'东北或西南',bedAvoid:'东（木克土）',industry:'房地产、建筑、农业、矿业、保险'},
    '金':{dir:'西',dir2:'西北',color:'白色、银色、金色',num:'4、9',material:'金属、不锈钢、铜器',plant:'金边吊兰、银皇后、白掌',bedHead:'西或西北',bedAvoid:'南（火克金）',industry:'金融、银行、五金、司法、军警'},
    '水':{dir:'北',dir2:'北',color:'黑色、深蓝、藏青',num:'1、6',material:'玻璃、水景、镜面',plant:'水仙、铜钱草、碗莲',bedHead:'北',bedAvoid:'东北/西南（土克水）',industry:'贸易、物流、旅游、航运、传播'}
  };

  // ===== analyze =====
  function analyze(baziResult) {
    if (!baziResult) return null;
    if (baziResult.ec && !baziResult.yongShen) {
      var ec2 = baziResult.ec;
      var dg = ec2.getDayGan();
      var wxm = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
      var gm = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
      baziResult.yongShen = gm[wxm[dg]||'木'];
      baziResult.jiShen = {'木':'金','火':'水','土':'木','金':'火','水':'土'}[wxm[dg]||'木'];
    }
    var ys = baziResult.finalYongShen || (Array.isArray(baziResult.yongShen) ? baziResult.yongShen[0] : baziResult.yongShen);
    var js = Array.isArray(baziResult.jiShen) ? baziResult.jiShen[0] : baziResult.jiShen;
    if (!ys) return null;
    var shengMap = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
    var ys2 = shengMap[ys]; if (ys2 === js) ys2 = ys;

    // 命卦
    // Handle both lunar-javascript Lunar object and our {year:...} format
    var lunarObj = baziResult.lunar;
    var birthYear = 1990;
    if (lunarObj) {
      if (typeof lunarObj.getYear === 'function') birthYear = lunarObj.getYear(); // lunar-javascript object
      else if (lunarObj.year) birthYear = lunarObj.year; // our format
    }
    var gender = baziResult.gender || 'male';
    var guaNum = calcMingGua(birthYear, gender);
    var guaName = GUA_NAMES[guaNum] || '坤';
    var guaGroup = GUA_GROUP[guaNum] || '西四命';
    var guaDirs = BA_ZHAI[guaNum] || {};

    // 流年飞星 — 以立春为准确定风水年
    var now = new Date();
    var solarYear = now.getFullYear();
    var fsYear = solarYear; // 风水年
    try {
      // 用 lunar-javascript 获取今年立春日期
      if (typeof Solar !== 'undefined') {
        // 从1月底到2月中旬逐日找立春
        for (var ld = 20; ld <= 40; ld++) {
          var checkDate = new Date(solarYear, 0, ld); // Jan 20 to Feb 9
          var ls = Solar.fromYmd(checkDate.getFullYear(), checkDate.getMonth()+1, checkDate.getDate());
          var ll = ls.getLunar();
          if (ll.getJieQi() === '立春') {
            // Found 立春 date
            if (now < new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate())) {
              fsYear = solarYear - 1; // 立春前，用去年
            }
            break;
          }
        }
      }
    } catch(e) {}
    var flyGrid = getYearFlyStars(fsYear);

    // Extract birth info for display
    var birthInfo = '';
    if (baziResult.ec) {
      try { birthInfo = baziResult.ec.getYear()+' '+baziResult.ec.getMonth()+' '+baziResult.ec.getDay()+' '+baziResult.ec.getTime(); } catch(e){}
    } else if (baziResult.pillars) {
      birthInfo = baziResult.pillars.map(function(p){return p.text}).join(' ');
    }
    var dayMasterWx = baziResult.dayMasterWuxing || '';
    var strengthDesc = baziResult.strengthDesc || '';

    // 流月飞星
    var monthFly = null;
    try {
      if (typeof Solar !== 'undefined') {
        var nowS = Solar.fromYmd(now.getFullYear(), now.getMonth()+1, now.getDate());
        var nowL = nowS.getLunar();
        var yearZhi = nowL.getYearZhi();
        var lunarMon = Math.abs(nowL.getMonth()); // abs for leap months
        if (lunarMon < 1) lunarMon = 1;
        if (lunarMon > 12) lunarMon = 12;
        monthFly = getMonthFlyStars(yearZhi, lunarMon);
        monthFly.monthCN = nowL.getMonthInChinese();
        monthFly.yearZhi = yearZhi;
      }
    } catch(e) {}

    return { ys:ys, ys2:ys2, js:js, guaNum:guaNum, guaName:guaName, guaGroup:guaGroup, guaDirs:guaDirs, flyGrid:flyGrid, monthFly:monthFly, currentYear:fsYear, birthYear:birthYear, gender:gender, birthInfo:birthInfo, dayMasterWx:dayMasterWx, strengthDesc:strengthDesc };
  }

  // ===== render =====
  function render(result) {
    if (!result) return '<div class="interp-card"><p>风水数据不完整</p></div>';
    var ys = result.ys, js = result.js, Y = WX_DATA[ys] || WX_DATA['木'];
    var html = '';

    // 导航
    html += '<div class="interp-card" style="padding:12px 16px;text-align:center">';
    html += '<h2>风水堪舆</h2>';
    if (result.birthInfo) {
      html += '<p style="font-family:var(--font-h);font-size:1rem;margin:6px 0">' + result.birthInfo + '</p>';
    }
    html += '<p style="font-size:.85rem;color:var(--ink-light)">' + result.birthYear + '年 ' + (result.gender==='male'?'男':'女') + '命 | 用神：' + ys + ' | 忌神：' + js + (result.dayMasterWx ? ' | 日主：' + result.dayMasterWx : '') + (result.strengthDesc ? '（' + result.strengthDesc + '）' : '') + '</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px">';
    [{id:'fs-bazhai',l:'八宅命卦'},{id:'fs-fly',l:'流年飞星'},{id:'fs-mfly',l:'流月飞星'},{id:'fs-office',l:'办公室风水'},{id:'fs-house',l:'居家布局'},{id:'fs-bed',l:'卧室床位'},{id:'fs-wealth',l:'催财布局'},{id:'fs-taboo',l:'风水禁忌'}].forEach(function(n) {
      html += '<a href="#'+n.id+'" style="display:inline-block;padding:5px 14px;border-radius:20px;font-size:.82rem;background:var(--cream);border:1px solid var(--border);color:var(--ink);text-decoration:none;font-family:var(--font-h);transition:all .15s" onmouseover="this.style.background=\'var(--vermillion)\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'var(--cream)\';this.style.color=\'var(--ink)\'">' + n.l + '</a>';
    });
    html += '</div></div>';

    // ===== 1. 八宅命卦 =====
    html += '<div class="interp-card"><h3 id="fs-bazhai">八宅命卦</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">八宅风水根据出生年份计算命卦，推出个人专属的四吉方和四凶方。</p>';

    // 命卦信息
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0;text-align:center">';
    html += '<div style="padding:12px;border:1px solid var(--border);border-radius:8px"><div style="font-size:.72rem;color:var(--ink-light)">命卦</div><div style="font-size:1.3rem;font-weight:900;font-family:var(--font-h);color:var(--vermillion)">' + result.guaName + '卦</div></div>';
    html += '<div style="padding:12px;border:1px solid var(--border);border-radius:8px"><div style="font-size:.72rem;color:var(--ink-light)">命类</div><div style="font-size:1rem;font-weight:700">' + result.guaGroup + '</div></div>';
    html += '<div style="padding:12px;border:1px solid var(--border);border-radius:8px"><div style="font-size:.72rem;color:var(--ink-light)">五行</div><div style="font-size:1rem;font-weight:700">' + (GUA_ELEMENT[result.guaNum]||'') + '</div></div>';
    html += '</div>';

    // 九宫格吉凶方位图
    html += '<h4>个人吉凶方位图</h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:10px auto;max-width:400px;border:2px solid var(--ink);border-radius:8px;overflow:hidden">';
    var dirGrid = ['SE','S','SW','E','','W','NE','N','NW'];
    dirGrid.forEach(function(dir) {
      if (!dir) {
        html += '<div style="background:var(--cream);padding:12px;text-align:center;font-size:.85rem"><strong>' + result.guaName + '命</strong><br>' + result.guaGroup + '</div>';
        return;
      }
      var star = result.guaDirs[dir] || '';
      var info = STAR_INFO[star] || {};
      var bg = info.color ? 'rgba(' + (info.level && info.level.indexOf('凶')>=0 ? '220,38,38' : '22,163,74') + ',.06)' : 'var(--card)';
      html += '<div style="background:'+bg+';padding:8px;text-align:center;font-size:.75rem;min-height:70px">';
      html += '<div style="font-weight:700;color:var(--ink-light);font-size:.68rem">' + DIR_CN[dir] + '</div>';
      html += '<div style="font-weight:900;color:' + (info.color||'var(--ink)') + ';font-size:.9rem;margin:3px 0">' + (info.icon||'') + star + '</div>';
      html += '<div style="font-size:.62rem;color:' + (info.color||'var(--ink-light)') + '">' + (info.level||'') + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // 吉凶方位详解
    html += '<h4>方位详解</h4>';
    ['生气','延年','天医','伏位','祸害','六煞','五鬼','绝命'].forEach(function(star) {
      var info = STAR_INFO[star];
      var dir = '';
      for (var d in result.guaDirs) { if (result.guaDirs[d] === star) dir = d; }
      var isGood = info.level.indexOf('吉') >= 0;
      html += '<details class="yearly-detail"' + (star==='生气'||star==='绝命'?' open':'') + '>';
      html += '<summary class="yearly-summary"><span style="color:'+info.color+';font-weight:700">' + info.icon + ' ' + star + '</span><span class="yr-gz">' + DIR_CN[dir] + '方</span><span class="yr-age">' + info.level + '</span></summary>';
      html += '<div class="yearly-content"><p><strong>' + info.star + '</strong> — ' + info.use + '</p></div></details>';
    });
    html += '</div>';

    // ===== 2. 流年九宫飞星 =====
    html += '<div class="interp-card"><h3 id="fs-fly">' + result.currentYear + '年九宫飞星</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">流年飞星每年变化方位（以立春为界，非正月初一），揭示当年各方位吉凶能量。每年自动更新。</p>';

    // 飞星九宫格
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:10px auto;max-width:400px;border:2px solid var(--ink);border-radius:8px;overflow:hidden">';
    result.flyGrid.forEach(function(starNum, idx) {
      var star = NINE_STARS[starNum];
      var isCenter = (idx === 4);
      var isBad = star.nature.indexOf('凶') >= 0;
      var bg = isBad ? 'rgba(220,38,38,.06)' : isCenter ? 'var(--cream)' : 'rgba(22,163,74,.04)';
      html += '<div style="background:'+bg+';padding:10px;text-align:center;min-height:75px">';
      html += '<div style="font-size:.68rem;color:var(--ink-light)">' + GRID_DIRS[idx] + '</div>';
      html += '<div style="font-size:1rem;font-weight:900;color:'+star.color+';margin:3px 0">' + star.short + '</div>';
      html += '<div style="font-size:.62rem;color:'+star.color+'">' + star.nature + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // 飞星详解
    html += '<h4>各方位详解与化解</h4>';
    result.flyGrid.forEach(function(starNum, idx) {
      var star = NINE_STARS[starNum];
      var isBad = star.nature.indexOf('凶') >= 0;
      var borderC = isBad ? '#dc2626' : 'var(--jade)';
      html += '<details class="yearly-detail"' + (starNum===5||starNum===8?' open':'') + '>';
      html += '<summary class="yearly-summary"><span style="color:'+star.color+';font-weight:700">' + star.short + '</span><span class="yr-gz">' + GRID_DIRS[idx] + '</span><span class="yr-age">' + star.nature + '</span></summary>';
      html += '<div class="yearly-content"><p><strong>' + star.name + '</strong>（' + star.wx + '）— ' + star.meaning + '</p>';
      if (star.good) html += '<p style="color:var(--jade)"><strong>催旺：</strong>' + star.good + '</p>';
      if (star.bad) html += '<p style="color:var(--vermillion)"><strong>化解：</strong>' + star.bad + '</p>';
      html += '</div></details>';
    });
    html += '</div>';

    // ===== 2.5 流月飞星 =====
    if (result.monthFly) {
      var mf = result.monthFly;
      var LUNAR_MON_NAMES = {'正':'正月','二':'二月','三':'三月','四':'四月','五':'五月','六':'六月',
        '七':'七月','八':'八月','九':'九月','十':'十月','冬':'冬月','腊':'腊月'};
      var monthName = LUNAR_MON_NAMES[mf.monthCN] || (mf.monthCN + '月');

      html += '<div class="interp-card"><h3 id="fs-mfly">本月飞星 — ' + monthName + '</h3>';
      html += '<p style="font-size:.84rem;color:var(--ink-light)">流月飞星每月变化，揭示本月各方位的吉凶能量。依据年支（' + mf.yearZhi + '）推算，' + monthName + '中宫飞入' + NINE_STARS[mf.center].short + '。结合流年飞星一起看，可精确到月度方位吉凶。</p>';

      // 月飞星九宫格
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:10px auto;max-width:400px;border:2px solid var(--gold);border-radius:8px;overflow:hidden">';
      mf.grid.forEach(function(starNum, idx) {
        var star = NINE_STARS[starNum];
        var isCenter = (idx === 4);
        var isBad = star.nature.indexOf('凶') >= 0;
        // 叠加：流年飞星 + 流月飞星同一方位对比
        var yearStar = result.flyGrid[idx];
        var yearInfo = NINE_STARS[yearStar];
        var yearBad = yearInfo.nature.indexOf('凶') >= 0;
        var doubleBad = isBad && yearBad;
        var doubleGood = !isBad && !yearBad;
        var bg = doubleBad ? 'rgba(220,38,38,.1)' : isBad ? 'rgba(220,38,38,.05)' : doubleGood ? 'rgba(22,163,74,.08)' : isCenter ? 'var(--cream)' : 'rgba(22,163,74,.03)';

        html += '<div style="background:'+bg+';padding:8px;text-align:center;min-height:80px">';
        html += '<div style="font-size:.65rem;color:var(--ink-light)">' + GRID_DIRS[idx] + '</div>';
        html += '<div style="font-size:1rem;font-weight:900;color:'+star.color+';margin:2px 0">' + star.short + '</div>';
        html += '<div style="font-size:.58rem;color:'+star.color+'">' + star.nature + '</div>';
        // 叠加年星
        html += '<div style="font-size:.55rem;color:var(--ink-light);margin-top:2px;border-top:1px dashed var(--border);padding-top:2px">年' + yearInfo.short + '</div>';
        if (doubleBad) html += '<div style="font-size:.55rem;color:#dc2626;font-weight:700">⚠️ 凶叠</div>';
        if (doubleGood) html += '<div style="font-size:.55rem;color:var(--jade);font-weight:700">双吉</div>';
        html += '</div>';
      });
      html += '</div>';

      // 本月重点提示
      html += '<h4>本月方位要点</h4>';
      // 找本月五黄、二黑、八白位置
      var mWuhuang = '', mErHei = '', mBaBai = '', mJiuZi = '';
      mf.grid.forEach(function(sn, si) {
        if (sn === 5) mWuhuang = GRID_DIRS[si];
        if (sn === 2) mErHei = GRID_DIRS[si];
        if (sn === 8) mBaBai = GRID_DIRS[si];
        if (sn === 9) mJiuZi = GRID_DIRS[si];
      });

      // 凶位警示
      html += '<div style="border:2px solid #dc2626;background:rgba(220,38,38,.03);padding:10px 14px;border-radius:8px;margin:8px 0">';
      html += '<p style="font-weight:700;color:#dc2626;margin-bottom:4px">本月凶方</p>';
      html += '<p style="font-size:.88rem"><strong>五黄煞：' + mWuhuang + '</strong> — 本月最凶方位！忌在此方位动土、装修、久坐。化解：放铜器或金属物件。</p>';
      html += '<p style="font-size:.88rem"><strong>二黑病符：' + mErHei + '</strong> — 本月病星所在，不利健康。化解：放铜葫芦或六帝铜钱。</p>';
      // 检查年月凶星叠加
      var yearWuhuang = '', yearErHei = '';
      result.flyGrid.forEach(function(sn, si) { if(sn===5) yearWuhuang=GRID_DIRS[si]; if(sn===2) yearErHei=GRID_DIRS[si]; });
      if (mWuhuang === yearWuhuang) html += '<p style="font-size:.85rem;color:#dc2626;font-weight:700">⚠️ 本月五黄与流年五黄同宫（' + mWuhuang + '），凶气极重！此方位本月绝对不可动！</p>';
      if (mErHei === yearErHei) html += '<p style="font-size:.85rem;color:#dc2626;font-weight:700">⚠️ 本月二黑与流年二黑同宫（' + mErHei + '），病气加重！此方位注意健康。</p>';
      html += '</div>';

      // 吉位提示
      html += '<div style="border:2px solid var(--jade);background:rgba(45,143,111,.03);padding:10px 14px;border-radius:8px;margin:8px 0">';
      html += '<p style="font-weight:700;color:var(--jade);margin-bottom:4px">本月吉方</p>';
      html += '<p style="font-size:.88rem"><strong>八白财星：' + mBaBai + '</strong> — 本月最佳财位！宜在此方位办公、谈判、放置催财物品。</p>';
      html += '<p style="font-size:.88rem"><strong>九紫喜庆：' + mJiuZi + '</strong> — 本月喜庆位。利感情、婚姻、添丁。宜放红色装饰。</p>';
      // 找一白桃花位和六白贵人位
      var mYiBai = '', mLiuBai = '';
      mf.grid.forEach(function(sn, si) { if(sn===1) mYiBai=GRID_DIRS[si]; if(sn===6) mLiuBai=GRID_DIRS[si]; });
      html += '<p style="font-size:.88rem"><strong>一白桃花：' + mYiBai + '</strong> — 利人缘社交。<strong>六白贵人：' + mLiuBai + '</strong> — 利事业升迁。</p>';
      html += '</div>';

      // 逐宫详解（折叠）
      html += '<details style="margin-top:6px"><summary style="cursor:pointer;font-size:.88rem;font-weight:600;color:var(--gold);padding:6px 0">展开九宫逐一详解</summary><div style="margin-top:6px">';
      mf.grid.forEach(function(starNum, idx) {
        var star = NINE_STARS[starNum];
        var isBad = star.nature.indexOf('凶') >= 0;
        html += '<details class="yearly-detail"' + (starNum===5||starNum===8?' open':'') + '>';
        html += '<summary class="yearly-summary"><span style="color:'+star.color+';font-weight:700">' + star.short + '</span><span class="yr-gz">' + GRID_DIRS[idx] + '</span><span class="yr-age">' + star.nature + '</span></summary>';
        html += '<div class="yearly-content"><p><strong>' + star.name + '</strong>（' + star.wx + '）— ' + star.meaning + '</p>';
        if (star.good) html += '<p style="color:var(--jade)"><strong>催旺：</strong>' + star.good + '</p>';
        if (star.bad) html += '<p style="color:var(--vermillion)"><strong>化解：</strong>' + star.bad + '</p>';
        html += '</div></details>';
      });
      html += '</div></details>';

      html += '</div>';
    }

    // ===== 2.8 办公室风水 =====
    html += '<div class="interp-card"><h3 id="fs-office">办公室风水</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">根据命卦（' + result.guaName + '卦·' + result.guaGroup + '）和用神（' + ys + '）为您量身定制办公风水方案。</p>';

    // 办公桌朝向
    var tianyiDir = ''; for (var dt in result.guaDirs) { if (result.guaDirs[dt] === '天医') tianyiDir = dt; }
    var fuweiDir = ''; for (var df in result.guaDirs) { if (result.guaDirs[df] === '伏位') fuweiDir = df; }
    var yanNianDir2 = ''; for (var dyn in result.guaDirs) { if (result.guaDirs[dyn] === '延年') yanNianDir2 = dyn; }

    html += '<h4>办公桌朝向</h4>';
    html += '<p>坐在办公桌时，<strong>面朝方向</strong>决定了你吸纳什么能量：</p>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">';
    html += '<div style="padding:10px 14px;border:2px solid var(--jade);border-radius:8px;background:rgba(45,143,111,.03)">';
    html += '<p style="font-weight:700;color:var(--jade);margin-bottom:4px">最佳：面朝' + DIR_CN[shengqiDir] + '</p>';
    html += '<p style="font-size:.82rem">生气方，旺事业旺人脉。适合需要开拓业务、追求升职的人。</p></div>';
    html += '<div style="padding:10px 14px;border:2px solid #2563eb;border-radius:8px;background:rgba(37,99,235,.03)">';
    html += '<p style="font-weight:700;color:#2563eb;margin-bottom:4px">次选：面朝' + DIR_CN[yanNianDir2] + '</p>';
    html += '<p style="font-size:.82rem">延年方，利人际和谐。适合需要团队协作、维护客户关系的岗位。</p></div>';
    html += '<div style="padding:10px 14px;border:2px solid #0891b2;border-radius:8px;background:rgba(8,145,178,.03)">';
    html += '<p style="font-weight:700;color:#0891b2;margin-bottom:4px">文职：面朝' + DIR_CN[tianyiDir] + '</p>';
    html += '<p style="font-size:.82rem">天医方，利思考和决策。适合策划、研发、文案类工作。</p></div>';
    html += '<div style="padding:10px 14px;border:2px solid #65a30d;border-radius:8px;background:rgba(101,163,13,.03)">';
    html += '<p style="font-weight:700;color:#65a30d;margin-bottom:4px">安稳：面朝' + DIR_CN[fuweiDir] + '</p>';
    html += '<p style="font-size:.82rem">伏位方，利平稳安定。适合不求大变化、只求稳步发展的阶段。</p></div>';
    html += '</div>';

    // 座位选择
    html += '<h4>座位选择原则</h4>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">';
    // 好
    html += '<div style="padding:10px 14px;border-radius:8px;background:rgba(45,143,111,.04)">';
    html += '<p style="font-weight:700;color:var(--jade);margin-bottom:4px">宜</p>';
    html += '<ul style="font-size:.84rem;padding-left:16px;margin:0">';
    html += '<li>背后有墙（有靠山）</li>';
    html += '<li>座位在整个办公室的' + DIR_CN[shengqiDir] + '方或' + DIR_CN[tianyiDir] + '方</li>';
    html += '<li>左手边（青龙方）比右手边宽敞</li>';
    html += '<li>光线充足、通风良好</li>';
    html += '<li>桌面整洁有序</li>';
    html += '</ul></div>';
    // 忌
    html += '<div style="padding:10px 14px;border-radius:8px;background:rgba(220,38,38,.04)">';
    html += '<p style="font-weight:700;color:var(--vermillion);margin-bottom:4px">忌</p>';
    html += '<ul style="font-size:.84rem;padding-left:16px;margin:0">';
    html += '<li>背对门或走廊（犯小人）</li>';
    html += '<li>正对厕所门或尖角（煞气冲射）</li>';
    html += '<li>座位上方有横梁（压迫运势）</li>';
    html += '<li>正对老板办公室门（压力过大）</li>';
    html += '<li>桌面杂乱或堆满文件</li>';
    html += '</ul></div>';
    html += '</div>';

    // 老板位 vs 员工位
    html += '<h4>老板位 vs 员工位</h4>';
    html += '<div style="border-left:3px solid var(--gold);padding:8px 14px;margin:6px 0;border-radius:0 6px 6px 0;background:rgba(197,146,46,.03)">';
    html += '<p style="font-weight:700;color:var(--gold);margin-bottom:4px">老板/管理者</p>';
    html += '<p style="font-size:.84rem">宜坐整个办公室的<strong>西北方</strong>（乾位，主权威）或<strong>' + DIR_CN[shengqiDir] + '方</strong>（个人生气位）。面朝门口方向，可掌控全局。背后宜靠实墙或高柜（靠山），忌背后是窗。桌上可放铜制或金属摆件增强权威感。</p>';
    html += '</div>';

    html += '<div style="border-left:3px solid #2563eb;padding:8px 14px;margin:6px 0;border-radius:0 6px 6px 0;background:rgba(37,99,235,.03)">';
    html += '<p style="font-weight:700;color:#2563eb;margin-bottom:4px">员工/打工人</p>';
    html += '<p style="font-size:.84rem">宜坐<strong>' + DIR_CN[tianyiDir] + '方</strong>（天医位，利人际和决策）或<strong>' + DIR_CN[yanNianDir2] + '方</strong>（延年位，利升迁）。面朝' + DIR_CN[shengqiDir] + '吸纳生气。桌面左边（青龙方）放文件、电话等活跃物品；右边（白虎方）尽量安静整洁。</p>';
    html += '</div>';

    html += '<div style="border-left:3px solid var(--jade);padding:8px 14px;margin:6px 0;border-radius:0 6px 6px 0;background:rgba(45,143,111,.03)">';
    html += '<p style="font-weight:700;color:var(--jade);margin-bottom:4px">求升职加薪</p>';
    html += '<p style="font-size:.84rem">在办公桌的<strong>' + DIR_CN[shengqiDir] + '</strong>方（个人生气位）放一盆小绿植或水晶球。';
    // 流年六白位
    var liuBaiDir = '';
    result.flyGrid.forEach(function(sn, si) { if(sn===6) liuBaiDir=GRID_DIRS[si]; });
    html += result.currentYear + '年六白权力星飞临<strong>' + liuBaiDir + '</strong>，可在此方位放金属饰品催旺贵人运和升迁运。</p>';
    html += '</div>';

    // 办公桌上的五行布局
    html += '<h4>办公桌面五行布局</h4>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">用神为<strong>' + ys + '</strong>，忌神为<strong>' + js + '</strong>，桌面布置应补用神、避忌神。</p>';
    var officeItems = {
      '木':'绿植（小盆栽）、木质笔筒、竹制杯垫。宜放东方或东南方。',
      '火':'红色桌垫或台灯、紫色小摆件。宜放南方。忌放太多水杯。',
      '土':'陶瓷杯、黄水晶、石头摆件。宜放东北或西南。',
      '金':'金属笔筒、铜制名片夹、银色相框。宜放西方或西北。',
      '水':'水杯常满、小鱼缸（1条黑色鱼）、深蓝色桌垫。宜放北方。'
    };
    var officeAvoid = {
      '木':'过多金属利器（剪刀、裁纸刀外露）',
      '火':'大量水摆件、深蓝/黑色装饰',
      '土':'过多绿植（木克土）',
      '金':'红色过多（火克金）、蜡烛台灯',
      '水':'过多黄色/土色物品、石头摆件过多'
    };
    html += '<p><span style="color:var(--jade);font-weight:700">宜：</span>' + (officeItems[ys]||'') + '</p>';
    html += '<p><span style="color:var(--vermillion);font-weight:700">忌：</span>' + (officeAvoid[ys]||'') + '</p>';

    html += '</div>';

    // ===== 3. 居家布局 =====
    html += '<div class="interp-card"><h3 id="fs-house">居家布局</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">基于用神 <strong>' + ys + '</strong> 和命卦 <strong>' + result.guaName + '（' + result.guaGroup + '）</strong> 综合建议。</p>';

    html += '<h4>大门朝向</h4>';
    var shengqiDir = ''; for (var d2 in result.guaDirs) { if (result.guaDirs[d2] === '生气') shengqiDir = d2; }
    html += '<p>最佳大门朝向：<strong>' + DIR_CN[shengqiDir] + '方</strong>（生气方 — 贪狼星，旺财旺丁）</p>';
    html += '<p>用神方位补充：<strong>' + Y.dir + '方</strong>（五行属' + ys + '）</p>';

    html += '<h4>客厅主色调</h4>';
    html += '<p>宜用：<strong>' + Y.color + '</strong>（用神' + ys + '色系）</p>';
    html += '<p>主要家具材质：' + Y.material + '</p>';

    html += '<h4>最佳楼层</h4>';
    html += '<p>楼层尾数：<strong>' + Y.num + '</strong>（五行属' + ys + '）</p>';
    html += '</div>';

    // ===== 4. 卧室床位 =====
    html += '<div class="interp-card"><h3 id="fs-bed">卧室与床位</h3>';
    var yanNianDir = ''; for (var d3 in result.guaDirs) { if (result.guaDirs[d3] === '延年') yanNianDir = d3; }
    html += '<p>最佳卧室位置：<strong>' + DIR_CN[yanNianDir] + '方</strong>（延年方 — 武曲星，利感情健康长寿）</p>';
    html += '<p>床头朝向：<strong>' + Y.bedHead + '方</strong>（用神' + ys + '方位）</p>';
    html += '<p style="color:var(--vermillion)">床头忌朝：<strong>' + Y.bedAvoid + '</strong></p>';
    html += '<ul class="fs-tips">';
    html += '<li>床头不宜对门、对窗、对镜</li>';
    html += '<li>床下保持整洁通风</li>';
    html += '<li>床头柜成对摆放</li>';
    html += '<li>卧室不宜放过多电器和绿植</li>';
    html += '</ul></div>';

    // ===== 5. 催财布局 =====
    html += '<div class="interp-card"><h3 id="fs-wealth">催财布局</h3>';
    // 找八白财星方位
    var wealthDir = '';
    result.flyGrid.forEach(function(sn, si) { if (sn === 8) wealthDir = GRID_DIRS[si]; });
    html += '<p>' + result.currentYear + '年正财位（八白星）：<strong>' + wealthDir + '</strong></p>';
    html += '<p>命卦生气位（长期财位）：<strong>' + DIR_CN[shengqiDir] + '方</strong></p>';

    var wealthItems = {'木':'大叶绿植（发财树、金钱树）','火':'长明灯或红色装饰','土':'黄水晶簇或聚宝盆','金':'铜制貔貅或金属聚宝盆','水':'流水摆件或鱼缸（养6或1条鱼）'};
    html += '<h4>催财物品</h4>';
    html += '<p>根据用神（' + ys + '）推荐：<strong>' + (wealthItems[ys]||'') + '</strong></p>';
    html += '<ul class="fs-tips">';
    html += '<li>财位保持明亮整洁</li>';
    html += '<li>财位上方不宜有横梁</li>';
    html += '<li>忌财位空、暗、脏、受冲</li>';
    html += '<li>钱包颜色宜用' + Y.color.split('、')[0] + '</li>';
    html += '</ul></div>';

    // ===== 6. 风水禁忌 =====
    html += '<div class="interp-card"><h3 id="fs-taboo">风水禁忌</h3>';
    // 流年五黄方位
    var wuhuangDir = '';
    result.flyGrid.forEach(function(sn, si) { if (sn === 5) wuhuangDir = GRID_DIRS[si]; });
    html += '<div style="border:2px solid #dc2626;background:rgba(220,38,38,.04);padding:12px 16px;border-radius:8px;margin-bottom:12px">';
    html += '<p style="font-weight:700;color:#dc2626">' + result.currentYear + '年五黄煞位：' + wuhuangDir + '</p>';
    html += '<p>此方位全年最凶！绝对忌动土、装修、放红色物品。化解：挂铜风铃或放五帝钱。</p>';
    html += '</div>';

    html += '<ul class="fs-tips">';
    html += '<li>大门正对厕所门 — 秽气直冲。化解：加屏风或门帘</li>';
    html += '<li>大门正对阳台 — 穿堂风，财气直泄。化解：玄关处放大叶植物</li>';
    html += '<li>镜子正对床头 — 影响睡眠。化解：移走或用布遮盖</li>';
    html += '<li>横梁压顶 — 压迫感。化解：假天花遮盖</li>';
    html += '<li>灶台与水槽正对 — 水火相冲。化解：中间隔绿植</li>';
    html += '<li>' + result.currentYear + '年' + wuhuangDir + '方不可动土装修！</li>';
    html += '</ul></div>';

    return html;
  }

  return { analyze:analyze, render:render, calcMingGua:calcMingGua };
})();
