/**
 * 观音灵签 + 掷筊 — Guanyin Oracle & Moon Blocks
 */
const LingQian = (() => {
  // 观音灵签100签 (精选签文 + 解读)
  const QIAN = [
    {n:1,level:'上上',poem:'开天辟地作良缘，吉日良时万物全。若得此签非小可，人行忠正帝王宣。',meaning:'此签大吉，万事如意。新开始的事业、感情、投资均有极好的发展。天时地利人和，把握机会可成大事。',career:'事业大展宏图，有贵人相助。',love:'姻缘天定，佳偶可期。',wealth:'财运亨通，求财有成。'},
    {n:2,level:'上上',poem:'看经念佛苦求缘，正当将来访神仙。若是悉心合大道，功成行满跨龙天。',meaning:'诚心向善，心诚则灵。此签示意坚持信念，勤勉修行终有善果。目前虽有困难，但只要坚持正道，前途光明。',career:'事业需要耐心积累，厚积薄发。',love:'诚心待人，缘分自来。',wealth:'财运渐好，不急不躁。'},
    {n:3,level:'上中',poem:'临风冒雨去还乡，正是其身似燕儿。一旦得归君在位，前呼后拥走忙忙。',meaning:'远行归来之象。在外奔波之人将有好消息传来，事情朝好的方向发展。注意把握时机，不要错过。',career:'事业有转机，可能外出发展。',love:'远方有佳人，或异地恋有结果。',wealth:'财运从远方来，贸易有利。'},
    {n:4,level:'上中',poem:'千年古镜复重圆，女再求夫男再婚。自此门庭重改换，更添福禄在儿孙。',meaning:'破镜重圆之象。之前失去的东西有机会失而复得。感情方面有复合机会，事业也有东山再起之势。',career:'旧项目重启有利，老客户回归。',love:'旧情复燃，或感情修复。',wealth:'财运回转，先苦后甜。'},
    {n:5,level:'上中',poem:'一锥笠上天付寄，二处同心结义来。志气相投成大事，终身快乐且安怀。',meaning:'合作共赢之象。与人合伙做事有利，志同道合者可成大业。贵在真诚，不可心怀叵测。',career:'合作创业有利，团队力量大。',love:'两情相悦，感情和睦。',wealth:'合伙求财有利。'},
    {n:6,level:'上中',poem:'庭前生瑞草，好事不如无。人得意中财，犹恐春风度。',meaning:'知足常乐之象。目前运势不错但需低调，不可过于张扬招人嫉妒。守住现有成果比盲目扩张更重要。',career:'稳中求进，不宜冒进。',love:'珍惜眼前人。',wealth:'有财但需守好。'},
    {n:7,level:'中上',poem:'奔忙须知自有名，一生心事两头明。一旦云开看太阳，即时便是出头人。',meaning:'守得云开见月明。目前虽然辛苦奔波，但坚持下去终会拨云见日。黑暗只是暂时的，光明就在前方。',career:'坚持就是胜利，曙光将至。',love:'等待有结果，耐心。',wealth:'先难后易，财运将至。'},
    {n:8,level:'中上',poem:'莫听旁人说是非，心中自有主张知。只管向前行好事，朝阳红日正当时。',meaning:'坚持主见之象。不要被外界干扰动摇决心，跟随自己内心的判断行事。正义终将战胜邪恶。',career:'按自己的计划走，不受干扰。',love:'不要听信谣言，相信对方。',wealth:'正财运好，走正道。'},
    {n:9,level:'中',poem:'烦恼脱时烦恼多，欲求安静不安和。若逢遇贵相扶助，指日可成福禄多。',meaning:'贵人相助之象。目前烦恼较多但不必过忧，会有贵人出现帮你渡过难关。主动求助比独自硬撑更好。',career:'寻求帮助，不要单打独斗。',love:'有人从中撮合，珍惜。',wealth:'贵人带财，注意人脉。'},
    {n:10,level:'中',poem:'石中隐玉有谁知，须要磨砻出自然。一旦运通人快乐，那时万事不相关。',meaning:'璞玉待磨之象。你的才华尚未被发现，需要经过磨练才能显现价值。不要急躁，时机成熟自然会发光。',career:'积累实力，等待时机。',love:'缘分未到，不急。',wealth:'财运平平，需要积累。'},
    {n:11,level:'中',poem:'月满天心正照时，两人相拜喜盈盈。一团和气从天降，吉运自然遇贵人。',meaning:'喜庆之象。有好事临门，可能是升职加薪、结婚生子、乔迁等喜事。保持心态开放，接受生活的馈赠。',career:'有升迁机会。',love:'喜事将至。',wealth:'有意外之财。'},
    {n:12,level:'中下',poem:'将军何必费心机，闭门修行好自知。若问前程终有日，不须着急且歇时。',meaning:'休养生息之象。目前不宜大动干戈，应该静下心来休息调整。等待时机成熟再出手，欲速则不达。',career:'暂缓行动，等待时机。',love:'不宜追求，顺其自然。',wealth:'不宜投资，守住本金。'},
    {n:13,level:'中下',poem:'自小生来福自然，却被名利乱心田。若能安分随缘过，自有天公降福缘。',meaning:'知足安分之象。不要被欲望驱使做出冲动的决定。回归本心，安守本分，福气自来。过度追逐反而失去更多。',career:'不宜跳槽，安于现状。',love:'不要贪心，珍惜当下。',wealth:'不贪则稳。'},
    {n:14,level:'下',poem:'路途未至半中间，风雨交加正阻拦。须是自家行好事，且看云散月团圆。',meaning:'阻碍重重之象。目前进展不顺，困难较多。但只要坚持做正确的事，困境终将过去。坚持善行是突破之道。',career:'遇到瓶颈，需要突破。',love:'感情有波折，需沟通。',wealth:'财运不佳，减少开支。'},
    {n:15,level:'下',poem:'出入营谋费事多，一生心事半蹉跎。苍天不负勤劳者，只要心诚运自和。',meaning:'辛劳之象。做事费力但效果不佳，有些事倍功半。但不要放弃，天道酬勤，坚持终有回报。调整方向比蛮干更重要。',career:'方法比努力更重要。',love:'感情需要经营。',wealth:'求财辛苦但有收获。'},
    {n:16,level:'上',poem:'一片归心似箭驰，层层锦绣满前程。凡间事体皆如意，好把功名报国知。',meaning:'前程似锦之象。此签甚吉，事业蒸蒸日上，一帆风顺。适合全力以赴、大展拳脚。机会就在眼前，抓住即是。',career:'升迁有望，前途光明。',love:'感情顺利，甜蜜。',wealth:'财运旺盛。'},
    {n:17,level:'中上',poem:'莫怨天来莫怨人，自家前世种来因。戒慎恐惧行善事，自有佳音报耳闻。',meaning:'因果循环之象。当前的处境与过去的选择有关。改变从现在开始，多行善事多积福德，好运自然会来。',career:'修正方向，重新出发。',love:'反思自身，改善关系。',wealth:'广结善缘，财运自来。'},
    {n:18,level:'中',poem:'秋来冬去到春天，万物复苏在眼前。三生有幸逢知己，一世姻缘定有缘。',meaning:'否极泰来之象。困难的时期即将过去，春暖花开的好运将至。贵人缘佳，有可能遇到志同道合的伙伴。',career:'困境将过，曙光在前。',love:'有缘人将出现。',wealth:'财运回暖。'},
    {n:19,level:'下中',poem:'急水滩头放船去，江心浪涌月不明。若遇险难休退避，等闲不过是虚惊。',meaning:'虚惊一场之象。虽然看似危险，但实际上没有想象中那么严重。保持冷静，不要被表象吓到。镇定应对即可化解。',career:'看似危机实有转机。',love:'虚惊一场，不必担心。',wealth:'短暂困难，不伤根本。'},
    {n:20,level:'上',poem:'当春久雨喜开晴，玉兔金鸡渐渐明。旧事已去新事到，一家和乐庆团圆。',meaning:'雨过天晴之象。之前的阴霾已经散去，新的希望正在到来。家庭和睦，事业顺利，是享受美好生活的时候。',career:'事业向好，新机会出现。',love:'感情和睦，家庭幸福。',wealth:'财运转好。'}
  ];

  // 第21-50签 独立签文
  var MORE = [
    {n:21,level:'上',poem:'天开地辟结良缘，日出东方照九天。纵有浮云遮蔽日，清风散尽月团圆。',meaning:'乌云散去，前途光明。之前的阻碍正在消失，坚持到底就能看到胜利的曙光。',career:'事业转好，障碍消除。',love:'感情拨云见日。',wealth:'财运回升。'},
    {n:22,level:'中',poem:'春来花发映阳台，万里风光一望开。若问前途何处去，管教百事不须猜。',meaning:'顺其自然之象。春天来了花自然会开，不需要过度担忧。保持平常心，一切自有安排。',career:'顺势而为即可。',love:'缘分自然来。',wealth:'财运自然。'},
    {n:23,level:'中下',poem:'忽遇惊涛骇浪时，须知身在险峰危。若非贵人来相助，可叹浮舟没处依。',meaning:'风浪险阻之象。目前处境困难，需要寻求帮助。独自面对不如借助外力，贵人是关键。',career:'遇到困难要求助。',love:'感情需要第三方调解。',wealth:'财运不佳，守为上。'},
    {n:24,level:'上中',poem:'一轮明月照九州，逢凶化吉有贵谋。待到风平浪静后，好把前程细打收。',meaning:'逢凶化吉之象。虽有困难但终能化解。耐心等待风浪过去，前程自然明朗。',career:'先稳后升。',love:'波折后和好。',wealth:'先紧后松。'},
    {n:25,level:'下',poem:'天边消息望难通，若问前程路未工。意马心猿都未定，自家心乱几时终。',meaning:'心乱如麻之象。目前内心纷乱，难以做出正确决定。建议先静心，理清思路再行动。',career:'不宜做重大决定。',love:'感情犹豫不决。',wealth:'不宜投资。'},
    {n:26,level:'上',poem:'金鳞已化龙门去，富贵荣华在此时。一举成名天下知，须凭正道步云梯。',meaning:'鲤鱼跳龙门之象。时机成熟，大有可为。适合考试、面试、竞标等关键时刻。凭实力一飞冲天。',career:'升迁考试大利。',love:'表白求婚有利。',wealth:'大财运到。'},
    {n:27,level:'中',poem:'一朵祥云现太空，天边消息喜相逢。守得花开结果实，凡事合理自亨通。',meaning:'等待开花结果之象。之前的努力即将有回报，但还需要一点耐心。不要急于求成。',career:'成果即将显现。',love:'感情水到渠成。',wealth:'投资待收获。'},
    {n:28,level:'中下',poem:'青山绿水好风光，前路茫茫不可量。且进且退须仔细，暗中有箭防灾殃。',meaning:'暗箭难防之象。表面平静实则暗藏危机。做事需格外小心，防人之心不可无。',career:'防小人暗中使绊。',love:'防第三者。',wealth:'防诈骗破财。'},
    {n:29,level:'上中',poem:'宝剑出鞘光芒射，英雄此日显锋芒。不须退缩向前进，自有贵人在远方。',meaning:'亮剑出击之象。现在是展示实力的好时机，不要退缩。远方有贵人助力。',career:'勇敢展示自己。',love:'主动出击有利。',wealth:'远方求财有利。'},
    {n:30,level:'中',poem:'劝君凡事莫强求，随缘不变乐悠悠。百年修得同船渡，莫怨今生少自由。',meaning:'随缘自在之象。不要过度执着，学会接受和放下。在随缘中反而能找到真正的幸福。',career:'不强求，等时机。',love:'随缘最好。',wealth:'不贪则安。'},
    {n:31,level:'上上',poem:'春雷一声万物苏，枯木逢春又发芽。莫道前途无光景，凤凰涅槃展翅飞。',meaning:'大吉！枯木逢春之象。困境即将彻底翻转，新生即将开始。凤凰涅槃，浴火重生。',career:'事业大翻身。',love:'感情新开始。',wealth:'财运大逆转。'},
    {n:32,level:'下',poem:'浮云遮日不分明，劝君且退守安宁。待等风消云散后，自然月朗见天心。',meaning:'不明朗之象。目前局势不清，不宜轻举妄动。退一步海阔天空，等待时机明朗。',career:'暂时退守。',love:'冷静观察。',wealth:'不宜大动。'},
    {n:33,level:'中上',poem:'半升半降运未齐，沉浮不定莫心急。若是持身行正道，凡事终须有转机。',meaning:'起伏不定之象。运势时好时坏，需保持正道不动摇。坚持做对的事，转机自会到来。',career:'有起有落，坚持即好。',love:'感情反复但终会稳定。',wealth:'财运波动，守正。'},
    {n:34,level:'上',poem:'玉兔东升照碧空，行人遥望喜相逢。一番好事从天降，不觉春风满面红。',meaning:'好事临门之象。意外的好消息即将到来，可能是升职、加薪、遇到好的合作机会。',career:'好消息将至。',love:'桃花降临。',wealth:'意外之财。'},
    {n:35,level:'中',poem:'衣食自然生处有，何须奔走苦劳求。安分守己行善事，福禄自来不用愁。',meaning:'安分守己之象。不需要过度奔波，安心做好本分事情。福气会自然来到。',career:'守好本职。',love:'安心经营。',wealth:'不必强求。'},
    {n:36,level:'下中',poem:'过河须用木为桥，出门宜择好时朝。风波不信人间有，一旦凭空事转遥。',meaning:'需要工具和时机之象。做事要准备充分，选择合适的时机才行动。不要盲目冒进。',career:'准备好再行动。',love:'时机未到。',wealth:'谋定后动。'},
    {n:37,level:'上中',poem:'一片冰心在玉壶，忠心义胆照前途。有朝一日风云变，平步青云上天衢。',meaning:'忠心待人之象。保持真诚和忠义，终有出头之日。风云变化之时就是你崛起之时。',career:'忠诚终有回报。',love:'真心换真情。',wealth:'正财渐旺。'},
    {n:38,level:'中',poem:'月挂枝头夜未央，行人遥指路茫茫。前途虽有千般好，只恐中途遇虎狼。',meaning:'路途有险之象。前途虽好但路上有陷阱。保持警惕，防范风险，不要因为顺利而大意。',career:'顺利中防意外。',love:'好中防变。',wealth:'赚钱也防亏。'},
    {n:39,level:'上',poem:'福星高照喜盈门，吉庆年年万事新。从此一帆风顺去，不须回首问前尘。',meaning:'福星高照！一切顺利，吉祥如意。不需要再纠结过去，大胆向前走。',career:'顺风顺水。',love:'甜蜜幸福。',wealth:'财源广进。'},
    {n:40,level:'中下',poem:'秋风落叶满天飞，一年光景渐凋微。若问前程终有日，只恐中途惹是非。',meaning:'衰减之象。运势有下降趋势，需要低调行事。避免惹是非，等待否极泰来。',career:'低调行事。',love:'减少争吵。',wealth:'节省开支。'},
    {n:41,level:'上上',poem:'紫气东来满堂春，一轮红日正当中。贵人指引前途路，从此功名达九重。',meaning:'大吉！紫气东来之象。贵人运极旺，事业有重大突破。抓住机会可以一步登天。',career:'贵人助力大成。',love:'遇到真命天子/天女。',wealth:'大发。'},
    {n:42,level:'中',poem:'两手空空无一物，须知守旧待时来。功名利禄皆前定，何必终朝苦自猜。',meaning:'顺天知命之象。不要过度焦虑，一切自有定数。做好当下，不必过度忧虑未来。',career:'顺其自然。',love:'不强求。',wealth:'随缘。'},
    {n:43,level:'下',poem:'当春久旱苗将枯，忽然一阵及时雨。虽然眼下多忧虑，过后方知是福居。',meaning:'久旱逢甘霖之象。目前虽然困难，但救援即将到来。不要绝望，坚持就是胜利。',career:'困境中有转机。',love:'柳暗花明。',wealth:'困难是暂时的。'},
    {n:44,level:'中上',poem:'安居乐业享太平，一门瑞气乐融融。若问前程何处好，春风送暖在家中。',meaning:'家和万事兴之象。幸福在身边，不需要远求。家庭和睦是一切好运的基础。',career:'稳定发展。',love:'家庭和睦。',wealth:'家中生财。'},
    {n:45,level:'中',poem:'百尺竿头须进步，回头是岸莫迟疑。一心向善行方便，自有天公降福祉。',meaning:'精进修行之象。已经取得不错的成绩，但不能骄傲停步。继续努力，好运会持续。',career:'不骄不躁继续进步。',love:'感情需要持续经营。',wealth:'稳步增长。'},
    {n:46,level:'下中',poem:'瓦上霜花风中烛，眼前富贵如浮云。劝君莫把功名误，回头看看来时路。',meaning:'虚幻之象。眼前的好处可能不真实，不要被表象迷惑。回归本心，脚踏实地。',career:'防虚假机会。',love:'看清真实面目。',wealth:'防虚假投资。'},
    {n:47,level:'上',poem:'锦绣前程在眼前，风和日丽好晴天。一心正道行善事，福寿绵长享万年。',meaning:'前程锦绣之象。一切向好，只要坚持正道就能长久享受好运。',career:'前途光明。',love:'感情美好。',wealth:'财运长久。'},
    {n:48,level:'中',poem:'渐入佳境莫停留，一步一印到高楼。回首来时风雨路，方知今日乐无忧。',meaning:'渐入佳境之象。正在变好的路上，不要停下脚步。回顾过去的辛苦，更要珍惜现在。',career:'越来越好。',love:'感情渐入佳境。',wealth:'稳步上升。'},
    {n:49,level:'下',poem:'乌云密布雨将来，一阵狂风天地哀。劝君暂避风雨处，待到天晴再出来。',meaning:'风雨将至之象。近期运势不佳，宜暂避锋芒，韬光养晦。不要在风头上做冒险的事。',career:'暂时退避。',love:'冷处理。',wealth:'守好钱包。'},
    {n:50,level:'上上',poem:'龙虎相逢在此时，风云际会展鸿志。从今一跃龙门去，万里前程皆可期。',meaning:'龙虎际会大吉之象！难得的好时机，事业感情都有重大突破。放手去做，万事可期。',career:'事业巅峰。',love:'遇到命中人。',wealth:'大富大贵。'},
  ];
  MORE.forEach(function(s){ QIAN.push(s); });

  function drawQian() {
    var idx = Math.floor(Math.random() * QIAN.length);
    return QIAN[idx];
  }

  function renderQian(qian) {
    var levelColor = qian.level.indexOf('上') >= 0 ? 'var(--jade,#2d8f6f)' : qian.level.indexOf('下') >= 0 ? 'var(--vermillion,#c53d43)' : 'var(--gold,#c5922e)';
    var html = '<div class="interp-card" style="text-align:center">';
    html += '<div style="font-size:3rem;margin-bottom:8px">🙏</div>';
    html += '<h2>第 ' + qian.n + ' 签</h2>';
    html += '<div style="display:inline-block;padding:4px 16px;border-radius:20px;background:' + levelColor + ';color:#fff;font-weight:700;font-size:1.1rem;margin:8px 0">' + qian.level + '</div>';
    html += '</div>';

    html += '<div class="interp-card">';
    html += '<h3>签诗</h3>';
    html += '<p style="font-family:var(--font-h);font-size:1.15rem;line-height:2.2;text-align:center;color:var(--ink);letter-spacing:.08em">' + qian.poem + '</p>';
    html += '</div>';

    html += '<div class="interp-card">';
    html += '<h3>签解</h3>';
    html += '<p>' + qian.meaning + '</p>';
    html += '<h4>事业</h4><p>' + qian.career + '</p>';
    html += '<h4>感情</h4><p>' + qian.love + '</p>';
    html += '<h4>财运</h4><p>' + qian.wealth + '</p>';
    html += '</div>';

    return html;
  }

  // ===== 掷筊 Moon Blocks =====
  function throwJiao() {
    // 0 = 阴面(flat), 1 = 阳面(round)
    var b1 = Math.random() < 0.5 ? 0 : 1;
    var b2 = Math.random() < 0.5 ? 0 : 1;
    if (b1 === 1 && b2 === 0) return 'sheng'; // 圣筊
    if (b1 === 0 && b2 === 1) return 'sheng';
    if (b1 === 1 && b2 === 1) return 'xiao'; // 笑筊
    return 'yin'; // 阴筊
  }

  var JIAO_RESULT = {
    'sheng': { name: '圣筊', symbol: '🌙☀️', color: 'var(--jade,#2d8f6f)', desc: '一阴一阳，神明应允。你所求之事得到肯定的答复，可以放心去做。' },
    'xiao': { name: '笑筊', symbol: '☀️☀️', color: 'var(--gold,#c5922e)', desc: '两面朝上（两阳），意为神明在笑。你的问题可能不够明确，或者答案还未定。请重新整理思绪再问。' },
    'yin': { name: '阴筊', symbol: '🌙🌙', color: 'var(--vermillion,#c53d43)', desc: '两面朝下（两阴），神明不允。此事不宜进行，或时机未到。建议暂缓行动，重新考虑方向。' }
  };

  function renderJiao(results, question) {
    var html = '<div class="interp-card" style="text-align:center">';
    if (question) html += '<p style="font-style:italic;color:var(--ink-light);margin-bottom:12px">所问：' + question + '</p>';

    html += '<div class="jiao-results">';
    results.forEach(function(r, i) {
      var j = JIAO_RESULT[r];
      html += '<div class="jiao-throw">';
      html += '<div class="jiao-num">第 ' + (i+1) + ' 筊</div>';
      html += '<div class="jiao-symbol" style="font-size:2.5rem">' + j.symbol + '</div>';
      html += '<div class="jiao-name" style="color:' + j.color + ';font-weight:700;font-size:1.1rem">' + j.name + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Count results
    var shengCount = results.filter(function(r){return r==='sheng'}).length;
    var xiaoCount = results.filter(function(r){return r==='xiao'}).length;
    var yinCount = results.filter(function(r){return r==='yin'}).length;

    html += '<div style="margin-top:20px;padding:16px;border-radius:8px;background:rgba(0,0,0,.02)">';
    if (shengCount === 3) {
      html += '<p style="font-size:1.2rem;font-weight:700;color:var(--jade)">三圣筊！神明大力应允！</p>';
      html += '<p>此事大吉，神明完全赞同你的请求。放手去做，必有善果。</p>';
    } else if (shengCount >= 2) {
      html += '<p style="font-size:1.2rem;font-weight:700;color:var(--jade)">二圣一' + (xiaoCount ? '笑' : '阴') + '，基本应允</p>';
      html += '<p>神明基本认可你的请求，但有小部分保留。行事时注意细节，稍加谨慎即可。</p>';
    } else if (shengCount === 1) {
      html += '<p style="font-size:1.2rem;font-weight:700;color:var(--gold)">一圣' + (xiaoCount >= 2 ? '二笑' : xiaoCount === 1 ? '一笑一阴' : '二阴') + '，态度模糊</p>';
      html += '<p>神明的态度不够明确。建议重新整理问题，换个角度再问一次。或者此事需要更多时间来验证。</p>';
    } else if (xiaoCount >= 2) {
      html += '<p style="font-size:1.2rem;font-weight:700;color:var(--gold)">多笑筊，神明含笑</p>';
      html += '<p>神明似乎觉得你的问题有趣或不够恰当。请认真思考后重新提问。</p>';
    } else {
      html += '<p style="font-size:1.2rem;font-weight:700;color:var(--vermillion)">多阴筊，神明不允</p>';
      html += '<p>此事目前不宜进行。建议放下执念，另寻他路，或等待更好的时机。</p>';
    }
    html += '</div></div>';

    return html;
  }

  return { drawQian: drawQian, renderQian: renderQian, throwJiao: throwJiao, renderJiao: renderJiao, JIAO_RESULT: JIAO_RESULT };
})();
