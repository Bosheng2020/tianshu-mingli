/**
 * 风水堪舆 — 基于八字命局的完整风水布局方案
 */
const FengShui = (() => {

    const WX = {
      '木': { dir:'东',dir2:'东南', color:['绿色','青色','翠绿','草绿'],colorAvoid:['白色','金色'],
        num:'3、8', material:'实木家具、竹制品、藤编、棉麻面料', plant:'发财树、富贵竹、绿萝、龟背竹、万年青',
        shape:'长形、柱形', animal:'兔、虎', organ:'肝胆',
        genBy:'水', keBy:'金', gen:'火', ke:'土' },
      '火': { dir:'南',dir2:'南', color:['红色','紫色','粉红','橙色'],colorAvoid:['黑色','深蓝'],
        num:'2、7', material:'灯饰、蜡烛、皮革、电器设备', plant:'红掌、一品红、朱顶红、三角梅',
        shape:'三角形、尖形', animal:'蛇、马', organ:'心脏、小肠',
        genBy:'木', keBy:'水', gen:'土', ke:'金' },
      '土': { dir:'东北/西南',dir2:'中宫', color:['黄色','棕色','米色','咖啡色'],colorAvoid:['绿色','青色'],
        num:'5、0', material:'陶瓷、石材、砖瓦、水泥、大理石', plant:'多肉、仙人掌、黄金葛、虎皮兰',
        shape:'方形、正方形', animal:'牛、龙、羊、狗', organ:'脾胃',
        genBy:'火', keBy:'木', gen:'金', ke:'水' },
      '金': { dir:'西',dir2:'西北', color:['白色','银色','金色','浅灰'],colorAvoid:['红色','紫色'],
        num:'4、9', material:'金属家具、不锈钢、铜器、银器、水晶', plant:'金边吊兰、银皇后、白掌',
        shape:'圆形、弧形', animal:'猴、鸡', organ:'肺、大肠',
        genBy:'土', keBy:'火', gen:'水', ke:'木' },
      '水': { dir:'北',dir2:'北', color:['黑色','深蓝','藏青','灰色'],colorAvoid:['黄色','棕色'],
        num:'1、6', material:'玻璃制品、水景、镜面、流线型家具', plant:'水仙、铜钱草（水培）、碗莲',
        shape:'波浪形、不规则形', animal:'鼠、猪', organ:'肾、膀胱',
        genBy:'金', keBy:'土', gen:'木', ke:'火' }
    };

    function analyze(baziResult) {
      if (!baziResult) return null;
      // Handle both old and new BaZi format
      if (baziResult.ec && !baziResult.yongShen) {
        var ec = baziResult.ec;
        var dayGan = ec.getDayGan();
        var wxMap = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
        var genMap = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
        var dmWx = wxMap[dayGan] || '木';
        baziResult.yongShen = genMap[dmWx];
        baziResult.jiShen = {'木':'金','火':'水','土':'木','金':'火','水':'土'}[dmWx];
        baziResult.dayMasterWuxing = dmWx;
      }
      var rawYong = baziResult.yongShen;
      var rawJi = baziResult.jiShen;
      var ys = Array.isArray(rawYong) ? rawYong[0] : rawYong;
      var js = Array.isArray(rawJi) ? rawJi[0] : rawJi;
      if (!ys || !WX[ys]) return null;
      var shengMap = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
      var ys2Raw = shengMap[ys] || ys;
      // 辅助五行不能和忌神相同，如果冲突则取用神本身
      var ys2 = (ys2Raw === js) ? ys : ys2Raw;
      return { ys: ys, ys2: ys2, js: js, dmWx: baziResult.dayMasterWuxing || ys };
    }

    function render(result) {
      if (!result) return '<div class="interp-card"><p>风水数据不完整，请先完成八字排盘。</p></div>';
      var ys = result.ys, ys2 = result.ys2, js = result.js;
      var Y = WX[ys], Y2 = WX[ys2]||Y, J = WX[js]||{};
      var html = '';

      // ===== 总览 =====
      html += '<div class="interp-card"><h2>风水堪舆</h2>';
      html += '<p>以下风水布局方案基于八字用神 <strong style="color:var(--vermillion)">' + ys + '</strong> 制定。';
      html += '用神五行为核心催旺方向，辅以 <strong>' + ys2 + '</strong>（生' + ys + '之五行）增强效果。';
      html += '忌神 <strong>' + js + '</strong> 代表不利五行，在布局中应尽量回避。</p></div>';

      // ===== 1. 住宅选址 =====
      html += '<div class="interp-card"><h3>住宅选址与朝向</h3>';
      html += '<h4>最佳区位</h4>';
      html += '<p>以出生地或现居地为中心，<strong>向' + Y.dir + '方或' + Y.dir2 + '方</strong>选择住宅最为有利。' + ys + '气在此方位最旺，长期居住可潜移默化地补充命局所需五行。</p>';
      html += '<p>辅助方位：<strong>' + (Y2.dir||'') + '方</strong>（' + ys2 + '生' + ys + '，间接助力）。</p>';
      html += '<p style="color:var(--vermillion)">不宜方位：' + (J.dir||'') + '方（忌神' + js + '方位），长期居住不利运势。</p>';

      html += '<h4>大门朝向</h4>';
      html += '<p>大门宜朝<strong>' + Y.dir + '方</strong>开，纳入' + ys + '气。若受建筑限制无法更改，可在入户玄关处摆放五行属' + ys + '的物品化解。</p>';
      html += '<p>大门口忌放属' + js + '的装饰物（' + (J.material||'').split('、').slice(0,2).join('、') + '等）。</p>';

      html += '<h4>楼层选择</h4>';
      html += '<p>最佳楼层尾数：<strong>' + Y.num + '</strong>（五行属' + ys + '）。辅助楼层尾数：' + (Y2.num||'') + '（属' + ys2 + '）。</p>';
      html += '<p>不宜楼层尾数：' + (J.num||'') + '（属' + js + '）。</p>';
      html += '</div>';

      // ===== 2. 客厅布局 =====
      html += '<div class="interp-card"><h3>客厅布局</h3>';
      html += '<p>客厅是住宅的核心气场，直接影响全家运势。</p>';
      html += '<h4>主色调</h4>';
      html += '<p>墙面和大面积软装宜用<strong>' + Y.color.slice(0,2).join('、') + '</strong>系为主色调，搭配' + Y2.color.slice(0,2).join('、') + '作为辅助色。</p>';
      html += '<p>避免大面积使用' + Y.colorAvoid.join('、') + '（' + js + '色系，克制用神）。</p>';

      html += '<h4>家具材质</h4>';
      html += '<p>优先选择：' + Y.material + '</p>';
      html += '<p>沙发形状以<strong>' + Y.shape + '</strong>为佳（' + ys + '的代表形状）。</p>';

      html += '<h4>摆件与装饰</h4>';
      html += '<p>客厅' + Y.dir + '方位摆放催旺物品效果最佳。推荐：</p>';
      html += '<ul class="fs-tips">';
      html += '<li>' + Y.plant.split('、').slice(0,2).join('或') + '摆在客厅' + Y.dir + '侧</li>';
      html += '<li>' + Y.material.split('、').slice(0,2).join('或') + '工艺品作为主装饰</li>';
      html += '<li>电视背景墙用' + Y.color[0] + '或' + Y.color[1] + '调</li>';
      if (ys === '水') html += '<li>客厅北方放置小型流水摆件或鱼缸（养' + Y.num.charAt(0) + '条或' + Y.num.charAt(2) + '条鱼）</li>';
      if (ys === '火') html += '<li>客厅保持明亮光线，多开灯，忌阴暗</li>';
      if (ys === '木') html += '<li>大叶绿植是最好的催旺物，圆叶为佳，忌带刺</li>';
      if (ys === '金') html += '<li>摆放铜制或银制工艺品，风铃挂在西方窗户</li>';
      if (ys === '土') html += '<li>摆放陶瓷花瓶或石雕摆件，黄水晶球旺财</li>';
      html += '</ul></div>';

      // ===== 3. 卧室风水 =====
      html += '<div class="interp-card"><h3>卧室与床位</h3>';
      var bedData = {
        '木': {head:'东',reason:'东方属木，晨光初照，生机勃勃。床头朝东有助于肝气舒畅、精力充沛。',avoid:'西（金克木）',bedColor:'绿色、浅绿色床品',extra:'卧室东侧窗边放一盆绿植，但晚上不宜放太多植物在卧室。'},
        '火': {head:'南',reason:'南方属火，阳光充沛。床头朝南有助于心气旺盛、精神饱满。',avoid:'北（水克火）',bedColor:'粉红、紫色或暖色系床品',extra:'卧室保持明亮温暖，可用暖色台灯。忌在床头放置水族箱。'},
        '土': {head:'东北或西南',reason:'东北为艮土、西南为坤土，两个方位土气最旺。',avoid:'东（木克土）',bedColor:'黄色、米色、大地色系床品',extra:'床头柜上放一对黄色水晶或陶瓷摆件，增强稳定能量。'},
        '金': {head:'西或西北',reason:'西方和西北方属金，秋肃之气凝聚。床头朝西有助于肺气通畅、睡眠安稳。',avoid:'南（火克金）',bedColor:'白色、银灰色床品',extra:'床头柜放置金属相框或水晶球。窗帘选白色或浅灰色。'},
        '水': {head:'北',reason:'北方属水，阴柔安静。床头朝北有助于肾气充盈、安心入眠。',avoid:'东北/西南（土克水）',bedColor:'深蓝、藏青色或黑灰色床品',extra:'卧室可放小型加湿器或蓝色装饰。但不宜在卧室放大型鱼缸（水气过重影响睡眠）。'}
      };
      var bd = bedData[ys] || {};
      html += '<h4>床头朝向</h4>';
      html += '<p><strong>床头宜朝' + (bd.head||'') + '方</strong>。' + (bd.reason||'') + '</p>';
      html += '<p style="color:var(--vermillion)"><strong>忌朝</strong>' + (bd.avoid||'') + '方。</p>';
      html += '<h4>床品颜色</h4>';
      html += '<p>' + (bd.bedColor||'') + '。换季时可用' + (Y2.color||[''])[0] + '系过渡。</p>';
      html += '<h4>卧室布置要诀</h4>';
      html += '<ul class="fs-tips">';
      html += '<li>' + (bd.extra||'') + '</li>';
      html += '<li>床头不宜对门、对窗、对镜（气场冲散影响睡眠）</li>';
      html += '<li>床下保持整洁通风，不堆放杂物（阻碍气场流通）</li>';
      html += '<li>床头柜成对摆放，高度与床面齐平（阴阳平衡）</li>';
      html += '<li>卧室不宜放过多电器（电磁场干扰休息）</li>';
      html += '</ul></div>';

      // ===== 4. 书房/办公室 =====
      html += '<div class="interp-card"><h3>书房与办公</h3>';
      html += '<h4>办公桌朝向</h4>';
      html += '<p><strong>面朝' + Y.dir + '方</strong>，背靠实墙（有靠山）。椅子后方忌空旷或有窗（无靠）。</p>';
      html += '<h4>书房位置</h4>';
      html += '<p>书房宜设在住宅的<strong>' + Y.dir + '侧</strong>。若条件不允许，在书房的' + Y.dir + '方位放置催旺物品也有效。</p>';
      html += '<h4>提升文昌运</h4>';
      html += '<ul class="fs-tips">';
      html += '<li>桌面放置四支毛笔或文昌塔催旺文昌运（适合学生和考试）</li>';
      html += '<li>书架放在左手边（青龙位），右手边（白虎位）不宜堆放杂物</li>';
      html += '<li>桌面摆件以' + Y.material.split('、').slice(0,1).join('') + '材质为佳</li>';
      html += '<li>办公区域保持整洁有序，文件分类收纳</li>';
      html += '</ul></div>';

      // ===== 5. 厨房与餐厅 =====
      html += '<div class="interp-card"><h3>厨房与餐厅</h3>';
      html += '<p>厨房属火，是住宅中火气最旺的区域。</p>';
      if (ys === '火') {
        html += '<p>用神属火，厨房是天然的催旺区域。保持厨房整洁明亮即可。灶台朝' + Y.dir + '方更佳。</p>';
      } else if (js === '火') {
        html += '<p>忌神属火，厨房的火气需要适度化解。灶台旁放一小碟粗盐或摆放属' + ys + '的小物件可平衡。</p>';
      } else {
        html += '<p>在厨房的' + Y.dir + '方位放置属' + ys + '的小物件（如' + Y.material.split('、').slice(0,1).join('') + '容器），将日常烹饪的火气转化为有利能量。</p>';
      }
      html += '<p>餐厅挂画宜选果蔬丰收题材，忌挂猛兽刀剑。餐桌以' + Y.shape + '为佳。</p>';
      html += '</div>';

      // ===== 6. 通用禁忌 =====
      html += '<div class="interp-card"><h3>风水通用禁忌</h3>';
      html += '<ul class="fs-tips">';
      html += '<li>大门正对厕所门 — 秽气直冲，影响全家运势。化解：加设屏风或门帘</li>';
      html += '<li>大门正对阳台/后门 — 穿堂风，财气直泄。化解：玄关处设玄关柜或放置大叶植物</li>';
      html += '<li>镜子正对床头 — 镜面反射影响睡眠和精神。化解：移走或用布遮盖</li>';
      html += '<li>房屋中心是厕所 — 秽气占据中宫，影响全家健康。化解：保持通风，常开排气扇</li>';
      html += '<li>灶台与水槽正对 — 水火相冲，夫妻易争吵。化解：中间隔一块砧板或绿植</li>';
      html += '<li>横梁压顶（床、沙发、书桌上方有横梁）— 造成压迫感。化解：用假天花遮盖或挂化煞物</li>';
      html += '<li>大面积使用' + (Y.colorAvoid||['暗色']).join('和') + ' — 克制用神' + ys + '，不利运势</li>';
      html += '<li>住宅周围有尖角冲射（路冲、屋角对冲）— 化解：在窗台放置铜镜或八卦镜</li>';
      html += '</ul></div>';

      // ===== 7. 催财布局 =====
      html += '<div class="interp-card"><h3>催财布局</h3>';
      html += '<p>财位一般在客厅大门对角线的角落处。此位置保持明亮整洁，不可堆放杂物或设置厕所。</p>';
      html += '<h4>财位催旺方案</h4>';
      html += '<ul class="fs-tips">';
      if (ys === '木') html += '<li>财位放一盆发财树或金钱树（活植物催财最佳）</li>';
      else if (ys === '火') html += '<li>财位保持灯光明亮，放一盏长明灯或红色装饰</li>';
      else if (ys === '土') html += '<li>财位放置黄水晶簇或聚宝盆（陶瓷材质）</li>';
      else if (ys === '金') html += '<li>财位放置金属貔貅或铜制聚宝盆</li>';
      else if (ys === '水') html += '<li>财位放置流水摆件或养鱼缸（鱼数' + Y.num.charAt(0) + '或' + Y.num.charAt(2) + '条）</li>';
      html += '<li>财位上方不宜有横梁压顶</li>';
      html += '<li>财位忌空、忌暗、忌脏、忌被尖角冲射</li>';
      html += '<li>钱包颜色宜用' + Y.color[0] + '或' + Y.color[1] + '，忌用' + (Y.colorAvoid||[''])[0] + '</li>';
      html += '</ul></div>';

      // ===== 8. 人际与桃花 =====
      html += '<div class="interp-card"><h3>人际与桃花</h3>';
      html += '<h4>催旺人缘</h4>';
      html += '<p>客厅西南方（坤位）摆放圆形饰品或双数摆件可增进人际和谐。鲜花（粉色或黄色）放在客厅也有助人缘。</p>';
      html += '<h4>催旺桃花</h4>';
      html += '<p>卧室桃花位（一般在卧室门对角线处）放置鲜花（粉红或桃红色）、粉水晶球或成对饰品。单身者卧室忌放单个人像或尖锐物品。</p>';
      html += '</div>';

      return html;
    }

    return { analyze: analyze, render: render };
})();
