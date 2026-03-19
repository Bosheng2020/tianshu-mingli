/**
 * 紫微斗数 (Zi Wei Dou Shu / Purple Star Astrology) Engine
 * Complete calculation and rendering module for Chinese Purple Star Astrology.
 *
 * Depends on global `Lunar` object providing:
 *   Lunar.TIAN_GAN, Lunar.DI_ZHI, Lunar.yearGanZhi(), Lunar.getNaYin(), Lunar.elementClass()
 */
const ZiWei = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Data Constants
  // ---------------------------------------------------------------------------

  const PALACE_NAMES = [
    '命宫','兄弟','夫妻','子女','财帛','疾厄',
    '迁移','交友','官禄','田宅','福德','父母'
  ];

  // Maps palace position index (0-11) to Earthly Branch index (子=0 … 亥=11).
  // Position 0 = 寅(2), position 1 = 卯(3), … position 11 = 丑(1).
  const PALACE_ZHI_ORDER = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];

  // ---------------------------------------------------------------------------
  // Branch to Position conversion
  // ---------------------------------------------------------------------------

  /**
   * Convert an Earthly Branch index (子=0 … 亥=11) to a palace position (寅=0 … 丑=11).
   * CRITICAL: all auxiliary star tables are stored in branch indices; this converts them.
   */
  function branchToPos(branchIdx) {
    return (branchIdx - 2 + 12) % 12;
  }

  // ---------------------------------------------------------------------------
  // Zi Wei Placement Table  (day 1-30) x (水二局=0, 木三局=1, 金四局=2, 土五局=3, 火六局=4)
  // Values are palace positions (0 = 寅).
  // ---------------------------------------------------------------------------
  const ZIWEI_TABLE = [
    [1,1,1,0,0],[2,1,2,1,1],[1,2,1,2,1],[3,2,3,1,2],[2,3,2,3,2],
    [4,3,4,2,3],[3,3,3,4,3],[5,4,5,3,4],[4,4,4,5,4],[6,5,6,4,5],
    [5,5,5,6,5],[7,6,7,5,6],[6,6,6,7,6],[8,7,8,6,7],[7,7,7,8,7],
    [9,8,9,7,8],[8,8,8,9,8],[10,9,10,8,9],[9,9,9,10,9],[11,10,11,9,10],
    [10,10,10,11,10],[0,11,0,10,11],[11,11,11,0,11],[1,0,1,11,0],[0,0,0,1,0],
    [2,1,2,0,1],[1,1,1,2,1],[3,2,3,1,2],[2,2,2,3,2],[4,3,4,2,3]
  ];

  // ---------------------------------------------------------------------------
  // Star Groups
  // ---------------------------------------------------------------------------

  // ZiWei group offsets (counterclockwise from ZiWei position)
  const ZIWEI_GROUP = [
    { name: '紫微', offset: 0 },
    { name: '天机', offset: -1 },
    { name: '太阳', offset: -3 },
    { name: '武曲', offset: -4 },
    { name: '天同', offset: -5 },
    { name: '廉贞', offset: -8 }
  ];

  // TianFu position lookup: index = ZiWei position -> value = TianFu position
  const TIANFU_LOOKUP = [2, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3];

  // TianFu group offsets (clockwise from TianFu position)
  const TIANFU_GROUP = [
    { name: '天府', offset: 0 },
    { name: '太阴', offset: 1 },
    { name: '贪狼', offset: 2 },
    { name: '巨门', offset: 3 },
    { name: '天相', offset: 4 },
    { name: '天梁', offset: 5 },
    { name: '七杀', offset: 6 },
    { name: '破军', offset: 10 }
  ];

  // ---------------------------------------------------------------------------
  // Auxiliary Stars  (all values are BRANCH INDICES - convert with branchToPos)
  // ---------------------------------------------------------------------------

  // 文昌 by year Heavenly Stem (甲=0 … 癸=9)
  const WENCHANG_BY_STEM = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];

  // 文曲 by year Heavenly Stem
  const WENQU_BY_STEM = [9, 8, 6, 5, 6, 5, 3, 2, 0, 11];

  // 左辅 by lunar month (index 0 = month 1)
  const ZUOFU_BY_MONTH = [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3];

  // 右弼 by lunar month
  const YOUBI_BY_MONTH = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11];

  // 天魁 by year stem
  const TIANKUI_BY_STEM = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3];

  // 天钺 by year stem
  const TIANYUE_BY_STEM = [7, 8, 9, 9, 7, 8, 7, 2, 5, 5];

  // 擎羊 by year stem
  const QINGYANG_BY_STEM = [3, 4, 6, 7, 6, 7, 9, 10, 0, 1];

  // 火星 base by year branch group (value is branch index)
  // 寅午戌(idx 2,6,10)->丑(1)  申子辰(idx 8,0,4)->寅(2)  巳酉丑(idx 5,9,1)->卯(3)  亥卯未(idx 11,3,7)->酉(9)
  function huoxingBase(yearBranchIdx) {
    if ([2, 6, 10].includes(yearBranchIdx)) return 1;
    if ([8, 0, 4].includes(yearBranchIdx)) return 2;
    if ([5, 9, 1].includes(yearBranchIdx)) return 3;
    /* [11, 3, 7] */ return 9;
  }

  // 铃星 base by year branch group (value is branch index)
  // 寅午戌->卯(3)  申子辰->戌(10)  巳酉丑->戌(10)  亥卯未->戌(10)
  function lingxingBase(yearBranchIdx) {
    if ([2, 6, 10].includes(yearBranchIdx)) return 3;
    return 10;
  }

  // ---------------------------------------------------------------------------
  // 四化 (Four Transformations)  index = year stem -> [化禄, 化权, 化科, 化忌]
  // ---------------------------------------------------------------------------
  const SIHUA = [
    ['廉贞','破军','武曲','太阳'],
    ['天机','天梁','紫微','太阴'],
    ['天同','天机','文昌','廉贞'],
    ['太阴','天同','天机','巨门'],
    ['贪狼','太阴','右弼','天机'],
    ['武曲','贪狼','天梁','文曲'],
    ['太阳','武曲','太阴','天同'],
    ['巨门','太阳','文曲','文昌'],
    ['天梁','紫微','左辅','武曲'],
    ['破军','巨门','太阴','贪狼']
  ];

  const SIHUA_NAMES = ['化禄','化权','化科','化忌'];

  // ---------------------------------------------------------------------------
  // 五行局 element -> bureau number
  // ---------------------------------------------------------------------------
  const WUXING_JU = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 };
  const JU_NAMES = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };

  // 五行局 column index in ZIWEI_TABLE
  const JU_COL = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4 };

  // ---------------------------------------------------------------------------
  // 五虎遁月法 - starting Stem index for 寅宫 by year stem
  // 甲己->丙(2), 乙庚->戊(4), 丙辛->庚(6), 丁壬->壬(8), 戊癸->甲(0)
  // ---------------------------------------------------------------------------
  const WUHU_START = [2, 4, 6, 8, 0]; // index = yearStem % 5

  // ---------------------------------------------------------------------------
  // Display order for 4x4 grid
  //   Row 0: 3  4  5  6
  //   Row 1: 2  -  -  7
  //   Row 2: 1  -  -  8
  //   Row 3: 0  11 10 9
  // ---------------------------------------------------------------------------
  const GRID_ORDER = [
    [3, 4, 5, 6],
    [2, null, null, 7],
    [1, null, null, 8],
    [0, 11, 10, 9]
  ];

  // ---------------------------------------------------------------------------
  // Interpretation Data
  // ---------------------------------------------------------------------------

  const STAR_INTERPRETATIONS = {
    '紫微': {
      personality: '帝星坐命，天生具有领袖气质，处事大方且有主见。为人正直厚重，自尊心极强，有不怒自威的气场。善于统御全局，思维缜密，具备非凡的判断力与决策力。但也容易孤高自许，不喜屈就于人下，须注意过度自信可能带来的盲点。',
      career: '适合从事管理、行政、政治、大型企业经营等需要领导力的工作。紫微星主贵，事业发展往往能达到较高层次，尤其在组织架构中容易升任要职。也适合自主创业，开创属于自己的事业版图。',
      relationship: '感情上较为被动，习惯被追求而非主动出击。对另一半要求较高，倾向找到能与自己匹配的伴侣。婚姻中容易主导一切，需学习尊重对方意见，维持平等关系。',
      wealth: '财运属于稳健上升型。紫微主贵不主富，但因地位提升带动收入增长。善于管理大资金，适合长期投资与资产配置，不宜投机。中晚年财运渐佳。',
      health: '需注意脾胃方面的问题，以及因压力大导致的心血管疾病。建议保持规律运动，避免过度操劳。精神压力也需要适时释放。'
    },
    '天机': {
      personality: '天机星主智，心思灵活，善于谋划。为人机敏聪慧，学习能力极强，对事物有敏锐的洞察力。擅长分析推理，思维跳跃快速。但也容易想太多而犹豫不决，心思过于细腻反而增添烦恼。',
      career: '适合从事策划、咨询、研究、科技、教育等需要动脑的工作。也适合幕僚角色、军师智囊。在变化快速的行业如互联网、金融分析领域能发挥特长。',
      relationship: '感情上多思多虑，容易因过度分析而错失良机。内心渴望深层的精神交流，对伴侣的智识水平有要求。恋爱中变化较多，需要稳定的另一半来平衡。',
      wealth: '财运起伏较大，善于发现赚钱机会但执行力有时不足。适合以智慧生财，如知识变现、技术创业。不宜守财，应学习理财规划。',
      health: '注意神经系统与肝胆方面的问题。思虑过多容易引起失眠、焦虑。建议培养冥想或运动习惯，保持身心平衡。'
    },
    '太阳': {
      personality: '太阳星光明磊落，热情慷慨，具有强烈的正义感和使命感。为人豪爽大方，乐于助人，有着天然的亲和力与感召力。行事光明正大，不喜欢暗中行事。但也可能过于理想化，容易因心直口快而得罪人。',
      career: '适合从事政治、外交、传媒、教育、公益等需要抛头露面的工作。太阳主贵主名，事业上容易获得名声与社会认可。也适合国际商务、公共关系等领域。',
      relationship: '感情上主动热情，愿意为爱人付出一切。男命太阳坐命，婚姻多美满；女命则容易辛劳操持，付出多于回报。需注意不要因事业而忽略家庭。',
      wealth: '财运来去明快，进财渠道广泛但花费也大。慷慨好施，不善积蓄。适合通过名声和人脉来拓展财源，中年以后财运渐趋稳定。',
      health: '注意眼睛和心脏方面的问题。太阳属火，容易上火、血压偏高。建议避免过度曝晒，保持充足睡眠，注意心血管保养。'
    },
    '武曲': {
      personality: '武曲星刚毅果决，意志坚定，做事雷厉风行。为人正直有原则，不轻易妥协。财星坐命，对金钱有天生的敏感度，理财能力出众。但性格较为孤傲，不善言辞，容易给人冷漠的印象。',
      career: '适合金融、会计、银行、投资、军警、武术等行业。武曲主财，在与金钱相关的领域能如鱼得水。也适合技术型工作，如工程、制造业。执行力强，适合独当一面。',
      relationship: '感情上较为木讷，不善表达情感。容易将工作放在感情之前，需要另一半的包容和理解。一旦认定对象，会以实际行动表达忠诚。晚婚往往更幸福。',
      wealth: '天生财星，理财能力极强。善于开源节流，有很强的赚钱意识。适合各类投资，尤其在金属、矿产、金融衍生品等领域有优势。一生不缺财，但需避免过度吝啬。',
      health: '注意呼吸系统和骨骼关节方面的问题。武曲属金，肺部需要特别保养。也容易因压力导致筋骨酸痛，建议适度运动放松。'
    },
    '天同': {
      personality: '天同星温和敦厚，与世无争，性情随和乐观。为人善良有同情心，不喜欢与人争斗。生活态度轻松自在，注重精神享受。但也容易安于现状，缺乏进取心，遇到困难时可能退缩逃避。',
      career: '适合从事艺术、文化、社工、心理咨询、餐饮、旅游等行业。天同主福，在服务业和文化产业中能发挥天赋。也适合稳定的公务员或国企工作，不太适合高压竞争的环境。',
      relationship: '感情上温柔体贴，是理想的伴侣人选。容易吸引异性，恋爱甜蜜。但需注意不要因为怕麻烦而逃避感情中的问题。婚后生活安逸幸福。',
      wealth: '财运平稳，不会大富但也不缺钱花。对金钱态度随性，赚多少花多少。适合稳健的储蓄和保险，不宜高风险投资。中年后财运渐好。',
      health: '注意泌尿系统和内分泌方面的问题。天同属水，肾脏需要保养。也容易因贪图口腹之欲而发胖，应注意饮食控制和运动。'
    },
    '廉贞': {
      personality: '廉贞星聪明干练，善于交际，既有文采又有武略。为人精明能干，有很强的适应能力和应变能力。在不同场合能展现不同面貌，社交手腕高明。但情绪起伏较大，容易因感情用事而做出冲动决定。',
      career: '适合政治、法律、军警、演艺、公关、销售等工作。廉贞又称次桃花星，在需要人际交往的领域特别出色。也适合管理岗位，能文能武，可以驾驭复杂的组织关系。',
      relationship: '感情上热烈多情，桃花旺盛。容易一见钟情，也容易喜新厌旧。需要学习在感情中保持理性，避免纠纷。成熟后能建立深厚的情感关系。',
      wealth: '财运有起有落，赚钱能力强但花钱也不手软。善于利用人脉关系生财。需注意避免因感情或法律纠纷而破财。中年后逐渐稳定。',
      health: '注意心脏和血液方面的问题。廉贞属火，容易心火旺盛、血压不稳。也需注意皮肤问题。建议保持心态平和，避免熬夜。'
    },
    '天府': {
      personality: '天府星稳重大方，气度不凡。为人宽容厚道，有包容力和领导力。处事沉稳有序，善于守成。注重生活品质，有品味。但也容易过于保守，守旧不变，对新事物接受较慢。',
      career: '适合金融、房地产、仓储物流、行政管理等行业。天府为财库星，在资产管理、财务规划领域有天赋。也适合大型企业中高层管理，能够守住基业并稳步发展。',
      relationship: '感情上成熟稳重，注重门当户对。婚姻生活安稳幸福，能给伴侣安全感。但有时过于现实，缺少浪漫情趣。适合与同样稳重的伴侣结合。',
      wealth: '财运极佳，天府为财库，善于积累和保管财富。一生衣食无忧，财运稳步上升。适合稳健投资如不动产、蓝筹股。是天生的守财高手。',
      health: '注意脾胃方面的问题。天府属土，消化系统需要保养。容易因享受美食而三高。建议控制饮食，保持适度运动。'
    },
    '太阴': {
      personality: '太阴星温柔细腻，感性浪漫，想象力丰富。为人含蓄内敛，不喜张扬。有很强的艺术天赋和审美能力。心思细密，善于察言观色。但也容易多愁善感，情绪波动较大，有时过于悲观。',
      career: '适合艺术、设计、文学、心理学、美容美妆、夜间经济等行业。太阴主阴柔之美，在创意和美学领域能大放异彩。也适合幕后工作、研究分析等安静的职业。',
      relationship: '感情上深情专一，渴望浪漫与温暖。容易为爱痴迷，投入全部感情。需注意不要在感情中迷失自我。适合与阳光开朗的伴侣互补。',
      wealth: '财运与月亮盈亏类似，有起有落。太阴为财星之一，有理财潜力但需耐心等待。适合与不动产、夜间经济相关的投资。女命太阴入命，财运更佳。',
      health: '注意眼睛和妇科（女性）方面的问题。太阴属水，肾脏和内分泌需要保养。情绪不稳也容易影响睡眠质量。建议保持心情舒畅。'
    },
    '贪狼': {
      personality: '贪狼星多才多艺，聪明伶俐，充满魅力。为人机灵善变，兴趣广泛，社交能力极强。有很强的学习能力和适应能力，每到一个新领域都能快速上手。但也容易贪多嚼不烂，三分钟热度，难以持之以恒。',
      career: '适合娱乐、演艺、销售、外交、餐饮、风水玄学等行业。贪狼为才艺之星，在需要创意和人际魅力的领域能如鱼得水。也适合创业，尤其是新兴行业和时尚产业。',
      relationship: '桃花极旺，异性缘极佳。感情生活丰富多彩，但也容易陷入三角关系。需要在感情中学习专注和负责。遇到真爱后能收心，晚年感情生活美满。',
      wealth: '财运偏向横财和意外之财。善于发现商机，赚钱手段多样。但花钱也大方，不善积蓄。适合风险投资和新兴产业。中年后财运逐渐稳定。',
      health: '注意肝胆和泌尿系统的问题。贪狼属木，肝脏需要特别保养。也需注意因应酬过多导致的亚健康状态。建议节制饮食，适度运动。'
    },
    '巨门': {
      personality: '巨门星口才出众，分析能力强，善于辩论和质疑。为人直率敏锐，能一针见血地指出问题所在。有很强的研究精神和探索欲望。但也容易出口伤人，引起是非口舌，人际关系需要特别注意。',
      career: '适合律师、教师、主播、记者、医生、研究员等职业。巨门主口舌，在需要口才和分析能力的领域有优势。也适合学术研究、市场调研、质量检测等工作。',
      relationship: '感情上容易因言语不当引起争吵。需要学习在亲密关系中温和表达。内心其实很渴望被理解和接纳。适合与包容大度的伴侣结合。',
      wealth: '财运来自口才和专业技能。适合以嘴吃饭的行业，如教育培训、法律咨询等。需注意避免因口舌是非而破财。稳扎稳打更有利。',
      health: '注意口腔、喉咙和消化系统的问题。巨门属水土，脾胃需要保养。也容易因压力大导致胃溃疡、口腔溃疡。建议注意饮食规律。'
    },
    '天相': {
      personality: '天相星谨慎周到，公正无私，有很强的责任感。为人诚实可靠，注重原则和礼仪。善于协调各方关系，是天生的辅佐人才。处事有条理，值得信赖。但也容易过于拘泥于规矩，缺乏开创精神。',
      career: '适合行政、人事、秘书、法务、审计、社工等工作。天相为印星，在辅助性和协调性的岗位上能发挥最大价值。也适合公务员、事业单位等稳定的工作环境。',
      relationship: '感情上忠诚可靠，是值得托付的伴侣。注重家庭和睦，会尽心经营婚姻。但有时过于操心，需要适度放手。适合与有主见的伴侣互补。',
      wealth: '财运稳定，靠薪资和正当收入积累财富。不适合冒险投资，稳健理财更合适。有贵人运，常因他人提携而获得经济上的好处。一生不缺衣食。',
      health: '注意皮肤和免疫系统方面的问题。天相属水，需要注意肾脏保养。也容易因操劳过度而疲惫。建议劳逸结合，注重休息。'
    },
    '天梁': {
      personality: '天梁星慈悲正直，有长者风范，为人乐善好施。具有很强的化解危机的能力，逢凶化吉。处事公正不偏私，有高尚的道德标准。但也容易说教过多，管得太宽，给人啰嗦的感觉。',
      career: '适合医生、教师、慈善、宗教、保险、司法等行业。天梁为荫星，在需要帮助他人的领域能实现自我价值。也适合仲裁调解、社会服务等工作。',
      relationship: '感情上成熟稳重，适合晚婚。对伴侣有保护欲，希望照顾对方。但有时过于理性，缺乏浪漫。适合与感性的伴侣结合，互相平衡。',
      wealth: '财运平稳，不会大富大贵但衣食无忧。天梁主荫不主财，财富来源往往与服务他人有关。适合保守理财，注重保险和储蓄。晚年生活安逸。',
      health: '总体健康状况较好，天梁有化解疾病的能力。但需注意脾胃和消化系统。年长后注意关节和骨骼保养。建议保持乐观心态。'
    },
    '七杀': {
      personality: '七杀星英勇果断，意志坚强，有很强的开创力和行动力。为人豪迈不羁，不服输不认输。敢于挑战权威，打破常规。但也容易冲动行事，脾气暴躁，人际关系紧张。',
      career: '适合军警、运动、外科医生、探险、创业、改革等工作。七杀主武，在需要魄力和执行力的领域能大显身手。也适合危机管理、项目攻坚等高难度任务。',
      relationship: '感情上热烈直接，喜欢就大胆追求。婚姻中容易因脾气问题起冲突。需要学习控制情绪，尊重伴侣。适合与温和包容的伴侣互补。',
      wealth: '财运属于大起大落型。赚钱能力强但花费也大。适合创业和投机，但风险也相应较高。需要学习风险管理，避免一夜暴富的心态。',
      health: '注意外伤、手术和血光之灾。七杀属金，骨骼和呼吸系统需要保养。也容易因压力大导致免疫力下降。建议注意安全，避免极限运动。'
    },
    '破军': {
      personality: '破军星叛逆创新，不走寻常路，有很强的变革意识。为人我行我素，不受约束，敢于打破一切陈规旧矩。行动力极强，说做就做。但也容易极端偏执，破坏力强，人生波折较多。',
      career: '适合科技创新、互联网、拆迁改建、外科医生、先锋艺术等工作。破军主变，在需要颠覆和创新的领域能发挥特长。也适合开拓市场、海外发展等需要冒险精神的工作。',
      relationship: '感情上变化多端，容易闪婚闪离。对爱情有着极端的态度，要么全情投入要么毫不留情。需要成长后才能建立稳定的情感关系。',
      wealth: '财运大起大落，一生中可能多次从零开始。赚钱方式非传统，往往在别人不看好的领域获得成功。适合风险投资和新兴产业。需要学习储蓄和风险控制。',
      health: '注意外伤和手术。破军属水，泌尿系统和肾脏需要保养。也容易因生活不规律导致各种问题。建议建立健康的生活习惯。'
    }
  };

  // Double-star combination interpretations
  const COMBO_INTERPRETATIONS = {
    '紫微+天府': {
      title: '帝座临命，大富大贵之格',
      text: '紫微天府同宫，为最上格局之一。兼具领导才能与理财能力，既能开创事业又能守住基业。为人气度恢宏，处事稳重大方，在政商两界均能有所建树。一生贵人运极佳，财官双美，是天生的领袖人物。但需注意不可过于骄傲自满，保持谦虚方能长久。'
    },
    '紫微+贪狼': {
      title: '桃花旺盛，才艺出众',
      text: '紫微贪狼同宫，集尊贵与才艺于一身。为人聪明伶俐，多才多艺，既有领袖气质又有个人魅力。桃花极旺，异性缘佳。适合在娱乐、文化、艺术等领域发展，容易成为公众人物。但需注意感情生活不宜过于复杂，否则影响事业和声誉。'
    },
    '紫微+天相': {
      title: '谨慎周到，善于辅佐',
      text: '紫微天相同宫，尊贵与谨慎并重。为人处事周到细致，既有帝王之尊又有宰相之才。善于在大格局中注重细节，适合辅佐型的领导角色。事业上稳步上升，中晚年运势极佳。婚姻多美满，家庭和睦。'
    },
    '紫微+七杀': {
      title: '权威非凡，杀伐果断',
      text: '紫微七杀同宫，帝星坐命配以武将之星，权威极重。为人果断刚毅，有非凡的魄力和执行力。在事业上能成大事，适合在竞争激烈的环境中打拼。但性格过于强势，需注意人际关系和夫妻之间的相处。一生波折中见成就。'
    },
    '紫微+破军': {
      title: '开创变革，不走常路',
      text: '紫微破军同宫，帝星配以先锋之星，有着非凡的开创能力。为人不拘一格，善于在变革中找到机会。事业上多有大起大落，但最终能建立属于自己的版图。适合科技创新、改革先锋等领域。需注意控制破坏欲，学会建设性地进行变革。'
    },
    '武曲+天府': {
      title: '财星坐命，理财高手',
      text: '武曲天府同宫，双财星聚合，财运极佳。为人稳重务实，有极强的理财能力和商业头脑。一生衣食丰足，财富积累稳定。适合金融投资、资产管理、企业经营等领域。但需注意不可过于守财吝啬，适度享受生活。'
    },
    '武曲+贪狼': {
      title: '财色兼收，物欲强烈',
      text: '武曲贪狼同宫，财星配以桃花星，物质和感情生活都很丰富。为人精明能干，善于社交，在商业领域有独特天赋。赚钱手段多样，投资眼光独到。但需注意控制物欲和感情纠葛，避免因贪心而招致损失。'
    },
    '武曲+天相': {
      title: '财印相守，稳健发展',
      text: '武曲天相同宫，财星与印星相合，事业财运均稳步发展。为人谨慎有原则，理财能力强且不冒险。适合在大企业中担任财务或管理要职。一生贵人扶持，财运平稳上升。婚姻幸福，家庭和谐。'
    },
    '武曲+七杀': {
      title: '刚毅果断，事业心强',
      text: '武曲七杀同宫，财星配以武将星，事业心极强。为人果断刚毅，有很强的执行力和赚钱能力。适合在竞争激烈的行业打拼，如金融交易、军工企业等。一生事业有成，但需注意人际关系和健康。'
    },
    '武曲+破军': {
      title: '开拓进取，财运起伏',
      text: '武曲破军同宫，财星配以变星，财运大起大落。为人敢于冒险，善于在变化中把握机会。适合创业和投资新兴行业。一生中可能多次重新开始，但每次都能东山再起。需注意风险管理和情绪控制。'
    },
    '天同+天梁': {
      title: '福德双全，逍遥自在',
      text: '天同天梁同宫，福星配以荫星，一生逢凶化吉。为人乐观豁达，不计较得失，处事从容。适合从事教育、文化、社会服务等工作。虽不一定大富大贵，但一生平安幸福，晚年尤其安逸。'
    },
    '天同+太阴': {
      title: '温和敏感，内心丰富',
      text: '天同太阴同宫，福星配以阴柔之星，内心世界极为丰富。为人温和善良，感性浪漫，有很强的艺术天赋。适合文学创作、艺术设计、心理咨询等领域。感情生活细腻动人，但也容易多愁善感。'
    },
    '天同+巨门': {
      title: '口舌是非，需修口德',
      text: '天同巨门同宫，福星受到口舌星的影响。为人虽然善良但容易说错话引起误会。需要特别注意言辞表达。适合通过口才赚钱的行业，但需修口德。中年后运势好转，学会沟通技巧后人际关系改善。'
    },
    '太阳+太阴': {
      title: '日月同辉，光芒万丈',
      text: '太阳太阴同宫，日月交辉，才华横溢。兼具阳刚与阴柔之美，为人大方又细腻。适合在文化艺术、传媒、外交等领域发展。一生声名远播，贵人运极佳。但需注意平衡事业与家庭。'
    },
    '太阳+巨门': {
      title: '光明磊落，化暗为明',
      text: '太阳巨门同宫，光明之星化解口舌之暗。为人正直敢言，能以正义之声消除是非。适合从事法律、新闻、教育等领域。口才出众且能服众。太阳的光芒能化解巨门带来的负面影响。'
    },
    '天机+太阴': {
      title: '机月同梁，聪慧过人',
      text: '天机太阴同宫，智慧之星与灵性之星结合。为人聪颖灵慧，有极强的直觉和分析能力。适合从事研究、策划、设计等需要脑力的工作。感情细腻，有文艺气质。但容易想太多而焦虑。'
    },
    '天机+天梁': {
      title: '善谋多虑，适合幕僚',
      text: '天机天梁同宫，智慧星配以荫星，善于谋划和化解危机。为人沉稳有智慧，是天生的军师参谋。适合从事策略咨询、风险管理、保险精算等工作。一生贵人扶持，逢凶化吉。但不适合台前表演，幕后发力更佳。'
    },
    '天机+巨门': {
      title: '辩才无碍，善于分析',
      text: '天机巨门同宫，智慧星配以口才星，分析能力和表达能力俱佳。为人思维敏捷，善于辩论，能以理服人。适合律师、分析师、评论员等职业。但需注意不要过于尖锐，伤害他人感情。'
    },
    '廉贞+天府': {
      title: '政商兼顾，手段高明',
      text: '廉贞天府同宫，交际星配以财库星，在政商两界均游刃有余。为人精明干练，既有人脉又有财力。善于利用关系网络拓展事业。适合经营企业或从事政治活动。需注意行事不可过于功利。'
    },
    '廉贞+贪狼': {
      title: '桃花满天，多才多艺',
      text: '廉贞贪狼同宫，双桃花星聚合，魅力非凡。为人风流倜傥，才华横溢，社交能力极强。在娱乐、艺术、公关领域能大放异彩。但感情生活容易复杂，需要学习克制和专一。'
    },
    '廉贞+天相': {
      title: '刑印相守，公正无私',
      text: '廉贞天相同宫，刑星配以印星，为人正义感极强。处事公正严明，适合从事法律、执法、监察等工作。性格刚柔并济，既有原则又懂变通。事业上能担当重任，受人敬重。'
    },
    '廉贞+七杀': {
      title: '英星入命，权威刚烈',
      text: '廉贞七杀同宫，为英星入命之格。为人英气逼人，果断刚烈，有军人或侠客的气质。适合从事军警、体育竞技、危机处理等工作。一生多经磨难但终能成就。需注意控制脾气和冲动。'
    },
    '廉贞+破军': {
      title: '刑囚夹印，人生起伏',
      text: '廉贞破军同宫，人生波折较多。为人叛逆不羁，有很强的开创精神但也容易遭受挫折。一生中多次面临重大转折，需要极强的心理素质。适合在逆境中奋起的行业。越磨砺越光芒。'
    }
  };

  // Palace-specific interpretations
  const PALACE_READINGS = {
    '官禄宫': {
      desc: '官禄宫主事业运势、工作状态和社会地位。',
      stars: {
        '紫微': '事业上有极高的成就，适合担任领导角色，中晚年事业达到顶峰。',
        '天机': '适合从事策划、顾问类工作，事业多变化但总能找到出路。',
        '太阳': '事业上光明磊落，适合公职或名气相关的工作，声誉极佳。',
        '武曲': '事业与财务紧密相关，适合金融或技术领域，执行力极强。',
        '天同': '事业心不强，但工作轻松愉快，适合服务业和文化产业。',
        '廉贞': '事业上善于交际和经营，适合管理或公关工作。',
        '天府': '事业稳定发展，适合大企业中高层管理或资产相关工作。',
        '太阴': '适合幕后工作或文化创意产业，夜间经济也有优势。',
        '贪狼': '事业多元化，适合娱乐、艺术或新兴行业。',
        '巨门': '适合以口才为业，如教师、律师、主播等。',
        '天相': '适合行政、人事等辅助性管理工作，为人信赖的助手。',
        '天梁': '适合医疗、教育、社会服务等帮助他人的事业。',
        '七杀': '事业上有开创精神，适合在竞争环境中拼搏。',
        '破军': '事业多变化和革新，适合科技创新或开拓市场。'
      }
    },
    '财帛宫': {
      desc: '财帛宫主财运状况、理财能力和收入来源。',
      stars: {
        '紫微': '财运极佳，贵人送财，财富来源于地位和权力。',
        '天机': '财运多变，善于发现商机但执行力有时不足。',
        '太阳': '财运来去明快，进财广泛但花费也大。',
        '武曲': '天生财星入财帛宫，理财能力极强，一生不缺财。',
        '天同': '财运平稳，不求大富但衣食无忧。',
        '廉贞': '财运有起伏，善于利用人脉赚钱。',
        '天府': '财库星入财帛宫，积蓄丰厚，财运极佳。',
        '太阴': '财运与不动产和女性贵人有关，适合夜间经营。',
        '贪狼': '偏财运佳，适合投资和创业。',
        '巨门': '靠口才和专业技能赚钱。',
        '天相': '财运稳定，靠正职收入积累。',
        '天梁': '财运平稳，适合保守理财。',
        '七杀': '财运大起大落，适合风险投资。',
        '破军': '财运波动大，但善于在变化中赚钱。'
      }
    },
    '夫妻宫': {
      desc: '夫妻宫主婚姻状况、配偶特质和感情运势。',
      stars: {
        '紫微': '配偶有地位有能力，婚姻中另一半较强势。',
        '天机': '配偶聪明灵活，但婚姻可能有变化。',
        '太阳': '男命配偶贤慧，女命丈夫能干有成就。',
        '武曲': '配偶理财能力强，婚姻较晚但稳定。',
        '天同': '夫妻感情和睦，婚姻生活甜蜜幸福。',
        '廉贞': '感情生活丰富，需注意桃花问题。',
        '天府': '配偶稳重有财，婚姻安稳。',
        '太阴': '配偶温柔体贴，感情细腻深厚。',
        '贪狼': '感情桃花旺，婚姻需注意第三者。',
        '巨门': '夫妻间容易有口角争执，需修口德。',
        '天相': '配偶忠诚可靠，婚姻稳定和谐。',
        '天梁': '配偶成熟稳重，适合晚婚。',
        '七杀': '婚姻中有争执和波折，但感情浓烈。',
        '破军': '婚姻变化大，可能经历分合。'
      }
    },
    '疾厄宫': {
      desc: '疾厄宫主健康状况、体质特点和潜在疾病。',
      stars: {
        '紫微': '总体健康状况良好，需注意脾胃和心脏。',
        '天机': '需注意肝胆和神经系统，易失眠多虑。',
        '太阳': '注意眼睛和心血管，容易上火血压高。',
        '武曲': '注意呼吸系统和骨骼关节。',
        '天同': '注意泌尿系统和内分泌。',
        '廉贞': '注意心脏和皮肤问题，易心火旺。',
        '天府': '注意脾胃消化系统，控制饮食。',
        '太阴': '注意眼睛和肾脏，女性注意妇科。',
        '贪狼': '注意肝胆和泌尿系统。',
        '巨门': '注意口腔和消化系统。',
        '天相': '注意皮肤和免疫系统。',
        '天梁': '总体健康佳，注意脾胃保养。',
        '七杀': '注意外伤和手术，骨骼呼吸需保养。',
        '破军': '注意外伤，泌尿肾脏需保养。'
      }
    },
    '福德宫': {
      desc: '福德宫主精神生活、心境状态和享受福气。',
      stars: {
        '紫微': '精神生活充实，有高雅的品味和追求。',
        '天机': '思虑较多，精神世界丰富但容易焦虑。',
        '太阳': '心态积极阳光，精神生活充实。',
        '武曲': '精神上较为严肃，不太会享受生活。',
        '天同': '福星入福德，精神生活极为愉悦，最会享福。',
        '廉贞': '精神生活丰富多彩，但情绪起伏大。',
        '天府': '内心安稳富足，善于享受生活品质。',
        '太阴': '内心世界丰富，但容易多愁善感。',
        '贪狼': '兴趣广泛，精神生活多姿多彩。',
        '巨门': '精神上容易焦虑不安，需修心养性。',
        '天相': '内心平和安稳，精神生活有条理。',
        '天梁': '精神境界高远，有修行和信仰。',
        '七杀': '精神上有压力，不太安定。',
        '破军': '精神生活多变化，内心不安定。'
      }
    },
    '迁移宫': {
      desc: '迁移宫主外出运势、人际交往和异地发展。',
      stars: {
        '紫微': '外出有贵人扶持，适合外地发展，地位尊崇。',
        '天机': '适合流动性强的工作，外出多变化。',
        '太阳': '外出运极佳，在外地名声远播。',
        '武曲': '外出能赚到钱，适合异地经商。',
        '天同': '外出舒适愉快，适合旅游和文化交流。',
        '廉贞': '外出交际广泛，但需注意是非。',
        '天府': '外出有财运和贵人，适合外地发展事业。',
        '太阴': '适合夜间或海外发展。',
        '贪狼': '外出桃花旺，社交圈广泛。',
        '巨门': '外出容易有口舌是非，需谨言慎行。',
        '天相': '外出有人照顾扶持，适合异地工作。',
        '天梁': '外出逢凶化吉，有贵人保护。',
        '七杀': '外出拼搏有成，适合开拓新市场。',
        '破军': '外出波折较多但能开创新局面。'
      }
    }
  };

  // Four Transformation effects by palace
  const SIHUA_EFFECTS = {
    '化禄': {
      '命宫': '化禄入命宫，一生福气深厚，做事顺利，贵人运佳。为人乐观积极，人缘极好，事业和生活都能获得丰厚回报。',
      '兄弟': '化禄入兄弟宫，与兄弟姐妹关系融洽，能互相帮助。也代表朋友圈质量高。',
      '夫妻': '化禄入夫妻宫，婚姻幸福美满，配偶能力强且能带来好运。感情生活甜蜜。',
      '子女': '化禄入子女宫，子女聪明有出息，亲子关系和谐。也代表桃花运佳。',
      '财帛': '化禄入财帛宫，财运极佳，赚钱容易，收入丰厚。适合投资理财。',
      '疾厄': '化禄入疾厄宫，身体素质好，即使有病也容易康复。精力充沛。',
      '迁移': '化禄入迁移宫，外出运极佳，适合异地发展，在外有贵人相助。',
      '交友': '化禄入交友宫，人脉广泛，朋友多且质量高，社交能力强。',
      '官禄': '化禄入官禄宫，事业运极佳，工作顺利，容易升迁。适合从政或经商。',
      '田宅': '化禄入田宅宫，不动产运佳，适合买房置业。家庭环境优越。',
      '福德': '化禄入福德宫，精神生活充实愉快，善于享受生活。内心富足。',
      '父母': '化禄入父母宫，与父母关系好，能得到长辈庇护。学业运也佳。'
    },
    '化权': {
      '命宫': '化权入命宫，个性强势有主见，领导能力突出。一生能掌握主动权，不甘人后。',
      '兄弟': '化权入兄弟宫，在兄弟中较有地位，或手足事业有成。',
      '夫妻': '化权入夫妻宫，配偶能力强且有主见。婚姻中需注意权力平衡。',
      '子女': '化权入子女宫，子女有出息且个性强。在教育子女方面投入大。',
      '财帛': '化权入财帛宫，对财务有掌控力，赚钱能力强，善于理财。',
      '疾厄': '化权入疾厄宫，身体强壮有力，但也容易因过度使用而损耗。',
      '迁移': '化权入迁移宫，在外有权有势，适合在外地发展事业。',
      '交友': '化权入交友宫，在朋友中有领导地位，社交影响力强。',
      '官禄': '化权入官禄宫，事业上有实权，适合管理岗位，升迁快速。',
      '田宅': '化权入田宅宫，对家庭事务有主导权，在不动产方面有决策力。',
      '福德': '化权入福德宫，精神上有自主性，对自己的生活有强烈的掌控欲。',
      '父母': '化权入父母宫，与父母中有一方关系紧密且该方较强势。学业上有成就。'
    },
    '化科': {
      '命宫': '化科入命宫，为人有才华有学识，名声在外。适合学术研究或文化领域。',
      '兄弟': '化科入兄弟宫，兄弟姐妹中有人才，手足关系温文有礼。',
      '夫妻': '化科入夫妻宫，配偶有学识有涵养，婚姻中重精神交流。',
      '子女': '化科入子女宫，子女聪明好学，学业成绩优异。',
      '财帛': '化科入财帛宫，赚钱方式文雅，适合知识变现或文化产业。',
      '疾厄': '化科入疾厄宫，即使有病也能遇到好医生，逢凶化吉。',
      '迁移': '化科入迁移宫，在外名声好，适合学术交流或文化传播。',
      '交友': '化科入交友宫，交往的朋友多为有学识有涵养之人。',
      '官禄': '化科入官禄宫，事业上以才华见长，适合学术或文化类工作。',
      '田宅': '化科入田宅宫，居住环境优雅，对家居品味有追求。',
      '福德': '化科入福德宫，精神世界丰富，有高雅的兴趣爱好。',
      '父母': '化科入父母宫，家庭教育好，父母有文化修养。学业运极佳。'
    },
    '化忌': {
      '命宫': '化忌入命宫，一生较为辛劳，凡事需要付出更多努力。但磨练也是成长，大器晚成之命。',
      '兄弟': '化忌入兄弟宫，与兄弟姐妹之间有缘薄之象，关系需要经营。',
      '夫妻': '化忌入夫妻宫，婚姻中容易有波折和误解，需要双方共同努力经营。',
      '子女': '化忌入子女宫，在子女教育上需多费心思，或子女运较晚。',
      '财帛': '化忌入财帛宫，财运有阻碍，赚钱辛苦但也能靠努力积累。需注意理财。',
      '疾厄': '化忌入疾厄宫，健康方面需要特别注意，建议定期体检，预防为主。',
      '迁移': '化忌入迁移宫，外出运势欠佳，在外容易遇到困难。适合在家乡发展。',
      '交友': '化忌入交友宫，交友需谨慎，容易遇到损友或被朋友拖累。',
      '官禄': '化忌入官禄宫，事业上辛劳较多，容易遇到阻碍。但坚持努力终能突破。',
      '田宅': '化忌入田宅宫，不动产运势欠佳，在买房置业上需谨慎。家庭关系也需经营。',
      '福德': '化忌入福德宫，精神上容易焦虑不安，需要学习放松和修心。',
      '父母': '化忌入父母宫，与父母关系需要经营，或在学业上需要更多努力。'
    }
  };

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------

  /** Modular wrap to [0, 12) */
  function mod12(n) { return ((n % 12) + 12) % 12; }

  // ---------------------------------------------------------------------------
  // Main Calculation
  // ---------------------------------------------------------------------------

  /**
   * Calculate a full Zi Wei Dou Shu chart.
   * @param {number} lunarYear  - Lunar year (e.g. 1990)
   * @param {number} lunarMonth - Lunar month 1-12
   * @param {number} lunarDay   - Lunar day 1-30
   * @param {number} hourIdx    - Shichen index 0-11 (子=0, 丑=1, 寅=2 ...)
   * @param {string} gender     - 'male' or 'female'
   * @returns {object} chart data
   */
  function calculate(lunarYear, lunarMonth, lunarDay, hourIdx, gender) {
    // 1. Year Gan-Zhi
    var yearGZ = Lunar.yearGanZhi(lunarYear);
    var yearStemIdx = yearGZ.ganIdx;   // 0-9
    var yearBranchIdx = yearGZ.zhiIdx; // 0-11

    // 2. Ming Palace position
    var mingPos = mod12((lunarMonth - 1) - hourIdx + 24);

    // 3. Shen Palace position
    var shenPos = mod12((lunarMonth - 1) + hourIdx);

    // 4. Set up 12 palaces (counterclockwise from Ming)
    var palaces = [];
    for (var i = 0; i < 12; i++) {
      var pos = mod12(mingPos - i);
      var branchIdx = PALACE_ZHI_ORDER[pos];
      palaces.push({
        name: PALACE_NAMES[i],
        pos: pos,
        branchIdx: branchIdx,
        branchName: Lunar.DI_ZHI[branchIdx],
        stem: null,
        stemName: '',
        stars: [],
        sihua: []
      });
    }

    // 5. Assign palace stems via 五虎遁月法
    // Position 0 = 寅 gets startStem; position p gets stem (startStem + p) % 10.
    var startStem = WUHU_START[yearStemIdx % 5];
    for (var p = 0; p < palaces.length; p++) {
      palaces[p].stem = (startStem + palaces[p].pos) % 10;
      palaces[p].stemName = Lunar.TIAN_GAN[palaces[p].stem];
    }

    // 6. Determine 五行局 from Ming Palace Na-Yin
    var mingPalace = palaces[0];
    var nayin = Lunar.getNaYin(mingPalace.stem, mingPalace.branchIdx);
    var nayinElement = nayin.charAt(nayin.length - 1); // last char: 金木水火土
    var juNumber = WUXING_JU[nayinElement];
    var juName = JU_NAMES[juNumber];
    var juCol = JU_COL[juNumber];

    // 7. Place Zi Wei star and group
    var ziweiPos = ZIWEI_TABLE[lunarDay - 1][juCol];

    function addStar(pos, starName) {
      for (var j = 0; j < palaces.length; j++) {
        if (palaces[j].pos === pos) {
          if (!palaces[j].stars.includes(starName)) {
            palaces[j].stars.push(starName);
          }
          return;
        }
      }
    }

    ZIWEI_GROUP.forEach(function (s) {
      addStar(mod12(ziweiPos + s.offset), s.name);
    });

    // 8. Place Tian Fu and group
    var tianfuPos = TIANFU_LOOKUP[ziweiPos];
    TIANFU_GROUP.forEach(function (s) {
      addStar(mod12(tianfuPos + s.offset), s.name);
    });

    // 9. Place auxiliary stars (CONVERTING from branch index to palace position)

    // 文昌, 文曲 by year stem
    addStar(branchToPos(WENCHANG_BY_STEM[yearStemIdx]), '文昌');
    addStar(branchToPos(WENQU_BY_STEM[yearStemIdx]), '文曲');

    // 左辅, 右弼 by month
    addStar(branchToPos(ZUOFU_BY_MONTH[lunarMonth - 1]), '左辅');
    addStar(branchToPos(YOUBI_BY_MONTH[lunarMonth - 1]), '右弼');

    // 天魁, 天钺 by year stem
    addStar(branchToPos(TIANKUI_BY_STEM[yearStemIdx]), '天魁');
    addStar(branchToPos(TIANYUE_BY_STEM[yearStemIdx]), '天钺');

    // 擎羊 by year stem
    var qingyangBranch = QINGYANG_BY_STEM[yearStemIdx];
    addStar(branchToPos(qingyangBranch), '擎羊');

    // 陀罗 = 擎羊 branch - 1 (with wrap)
    var tuoluoBranch = (qingyangBranch - 1 + 12) % 12;
    addStar(branchToPos(tuoluoBranch), '陀罗');

    // 火星 by year branch + hour
    var huoxingBranch = (huoxingBase(yearBranchIdx) + hourIdx) % 12;
    addStar(branchToPos(huoxingBranch), '火星');

    // 铃星 by year branch + hour
    var lingxingBranch = (lingxingBase(yearBranchIdx) + hourIdx) % 12;
    addStar(branchToPos(lingxingBranch), '铃星');

    // 地空 by hour
    var dikongBranch = (hourIdx + 11) % 12;
    addStar(branchToPos(dikongBranch), '地空');

    // 地劫 by hour
    var dijieBranch = (11 - hourIdx + 12) % 12;
    addStar(branchToPos(dijieBranch), '地劫');

    // 10. Apply Four Transformations
    var sihuaRow = SIHUA[yearStemIdx];
    var sihuaResults = [];
    for (var h = 0; h < 4; h++) {
      var targetStar = sihuaRow[h];
      var huaName = SIHUA_NAMES[h];
      for (var pp = 0; pp < palaces.length; pp++) {
        if (palaces[pp].stars.includes(targetStar)) {
          palaces[pp].sihua.push(huaName);
          sihuaResults.push({
            star: targetStar,
            hua: huaName,
            palace: palaces[pp].name,
            palacePos: palaces[pp].pos
          });
          break;
        }
      }
    }

    // Determine gender-yin-yang direction for major limit (大限)
    var isYangStem = yearStemIdx % 2 === 0;
    var isMale = gender === 'male';
    var clockwise = (isYangStem && isMale) || (!isYangStem && !isMale);

    // 11. Calculate 大运 (Major Periods)
    var dayunList = [];
    var dayunStartAge = juNumber;
    for (var dy = 0; dy < 12; dy++) {
      var dyPalaceIdx = clockwise ? dy : ((12 - dy) % 12);
      var dyPalace = palaces[dyPalaceIdx];
      var dyStartAge = dayunStartAge + dy * 10;
      var dyEndAge = dyStartAge + 9;
      var dyGanIdx = dyPalace.stem;
      var dyBranchIdx = dyPalace.branchIdx;
      dayunList.push({
        index: dy, palaceIdx: dyPalaceIdx, palaceName: dyPalace.name,
        startAge: dyStartAge, endAge: dyEndAge,
        ganZhi: Lunar.TIAN_GAN[dyGanIdx] + Lunar.DI_ZHI[dyBranchIdx],
        ganIdx: dyGanIdx, branchIdx: dyBranchIdx,
        stars: dyPalace.stars.slice(), sihua: dyPalace.sihua.slice()
      });
    }

    // 12. Calculate 流年 (Annual Fortune) — current year ± range
    var currentYear = new Date().getFullYear();
    var liunianList = [];
    for (var ln = 0; ln < 12; ln++) {
      var lnYear = currentYear - 1 + ln;
      var lnYearGZ = Lunar.yearGanZhi(lnYear);
      var lnBranchIdx = lnYearGZ.zhiIdx;
      var lnPos = branchToPos(lnBranchIdx);
      var lnPalace = null;
      for (var lp = 0; lp < palaces.length; lp++) {
        if (palaces[lp].pos === lnPos) { lnPalace = palaces[lp]; break; }
      }
      var lnAge = lnYear - lunarYear;
      var lnDayun = null;
      for (var dd = 0; dd < dayunList.length; dd++) {
        if (lnAge >= dayunList[dd].startAge && lnAge <= dayunList[dd].endAge) { lnDayun = dayunList[dd]; break; }
      }
      liunianList.push({
        year: lnYear, yearGZ: lnYearGZ.text, age: lnAge,
        palaceName: lnPalace ? lnPalace.name : '—',
        palaceStars: lnPalace ? lnPalace.stars.slice() : [],
        dayun: lnDayun
      });
    }

    return {
      lunarYear: lunarYear, lunarMonth: lunarMonth, lunarDay: lunarDay,
      hourIdx: hourIdx, gender: gender, yearGZ: yearGZ,
      mingPos: mingPos, shenPos: shenPos, palaces: palaces,
      nayin: nayin, juNumber: juNumber, juName: juName,
      ziweiPos: ziweiPos, tianfuPos: tianfuPos,
      sihua: sihuaResults, clockwise: clockwise,
      dayunList: dayunList, liunianList: liunianList
    };
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function render(chart) {
    var html = '';

    // ---- Info Header ----
    html += '<div class="ziwei-header">';
    html += '<h2>紫微斗数命盘</h2>';
    html += '<div class="ziwei-info">';
    html += '<span>农历 ' + chart.lunarYear + '年 ' + chart.lunarMonth + '月 ' + chart.lunarDay + '日 '
          + Lunar.DI_ZHI[chart.hourIdx] + '时</span>';
    html += '<span>年柱：' + chart.yearGZ.text + '</span>';
    html += '<span>纳音：' + chart.nayin + '</span>';
    html += '<span>' + chart.juName + '</span>';
    html += '<span>' + (chart.gender === 'male' ? '男命' : '女命') + '</span>';
    html += '</div>';
    html += '</div>';

    // ---- Build palace lookup by position ----
    var byPos = {};
    chart.palaces.forEach(function (p) { byPos[p.pos] = p; });

    // ---- 4x4 Grid ----
    html += '<div class="ziwei-grid">';
    GRID_ORDER.forEach(function (row, rowIdx) {
      row.forEach(function (pos, colIdx) {
        if (pos !== null) {
          html += renderPalaceCell(byPos[pos], chart);
        } else {
          // Center info cells
          if (rowIdx === 1 && colIdx === 1) {
            html += renderCenterCell1(chart);
          } else if (rowIdx === 1 && colIdx === 2) {
            html += renderCenterCell2(chart);
          } else if (rowIdx === 2 && colIdx === 1) {
            html += renderCenterCell3(chart);
          } else if (rowIdx === 2 && colIdx === 2) {
            html += renderCenterCell4(chart);
          }
        }
      });
    });
    html += '</div>';

    // ---- Detailed Interpretations ----
    html += renderInterpretations(chart);

    // ---- 大运 Timeline ----
    html += renderDayun(chart);

    // ---- 流年 Grid ----
    html += renderLiunian(chart);

    return html;
  }

  function renderPalaceCell(palace, chart) {
    var isMing = palace.name === '命宫';
    var isShen = palace.pos === chart.shenPos;
    var cls = 'ziwei-cell';
    if (isMing) cls += ' ming-palace';
    if (isShen) cls += ' shen-palace';

    var html = '<div class="' + cls + '">';
    html += '<div class="palace-header">';
    html += '<span class="palace-name">' + palace.name;
    if (isShen && !isMing) html += ' (身)';
    if (isMing && isShen) html += ' (命身)';
    html += '</span>';
    html += '<span class="palace-branch">' + palace.stemName + palace.branchName + '</span>';
    html += '</div>';

    // Stars
    html += '<div class="palace-stars">';
    palace.stars.forEach(function (star) {
      var mainClass = isMainStar(star) ? ' main-star' : ' aux-star';
      html += '<span class="star' + mainClass + '">' + star + '</span>';
    });
    html += '</div>';

    // Si Hua
    if (palace.sihua.length > 0) {
      html += '<div class="palace-sihua">';
      palace.sihua.forEach(function (hua) {
        var huaClass = hua === '化忌' ? ' hua-ji' : (hua === '化禄' ? ' hua-lu' : (hua === '化权' ? ' hua-quan' : ' hua-ke'));
        html += '<span class="sihua-tag' + huaClass + '">' + hua + '</span>';
      });
      html += '</div>';
    }

    // Show 大运 age in palace cell
    if (chart.dayunList) {
      for (var dyi = 0; dyi < chart.dayunList.length; dyi++) {
        var dyItem = chart.dayunList[dyi];
        if (chart.palaces[dyItem.palaceIdx] === palace) {
          html += '<div class="palace-dayun">' + dyItem.startAge + '-' + dyItem.endAge + '</div>';
          break;
        }
      }
    }

    html += '</div>';
    return html;
  }

  function renderCenterCell1(chart) {
    var html = '<div class="ziwei-cell center-cell">';
    html += '<div class="center-title">紫微斗数</div>';
    html += '<div class="center-detail">' + chart.juName + '</div>';
    html += '<div class="center-detail">' + chart.yearGZ.text + '年</div>';
    html += '</div>';
    return html;
  }

  function renderCenterCell2(chart) {
    var html = '<div class="ziwei-cell center-cell">';
    html += '<div class="center-detail">纳音：' + chart.nayin + '</div>';
    html += '<div class="center-detail">' + (chart.gender === 'male' ? '男命' : '女命') + '</div>';
    html += '<div class="center-detail">' + (chart.clockwise ? '顺行' : '逆行') + '</div>';
    html += '</div>';
    return html;
  }

  function renderCenterCell3(chart) {
    var html = '<div class="ziwei-cell center-cell">';
    html += '<div class="center-subtitle">四化</div>';
    chart.sihua.forEach(function (sh) {
      html += '<div class="center-detail">' + sh.star + ' ' + sh.hua + ' (' + sh.palace + ')</div>';
    });
    html += '</div>';
    return html;
  }

  function renderCenterCell4(chart) {
    var html = '<div class="ziwei-cell center-cell">';
    html += '<div class="center-subtitle">基本信息</div>';
    html += '<div class="center-detail">农历 ' + chart.lunarMonth + '月' + chart.lunarDay + '日</div>';
    html += '<div class="center-detail">' + Lunar.DI_ZHI[chart.hourIdx] + '时</div>';
    html += '</div>';
    return html;
  }

  function isMainStar(name) {
    return ['紫微','天机','太阳','武曲','天同','廉贞',
            '天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'].includes(name);
  }

  // ---------------------------------------------------------------------------
  // Interpretations
  // ---------------------------------------------------------------------------

  function renderInterpretations(chart) {
    var html = '<div class="ziwei-interpretations">';

    // Ming Palace stars interpretation
    var mingPalace = chart.palaces[0];
    var mingMain = mingPalace.stars.filter(isMainStar);

    html += '<h3>命宫解析</h3>';

    // Check for double-star combos first
    if (mingMain.length >= 2) {
      for (var a = 0; a < mingMain.length; a++) {
        for (var b = a + 1; b < mingMain.length; b++) {
          var key1 = mingMain[a] + '+' + mingMain[b];
          var key2 = mingMain[b] + '+' + mingMain[a];
          var combo = COMBO_INTERPRETATIONS[key1] || COMBO_INTERPRETATIONS[key2];
          if (combo) {
            html += '<div class="interp-combo">';
            html += '<h4>' + combo.title + '</h4>';
            html += '<p>' + combo.text + '</p>';
            html += '</div>';
          }
        }
      }
    }

    // Individual main star readings in Ming Palace
    mingMain.forEach(function (star) {
      var data = STAR_INTERPRETATIONS[star];
      if (!data) return;
      html += '<div class="interp-star">';
      html += '<h4>' + star + '坐命</h4>';
      html += '<div class="interp-section"><strong>性格特质：</strong>' + data.personality + '</div>';
      html += '<div class="interp-section"><strong>事业方向：</strong>' + data.career + '</div>';
      html += '<div class="interp-section"><strong>感情模式：</strong>' + data.relationship + '</div>';
      html += '<div class="interp-section"><strong>财运特征：</strong>' + data.wealth + '</div>';
      html += '<div class="interp-section"><strong>健康提示：</strong>' + data.health + '</div>';
      html += '</div>';
    });

    if (mingMain.length === 0) {
      html += '<div class="interp-star">';
      html += '<p>命宫无主星，需借对宫迁移宫主星来论命。为人较为灵活多变，适应能力强。人生轨迹受外部环境影响较大，建议多发展自身特长，增强内在实力。</p>';
      html += '</div>';
    }

    // Key palace readings
    var keyPalaces = ['官禄','财帛','夫妻','疾厄','福德','迁移'];
    keyPalaces.forEach(function (palaceName) {
      var palace = null;
      for (var k = 0; k < chart.palaces.length; k++) {
        if (chart.palaces[k].name === palaceName) {
          palace = chart.palaces[k];
          break;
        }
      }
      if (!palace) return;

      var displayName = palace.name;
      if (!displayName.endsWith('宫')) displayName += '宫';
      var reading = PALACE_READINGS[displayName];
      if (!reading) return;

      var pMainStars = palace.stars.filter(isMainStar);
      html += '<div class="interp-palace">';
      html += '<h4>' + displayName + '</h4>';
      html += '<p class="palace-desc">' + reading.desc + '</p>';

      if (pMainStars.length > 0) {
        pMainStars.forEach(function (star) {
          if (reading.stars[star]) {
            html += '<div class="interp-section"><strong>' + star + '在' + displayName + '：</strong>' + reading.stars[star] + '</div>';
          }
        });
      } else {
        html += '<div class="interp-section">' + displayName + '无主星，受对宫影响，运势较为中性，需综合其他因素判断。</div>';
      }

      html += '</div>';
    });

    // Four Transformation effects
    if (chart.sihua.length > 0) {
      html += '<h3>四化详解</h3>';
      chart.sihua.forEach(function (sh) {
        var effects = SIHUA_EFFECTS[sh.hua];
        if (effects) {
          var effect = effects[sh.palace];
          if (effect) {
            html += '<div class="interp-sihua">';
            html += '<h4>' + sh.star + ' ' + sh.hua + ' 在' + sh.palace + '</h4>';
            html += '<p>' + effect + '</p>';
            html += '</div>';
          }
        }
      });
    }

    html += '</div>';
    return html;
  }

  // ---------------------------------------------------------------------------
  // 大运 Rendering
  // ---------------------------------------------------------------------------

  var DAYUN_INTERP = {
    '命宫': '大运行至命宫，此十年为人生重要转折期。自身能量被激发，适合主动出击、展示才华。个人魅力和运势处于高点，把握机会可成就大事。',
    '兄弟': '大运行至兄弟宫，此十年人际关系活跃。与朋友同事互动频繁，合作机会增多。善用人脉资源是此运关键。',
    '夫妻': '大运行至夫妻宫，此十年感情婚姻为生活重心。单身者有望遇到佳偶，已婚者感情更加深厚。需用心经营亲密关系。',
    '子女': '大运行至子女宫，此十年与子女缘分深厚，也代表创造力旺盛。适合投资、创业和开展新项目。',
    '财帛': '大运行至财帛宫，此十年财运为主题。赚钱机会增多，适合积极拓展财源、理性投资。是积累财富的黄金期。',
    '疾厄': '大运行至疾厄宫，此十年需注意健康养生。工作压力可能较大，建议定期体检，注重身心平衡。',
    '迁移': '大运行至迁移宫，此十年外出运活跃。适合出差、旅行、留学、搬迁。在外地容易遇到贵人和机遇。',
    '交友': '大运行至交友宫，此十年社交圈扩展。结交各路人脉，但需辨别益友损友，防止因交际不慎而招致麻烦。',
    '官禄': '大运行至官禄宫，此十年事业运势最为强劲。升迁有望，适合全力冲刺事业目标，是职业发展的黄金十年。',
    '田宅': '大运行至田宅宫，此十年与家庭和不动产有关。适合买房置业、安家落户。家庭关系是生活重心。',
    '福德': '大运行至福德宫，此十年精神生活充实。适合修身养性、学习充电。心态平和，但事业冲劲可能不足。',
    '父母': '大运行至父母宫，此十年与长辈缘分深。适合考试深造、获取证书。也要多关注父母健康。'
  };

  var LIUNIAN_INTERP = {
    '命宫': '太岁入命，今年自我展现的一年。运势高涨，适合主动出击。注意健康管理。',
    '兄弟': '太岁入兄弟宫，今年人际互动频繁。朋友助力大，团队合作是成功关键。',
    '夫妻': '太岁入夫妻宫，今年感情运突出。单身者有望脱单，已婚者多花时间陪伴伴侣。',
    '子女': '太岁入子女宫，今年创造力旺盛。适合开展新项目。桃花运旺，单身者多参加社交。',
    '财帛': '太岁入财帛宫，今年财运为主题。正偏财都有机会，适合拓展收入来源。理性投资为上。',
    '疾厄': '太岁入疾厄宫，今年注意健康。建议做全面体检，日常注意作息规律。学会减压。',
    '迁移': '太岁入迁移宫，今年适合外出发展。出差旅行运佳，在外地容易遇贵人。多走动多见识。',
    '交友': '太岁入交友宫，今年社交圈扩展。结识新朋友，但借贷需谨慎。合作前看清底细。',
    '官禄': '太岁入官禄宫，今年事业运强劲。升职加薪有望，全力冲刺目标。勇于表现自己。',
    '田宅': '太岁入田宅宫，今年家庭为重心。适合买房装修。多关心家人，维护家庭和睦。',
    '福德': '太岁入福德宫，今年精神充实。适合学习修身、旅行放松。事业不宜过于激进。',
    '父母': '太岁入父母宫，今年与长辈互动多。学业运和贵人运佳。多尽孝心，关注父母健康。'
  };

  function renderDayun(chart) {
    if (!chart.dayunList || chart.dayunList.length === 0) return '';
    var currentAge = new Date().getFullYear() - chart.lunarYear;
    var html = '<div class="interp-card">';
    html += '<h3>大运走势</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light,#6b7280)">大运每十年一变，揭示人生不同阶段的运势主题。' +
      (chart.clockwise ? '阳男/阴女顺行' : '阴男/阳女逆行') + '，起运年龄：' + chart.juNumber + '岁（' + chart.juName + '）</p>';

    html += '<div class="dayun-timeline">';
    chart.dayunList.forEach(function(dy) {
      var isCur = (currentAge >= dy.startAge && currentAge <= dy.endAge);
      html += '<div class="dayun-item' + (isCur ? ' current' : '') + '">';
      html += '<div class="dayun-age">' + dy.startAge + '~' + dy.endAge + '岁</div>';
      html += '<div class="dayun-gz">' + dy.ganZhi + '</div>';
      html += '<div class="dayun-palace">' + dy.palaceName + '</div>';
      var ms = dy.stars.filter(isMainStar);
      if (ms.length) html += '<div class="dayun-stars">' + ms.join(' ') + '</div>';
      if (dy.sihua.length) html += '<div class="dayun-sihua">' + dy.sihua.join(' ') + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Current 大运 interpretation
    var cur = null;
    chart.dayunList.forEach(function(dy) { if (currentAge >= dy.startAge && currentAge <= dy.endAge) cur = dy; });
    if (cur) {
      html += '<h4>当前大运：' + cur.ganZhi + '（' + cur.startAge + '~' + cur.endAge + '岁）— ' + cur.palaceName + '</h4>';
      html += '<p>' + (DAYUN_INTERP[cur.palaceName] || '此十年运势平稳。') + '</p>';
      if (cur.stars.length) html += '<p><strong>此运星曜：</strong>' + cur.stars.join('、') + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderLiunian(chart) {
    if (!chart.liunianList || chart.liunianList.length === 0) return '';
    var currentYear = new Date().getFullYear();
    var html = '<div class="interp-card">';
    html += '<h3>流年运势</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light,#6b7280)">流年以太岁所入宫位论断，结合大运综合判断当年运势。</p>';

    html += '<div class="liunian-grid">';
    chart.liunianList.forEach(function(ln) {
      var isCur = (ln.year === currentYear);
      html += '<div class="liunian-item' + (isCur ? ' current-year' : '') + '">';
      html += '<div class="ln-year">' + ln.year + '</div>';
      html += '<div class="ln-gz">' + ln.yearGZ + '</div>';
      html += '<div class="ln-age">' + ln.age + '岁</div>';
      html += '<div class="ln-palace">' + ln.palaceName + '</div>';
      var ms = ln.palaceStars.filter(isMainStar);
      if (ms.length) html += '<div class="ln-stars">' + ms.join(' ') + '</div>';
      if (ln.dayun) html += '<div class="ln-dayun">大运：' + ln.dayun.palaceName + '</div>';
      html += '</div>';
    });
    html += '</div>';

    // Current year interpretation
    var curLn = null;
    chart.liunianList.forEach(function(ln) { if (ln.year === currentYear) curLn = ln; });
    if (curLn) {
      html += '<h4>' + curLn.year + '年（' + curLn.yearGZ + '）— ' + curLn.palaceName + '</h4>';
      html += '<p>' + (LIUNIAN_INTERP[curLn.palaceName] || '今年运势平稳。') + '</p>';
      if (curLn.palaceStars.length) html += '<p><strong>流年星曜：</strong>' + curLn.palaceStars.join('、') + '</p>';
      if (curLn.dayun) html += '<p><strong>所在大运：</strong>' + curLn.dayun.palaceName + '（' + curLn.dayun.ganZhi + '，' + curLn.dayun.startAge + '~' + curLn.dayun.endAge + '岁）</p>';
    }
    html += '</div>';
    return html;
  }


  // ---------------------------------------------------------------------------
  // renderIztro - Full professional rendering from iztro engine
  // ---------------------------------------------------------------------------

  function renderIztro(astrolabe, gender, tst) {
    try {
    var html = '';
    var pals = astrolabe.palaces || [];
    if (pals.length < 12) return '<div class="interp-card"><p>命盘数据不完整</p></div>';
    var mingIdx = -1;
    pals.forEach(function(p,i){ if (p.name === '命宫') mingIdx = i; });
    var birthYear = (astrolabe.rawDates && astrolabe.rawDates.lunarDate) ? astrolabe.rawDates.lunarDate.lunarYear : 1990;
    var currentAge = new Date().getFullYear() - birthYear;
    var currentYear = new Date().getFullYear();

    // ===== HEADER =====
    html += '<div class="interp-card"><h2>紫微斗数命盘</h2>';
    html += '<p>' + (astrolabe.chineseDate||'') + ' | ' + (astrolabe.fiveElementsClass||'') +
      ' | ' + (gender==='male'?'男':'女') + '命 | 生肖' + (astrolabe.zodiac||'') + ' | ' + (astrolabe.sign||'') + '</p>';
    html += '<p style="font-size:.82rem;color:var(--ink-light)">命宫：' + (astrolabe.earthlyBranchOfSoulPalace||'') +
      ' | 身宫：' + (astrolabe.earthlyBranchOfBodyPalace||'') + '</p>';
    if (tst) html += '<p style="font-size:.82rem;color:var(--ink-light)">真太阳时：' + tst.str + '</p>';
    html += '</div>';

    // ===== 4x4 GRID =====
    var grid = [[3,4,5,6],[2,'c1','c2',7],[1,'c3','c4',8],[0,11,10,9]];
    html += '<div class="ziwei-grid">';
    grid.forEach(function(row) {
      row.forEach(function(cell) {
        if (typeof cell === 'number') {
          var p = pals[cell]; if (!p) { html += '<div class="ziwei-cell"></div>'; return; }
          var isMing = (p.name === '命宫'), isBody = p.isBodyPalace;
          var isLaiyin = p.isOriginalPalace;
          html += '<div class="ziwei-cell' + (isMing?' ming-palace':'') + (isBody&&!isMing?' shen-palace':'') + (isLaiyin?' laiyin-palace':'') + '" data-palace-idx="'+cell+'" onclick="window._toggleFlyingStar&&window._toggleFlyingStar(this,'+cell+')">';
          html += '<div class="palace-header"><span class="palace-name">' + p.name + (isMing&&isBody?'(命身)':isBody?'(身)':'') + (isLaiyin?' ★来因':'') + '</span>';
          html += '<span class="palace-branch">' + (p.heavenlyStem||'') + (p.earthlyBranch||'') + '</span></div>';
          // Stars rendering — show ALL stars
          var goodMinor = ['文昌','文曲','左辅','右弼','天魁','天钺','禄存','天马'];
          var badMinor = ['擎羊','陀罗','火星','铃星','地空','地劫'];
          var badAdj = ['天刑','天哭','天虚','阴煞','孤辰','寡宿','破碎','截路','旬空','空亡'];

          html += '<div class="palace-stars">';
          // 1. Major stars (14主星) with brightness + mutagen
          (p.majorStars||[]).forEach(function(s) {
            if (!s.name) return;
            html += '<span class="star main-star">' + s.name;
            if (s.brightness) html += '<sub>' + s.brightness + '</sub>';
            html += '</span>';
            if (s.mutagen) {
              var mt = s.mutagen;
              var hc = (mt==='忌'||mt==='化忌')?'hua-ji':(mt==='禄'||mt==='化禄')?'hua-lu':(mt==='权'||mt==='化权')?'hua-quan':'hua-ke';
              var mtLabel = mt.length===1 ? '化'+mt : mt;
              html += '<span class="sihua-tag '+hc+'">' + mtLabel + '</span> ';
            } else html += ' ';
          });

          // 2. Minor stars (辅星) — good=green, bad=BLACK BOLD
          (p.minorStars||[]).forEach(function(s) {
            if (!s.name) return;
            var cls = goodMinor.indexOf(s.name)>=0 ? 'lucky-star' : badMinor.indexOf(s.name)>=0 ? 'unlucky-star' : 'aux-star';
            html += '<span class="star ' + cls + '">' + s.name + (s.brightness ? '<sub>' + s.brightness + '</sub>' : '') + '</span>';
            if (s.mutagen) {
              var mt2 = s.mutagen;
              var hc2 = (mt2==='忌'||mt2==='化忌')?'hua-ji':(mt2==='禄'||mt2==='化禄')?'hua-lu':(mt2==='权'||mt2==='化权')?'hua-quan':'hua-ke';
              html += '<span class="sihua-tag '+hc2+'">' + (mt2.length===1?'化'+mt2:mt2) + '</span>';
            }
            html += ' ';
          });

          // 3. ALL adjective stars (杂曜) — bad ones get dark styling
          (p.adjectiveStars||[]).forEach(function(s) {
            if (!s.name) return;
            var isBad = badAdj.indexOf(s.name) >= 0;
            html += '<span class="star ' + (isBad ? 'adj-star-bad' : 'adj-star') + '">' + s.name + '</span> ';
          });
          html += '</div>';

          // 自化检测 — 显示具体是哪颗星自化
          var SELF_HUA_TABLE = {
            '甲':['廉贞','破军','武曲','太阳'],'乙':['天机','天梁','紫微','太阴'],
            '丙':['天同','天机','文昌','廉贞'],'丁':['太阴','天同','天机','巨门'],
            '戊':['贪狼','太阴','右弼','天机'],'己':['武曲','贪狼','天梁','文曲'],
            '庚':['太阳','武曲','太阴','天同'],'辛':['巨门','太阳','文曲','文昌'],
            '壬':['天梁','紫微','左辅','武曲'],'癸':['破军','巨门','太阴','贪狼']
          };
          var selfHuaList = [];
          var selfHuaNames = ['禄','权','科','忌'];
          selfHuaNames.forEach(function(h, hi) {
            try {
              if (p.selfMutaged(h)) {
                var starName = (SELF_HUA_TABLE[p.heavenlyStem]||[])[hi] || '';
                selfHuaList.push({ hua: h, star: starName });
              }
            } catch(e) {}
          });
          if (selfHuaList.length > 0) {
            html += '<div style="margin-top:2px">';
            selfHuaList.forEach(function(sh) {
              var shBg = sh.hua==='忌'?'#dc2626':sh.hua==='禄'?'#16a34a':sh.hua==='权'?'#d97706':'#2563eb';
              html += '<span style="font-size:.6rem;padding:1px 5px;border-radius:3px;background:'+shBg+';color:#fff;font-weight:700;margin-right:2px">' + sh.star + '自化' + sh.hua + '</span>';
            });
            html += '</div>';
          }

          // 长生12神 + 博士12神
          var extraInfo = [];
          if (p.changsheng12) extraInfo.push(p.changsheng12);
          if (p.boshi12) extraInfo.push(p.boshi12);
          if (extraInfo.length) html += '<div style="font-size:.55rem;color:var(--ink-light);margin-top:1px">' + extraInfo.join(' ') + '</div>';
          if (p.decadal && p.decadal.range) { var dr=p.decadal.range; html += '<div class="palace-dayun' + (currentAge>=dr[0]&&currentAge<=dr[1]?' current-dayun':'') + '">' + dr[0]+'-'+dr[1] + '</div>'; }
          html += '</div>';
        } else {
          html += '<div class="ziwei-cell center-cell">';
          if (cell==='c1') html += '<div class="center-title">紫微斗数</div><div class="center-detail">' + (astrolabe.fiveElementsClass||'') + '</div>';
          else if (cell==='c2') html += '<div class="center-detail">' + (astrolabe.chineseDate||'') + '</div><div class="center-detail">' + (gender==='male'?'男':'女') + '命 · ' + (astrolabe.zodiac||'') + '</div>';
          else if (cell==='c3') html += '<div class="center-detail">命宫：' + (astrolabe.earthlyBranchOfSoulPalace||'') + '</div><div class="center-detail">身宫：' + (astrolabe.earthlyBranchOfBodyPalace||'') + '</div>';
          else html += '<div class="center-detail">' + (astrolabe.time||'') + '</div><div class="center-detail">' + (astrolabe.timeRange||'') + '</div>';
          html += '</div>';
        }
      });
    });
    html += '</div>';

    // Flying star panel (shown when clicking a palace cell)
    html += '<div id="flying-star-panel" style="display:none;margin:-12px 0 16px;padding:14px 18px;background:var(--card,#fff);border:2px solid var(--gold,#c5922e);border-radius:8px;box-shadow:var(--shadow-md);animation:fadeIn .2s ease">';
    html += '<div id="flying-star-content"></div></div>';

    // Tip
    html += '<p style="text-align:center;font-size:.82rem;color:var(--ink-light);margin:-8px 0 16px">点击上方命盘中的任意宫位，查看该宫的飞星四化去向</p>';

    // Embed palace data + SIHUA table for JS click handler
    var SIHUA_TBL = {
      '甲':['廉贞','破军','武曲','太阳'],'乙':['天机','天梁','紫微','太阴'],
      '丙':['天同','天机','文昌','廉贞'],'丁':['太阴','天同','天机','巨门'],
      '戊':['贪狼','太阴','右弼','天机'],'己':['武曲','贪狼','天梁','文曲'],
      '庚':['太阳','武曲','太阴','天同'],'辛':['巨门','太阳','文曲','文昌'],
      '壬':['天梁','紫微','左辅','武曲'],'癸':['破军','巨门','太阴','贪狼']
    };
    // Build star→palace lookup
    var starToPalace = {};
    pals.forEach(function(p) {
      (p.majorStars||[]).concat(p.minorStars||[]).forEach(function(s) {
        if (s.name) starToPalace[s.name] = p.name;
      });
    });

    // Register flying star click handler directly (not via <script> tag)
    var _palDataJSON = JSON.stringify(pals.map(function(p){return {name:p.name,stem:p.heavenlyStem,branch:p.earthlyBranch,isOrig:p.isOriginalPalace}}));
    var _sihuaJSON = JSON.stringify(SIHUA_TBL);
    var _starPalJSON = JSON.stringify(starToPalace);

    window._fsData = { palData: JSON.parse(_palDataJSON), sihua: JSON.parse(_sihuaJSON), starPal: JSON.parse(_starPalJSON) };
    window._toggleFlyingStar = function(el, idx) {
      var panel = document.getElementById('flying-star-panel');
      var content = document.getElementById('flying-star-content');
      var d = window._fsData; if (!d) return;
      var p = d.palData[idx]; if (!p || !p.stem) return;
      var row = d.sihua[p.stem]; if (!row) return;
      var huaFull = ['化禄','化权','化科','化忌'];
      var huaColor = ['#16a34a','#d97706','#2563eb','#dc2626'];

      document.querySelectorAll('.ziwei-cell').forEach(function(c){c.style.outline='none'});
      el.style.outline = '2px solid #c5922e';

      var h = '<strong>' + p.name + '宫</strong>（' + p.stem + '干）飞星四化：<br><br>';
      row.forEach(function(star, i) {
        var target = d.starPal[star] || '未知';
        var isSelf = (target === p.name);
        h += '<span style="color:'+huaColor[i]+';font-weight:700">' + star + ' ' + huaFull[i] + '</span> → <strong>' + target + '宫</strong>';
        if (isSelf) h += ' <span style="background:#dc2626;color:#fff;padding:1px 6px;border-radius:3px;font-size:.75rem;font-weight:700">自化!</span>';
        h += '<br>';
      });
      content.innerHTML = h;
      panel.style.display = 'block';
      panel.scrollIntoView({behavior:'smooth',block:'nearest'});
    };

    // ===== 来因宫解读 =====
    var laiyinPalace = pals.find(function(p){return p.isOriginalPalace});
    if (laiyinPalace) {
      var lyMajors = (laiyinPalace.majorStars||[]).filter(function(s){return s.name}).map(function(s){return s.name+(s.brightness?'('+s.brightness+')':'')});
      var lyStem = laiyinPalace.heavenlyStem;
      var lySihua = SIHUA_TBL[lyStem] || [];

      var laiyinInterp = {
        '命宫': '来因宫在命宫，说明命主此生的课题就是「认识自己」。一切的因果都从自身出发，自己既是因也是果。飞星派认为这是最核心的格局——生年四化全部围绕自我展开。需要特别重视命宫的四化飞出方向。',
        '兄弟': '来因宫在兄弟宫，说明命主此生的因缘与兄弟朋友、同事伙伴密切相关。成败往往取决于人际关系的经营。合伙事业的好坏是此生的重要课题。',
        '夫妻': '来因宫在夫妻宫，说明命主此生的因缘与婚姻感情密切相关。配偶是此生最重要的贵人（或克星）。婚姻的好坏直接影响人生走向。',
        '子女': '来因宫在子女宫，说明命主此生的因缘与子女、投资、创造力相关。子女可能是此生最大的牵挂或成就。投资决策也是重要课题。',
        '财帛': '来因宫在财帛宫，说明命主此生的因缘与金钱财富密切相关。财运的起伏是此生的主线。需要特别关注理财能力的培养。',
        '疾厄': '来因宫在疾厄宫，说明命主此生的因缘与身体健康密切相关。健康是一切的基础，此生需要格外重视养生保健。身体好坏直接影响其他方面的发展。',
        '迁移': '来因宫在迁移宫，说明命主此生的因缘与外出、迁徙、社交密切相关。在外地发展比在家乡更有机会。贵人多在远方。社交能力是成功的关键。',
        '仆役': '来因宫在交友宫（仆役），说明命主此生的因缘与朋友、下属、合作伙伴密切相关。能否识人善用是此生的核心课题。',
        '官禄': '来因宫在官禄宫，说明命主此生的因缘与事业发展密切相关。事业的成败是此生的主旋律。适合将大量精力投入到职业发展中。',
        '田宅': '来因宫在田宅宫，说明命主此生的因缘与家庭、不动产密切相关。安家置业是此生的重要课题。家庭环境对命主影响极大。',
        '福德': '来因宫在福德宫，说明命主此生的因缘与精神世界、享受、修行密切相关。内心的满足比外在的成功更重要。此生的课题是找到心灵的归宿。',
        '父母': '来因宫在父母宫，说明命主此生的因缘与长辈、学业、家族密切相关。父母的影响深远，家族传承是重要课题。学业和文书运也是此生的关键。'
      };

      html += '<div class="interp-card"><h3>来因宫解读（飞星派核心）</h3>';
      html += '<p style="font-size:.84rem;color:var(--ink-light)">来因宫是飞星派独有的概念。宫干与年干相同的那个宫位即为「来因宫」，代表此人今生来到世间的因缘所在，也是生年四化的源头。来因宫揭示了命主此生最核心的人生课题。</p>';

      html += '<div style="background:linear-gradient(135deg,rgba(197,146,46,.08),rgba(197,146,46,.02));border:1px solid var(--gold);border-radius:8px;padding:16px 20px;margin:12px 0">';
      html += '<p style="font-size:1.1rem;font-weight:700;color:var(--gold)">来因宫：' + laiyinPalace.name + '宫（' + lyStem + laiyinPalace.earthlyBranch + '）</p>';
      if (lyMajors.length) html += '<p>宫内主星：' + lyMajors.join('、') + '</p>';
      html += '</div>';

      // 来因宫解读
      var lyText = laiyinInterp[laiyinPalace.name] || '来因宫代表此生因缘的核心领域。';
      html += '<p>' + lyText + '</p>';

      // 来因宫飞出的四化
      html += '<h4>来因宫四化飞出</h4>';
      html += '<p style="font-size:.84rem;color:var(--ink-light)">来因宫（' + lyStem + '干）飞出的四化是解读命盘的钥匙。生年四化实际上就是来因宫天干产生的，因此来因宫的四化方向揭示了此生因缘的具体去向。</p>';

      lySihua.forEach(function(starName, idx) {
        var targetPalace = starToPalace[starName] || '未知';
        var isSelf = (targetPalace === laiyinPalace.name);
        var colors = ['#16a34a','#d97706','#2563eb','#dc2626'];
        var huaNames = ['化禄','化权','化科','化忌'];

        html += '<p><strong style="color:' + colors[idx] + '">' + starName + ' ' + huaNames[idx] + '</strong> → <strong>' + targetPalace + '宫</strong>';
        if (isSelf) html += ' <span style="background:#dc2626;color:#fff;padding:1px 6px;border-radius:3px;font-size:.78rem;font-weight:700">自化</span>';

        // Brief meaning
        var huaMeanings = {
          '化禄': '（福气、资源流向此宫代表的领域）',
          '化权': '（掌控力、执行力投注在此宫代表的领域）',
          '化科': '（名声、贵人运体现在此宫代表的领域）',
          '化忌': '（执念、困扰集中在此宫代表的领域——也是最需要修行的课题）'
        };
        html += ' <span style="font-size:.84rem;color:var(--ink-light)">' + (huaMeanings[huaNames[idx]]||'') + '</span>';
        html += '</p>';
      });

      html += '</div>';
    }

    // ===== 命宫解读 =====
    if (mingIdx >= 0) {
      var ming = pals[mingIdx];
      var mStars = (ming.majorStars||[]).filter(function(s){return s.name});
      html += '<div class="interp-card"><h3>命宫主星解读</h3>';
      if (mStars.length === 0) {
        var qianyi = pals.find(function(p){return p.name==='迁移'});
        var qyStars = qianyi ? (qianyi.majorStars||[]).filter(function(s){return s.name}) : [];
        html += '<p><strong>命宫无主星</strong>，借对宫迁移宫主星论命。命主性格柔和善变，适应力强。</p>';
        mStars = qyStars;
      }
      if (mStars.length >= 2) {
        var ck = mStars[0].name+'+'+mStars[1].name, ck2 = mStars[1].name+'+'+mStars[0].name;
        var combo = COMBO_INTERPRETATIONS[ck] || COMBO_INTERPRETATIONS[ck2];
        if (combo) html += '<div style="background:rgba(197,61,67,.03);border-left:3px solid var(--vermillion);padding:12px 16px;margin:10px 0;border-radius:4px"><h4 style="color:var(--vermillion)">' + combo.title + '</h4><p>' + combo.text + '</p></div>';
      }
      mStars.forEach(function(s) {
        var si = STAR_INTERPRETATIONS[s.name]; if (!si) return;
        html += '<h4>' + s.name + '坐命' + (s.brightness ? ' — ' + s.brightness : '') + '</h4>';
        html += '<p><strong>性格：</strong>' + si.personality + '</p><p><strong>事业：</strong>' + si.career + '</p>';
        html += '<p><strong>感情：</strong>' + si.relationship + '</p><p><strong>财运：</strong>' + si.wealth + '</p><p><strong>健康：</strong>' + si.health + '</p>';
      });
      // 六吉六煞 + 杂曜 按亮度详解
      var minorInterp = {
        '文昌': {
          base: '文昌为科甲之星，主聪明才智、考试功名、文书运。',
          '庙': '文昌庙旺，学业极佳，考试必中，文才出众。适合走学术、考公、文化路线，一生多获文凭证书。',
          '旺': '文昌旺地，聪明好学，文笔流畅，学历运好。考试升学顺利，适合文教类工作。',
          '得': '文昌得地，有一定文才学识，读书有悟性。虽非顶尖学霸但学业平顺，考试中等偏上。',
          '利': '文昌利地，学习能力尚可，需要后天努力。文书工作能胜任，但不算特别突出。',
          '平': '文昌平和，学业普通，文才一般。需更加刻苦才能在考试中脱颖而出。',
          '陷': '文昌落陷，考试运差，文书易出差错。学业上容易半途而废，合同签约需格外仔细检查。不宜过于依赖学历发展。'
        },
        '文曲': {
          base: '文曲为才艺之星，主口才表达、文艺天赋、异路功名。',
          '庙': '文曲庙旺，才艺非凡，口才出众，有艺术天赋。适合演艺、主持、写作等领域，异路成名。',
          '旺': '文曲旺地，能说会道，多才多艺。社交能力强，桃花也旺。',
          '得': '文曲得地，有才艺基础，口才不错。可以靠技能吃饭，但需持续修炼。',
          '利': '文曲利地，才艺平平但有发展空间。在表达上下功夫能有进步。',
          '平': '文曲平和，才艺一般，口才普通。不太适合靠口才和文艺吃饭。',
          '陷': '文曲落陷，口才反成祸端，容易因言语惹祸、说错话得罪人。文书合同容易有纠纷，需防被骗上当。才艺也难以变现。'
        },
        '左辅': {
          base: '左辅为贵人之星，主助力、辅佐。入命者人缘极佳，一生常有贵人相助，逢凶化吉。善于团队合作，是天生的好帮手。'
        },
        '右弼': {
          base: '右弼为贵人之星，主机变、辅佐。入命者心思灵活，善于见风使舵。贵人运好，常在不经意间获得帮助。适合做协调和辅助角色。'
        },
        '天魁': {
          base: '天魁为阳贵人星，主日间贵人。入命者白天出门做事容易遇贵人相助。男性贵人缘尤佳。为人端庄正气，容易获得上级和长辈赏识。'
        },
        '天钺': {
          base: '天钺为阴贵人星，主夜间贵人。入命者晚间和暗中有贵人助力。女性贵人缘佳。为人和蔼可亲，常在不知不觉中获得帮助。'
        },
        '禄存': {
          base: '禄存为天禄之星，主正财、稳定收入。入命者财运稳健，一生不愁温饱。但禄存必与擎羊陀罗相邻，有财也有破。善于守财但不宜冒险投资。为人节俭有度。'
        },
        '天马': {
          base: '天马为驿马之星，主奔走、变动、迁移。入命者一生多走动，越动越旺。适合流动性强的工作如贸易、物流、旅游。天马逢禄存为「禄马交驰」，主发财于远方。'
        },
        '擎羊': {
          base: '擎羊为刑星，主刑克、冲突、果断。是六煞之首。',
          '庙': '擎羊庙旺，化煞为权。性格刚毅果断，有军人气质，做事雷厉风行。适合军警、外科医生、竞技运动等需要果敢的行业。庙旺时不主灾祸，反主魄力和行动力。',
          '旺': '擎羊旺地，个性刚强有主见。虽然脾气直但能成事，做事不拖泥带水。适合做开拓性工作。',
          '陷': '擎羊落陷，凶性大发。性格暴躁易怒，与人冲突不断，口舌是非多。容易有血光之灾、意外伤害、开刀手术。人际关系紧张，婚姻也多波折。需特别注意控制脾气，远离危险活动。'
        },
        '陀罗': {
          base: '陀罗为暗耗之星，主拖延、纠缠、暗损。',
          '庙': '陀罗庙旺，化煞为用。坚韧不拔，做事有毅力有耐心。虽然慢但能坚持到底。适合需要长期坚持的工作，如学术研究、长期投资。',
          '旺': '陀罗旺地，有韧性有恒心。做事虽慢但稳扎稳打，终能成功。',
          '陷': '陀罗落陷，凶性尽显。做事极度拖延、反复纠缠，放不下也拿不起。容易陷入无意义的执念中无法自拔。人际关系粘腻不清，感情上藕断丝连。身体上容易有暗疾缠身、慢性病。心理上易钻牛角尖、强迫症倾向。'
        },
        '火星': {
          base: '火星为暴烈之星，主急躁、冲动、爆发。',
          '庙': '火星庙旺，化煞为权。行动力极强，做事风风火火效率极高。爆发力惊人，适合短期冲刺和竞技类工作。庙旺时不主灾祸，反主果断和执行力。与贪狼同宫成「火贪格」，主暴发。',
          '旺': '火星旺地，热情冲劲足。做事有干劲有效率，但需注意持久性。',
          '得': '火星得地，有一定行动力但不至于太冲动。脾气来得快去得也快。',
          '利': '火星利地，冲劲一般，偶尔急躁。影响不算太大。',
          '陷': '火星落陷，暴躁难控。极易冲动行事、一怒之下做出不可挽回的决定。容易有意外、烫伤、火灾等灾祸。脾气暴烈伤人伤己，人际关系很差。需特别学会冷静和忍耐。'
        },
        '铃星': {
          base: '铃星为阴火之星，主闷烧、暗燃、延迟爆发。',
          '庙': '铃星庙旺，化煞为用。内心有持久的热情和动力，不显山露水但爆发力强。适合做需要沉潜后一鸣惊人的工作。与贪狼同宫成「铃贪格」，主意外暴发。',
          '旺': '铃星旺地，内在动力足。外表平静但内心有火焰。能忍能等，时机到了全力出击。',
          '得': '铃星得地，有一定的内在冲劲。偶尔有焦虑但能控制。',
          '利': '铃星利地，影响较小。稍有急躁但不致大碍。',
          '陷': '铃星落陷，内心焦虑不安、烦躁难眠。闷在心里的怒火找不到出口，容易抑郁或突然爆发。有暗疾、皮肤病、内分泌问题的风险。需特别注意心理健康，学会倾诉和释放情绪。'
        },
        '地空': {
          base: '地空为空亡之星，主空虚、理想、灵感。想象力丰富，思想超前，有哲学和宗教天赋。但也容易不切实际、好高骛远。财运上代表「有形之损」，钱财容易从看得见的途径流失。',
          '命宫': '地空入命宫：命主思想超前、想象力丰富，有哲学家和艺术家的特质。但容易想得多做得少，不接地气。适合创意、宗教、哲学、科研领域。不宜做需要脚踏实地的工作。',
          '财帛': '地空入财帛宫：财运上有明显漏洞。钱财从看得见的途径流失——花钱大手大脚、投资亏损、借出去的钱收不回来。必须特别注意理财，避免冲动消费和高风险投资。',
          '官禄': '地空入官禄宫：事业上有创新能力但难以落地。点子多但执行力不足，容易半途而废。适合做自由职业或创意行业，不适合按部就班的体制内工作。',
          '夫妻': '地空入夫妻宫：感情上容易「空等一场」。对爱情有理想化倾向，现实中难以找到完全符合期望的伴侣。需降低期望值，学会在不完美中找到幸福。',
          '福德': '地空入福德宫：精神世界空虚，容易感到孤独和迷茫。但也代表悟性极高，适合修行和灵性追求。',
          '田宅': '地空入田宅宫：不动产运差，买房容易亏损。家中可能有破财现象，需注意家居安全。',
          '迁移': '地空入迁移宫：外出运不佳，出门容易遇到意外。社交中常感格格不入。',
          '疾厄': '地空入疾厄宫：注意精神类疾病和空虚感。容易失眠多梦，精神状态不稳定。',
          '子女': '地空入子女宫：在子女方面可能有缘薄之象。投资也容易「竹篮打水一场空」。',
          '兄弟': '地空入兄弟宫：与兄弟朋友关系疏淡。合伙经营容易亏空。',
          '父母': '地空入父母宫：与父母缘分较薄，或父母对自己帮助有限。学业上容易中断。',
          '仆役': '地空入交友宫：朋友关系看似热闹实则空虚。需防酒肉朋友。'
        },
        '地劫': {
          base: '地劫为劫煞之星，主突变、损失、顿悟。悟性极高但人生多波折。财运上代表「无形之损」，钱财在不知不觉中消耗。但地劫也主灵感和突破。',
          '命宫': '地劫入命宫：命主悟性极高、直觉敏锐，有灵光一现的天赋。但人生起伏大，容易经历「归零重来」。适合科技创新、艺术先锋等颠覆性领域。很多成功的创业者命中带地劫。',
          '财帛': '地劫入财帛宫：钱财在不知不觉中消耗。不是大笔亏损而是积少成多的损耗——小额消费不知不觉花掉大钱。需特别注意记账理财，控制隐形消费。',
          '官禄': '地劫入官禄宫：事业上容易有突变和反转。可能经历裁员、公司倒闭等意外。但也能在危机中发现新机会。适合做风险较高的创新型工作。',
          '夫妻': '地劫入夫妻宫：感情上可能经历突然的变故——闪婚闪离、感情骤变。需要用心经营，防止因一时冲动做出不可挽回的决定。',
          '福德': '地劫入福德宫：精神上容易有突发的情绪波动。但也代表在逆境中能获得深刻的人生感悟。',
          '田宅': '地劫入田宅宫：家中可能有突发变故。不动产投资需格外谨慎，防止突然贬值或纠纷。',
          '迁移': '地劫入迁移宫：出门容易遇到突发状况。旅途中需防意外。但也代表在陌生环境中能有意外收获。',
          '疾厄': '地劫入疾厄宫：健康上需防突发疾病和意外伤害。定期体检非常重要。',
          '子女': '地劫入子女宫：在子女方面可能有意外之事。投资上防止突然亏损。',
          '兄弟': '地劫入兄弟宫：与朋友兄弟的关系可能有突变。防止被朋友突然背叛或拖累。',
          '父母': '地劫入父母宫：与长辈关系可能有突变。学业上可能因意外中断。',
          '仆役': '地劫入交友宫：朋友圈可能突然变化。需防被人突然坑害。'
        },
        '红鸾': { base: '红鸾为正桃花星，主婚嫁喜事、异性缘佳。入命者容貌姣好、有异性魅力。逢流年红鸾时有结婚机会。' },
        '天喜': { base: '天喜为喜庆之星，主添丁之喜、好事临门。与红鸾对宫呼应，主人缘好、生活中喜事多。' },
        '华盖': { base: '华盖为孤高之星，主聪明、才华、孤独。有宗教哲学缘分，适合做学术研究。但也主性格清高不合群，容易孤独。' },
        '天刑': { base: '天刑为刑法之星，主法律、纪律、手术。适合从事法律、军警、医疗等行业。入命者性格严肃、纪律性强，但也容易与人对立。' },
        '天姚': { base: '天姚为风流之星，主异性缘、社交魅力。入命者人缘极好、异性缘旺。但过旺则主桃花过多、风流韵事。' },
        '咸池': { base: '咸池为沐浴桃花，主感情丰富、艺术天赋。入命者多情浪漫但也容易沉溺于感情。需注意节制。' }
      };

      // (命宫辅星仍保留简短版)
      html += '<h4>命宫辅星提要</h4>';
      (ming.minorStars||[]).concat(ming.adjectiveStars||[]).forEach(function(s) {
        var interp = minorInterp[s.name];
        if (!interp) return;
        html += '<p style="font-size:.88rem"><strong>' + s.name + (s.brightness?'（'+s.brightness+'）':'') + '</strong> — ' + interp.base.split('。')[0] + '。</p>';
      });
      html += '</div>';
    }

    // ===== 六吉六煞全盘解读 =====
    html += '<div class="interp-card"><h3>六吉六煞全盘解读</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">六吉星（文昌、文曲、左辅、右弼、天魁、天钺）和六煞星（擎羊、陀罗、火星、铃星、地空、地劫）散布在命盘各宫，对每个宫位的主星形成增益或干扰。以下逐一分析它们在您命盘中的位置和影响。</p>';

    // Collect all 12 key minor stars across all palaces
    var sixJi = ['文昌','文曲','左辅','右弼','天魁','天钺'];
    var sixSha = ['擎羊','陀罗','火星','铃星','地空','地劫'];
    var allTwelve = sixJi.concat(sixSha);

    // 六吉星
    html += '<h4 style="color:var(--jade)">六吉星</h4>';
    sixJi.forEach(function(starName) {
      var foundPalace = null, foundStar = null;
      pals.forEach(function(p) {
        (p.minorStars||[]).forEach(function(s) {
          if (s.name === starName) { foundPalace = p; foundStar = s; }
        });
      });
      if (!foundPalace) return;
      var interp = minorInterp[starName]; if (!interp) return;
      var b = foundStar.brightness || '';
      var text = (b && interp[b]) ? interp[b] : interp.base;
      var coStars = (foundPalace.majorStars||[]).filter(function(s){return s.name}).map(function(s){return s.name});

      html += '<div style="border-left:3px solid var(--jade);background:rgba(45,143,111,.04);padding:10px 14px;margin:6px 0;border-radius:0 6px 6px 0">';
      html += '<p><strong style="color:var(--jade)">' + starName + (b ? '（'+b+'）' : '') + '</strong> 在 <strong>' + foundPalace.name + '宫</strong>';
      if (coStars.length) html += '（同宫：' + coStars.join('、') + '）';
      html += '</p>';
      html += '<p>' + text + '</p>';
      html += '</div>';
    });

    // 六煞星
    html += '<h4 style="color:#1a1a1a">六煞星</h4>';
    sixSha.forEach(function(starName) {
      var foundPalace = null, foundStar = null;
      pals.forEach(function(p) {
        (p.minorStars||[]).forEach(function(s) {
          if (s.name === starName) { foundPalace = p; foundStar = s; }
        });
      });
      if (!foundPalace) return;
      var interp = minorInterp[starName]; if (!interp) return;
      var b = foundStar.brightness || '';
      var palaceName = foundPalace.name;

      // For 地空地劫: use palace-specific text
      var text = '';
      if ((starName === '地空' || starName === '地劫') && interp[palaceName]) {
        text = interp[palaceName];
      } else if (b && interp[b]) {
        text = interp[b];
      } else {
        text = interp.base;
      }

      var coStars = (foundPalace.majorStars||[]).filter(function(s){return s.name}).map(function(s){return s.name});
      var isWarn = b === '陷' || starName === '地空' || starName === '地劫';
      var borderColor = isWarn ? '#dc2626' : '#1a1a1a';
      var bgColor = isWarn ? 'rgba(220,38,38,.04)' : 'rgba(26,26,26,.03)';

      html += '<div style="border-left:3px solid '+borderColor+';background:'+bgColor+';padding:10px 14px;margin:6px 0;border-radius:0 6px 6px 0">';
      html += '<p><strong style="color:'+borderColor+'">' + starName + (b ? '（'+b+'）' : '') + '</strong> 在 <strong>' + palaceName + '宫</strong>';
      if (coStars.length) html += '（同宫：' + coStars.join('、') + '）';
      html += '</p>';
      html += '<p>' + text + '</p>';

      // Special warnings for 地空地劫 with financial stars
      if ((starName === '地空' || starName === '地劫') && coStars.length) {
        var hasCai = ['武曲','天府','太阴'].some(function(s){return coStars.indexOf(s)>=0});
        if (hasCai) html += '<p style="color:#dc2626;font-weight:600">' + starName + '与财星同宫，财运受损较重，有财难聚。</p>';
      }
      html += '</div>';
    });

    // 地空地劫同宫特别提示
    var dkPal = null, djPal = null;
    pals.forEach(function(p) {
      (p.minorStars||[]).forEach(function(s) {
        if (s.name === '地空') dkPal = p;
        if (s.name === '地劫') djPal = p;
      });
    });
    if (dkPal && djPal && dkPal.name === djPal.name) {
      html += '<div style="border-left:4px solid #dc2626;background:rgba(220,38,38,.06);padding:12px 16px;margin:10px 0;border-radius:0 6px 6px 0">';
      html += '<p><strong style="color:#dc2626;font-size:1rem">⚠ 地空地劫同宫（' + dkPal.name + '宫）</strong></p>';
      html += '<p>空劫同宫是命盘中影响极大的组合。该宫位代表的领域会经历大起大落、从有到无再从无到有的轮回。但也代表此人在该领域有超越常人的悟性和突破能力。「置之死地而后生」正是空劫同宫者的写照。</p>';
      html += '</div>';
    }

    html += '</div>';

    // ===== 十二宫位 =====
    var kps = [{n:'官禄',t:'事业'},{n:'财帛',t:'财运'},{n:'夫妻',t:'感情'},{n:'子女',t:'子女桃花'},{n:'疾厄',t:'健康'},{n:'福德',t:'精神'},{n:'迁移',t:'外出'},{n:'田宅',t:'不动产'}];
    html += '<div class="interp-card"><h3>重要宫位</h3>';
    kps.forEach(function(kn) {
      var kp = pals.find(function(p){return p.name===kn.n}); if (!kp) return;
      var mj = (kp.majorStars||[]).filter(function(s){return s.name});
      html += '<h4>' + kn.n + '（' + kn.t + '）— ' + (kp.heavenlyStem||'')+(kp.earthlyBranch||'') + '</h4>';
      html += '<p>主星：' + (mj.map(function(s){return s.name+(s.brightness?'('+s.brightness+')':'')+(s.mutagen?' '+s.mutagen:'')}).join('、')||'无主星') + '</p>';
      var pr = PALACE_READINGS[kn.n+'宫']; if (pr) mj.forEach(function(s){ if (pr.stars && pr.stars[s.name]) html += '<p>' + pr.stars[s.name] + '</p>'; });
    });
    html += '</div>';

    // ===== 四化 =====
    // ===== 生年四化（三合派+飞星派） =====
    html += '<div class="interp-card"><h3>生年四化（命盘四化）</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">生年四化由出生年天干决定，是命盘中最核心的动态因素。禄权科忌四颗化星分布在不同宫位，揭示此人一生的核心能量走向。</p>';
    var huaFull = ['化禄','化权','化科','化忌'];
    var huaShort = ['禄','权','科','忌'];
    var huaColors = ['var(--jade)','var(--gold)','var(--water)','#1a1a1a'];
    var mutagenStars = [];
    pals.forEach(function(p) {
      (p.majorStars||[]).concat(p.minorStars||[]).forEach(function(s) {
        if (s.mutagen) mutagenStars.push({star:s.name, hua:s.mutagen, palace:p.name});
      });
    });
    // 四格卡片显示
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0">';
    huaShort.forEach(function(shortLabel, idx) {
      var found = mutagenStars.find(function(m){ return m.hua === shortLabel || m.hua === huaFull[idx]; });
      var bg = idx === 3 ? 'rgba(26,26,26,.08)' : idx === 0 ? 'rgba(45,143,111,.06)' : idx === 1 ? 'rgba(197,146,46,.06)' : 'rgba(21,101,192,.06)';
      var borderC = idx === 3 ? '#1a1a1a' : 'var(--border)';
      html += '<div style="text-align:center;padding:12px 6px;border-radius:8px;background:' + bg + ';border:1px solid ' + borderC + '">';
      html += '<div style="font-size:.78rem;color:' + huaColors[idx] + ';font-weight:700">' + huaFull[idx] + '</div>';
      html += '<div style="font-size:1.2rem;font-weight:900;font-family:var(--font-h);margin:6px 0;color:' + huaColors[idx] + '">' + (found ? found.star : '—') + '</div>';
      html += '<div style="font-size:.78rem;color:var(--ink-light)">' + (found ? found.palace + '宫' : '') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    // 逐条解读
    mutagenStars.forEach(function(m) {
      var idx = huaShort.indexOf(m.hua); if (idx < 0) idx = huaFull.indexOf(m.hua);
      var fullLabel = idx >= 0 ? huaFull[idx] : m.hua;
      var color = idx >= 0 ? huaColors[idx] : 'var(--ink)';
      var hd = SIHUA_EFFECTS[fullLabel]; var pd = hd ? hd[m.palace] : '';
      html += '<p><strong style="color:' + color + '">' + m.star + ' ' + fullLabel + '</strong> 在' + m.palace + '宫' + (pd ? ' — ' + pd : '') + '</p>';
    });

    // 飞星派：宫干四化（每宫天干飞出的四化）
    html += '<h4>飞星四化（宫干飞化）</h4>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">飞星派的核心：每个宫位的天干各自飞出禄权科忌四化到其他宫位，形成宫与宫之间的能量关系网络。</p>';

    // 天干四化表
    var SIHUA_TABLE = {
      '甲':['廉贞','破军','武曲','太阳'],'乙':['天机','天梁','紫微','太阴'],
      '丙':['天同','天机','文昌','廉贞'],'丁':['太阴','天同','天机','巨门'],
      '戊':['贪狼','太阴','右弼','天机'],'己':['武曲','贪狼','天梁','文曲'],
      '庚':['太阳','武曲','太阴','天同'],'辛':['巨门','太阳','文曲','文昌'],
      '壬':['天梁','紫微','左辅','武曲'],'癸':['破军','巨门','太阴','贪狼']
    };

    // Show key palace flying stars (命宫, 官禄, 财帛, 夫妻)
    var keyFlyPalaces = ['命宫','官禄','财帛','夫妻','福德','迁移'];
    keyFlyPalaces.forEach(function(palaceName) {
      var pal = pals.find(function(p){return p.name === palaceName});
      if (!pal || !pal.heavenlyStem) return;
      var stem = pal.heavenlyStem;
      var sihuaRow = SIHUA_TABLE[stem];
      if (!sihuaRow) return;

      html += '<details class="yearly-detail"><summary class="yearly-summary">';
      html += '<span class="yr-year">' + palaceName + '宫</span>';
      html += '<span class="yr-gz">' + stem + '干</span>';
      html += '<span style="font-size:.75rem;color:var(--ink-light)">飞 ' + sihuaRow.map(function(s,i){return s+huaFull[i].charAt(1)}).join(' ') + '</span>';
      html += '</summary><div class="yearly-content">';

      // Find where each star lands
      sihuaRow.forEach(function(starName, idx) {
        var landPalace = '';
        pals.forEach(function(pp) {
          (pp.majorStars||[]).concat(pp.minorStars||[]).forEach(function(ss) {
            if (ss.name === starName) landPalace = pp.name;
          });
        });
        if (landPalace) {
          var isSelf = (landPalace === palaceName);
          html += '<p>' + '<strong style="color:' + huaColors[idx] + '">' + starName + ' ' + huaFull[idx] + '</strong> → ' + landPalace + '宫' + (isSelf ? ' <span style="color:var(--vermillion);font-weight:700">（自化' + huaFull[idx].charAt(1) + '）</span>' : '') + '</p>';
        }
      });
      html += '</div></details>';
    });
    html += '</div>';

    // ===== 自化解读 =====
    var selfHuaData = [];
    pals.forEach(function(p) {
      ['禄','权','科','忌'].forEach(function(h) {
        try {
          if (p.selfMutaged(h)) {
            // Find which star causes the self-hua
            var SIHUA_TABLE2 = {
              '甲':['廉贞','破军','武曲','太阳'],'乙':['天机','天梁','紫微','太阴'],
              '丙':['天同','天机','文昌','廉贞'],'丁':['太阴','天同','天机','巨门'],
              '戊':['贪狼','太阴','右弼','天机'],'己':['武曲','贪狼','天梁','文曲'],
              '庚':['太阳','武曲','太阴','天同'],'辛':['巨门','太阳','文曲','文昌'],
              '壬':['天梁','紫微','左辅','武曲'],'癸':['破军','巨门','太阴','贪狼']
            };
            var huaIdx = ['禄','权','科','忌'].indexOf(h);
            var stem = p.heavenlyStem;
            var starName = (SIHUA_TABLE2[stem]||[])[huaIdx] || '';
            selfHuaData.push({ palace: p.name, hua: h, star: starName, stem: stem });
          }
        } catch(e) {}
      });
    });

    if (selfHuaData.length > 0) {
      html += '<div class="interp-card"><h3>自化解读</h3>';
      html += '<p style="font-size:.84rem;color:var(--ink-light)">自化是飞星派的核心概念。当一个宫位的天干所飞出的四化星恰好就在本宫内时，称为「自化」。自化意味着该宫位的能量会自动向外流动或内化，对命主有深远影响。</p>';

      var selfHuaInterp = {
        '禄': {
          general: '自化禄意味着该宫位的福气会自动外泄。虽然本宫看似有禄，但财气、福气留不住，容易流失到外面。',
          palaces: {
            '命宫': '命宫自化禄：命主天生乐于付出，慷慨大方但不善积累。常为他人做嫁衣，自己的好运容易被人分享。性格随和不计较，但需学会适当保留。',
            '财帛': '财帛宫自化禄：赚钱容易但守财难。财来财去，钱财过手而不留。花钱大方，或有漏财现象。需要特别注意理财规划。',
            '官禄': '官禄宫自化禄：事业上容易把机会让给别人。工作中付出多但功劳常被人拿走。适合做幕后工作，不适合争功。',
            '夫妻': '夫妻宫自化禄：感情上付出多于回报。对伴侣好但未必得到同等回馈。需学会在付出中保持自我。',
            '福德': '福德宫自化禄：精神上的满足感不持久。追求的快乐总是短暂的，需要不断寻找新的兴趣点。',
            '田宅': '田宅宫自化禄：家产不聚，房产投资需谨慎。家中的好东西容易流失或被人借去不还。',
            '迁移': '迁移宫自化禄：出门在外容易破费。社交中常请客做东，人缘好但花费大。',
            '父母': '父母宫自化禄：与长辈的缘分深但也容易疏远。学业上起步好但难以坚持到底。',
            '兄弟': '兄弟宫自化禄：对朋友兄弟慷慨，但容易因此破财。合伙经营需格外谨慎。',
            '子女': '子女宫自化禄：在子女身上投入大但回报期长。投资容易有去无回。桃花来了也留不住。',
            '疾厄': '疾厄宫自化禄：身体底子不错但容易大意忽视保养。健康上的优势可能被不良习惯消耗。',
            '仆役': '交友宫自化禄：人缘极好但容易被朋友利用。需学会分辨真心朋友。'
          }
        },
        '权': {
          general: '自化权意味着该宫位的权力和掌控感会自动增强。本宫有自主行动的冲劲，但也可能过于强势。',
          palaces: {
            '命宫': '命宫自化权：个性极强，自主意识很重。不喜欢被人管束，凡事要自己做主。领导力强但也容易独断。',
            '财帛': '财帛宫自化权：对金钱有很强的掌控欲。善于积极赚钱，敢于投资冒险。财运靠自己打拼而来。',
            '官禄': '官禄宫自化权：事业心极强，工作中有魄力有主见。适合做管理者和决策者。可能工作狂倾向。',
            '夫妻': '夫妻宫自化权：在感情中较为主导强势。容易掌控关系走向，但需给伴侣足够空间。',
            '福德': '福德宫自化权：精神世界有很强的主见。不轻易受外界影响，内心有自己的坚持。',
            '迁移': '迁移宫自化权：在外交际中有主导权。适合做社交领袖，在外地发展有掌控力。',
            '田宅': '田宅宫自化权：对家庭事务有强烈的掌控欲。在家中说了算，置产投资果断。',
            '父母': '父母宫自化权：与长辈关系中你较为主动。在学业上有自主学习能力。',
            '兄弟': '兄弟宫自化权：在朋友圈中有号召力。常担任组织者角色。',
            '子女': '子女宫自化权：对子女教育有强烈主见。投资上敢于冒险，有魄力。',
            '疾厄': '疾厄宫自化权：身体有自我修复能力，但也可能过度消耗体力。',
            '仆役': '交友宫自化权：在社交圈中有领导地位。朋友关系中你是掌控者。'
          }
        },
        '科': {
          general: '自化科意味着该宫位有贵人运和名声运自动加持。但科的力量偏柔，名声来得快去得也快。',
          palaces: {
            '命宫': '命宫自化科：天生有学者气质，给人文雅有涵养的印象。名声运好但不持久，需要持续经营。',
            '财帛': '财帛宫自化科：赚钱方式文雅体面。靠知识、名声赚钱。但科是虚名，实际收入可能不如表面。',
            '官禄': '官禄宫自化科：事业上有一定知名度。擅长包装自己，但实力需要跟上名声。',
            '夫妻': '夫妻宫自化科：配偶有文化修养，感情中注重精神交流。',
            '福德': '福德宫自化科：精神生活充实，有高雅的兴趣爱好。',
            '迁移': '迁移宫自化科：在外有好名声。适合从事需要展示形象的工作。',
            '田宅': '田宅宫自化科：居住环境优雅有品味。',
            '父母': '父母宫自化科：学业运好，适合读书考试。',
            '兄弟': '兄弟宫自化科：朋友中有文人雅士。社交圈有品位。',
            '子女': '子女宫自化科：子女聪明好学。桃花有文雅气质。',
            '疾厄': '疾厄宫自化科：有病能遇到好医生。健康问题能得到及时关注。',
            '仆役': '交友宫自化科：交往的朋友有文化水平。'
          }
        },
        '忌': {
          general: '自化忌是最需要注意的自化。意味着该宫位的能量会自我消耗、自我纠结。该宫所代表的领域容易出现困扰、执着、损耗。是命盘中的重要警示信号。',
          palaces: {
            '命宫': '命宫自化忌：命主容易自我纠结、自我否定。内心常有不安全感和焦虑。需要学会放过自己，不要对自己太苛刻。多培养自信心。',
            '财帛': '财帛宫自化忌：财运上容易自找麻烦。投资判断失误、花钱没有计划、赚钱辛苦。需特别注意理财，避免冲动消费和盲目投资。',
            '官禄': '官禄宫自化忌：事业上容易自设障碍。工作中总觉得不顺心，容易钻牛角尖。需学会放下执念，接受不完美。',
            '夫妻': '夫妻宫自化忌：感情中容易自寻烦恼。对伴侣的小事过度在意，疑心重。需学会信任和放手。婚姻中的问题多源于自身心态。',
            '福德': '福德宫自化忌：精神上容易焦虑不安、胡思乱想。内心难以平静，常有莫名的忧虑。建议学习冥想或信仰，让心灵有所归依。',
            '田宅': '田宅宫自化忌：在房产、家庭事务上容易出问题。居住不安稳，搬家频繁。家中需注意安全隐患。',
            '迁移': '迁移宫自化忌：出门在外容易遇到麻烦。社交中容易因言语不当引起误会。出行需谨慎。',
            '父母': '父母宫自化忌：与长辈关系有压力。学业上容易中途放弃。文书合同需仔细审查。',
            '兄弟': '兄弟宫自化忌：与兄弟朋友之间容易有矛盾。合伙经营风险大。需防借贷纠纷。',
            '子女': '子女宫自化忌：在子女教育上操心多。投资容易亏损。桃花运有困扰。',
            '疾厄': '疾厄宫自化忌：健康方面需要特别关注。容易因自己的不良习惯导致疾病。定期体检很重要。',
            '仆役': '交友宫自化忌：容易遇到损友。在人际交往中吃亏。需学会辨别朋友。'
          }
        }
      };

      selfHuaData.forEach(function(sh) {
        var interp = selfHuaInterp[sh.hua] || {};
        var palaceInterp = (interp.palaces || {})[sh.palace] || '';
        var shBg = sh.hua==='忌'?'rgba(220,38,38,.06)':sh.hua==='禄'?'rgba(22,163,74,.06)':sh.hua==='权'?'rgba(217,119,6,.06)':'rgba(37,99,235,.06)';
        var shBorder = sh.hua==='忌'?'#dc2626':sh.hua==='禄'?'#16a34a':sh.hua==='权'?'#d97706':'#2563eb';

        html += '<div style="background:'+shBg+';border-left:4px solid '+shBorder+';padding:14px 18px;margin:10px 0;border-radius:0 8px 8px 0">';
        html += '<h4 style="color:'+shBorder+';margin-bottom:6px">' + sh.palace + '宫 自化' + sh.hua + '</h4>';
        html += '<p style="font-size:.85rem;color:var(--ink-light)">' + sh.stem + '干 → ' + sh.star + ' 化' + sh.hua + '（星在本宫，形成自化）</p>';
        if (palaceInterp) html += '<p>' + palaceInterp + '</p>';
        else if (interp.general) html += '<p>' + interp.general + '</p>';
        html += '</div>';
      });

      html += '</div>';
    }

    // ===== 大运走势（每段可展开详解） =====
    html += '<div class="interp-card"><h3>大运走势</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">大运每十年一变，揭示人生不同阶段的运势主题。点击展开查看每段大运详解。</p>';

    // Scrollable timeline
    html += '<div class="dayun-timeline">';
    var sorted = pals.slice().sort(function(a,b){ return ((a.decadal&&a.decadal.range)?a.decadal.range[0]:999)-((b.decadal&&b.decadal.range)?b.decadal.range[0]:999); });
    sorted.forEach(function(p) {
      if (!p.decadal||!p.decadal.range) return; var dr=p.decadal.range; var isCur = currentAge>=dr[0]&&currentAge<=dr[1];
      html += '<div class="dayun-item'+(isCur?' current':'')+'">';
      html += '<div class="dayun-age">'+dr[0]+'~'+dr[1]+'岁</div>';
      html += '<div class="dayun-gz">'+(p.decadal.heavenlyStem||'')+(p.decadal.earthlyBranch||'')+'</div>';
      html += '<div class="dayun-palace">'+p.name+'</div>';
      var mj=(p.majorStars||[]).filter(function(s){return s.name}).map(function(s){return s.name});
      if (mj.length) html += '<div class="dayun-stars">'+mj.join(' ')+'</div>';
      html += '</div>';
    });
    html += '</div>';

    // Each 大运 expandable detail
    sorted.forEach(function(p) {
      if (!p.decadal||!p.decadal.range) return;
      var dr = p.decadal.range;
      var isCur = currentAge>=dr[0]&&currentAge<=dr[1];
      var decGZ = (p.decadal.heavenlyStem||'')+(p.decadal.earthlyBranch||'');
      var majors = (p.majorStars||[]).filter(function(s){return s.name});
      var minors = (p.minorStars||[]).filter(function(s){return s.name});

      html += '<details class="yearly-detail' + (isCur?' current-year-detail':'') + '"' + (isCur?' open':'') + '>';
      html += '<summary class="yearly-summary">';
      html += '<span class="yr-year">' + dr[0] + '~' + dr[1] + '岁</span>';
      html += '<span class="yr-gz">' + decGZ + '</span>';
      html += '<span class="yr-palace">' + p.name + '</span>';
      if (majors.length) html += '<span class="yr-age" style="font-size:.78rem">' + majors.map(function(s){return s.name}).join(' ') + '</span>';
      if (isCur) html += '<span class="yr-current">当前</span>';
      html += '</summary>';
      html += '<div class="yearly-content">';

      // 1. 宫位总论
      html += '<p><strong>大运行至' + p.name + '：</strong>' + (DAYUN_INTERP[p.name]||'此运运势平稳，宜顺势而为。') + '</p>';

      // 2. 大运干支
      html += '<p><strong>大运干支：</strong>' + decGZ + '</p>';

      // 3. 主星解读
      if (majors.length > 0) {
        html += '<p><strong>此运主星：</strong>' + majors.map(function(s){return s.name+(s.brightness?'('+s.brightness+')':'')+(s.mutagen?' '+s.mutagen:'')}).join('、') + '</p>';
        majors.forEach(function(s) {
          var si = STAR_INTERPRETATIONS[s.name];
          if (si) {
            html += '<p style="padding-left:12px;border-left:2px solid var(--border,#e8e4dd)"><strong>' + s.name + '行运：</strong>';
            if (p.name === '官禄' || p.name === '命宫') html += si.career;
            else if (p.name === '财帛' || p.name === '田宅') html += si.wealth;
            else if (p.name === '夫妻' || p.name === '子女') html += si.relationship;
            else if (p.name === '疾厄') html += si.health;
            else html += si.personality;
            html += '</p>';
          }
        });
      } else {
        html += '<p>此宫无主星坐守，大运影响较为中性。需参考对宫和三方四正的星曜综合判断。运势起伏不大，宜稳健为主。</p>';
      }

      // 4. 辅星影响
      if (minors.length > 0) {
        html += '<p><strong>辅星影响：</strong>' + minors.map(function(s){return s.name}).join('、') + '</p>';
        var goodCount = 0, badCount = 0;
        minors.forEach(function(s) {
          if (['文昌','文曲','左辅','右弼','天魁','天钺','禄存','天马'].indexOf(s.name) >= 0) goodCount++;
          if (['擎羊','陀罗','火星','铃星','地空','地劫'].indexOf(s.name) >= 0) badCount++;
        });
        if (goodCount > badCount) html += '<p>吉星辅助较多，此运整体顺利，贵人运佳，做事多有助力。</p>';
        else if (badCount > goodCount) html += '<p>煞星影响较大，此运需注意防范小人和意外。遇事宜沉着冷静，三思后行。</p>';
        else html += '<p>吉凶参半，此运有机遇也有挑战。关键在于把握时机、化解困难。</p>';
      }

      // 5. 杂曜提示
      var keyAdj = (p.adjectiveStars||[]).filter(function(s){return s.name && ['红鸾','天喜','华盖','天刑','天姚','咸池','孤辰','寡宿','天哭','天虚'].indexOf(s.name)>=0});
      if (keyAdj.length > 0) {
        var adjNotes = {
          '红鸾':'红鸾入运，此十年桃花运旺盛，单身者有望遇到佳偶。','天喜':'天喜入运，喜庆之事频现，可能有婚嫁、添丁等好事。',
          '华盖':'华盖入运，适合修行进修，学术研究有成。但也主孤独清高。','天刑':'天刑入运，适合从事法律、医疗行业，但需防官非诉讼。',
          '天姚':'天姚入运，异性缘极佳，社交活跃。需注意感情分寸。','咸池':'咸池入运，桃花旺但需防烂桃花，感情上宜理智。',
          '孤辰':'孤辰入运，此运较为孤独，宜专注个人成长和事业发展。','寡宿':'寡宿入运，感情上可能较为冷淡，宜多关心伴侣。',
          '天哭':'天哭入运，情绪波动较大，可能有悲伤之事。宜调整心态。','天虚':'天虚入运，防止虚耗钱财和精力，做事务实为上。'
        };
        keyAdj.forEach(function(s) { if (adjNotes[s.name]) html += '<p style="font-size:.85rem">' + adjNotes[s.name] + '</p>'; });
      }

      // 6. 大运四化（从horoscope获取）
      try {
        var midAge = Math.floor((dr[0]+dr[1])/2);
        var midYear = birthYear + midAge;
        var horo = astrolabe.horoscope(midYear + '-6-15');
        if (horo && horo.decadal && horo.decadal.mutagen) {
          var huaNames = ['化禄','化权','化科','化忌'];
          html += '<p><strong>大运四化：</strong>';
          horo.decadal.mutagen.forEach(function(star,idx) {
            html += star + (huaNames[idx]||'') + '　';
          });
          html += '</p>';
          // Explain each hua
          horo.decadal.mutagen.forEach(function(star,idx) {
            var starPalace = '';
            pals.forEach(function(pp) { (pp.majorStars||[]).concat(pp.minorStars||[]).forEach(function(ss){ if(ss.name===star) starPalace=pp.name; }); });
            if (starPalace && huaNames[idx]) {
              var eff = SIHUA_EFFECTS[huaNames[idx]];
              if (eff && eff[starPalace]) html += '<p style="font-size:.85rem;padding-left:12px;border-left:2px solid var(--border,#e8e4dd)">' + star+huaNames[idx]+'入'+starPalace+'：'+eff[starPalace] + '</p>';
            }
          });
        }
      } catch(e) {}

      // 7. 综合评价
      html += '<p style="margin-top:8px;font-style:italic;color:var(--ink-light)">';
      if (majors.length >= 2) html += '此运双星坐守，能量充沛，是人生重要的发展阶段。';
      else if (majors.length === 1) html += '此运单星主导，方向明确，宜专注深耕。';
      else html += '此运宫位空旷，宜随遇而安，以不变应万变。';
      html += '</p>';

      html += '</div></details>';
    });
    html += '</div>';

    // ===== 逐年运势展开（核心新功能） =====
    html += '<div class="interp-card"><h3>逐年运势详解</h3>';
    html += '<p style="font-size:.84rem;color:var(--ink-light)">点击展开查看每年详细运势。流年命宫入不同宫位，结合大运与流年四化综合论断。</p>';

    // Generate 15 years: from age 1 to current+5, grouped by 大运
    var startYr = Math.max(currentYear - 5, birthYear + 1);
    var endYr = currentYear + 5;
    var lastDecadalGZ = '';

    for (var yr = startYr; yr <= endYr; yr++) {
      try {
        var horo = astrolabe.horoscope(yr + '-6-15');
        if (!horo || !horo.yearly) continue;
        var age = yr - birthYear;
        var isCurYr = (yr === currentYear);
        var decGZ = (horo.decadal?horo.decadal.heavenlyStem:'')+(horo.decadal?horo.decadal.earthlyBranch:'');

        // 大运分隔线
        if (decGZ !== lastDecadalGZ) {
          var decPalName = horo.decadal && horo.decadal.palaceNames ? horo.decadal.palaceNames[0] : '';
          html += '<div style="margin:16px 0 8px;padding:8px 12px;background:var(--ink,#1a1a2e);color:var(--gold-light,#e8d5a3);border-radius:4px;font-family:var(--font-h);font-size:.88rem">';
          html += '大运 ' + decGZ + ' — ' + decPalName;
          if (horo.decadal && horo.decadal.mutagen) html += ' | 运四化：' + horo.decadal.mutagen.join('、');
          html += '</div>';
          lastDecadalGZ = decGZ;
        }

        // 流年卡片
        html += '<details class="yearly-detail' + (isCurYr ? ' current-year-detail' : '') + '"' + (isCurYr ? ' open' : '') + '>';
        html += '<summary class="yearly-summary">';
        html += '<span class="yr-year">' + yr + '年</span>';
        html += '<span class="yr-gz">' + (horo.yearly.heavenlyStem||'') + (horo.yearly.earthlyBranch||'') + '</span>';
        html += '<span class="yr-age">' + age + '岁</span>';
        html += '<span class="yr-palace">命宫→' + (horo.yearly.palaceNames ? horo.yearly.palaceNames[0] : '') + '</span>';
        if (isCurYr) html += '<span class="yr-current">今年</span>';
        html += '</summary>';

        // 展开内容
        html += '<div class="yearly-content">';

        // 流年命宫所在宫位
        var yrMingPalace = horo.yearly.palaceNames ? horo.yearly.palaceNames[0] : '';
        if (yrMingPalace) {
          html += '<p><strong>流年命宫入' + yrMingPalace + '：</strong>' + (LIUNIAN_INTERP[yrMingPalace]||'运势平稳。') + '</p>';
        }

        // 流年四化
        if (horo.yearly.mutagen && horo.yearly.mutagen.length) {
          html += '<p><strong>流年四化：</strong>';
          var huaNames = ['化禄','化权','化科','化忌'];
          horo.yearly.mutagen.forEach(function(star, idx) {
            html += star + (huaNames[idx]||'') + '　';
          });
          html += '</p>';

          // 四化入宫解读
          if (horo.yearly.palaceNames) {
            horo.yearly.mutagen.forEach(function(star, idx) {
              // Find which natal palace this star is in
              var starPalace = '';
              pals.forEach(function(p) {
                (p.majorStars||[]).concat(p.minorStars||[]).forEach(function(s) {
                  if (s.name === star) starPalace = p.name;
                });
              });
              if (starPalace && huaNames[idx]) {
                var eff = SIHUA_EFFECTS[huaNames[idx]];
                if (eff && eff[starPalace]) {
                  html += '<p style="font-size:.85rem;padding-left:12px;border-left:2px solid var(--border,#e8e4dd)">' +
                    star + huaNames[idx] + '（' + starPalace + '宫）：' + eff[starPalace] + '</p>';
                }
              }
            });
          }
        }

        // 大运信息
        if (horo.decadal) {
          html += '<p style="font-size:.84rem;color:var(--ink-light)"><strong>所在大运：</strong>' +
            (horo.decadal.heavenlyStem||'') + (horo.decadal.earthlyBranch||'') +
            (horo.decadal.palaceNames ? '（' + horo.decadal.palaceNames[0] + '）' : '') + '</p>';
        }

        // 小限
        if (horo.age && horo.age.palaceNames) {
          html += '<p style="font-size:.84rem;color:var(--ink-light)"><strong>小限：</strong>' +
            (horo.age.heavenlyStem||'') + (horo.age.earthlyBranch||'') +
            '（命宫→' + horo.age.palaceNames[0] + '）</p>';
        }

        html += '</div></details>';
      } catch(e) { /* skip year on error */ }
    }
    html += '</div>';

    return html;
    } catch(err) {
      console.error('renderIztro error:', err);
      return '<div class="interp-card"><p style="color:red">渲染出错：' + err.message + '</p></div>';
    }
  }

  return { calculate: calculate, render: render, renderIztro: renderIztro };
})();
