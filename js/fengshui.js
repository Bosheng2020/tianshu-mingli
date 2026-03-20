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
    var birthYear = (baziResult.lunar && baziResult.lunar.year) || 1990;
    var gender = baziResult.gender || 'male';
    var guaNum = calcMingGua(birthYear, gender);
    var guaName = GUA_NAMES[guaNum] || '坤';
    var guaGroup = GUA_GROUP[guaNum] || '西四命';
    var guaDirs = BA_ZHAI[guaNum] || {};

    // 流年飞星
    var currentYear = new Date().getFullYear();
    var flyGrid = getYearFlyStars(currentYear);

    return { ys:ys, ys2:ys2, js:js, guaNum:guaNum, guaName:guaName, guaGroup:guaGroup, guaDirs:guaDirs, flyGrid:flyGrid, currentYear:currentYear, birthYear:birthYear, gender:gender };
  }

  // ===== render =====
  function render(result) {
    if (!result) return '<div class="interp-card"><p>风水数据不完整</p></div>';
    var ys = result.ys, js = result.js, Y = WX_DATA[ys] || WX_DATA['木'];
    var html = '';

    // 导航
    html += '<div class="interp-card" style="padding:12px 16px;text-align:center">';
    html += '<h2>风水堪舆</h2>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px">';
    [{id:'fs-bazhai',l:'八宅命卦'},{id:'fs-fly',l:'流年飞星'},{id:'fs-house',l:'居家布局'},{id:'fs-bed',l:'卧室床位'},{id:'fs-wealth',l:'催财布局'},{id:'fs-taboo',l:'风水禁忌'}].forEach(function(n) {
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
    html += '<p style="font-size:.84rem;color:var(--ink-light)">流年飞星每年变化方位，揭示当年各方位的吉凶能量。据此调整家居布局可趋吉避凶。</p>';

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
