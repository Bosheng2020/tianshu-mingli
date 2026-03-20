/**
 * 八字命理推算引擎 (BaZi / Four Pillars of Destiny Engine)
 *
 * 依赖全局 Lunar 对象提供天干地支、五行、纳音等基础数据与转换方法。
 * 导出 calculate(solarYear, solarMonth, solarDay, hourIdx, gender) 与 render(result)。
 */
const BaZi = (function () {
  'use strict';

  /* ====================================================================
   *  常量 & 辅助映射
   * ==================================================================== */

  const WX_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const WX_KE   = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  const ZHI_SEASON = {
    '寅': '春', '卯': '春',
    '巳': '夏', '午': '夏',
    '申': '秋', '酉': '秋',
    '亥': '冬', '子': '冬',
    '辰': '季', '未': '季', '戌': '季', '丑': '季'
  };

  const SEASON_LABEL = { '春': '春季', '夏': '夏季', '秋': '秋季', '冬': '冬季', '季': '四季土月' };

  const SEASONAL_WEIGHT = {
    '春': { '木': 2, '火': 1.5, '土': 0.7, '金': 0.4, '水': 1 },
    '夏': { '火': 2, '土': 1.5, '金': 0.7, '水': 0.4, '木': 1 },
    '秋': { '金': 2, '水': 1.5, '木': 0.7, '火': 0.4, '土': 1 },
    '冬': { '水': 2, '木': 1.5, '火': 0.7, '土': 0.4, '金': 1 },
    '季': { '土': 2, '金': 1.5, '水': 0.7, '木': 0.4, '火': 1 }
  };

  const WT_GAN = 1.0;
  const WT_ZHI_MAIN = 0.7;
  const WT_ZHI_MID  = 0.3;
  const WT_ZHI_REM  = 0.1;

  const SHISHEN_DESC = {
    '比肩': '与日主同类同性，代表自我、朋友、同辈、竞争者',
    '劫财': '与日主同类异性，代表竞争、争夺、手足、冒险',
    '食神': '日主所生同性，代表才华、口福、子女（女命）、安逸',
    '伤官': '日主所生异性，代表智慧、叛逆、表现欲、创造力',
    '偏财': '日主所克异性，代表横财、父亲、外交、投资',
    '正财': '日主所克同性，代表正当收入、妻子（男命）、勤劳',
    '七杀': '克日主异性，代表权威、压力、小人、魄力',
    '正官': '克日主同性，代表名誉、地位、丈夫（女命）、自律',
    '偏印': '生日主异性，代表偏学、灵感、孤独、另类才能',
    '正印': '生日主同性，代表学业、母亲、贵人、庇护'
  };

  /* ====================================================================
   *  日主详批（十天干）
   * ==================================================================== */

  const DAY_MASTER_READINGS = {
    '甲': {
      label: '甲木 — 参天巨木',
      nature: '阳木',
      summary: '甲木为十干之首，犹如苍松翠柏，参天而立。禀阳刚正直之气，有顶天立地之姿。',
      personality: '甲木之人正直磊落，志向远大，天生具备领袖气质。如参天大树般傲然挺立于世，有主见、有担当，做事光明磊落，绝不弯腰屈膝。为人重仁义、讲原则，宁折不弯。心胸宽广，能容人之过，乐于提携后辈。然甲木过刚则易折，性格固执时听不进他人劝告，宜学会圆融变通之道。甲木人自尊心极强，一旦受辱则难以释怀，需注意控制情绪。',
      career: '甲木人天生适合做领导者和决策者。宜从事管理、行政、教育、法律、文化传媒、建筑规划等需要魄力与远见的行业。甲木人做事有章法、有条理，善于制定长远规划。在仕途上容易获得赏识和提拔。创业者中甲木人成功率较高，因其坚韧不拔、百折不挠的品质。然需注意不宜独断专行，团队合作方能事半功倍。',
      wealth: '甲木人重义轻财，不善斤斤计较，但正财运稳定。适合靠专业技能和管理能力获取稳定收入，不宜投机冒险。中年后财运渐旺，晚年多有积蓄。若八字中财星健旺，则一生衣食无忧；若财星过弱，则需脚踏实地、勤勉经营。',
      relationship: '甲木人在感情中较为主动，喜欢照顾和保护对方。男命有大丈夫气概，对伴侣忠诚负责，但有时过于严肃刻板；女命独立自主，不愿依附他人，择偶标准较高。甲木人配偶宜温和柔顺之人为佳，水木相济则感情和美。婚后甲木人是可靠的家庭支柱。',
      health: '甲木五行属肝胆，对应人体筋骨、头部、毛发。需注意肝脏保养，忌酗酒熬夜。容易出现筋骨劳损、头痛、眼疾等问题。春季出生者体质较好，秋季出生者肝气受克需格外注意养生。建议多亲近自然、早起运动，保持肝气舒畅。'
    },
    '乙': {
      label: '乙木 — 花草藤蔓',
      nature: '阴木',
      summary: '乙木为阴木，犹如花草藤蔓，柔韧灵活。外表温和内心坚韧，善于随机应变。',
      personality: '乙木之人温柔细腻，心思敏感，善于观察人情世故。如藤蔓般看似柔弱，实则韧性极强，能屈能伸。为人含蓄内敛，不争不抢，但内心自有主张。待人亲和，善于倾听，人缘极佳。乙木人心地善良，富有同情心，常不自觉地帮助弱者。然乙木人有时过于优柔寡断，容易受外界影响而左右摇摆，需培养果断的决策能力。依赖性较强，宜学会独立自主。',
      career: '乙木人适合从事需要细心与耐心的工作。文学、艺术、设计、花艺、中医、心理咨询、公关、外交、秘书等职业皆宜。乙木人善于协调人际关系，是天生的调解者。在团队中扮演润滑剂的角色，能化解矛盾、凝聚人心。不宜从事过于刚猛激烈的行业，柔性管理是其强项。',
      wealth: '乙木人财运温和稳健，不适合大起大落的投资。善于积少成多、细水长流式的理财方式。女命乙木者若财星旺则持家有方；男命乙木者财运多靠人脉与巧思获取。乙木人不贪不急，反而容易在不经意间积累可观财富。',
      relationship: '乙木人在感情中温柔体贴，善解人意。男命较为浪漫多情，懂得营造气氛；女命温婉可人，贤淑有加。乙木人感情细腻，对伴侣的情绪变化极为敏感。然乙木人容易陷入感情纠葛，优柔寡断导致藕断丝连。宜找阳刚果断之人互补，方能长久幸福。',
      health: '乙木同属肝胆系统，但偏重于四肢末梢、皮肤、神经系统。容易出现过敏、皮肤问题、神经衰弱、失眠多梦等症状。情志不舒时易郁闷成疾，需保持心情愉悦。建议多做舒缓运动如瑜伽、太极，避免过度劳神。'
    },
    '丙': {
      label: '丙火 — 太阳之火',
      nature: '阳火',
      summary: '丙火如日当空，光明普照，热情似火。为人豪爽大方，光彩夺目。',
      personality: '丙火之人热情奔放，活力四射，如太阳般温暖照耀四方。性格开朗豁达，待人真诚直率，毫无城府。天生乐观向上，即使身处逆境也能保持积极心态。丙火人慷慨大方，出手阔绰，朋友遍天下。具有极强的感染力和号召力，走到哪里都是焦点。然丙火人急躁冲动，做事虎头蛇尾，热度来得快去得也快。有时过于张扬高调，容易招人嫉妒。',
      career: '丙火人适合需要展现个人魅力和创造力的行业。演艺、媒体、营销、公关、餐饮、能源、电子、照明等行业皆宜。丙火人天生善于演讲和表达，能够鼓舞人心。适合做开拓型工作，不宜做重复机械的事务。创业热情高涨，但需有稳重的合作伙伴辅佐方能成功。',
      wealth: '丙火人财来财去，大进大出。赚钱能力强但花钱也大方，需注意理财规划。正财偏财皆有机会，但偏财运更佳。投资眼光独到，善于把握风口。中年是财运高峰期，宜在此时多做储蓄和投资。晚年若不注意节制，恐有坐吃山空之虞。',
      relationship: '丙火人在感情中热烈而真诚，爱得轰轰烈烈。男命英俊潇洒、风度翩翩，追求者众；女命活泼开朗、光彩照人，魅力十足。然丙火人感情来得快去得也快，需要学会持之以恒。婚后丙火人是暖心的伴侣，但偶尔的大男子/大女子主义需要收敛。',
      health: '丙火五行属心脏、小肠，对应血液循环系统、眼睛、舌头。需注意心血管疾病、高血压、眼疾。丙火人精力旺盛但容易透支，需注意劳逸结合。夏季出生者火气过旺，尤需注意清心降火。建议保持规律作息，避免过度兴奋和情绪大起大落。'
    },
    '丁': {
      label: '丁火 — 灯烛之火',
      nature: '阴火',
      summary: '丁火如灯烛微光，虽不如太阳耀眼，却能在黑暗中指引方向，温暖人心。',
      personality: '丁火之人温文尔雅，内心热忱但外表含蓄。如烛光般柔和温暖，不张扬但持久。心思细腻，善于体察他人感受，是天生的倾听者和安慰者。丁火人内心世界丰富，富有文艺气质和浪漫情怀。直觉敏锐，第六感极强。然丁火人有时过于多愁善感，容易钻牛角尖，情绪起伏较大。内心的不安全感会让他们反复犹豫。',
      career: '丁火人适合从事文化、教育、研究、心理、宗教、哲学、中医、针灸、烹饪、烘焙等需要细心和悟性的工作。丁火人在幕后工作往往比台前更出色，是优秀的幕僚和智囊。学术研究能力强，适合深耕某一领域。直觉判断力在投资和决策中常有惊人表现。',
      wealth: '丁火人财运平稳，不求大富但衣食无忧。善于精打细算，理财能力优于丙火。偏重正财，靠勤劳和智慧稳步积累。丁火人有独特的投资眼光，尤其在文化产业和创意领域容易获利。不宜贪求快钱，稳扎稳打方为上策。',
      relationship: '丁火人在感情中深情而专一，一旦认定便全心投入。男命温柔体贴，懂得照顾人；女命柔情似水，极具女性魅力。丁火人渴望深层次的心灵交流，表面关系无法满足他们。然丁火人容易为情所困，爱得太深反受伤。宜找性格稳重、能给予安全感的伴侣。',
      health: '丁火同属心脏系统，偏重于血压、视力、精神状态。容易出现心悸、失眠、焦虑、抑郁等精神方面的问题。丁火人夜间思虑过重，影响睡眠质量。建议睡前远离电子设备，培养冥想或静坐的习惯，保持内心宁静。'
    },
    '戊': {
      label: '戊土 — 高山厚土',
      nature: '阳土',
      summary: '戊土如大山般厚重稳固，承载万物，包容一切。为人忠厚老实，值得信赖。',
      personality: '戊土之人稳重踏实，忠厚老实，如大山般沉稳可靠。为人宽厚包容，不计较小事，有容人之量。做事脚踏实地，不好高骛远，一步一个脚印。戊土人守信重诺，说到做到，是最可靠的朋友和伙伴。然戊土人反应较慢，不够灵活变通。性格过于固执保守，不愿接受新事物。有时显得木讷寡言，不善表达内心感情。',
      career: '戊土人适合从事房地产、建筑、农业、矿业、仓储、物流、银行、保险等稳健型行业。戊土人做事稳妥可靠，最适合做需要长期坚持的工作。在企业中是最可信赖的中坚力量。不宜频繁跳槽，在一个领域深耕必有大成。管理方面以德服人，下属忠心。',
      wealth: '戊土人财运稳健，属于厚积薄发型。早年财运一般，但随着年龄和经验的积累，财富会稳步增长。戊土人不善投机但善守财，适合长期投资如房产、基金等。中晚年财运旺盛，往往成为家族的经济支柱。',
      relationship: '戊土人在感情中忠诚专一，是最可靠的伴侣。男命有责任感，顾家爱家；女命贤良淑德，相夫教子。戊土人表达爱意的方式含蓄而实际，不会花言巧语但会用行动证明。然戊土人在感情中太过木讷，需要学会制造浪漫和惊喜。宜找活泼开朗之人互补。',
      health: '戊土五行属脾胃，对应消化系统、肌肉、口腔。需注意胃病、消化不良、肥胖、糖尿病等问题。戊土人容易暴饮暴食或饮食不规律。建议定时定量进餐，少食多餐，避免过于油腻辛辣的食物。适当运动控制体重。'
    },
    '己': {
      label: '己土 — 田园沃土',
      nature: '阴土',
      summary: '己土如田园沃土，滋养万物，默默奉献。为人谦和低调，内藏智慧。',
      personality: '己土之人谦虚谨慎，低调内敛，如田园沃土般默默耕耘、无私奉献。心地善良，乐于助人，但不喜张扬。做事细致周到，考虑周全，是天生的服务者。己土人适应能力强，在任何环境中都能扎根生长。然己土人过于在意他人看法，容易委屈自己成全他人。有时显得自卑胆小，缺乏魄力和冒险精神。',
      career: '己土人适合从事服务业、餐饮、农业、园艺、教育、护理、会计、行政等需要耐心细致的工作。己土人是最好的执行者和协助者，在幕后默默支持团队运转。善于处理繁杂事务，做事滴水不漏。不适合抛头露面的工作，但在专业领域可以成为不可替代的专家。',
      wealth: '己土人财运平稳，属于勤劳致富型。不会一夜暴富但也不会穷困潦倒。善于节流，生活节俭有度。己土人适合做稳定的工薪族或小本经营，不宜大额投资冒险。女命己土者持家有方，是理财小能手。',
      relationship: '己土人在感情中温柔体贴，默默付出型。男命顾家恋家，对伴侣照顾有加；女命温良贤淑，是传统意义上的好妻子好母亲。己土人的爱是润物细无声的，不轰轰烈烈但持久温暖。然己土人容易在感情中失去自我，过度迁就对方反而不被珍惜。需学会适当表达需求。',
      health: '己土同属脾胃系统，偏重于肠道、皮肤、免疫功能。容易出现肠胃炎、便秘、皮肤过敏、免疫力低下等问题。己土人容易思虑过重，忧思伤脾。建议保持乐观心态，注意饮食卫生，适当补充益生菌和膳食纤维。'
    },
    '庚': {
      label: '庚金 — 刀剑之金',
      nature: '阳金',
      summary: '庚金如刀剑般锋利果断，刚毅坚强，疾恶如仇。为人干脆利落，义薄云天。',
      personality: '庚金之人刚毅果敢，行事干脆利落，如刀剑般锋利决断。为人侠义心肠，疾恶如仇，最看不得不公不义之事。性格直爽，有什么说什么，绝不拐弯抹角。庚金人执行力极强，说干就干，雷厉风行。然庚金人过于刚硬则伤人伤己，言语锋利容易得罪人。缺乏耐心和细心，对细节关注不够。有时过于争强好胜，需学会以柔克刚。',
      career: '庚金人适合从事军警、法律、外科医生、金融、钢铁、机械、武术、竞技体育等需要果敢和决断力的行业。庚金人是天生的战士和开拓者，在竞争激烈的环境中如鱼得水。适合做改革者和执法者，在危机时刻能挺身而出。不宜从事需要圆滑外交的工作。',
      wealth: '庚金人财运有起有伏，大进大出。赚钱方式多靠实力和拼搏，适合在竞争中获取财富。正财偏财皆有，但花钱大手大脚，需注意控制支出。庚金人适合做实业投资，不宜做过于保守的理财。中年事业有成后财运稳定上升。',
      relationship: '庚金人在感情中直接了当，不懂得婉转含蓄。男命大男子主义较重，对感情占有欲强；女命个性独立，不愿被约束。庚金人爱憎分明，爱就全力以赴，不爱则干脆断舍离。然庚金人的尖锐言辞容易伤害伴侣感情，需学会温柔表达。宜找温和包容之人为伴。',
      health: '庚金五行属肺、大肠，对应呼吸系统、骨骼、牙齿。需注意肺部疾病、支气管炎、骨折、牙齿问题。庚金人好动好斗，容易受外伤。建议注意运动安全，避免过度激烈的对抗运动。秋季出生者体质较好，夏季出生者肺气受克需养肺。'
    },
    '辛': {
      label: '辛金 — 珠玉之金',
      nature: '阴金',
      summary: '辛金如珠宝美玉，精致细腻，温润有光。为人优雅讲究，品味不凡。',
      personality: '辛金之人温润如玉，精致优雅，对美有天生的鉴赏力。心思敏感细腻，追求完美，注重细节和品质。辛金人自尊心极强，外表柔和但内心有自己的坚持。善于社交，进退有度，在各种场合都能展现得体的风范。然辛金人过于追求完美容易苛求自己和他人，心理压力较大。有时显得冷漠疏离，不易亲近。爱面子，不愿示弱。',
      career: '辛金人适合从事珠宝、美容、时尚、设计、金融分析、会计审计、法务、精密仪器、牙科等需要精细和审美的行业。辛金人在需要精确判断和细致操作的领域表现出色。善于发现美和创造美，艺术鉴赏力极高。适合做专业人士和技术专家。',
      wealth: '辛金人财运优良，善于精打细算。理财能力出众，能在投资中获取稳定收益。辛金人有独到的商业眼光，尤其在奢侈品、艺术品、金融产品等领域容易获利。不喜冒险但善于把握确定性机会。中年后财运渐入佳境。',
      relationship: '辛金人在感情中含蓄矜持，不轻易表露心迹。男命绅士风度，注重仪表和品味；女命优雅知性，气质出众。辛金人对伴侣要求较高，宁缺毋滥。感情中比较被动，需要对方主动追求。然辛金人一旦陷入感情，便极为忠诚和深情。容易因追求完美而错过良缘，需学会接受不完美。',
      health: '辛金同属肺与大肠系统，偏重于皮肤、鼻咽、淋巴系统。容易出现过敏性鼻炎、皮肤敏感、淋巴结肿大等问题。辛金人精神压力大，容易出现焦虑和强迫倾向。建议学会放松减压，多做深呼吸和冥想练习。注意皮肤保养和呼吸道防护。'
    },
    '壬': {
      label: '壬水 — 江河大海',
      nature: '阳水',
      summary: '壬水如江河大海，波澜壮阔，奔流不息。为人聪慧多智，胸襟博大。',
      personality: '壬水之人聪明睿智，思维敏捷，如大海般深不可测。想象力丰富，创造力强，总能提出独到的见解和方案。为人豁达大度，不拘小节，有海纳百川的胸怀。壬水人交际广泛，朋友众多，善于结交各路人脉。然壬水人缺乏恒心和定力，兴趣广泛但难以专精。行事不够稳健，容易随波逐流。有时显得散漫不羁，缺乏责任感。',
      career: '壬水人适合从事贸易、航运、旅游、传媒、互联网、咨询、外交、物流等需要流动性和广泛人脉的行业。壬水人天生善于沟通协调，是出色的谈判者和中间人。在需要创意和灵活应变的领域表现出色。适合做自由职业者或连续创业者，不宜做一成不变的工作。',
      wealth: '壬水人财运如潮水般有涨有落，大起大落是常态。赚钱能力强，来财路子多，但守财能力较弱。壬水人适合做流动资金投资和贸易生意。偏财运佳，时有意外之财。但需注意控制欲望，避免贪多嚼不烂。培养储蓄习惯是壬水人理财的关键。',
      relationship: '壬水人在感情中浪漫多情，善于制造情调和惊喜。男命风流潇洒，桃花运旺；女命聪慧灵动，魅力独特。壬水人的爱情如江水般热烈奔放，但也容易转移目标。感情经历丰富，但需警惕用情不专。婚后需收心养性，专注于家庭。宜找踏实稳重之人为伴。',
      health: '壬水五行属肾、膀胱，对应泌尿生殖系统、骨髓、耳朵。需注意肾脏疾病、泌尿系统感染、腰膝酸软、耳鸣等问题。壬水人精力旺盛但消耗也大，容易透支元气。建议注意节制，避免过度劳累和纵欲。冬季出生者体质较好，夏季出生者需格外补肾养精。'
    },
    '癸': {
      label: '癸水 — 雨露甘霖',
      nature: '阴水',
      summary: '癸水如雨露甘霖，润物无声，滋养万物。为人聪颖灵慧，直觉敏锐。',
      personality: '癸水之人温润如雨，聪颖灵慧，直觉力极强。内心世界如深潭般幽邃莫测，观察力敏锐，能洞察他人不易察觉的细微之处。为人低调谦和，不喜张扬，但内心有坚定的信念。癸水人富有同理心和悲悯之心，常常默默帮助他人。然癸水人有时过于敏感多疑，容易胡思乱想。性格偏柔弱，面对压力时容易退缩逃避。',
      career: '癸水人适合从事研究、文学、艺术、占卜、心理学、医疗、护理、化妆、酒水、清洁等需要细腻感知和直觉判断的行业。癸水人的第六感在很多领域都是独特优势。善于发现隐藏的规律和真相，适合做研究员、分析师、心理咨询师等。在服务行业中，癸水人的细心周到能赢得客户信赖。',
      wealth: '癸水人财运温和，不大起大落。善于节省和规划，生活中精打细算。癸水人适合做稳健型投资，如定期储蓄、债券等。虽不会暴富，但能保证经济安全。癸水人有时会因过于保守而错失赚钱机会，需适当增加风险承受能力。',
      relationship: '癸水人在感情中深情内敛，爱如涓涓细流般持久温润。男命温柔体贴，善解人意，是理想的暖男；女命柔情似水，善于经营感情。癸水人对感情极为忠诚和执着，一旦爱上便难以放手。然癸水人太过敏感容易受伤，需要伴侣给予足够的安全感和回应。宜找阳光开朗之人互补。',
      health: '癸水同属肾与膀胱系统，偏重于血液、内分泌、生殖功能。容易出现贫血、内分泌失调、生殖系统疾病、水肿等问题。癸水人体质偏寒，手脚冰凉是常态。建议注意保暖，多食温补之物，避免生冷食物。冬季需格外注意养生保暖。'
    }
  };

  /* ====================================================================
   *  格局描述
   * ==================================================================== */

  const PATTERN_DESC = {
    '正官': {
      name: '正官格',
      desc: '正官为贵，代表名誉、地位、权威。正官格之人品行端正，循规蹈矩，有很强的自律意识和社会责任感。适合从政、从商、从事管理工作。一生行事光明磊落，容易获得社会地位和名望。需注意不宜过于拘谨保守，适度灵活方能更上一层楼。',
      career: '仕途、管理、行政、法律、大型企业中高层',
      trait: '自律、正直、有责任感、重名誉'
    },
    '七杀': {
      name: '七杀格',
      desc: '七杀为权，代表魄力、勇气、竞争。七杀格之人个性刚烈果断，不畏强权，敢于挑战权威。在竞争激烈的环境中如鱼得水，适合从事军警、竞技、投资等高压力行业。人生起伏较大，大起大落。若七杀有制化，则权威显赫；若七杀无制，则灾祸频仍。',
      career: '军警、投资、创业、竞技体育、改革开拓',
      trait: '果断、刚毅、好胜、有魄力'
    },
    '正财': {
      name: '正财格',
      desc: '正财为禄，代表勤劳、实干、稳健的财富。正财格之人脚踏实地，勤勉持家，靠自己的双手创造财富。为人诚实守信，商业信誉极佳。一生财运平稳，不会大富大贵但衣食无忧。婚姻多美满，家庭幸福。需注意不宜过于保守吝啬，适当投资方能钱生钱。',
      career: '会计、金融、房地产、零售业、稳健投资',
      trait: '勤劳、节俭、守信、务实'
    },
    '偏财': {
      name: '偏财格',
      desc: '偏财为才，代表交际、商机、灵活的财路。偏财格之人善于社交，人脉广泛，商机无限。为人豪爽大方，出手阔绰，能赚能花。偏财运旺盛，常有意外之财。然偏财不稳定，来去如风，需注意理财规划。男命偏财旺者风流多情，需控制桃花。',
      career: '贸易、投资、销售、公关、娱乐业',
      trait: '豪爽、善交际、灵活、有商业头脑'
    },
    '食神': {
      name: '食神格',
      desc: '食神为福，代表才华、安逸、口福。食神格之人才华横溢，生活安逸享受，为人温和有礼。天生的美食家和艺术家，在吃穿住行方面品味极佳。食神生财，靠才华和技能获取财富。一生福禄双全，少灾少难。然过于安逸则失去进取心，需保持适度的危机感。',
      career: '餐饮、文艺、教育、技术研发、自由职业',
      trait: '才华、温和、享受生活、有福气'
    },
    '伤官': {
      name: '伤官格',
      desc: '伤官为秀，代表智慧、创新、叛逆。伤官格之人聪慧过人，思维超前，不拘一格。有极强的创造力和表现欲，在艺术、科技等领域常有惊人之举。然伤官克官，桀骜不驯，容易与领导和权威发生冲突。一生多波折但精彩纷呈。宜从事自由度高的创造性工作。',
      career: '艺术创作、科技创新、律师、自媒体、独立顾问',
      trait: '聪慧、创新、叛逆、表现欲强'
    },
    '正印': {
      name: '正印格',
      desc: '正印为贵，代表学业、母爱、贵人庇护。正印格之人品学兼优，一生多遇贵人扶持。为人慈悲宽厚，有涵养有修养。学业运极佳，适合走学术路线或考取功名。正印护身，少灾少难，一生平顺安稳。然过多正印则使人懒散依赖，缺乏独立性和拼搏精神。',
      career: '教育、学术、公务员、文化事业、慈善',
      trait: '好学、仁慈、有涵养、受贵人扶持'
    },
    '偏印': {
      name: '偏印格',
      desc: '偏印为枭，代表偏才、灵感、孤独。偏印格之人思维独特，常有灵光一现的奇思妙想。在占卜、宗教、艺术、科研等领域有独到天赋。为人孤僻清高，不随波逐流，有自己的精神世界。然偏印夺食，容易心情抑郁、得失无常。需注意精神健康，多与人交流。',
      career: '研究、宗教哲学、占卜命理、技术专利、特殊才艺',
      trait: '独特、灵感强、孤僻、有偏才'
    },
    '比肩': {
      name: '身旺比肩格',
      desc: '比肩为强，代表自我、独立、竞争。比肩旺之人独立自主，不愿依附他人，凡事靠自己。为人豪爽坦率，朋友众多但也容易与人发生竞争。自信心强，有主见有魄力。然比肩过旺则刚愎自用、不易合作。财运需靠自己打拼，不宜合伙经营以免分财争利。',
      career: '自主创业、独立经营、体力劳动、运动员、自由职业',
      trait: '独立、自信、好胜、不服输'
    },
    '劫财': {
      name: '身旺劫财格',
      desc: '劫财为争，代表冒险、争夺、手足。劫财旺之人胆大好冒险，投机心理重。为人仗义疏财，对朋友出手大方但容易因此破财。人生起伏较大，大进大出。需注意理财规划，避免盲目投资和借贷。与朋友合伙需谨慎，防止被骗。宜学会守财和节制。',
      career: '投机、冒险行业、销售、运动竞技',
      trait: '胆大、冒险、仗义、花钱大方'
    }
  };

  /* ====================================================================
   *  健康 → 五行映射
   * ==================================================================== */

  const HEALTH_MAP = {
    '木': { organ: '肝胆', risks: '肝病、胆结石、筋骨劳损、眼疾、头痛、抽筋', advice: '保持情绪舒畅，少饮酒，多食绿色蔬菜，早睡护肝。春季注意疏肝理气。' },
    '火': { organ: '心脏、小肠', risks: '心血管疾病、高血压、眼疾、口舌生疮、失眠', advice: '戒烟限酒，控制情绪波动，避免过度兴奋，注意心脏保养。夏季注意清心降火。' },
    '土': { organ: '脾胃', risks: '胃病、消化不良、糖尿病、肥胖、口腔溃疡', advice: '饮食规律，避免暴饮暴食，少食生冷油腻，多食五谷杂粮。换季时注意脾胃调理。' },
    '金': { organ: '肺、大肠', risks: '呼吸系统疾病、支气管炎、皮肤过敏、便秘、鼻炎', advice: '远离烟尘污染，注意保暖防寒，多做深呼吸运动。秋季注意润肺养阴。' },
    '水': { organ: '肾、膀胱', risks: '肾脏疾病、泌尿系统感染、骨质疏松、耳鸣、腰痛', advice: '注意保暖，避免过度劳累和纵欲，多食黑色补肾食物。冬季注意补肾养精。' }
  };

  /* ====================================================================
   *  calculate(solarYear, solarMonth, solarDay, hourIdx, gender)
   * ==================================================================== */

  function calculate(solarYear, solarMonth, solarDay, hourIdx, gender) {
    var lunar = Lunar.solarToLunar(solarYear, solarMonth, solarDay);

    var yearGZ  = Lunar.yearGanZhi(lunar.year);
    var monthGZ = Lunar.monthGanZhi(yearGZ.ganIdx, lunar.month);
    var dayGZ   = Lunar.dayGanZhi(solarYear, solarMonth, solarDay);
    var hourGZ  = Lunar.hourGanZhi(dayGZ.ganIdx, hourIdx);

    var dayGanIdx = dayGZ.ganIdx;

    function pillarInfo(name, gz) {
      var ganWx  = Lunar.ganWuXing(gz.ganIdx);
      var zhiWx  = Lunar.zhiWuXing(gz.zhiIdx);
      var ganYY  = Lunar.ganYinYang(gz.ganIdx);
      var nayin  = Lunar.getNaYin(gz.ganIdx, gz.zhiIdx);
      var shiShen = (name === '日') ? '日主' : Lunar.shiShen(dayGanIdx, gz.ganIdx);

      var zhiChar = Lunar.DI_ZHI[gz.zhiIdx];
      var cangGanChars = Lunar.CANG_GAN[zhiChar] || [];
      var cangGan = cangGanChars.map(function (ch) {
        var idx = Lunar.TIAN_GAN.indexOf(ch);
        return {
          gan: ch,
          ganIdx: idx,
          wuxing: Lunar.ganWuXing(idx),
          yinyang: Lunar.ganYinYang(idx),
          shiShen: Lunar.shiShen(dayGanIdx, idx)
        };
      });

      return {
        name: name,
        gan: gz.gan,
        zhi: gz.zhi,
        ganIdx: gz.ganIdx,
        zhiIdx: gz.zhiIdx,
        ganWuxing: ganWx,
        zhiWuxing: zhiWx,
        ganYinyang: ganYY,
        text: gz.text,
        nayin: nayin,
        shiShen: shiShen,
        cangGan: cangGan,
        ganClass: Lunar.elementClass(ganWx),
        zhiClass: Lunar.elementClass(zhiWx),
        ganBg: Lunar.elementBgClass(ganWx),
        zhiBg: Lunar.elementBgClass(zhiWx)
      };
    }

    var pillars = [
      pillarInfo('年', yearGZ),
      pillarInfo('月', monthGZ),
      pillarInfo('日', dayGZ),
      pillarInfo('时', hourGZ)
    ];

    // 五行统计（含藏干权重）
    var elements = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    var totalWeight = 0;

    pillars.forEach(function (p) {
      elements[p.ganWuxing] += WT_GAN;
      totalWeight += WT_GAN;

      p.cangGan.forEach(function (cg, i) {
        var w = (i === 0) ? WT_ZHI_MAIN : (i === 1 ? WT_ZHI_MID : WT_ZHI_REM);
        elements[cg.wuxing] += w;
        totalWeight += w;
      });
    });

    var elementPct = {};
    for (var e in elements) {
      elementPct[e] = totalWeight > 0 ? Math.round(elements[e] / totalWeight * 100) : 0;
    }

    // 日主旺衰分析
    var dayMasterWx = pillars[2].ganWuxing;
    var monthZhi = Lunar.DI_ZHI[pillars[1].zhiIdx];
    var season = ZHI_SEASON[monthZhi] || '季';
    var seasonLabel = SEASON_LABEL[season];
    var seasonWeights = SEASONAL_WEIGHT[season];
    var seasonFactor = seasonWeights[dayMasterWx] || 1;

    var supportCount = 0, drainCount = 0;

    pillars.forEach(function (p, idx) {
      if (idx === 2) return;
      var rel = Lunar.shiShen(dayGanIdx, p.ganIdx);
      if (['比肩', '劫财', '正印', '偏印'].indexOf(rel) >= 0) {
        supportCount++;
      } else {
        drainCount++;
      }
      if (p.cangGan.length > 0) {
        var mainRel = p.cangGan[0].shiShen;
        if (['比肩', '劫财', '正印', '偏印'].indexOf(mainRel) >= 0) {
          supportCount++;
        } else {
          drainCount++;
        }
      }
    });

    // 生我的五行
    var motherWx = '';
    for (var k in WX_SHENG) {
      if (WX_SHENG[k] === dayMasterWx) { motherWx = k; break; }
    }

    var strengthScore = elements[dayMasterWx] * seasonFactor + (elements[motherWx] || 0) * 0.6;

    var otherScore = 0;
    for (var wx in elements) {
      if (wx !== dayMasterWx && wx !== motherWx) {
        otherScore += elements[wx];
      }
    }

    var isStrong = strengthScore >= otherScore;
    var strengthDesc = isStrong ? '身强' : '身弱';

    // 用神 / 忌神
    var yongShen, jiShen, yongShenReason, jiShenReason;

    if (isStrong) {
      var keWoWx = '';
      for (var kk in WX_KE) { if (WX_KE[kk] === dayMasterWx) { keWoWx = kk; break; } }
      var woKeWx = WX_KE[dayMasterWx] || '';
      var woShengWx = WX_SHENG[dayMasterWx] || '';

      yongShen = woShengWx;
      jiShen = motherWx;

      if (elements[woShengWx] >= elements[keWoWx]) {
        yongShen = keWoWx;
      }

      yongShenReason = '日主身强，精力过剩，宜用' + yongShen + '（' +
        (yongShen === woShengWx ? '食伤泄秀' : yongShen === woKeWx ? '财星耗身' : '官杀克制') +
        '）来平衡命局，使日主不至于过旺为患。';
      jiShenReason = '忌' + jiShen + '（' +
        (jiShen === motherWx ? '印星' : '比劫') +
        '）继续生扶日主，使命局更加失衡。';
    } else {
      yongShen = motherWx;
      jiShen = WX_KE[dayMasterWx] || '';
      if (!jiShen) {
        for (var kkk in WX_KE) { if (WX_KE[kkk] === dayMasterWx) { jiShen = kkk; break; } }
      }

      yongShenReason = '日主身弱，力量不足，宜用' + yongShen + '（印星）来生扶日主，增强自身力量。同时' + dayMasterWx + '（比劫）也能帮身，使命局趋于平衡。';
      jiShenReason = '忌' + jiShen + '（' +
        (jiShen === WX_KE[dayMasterWx] ? '财星耗身' : '官杀克身') +
        '）进一步消耗日主本已不足的力量。';
    }

    // 十神统计
    var shiShenCount = {};
    pillars.forEach(function (p) {
      if (p.shiShen !== '日主') {
        shiShenCount[p.shiShen] = (shiShenCount[p.shiShen] || 0) + 1;
      }
      p.cangGan.forEach(function (cg) {
        if (cg.shiShen !== '日主') {
          shiShenCount[cg.shiShen] = (shiShenCount[cg.shiShen] || 0) + 0.5;
        }
      });
    });

    var dominantSS = '', dominantVal = 0;
    for (var ss in shiShenCount) {
      if (shiShenCount[ss] > dominantVal) {
        dominantVal = shiShenCount[ss];
        dominantSS = ss;
      }
    }

    var zodiac = Lunar.SHENG_XIAO[(lunar.year - 4) % 12];
    var dayMasterChar = pillars[2].gan;
    var dayMasterInfo = DAY_MASTER_READINGS[dayMasterChar] || {};

    return {
      lunar: lunar,
      pillars: pillars,
      dayMaster: dayGanIdx,
      dayMasterChar: dayMasterChar,
      dayMasterWuxing: dayMasterWx,
      dayMasterInfo: dayMasterInfo,
      elements: elements,
      elementPct: elementPct,
      isStrong: isStrong,
      strengthDesc: strengthDesc,
      strengthScore: strengthScore,
      otherScore: otherScore,
      season: season,
      seasonLabel: seasonLabel,
      seasonFactor: seasonFactor,
      seasonWeights: seasonWeights,
      supportCount: supportCount,
      drainCount: drainCount,
      motherWx: motherWx,
      yongShen: yongShen,
      jiShen: jiShen,
      yongShenReason: yongShenReason,
      jiShenReason: jiShenReason,
      shiShenCount: shiShenCount,
      dominantSS: dominantSS,
      gender: gender,
      zodiac: zodiac,
      _tst: null,
      _stdTime: null,
      _longitude: null
    };
  }

  /* ====================================================================
   *  Convert lunar-javascript EightChar to our internal format
   * ==================================================================== */

  function convertFromLunarJS(data) {
    var ec = data.ec;
    var gender = data.gender;
    var lunar = data.lunar;

    // Use library's own ten gods and hidden stems directly
    var ganSS = ['', ec.getYearShiShenGan(), ec.getMonthShiShenGan(), '日主', ec.getTimeShiShenGan()];
    var zhiSS = [null, ec.getYearShiShenZhi(), ec.getMonthShiShenZhi(), ec.getDayShiShenZhi(), ec.getTimeShiShenZhi()];
    var hideGans = [ec.getYearHideGan(), ec.getMonthHideGan(), ec.getDayHideGan(), ec.getTimeHideGan()];
    var nayins = [ec.getYearNaYin(), ec.getMonthNaYin(), ec.getDayNaYin(), ec.getTimeNaYin()];
    var diShis = [ec.getYearDiShi(), ec.getMonthDiShi(), ec.getDayDiShi(), ec.getTimeDiShi()];
    var ganArr = [ec.getYearGan(), ec.getMonthGan(), ec.getDayGan(), ec.getTimeGan()];
    var zhiArr = [ec.getYearZhi(), ec.getMonthZhi(), ec.getDayZhi(), ec.getTimeZhi()];
    var names = ['年', '月', '日', '时'];
    var dayGanIdx = Lunar.TIAN_GAN.indexOf(ec.getDayGan());
    var wxMap = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};

    var pillars = [];
    for (var i = 0; i < 4; i++) {
      var gIdx = Lunar.TIAN_GAN.indexOf(ganArr[i]);
      var zIdx = Lunar.DI_ZHI.indexOf(zhiArr[i]);
      var gWx = wxMap[ganArr[i]] || Lunar.ganWuXing(gIdx);
      var zWx = Lunar.zhiWuXing(zIdx);

      // Use library's hidden stems and their ten gods
      var hg = hideGans[i] || [];
      var zss = zhiSS[i+1] || [];
      var cangGan = hg.map(function(ch, ci) {
        var idx = Lunar.TIAN_GAN.indexOf(ch);
        return {
          gan: ch, ganIdx: idx,
          wuxing: wxMap[ch] || Lunar.ganWuXing(idx),
          yinyang: Lunar.ganYinYang(idx),
          shiShen: (zss[ci] !== undefined) ? zss[ci] : Lunar.shiShen(dayGanIdx, idx)
        };
      });

      pillars.push({
        name: names[i], gan: ganArr[i], zhi: zhiArr[i],
        ganIdx: gIdx, zhiIdx: zIdx, text: ganArr[i] + zhiArr[i],
        ganWuxing: gWx, zhiWuxing: zWx,
        ganYinyang: Lunar.ganYinYang(gIdx),
        nayin: nayins[i] || '',
        diShi: diShis[i] || '',
        shiShen: ganSS[i+1] || (i === 2 ? '日主' : ''),
        cangGan: cangGan,
        ganClass: Lunar.elementClass(gWx),
        zhiClass: Lunar.elementClass(zWx),
        ganBg: Lunar.elementBgClass(gWx),
        zhiBg: Lunar.elementBgClass(zWx)
      });
    }

    // Additional info from library
    var taiYuan = '', taiXi = '', mingGong = '', shenGong = '';
    try { taiYuan = ec.getTaiYuan() + '（' + ec.getTaiYuanNaYin() + '）'; } catch(e){}
    try { taiXi = ec.getTaiXi() + '（' + ec.getTaiXiNaYin() + '）'; } catch(e){}
    try { mingGong = ec.getMingGong() + '（' + ec.getMingGongNaYin() + '）'; } catch(e){}
    try { shenGong = ec.getShenGong() + '（' + ec.getShenGongNaYin() + '）'; } catch(e){}

    // 大运 from library
    var dayunList = [];
    try {
      var yun = ec.getYun(gender === 'male' ? 1 : 0);
      var dayunArr = yun.getDaYun();
      dayunArr.forEach(function(dy) {
        var lnArr = dy.getLiuNian();
        dayunList.push({
          startAge: dy.getStartAge(),
          ganZhi: dy.getGanZhi(),
          liunian: lnArr.map(function(ln) { return { year: ln.getYear(), ganZhi: ln.getGanZhi(), age: ln.getAge() }; })
        });
      });
    } catch(e) { console.error('DaYun error:', e); }

    // Five elements count (using library's hidden stems)
    var elements = { '木':0, '火':0, '土':0, '金':0, '水':0 };
    var totalW = 0;
    pillars.forEach(function(p) {
      elements[p.ganWuxing] += WT_GAN; totalW += WT_GAN;
      p.cangGan.forEach(function(cg, ci) {
        var w = ci === 0 ? WT_ZHI_MAIN : ci === 1 ? WT_ZHI_MID : WT_ZHI_REM;
        elements[cg.wuxing] += w; totalW += w;
      });
    });
    var elementPct = {};
    for (var el in elements) elementPct[el] = totalW > 0 ? Math.round(elements[el] / totalW * 100) : 0;

    // Day master analysis
    var dayMasterWx = pillars[2].ganWuxing;
    var dayMasterChar = pillars[2].gan;
    var monthZhi = pillars[1].zhi;
    var season = ZHI_SEASON[monthZhi] || '季';
    var seasonLabel = SEASON_LABEL[season];
    var seasonWeights = SEASONAL_WEIGHT[season];
    var seasonFactor = seasonWeights[dayMasterWx] || 1;

    var motherWx = '';
    for (var k in WX_SHENG) { if (WX_SHENG[k] === dayMasterWx) { motherWx = k; break; } }

    var strengthScore = elements[dayMasterWx] * seasonFactor + (elements[motherWx] || 0) * 0.6;
    var otherScore = 0;
    for (var wx in elements) { if (wx !== dayMasterWx && wx !== motherWx) otherScore += elements[wx]; }
    var isStrong = strengthScore >= otherScore;

    // ===== 喜用神/忌仇神（标准扶抑法） =====
    var woShengWx = WX_SHENG[dayMasterWx];
    var woKeWx = WX_KE[dayMasterWx];
    var keWoWx = "";
    for (var kk in WX_KE) { if (WX_KE[kk] === dayMasterWx) { keWoWx = kk; break; } }

    var yongShen, xiShen, jiShen, chouShen, xianShen;
    var yongShenReason, jiShenReason;

    if (isStrong) {
      yongShen = keWoWx;       // 官杀克我
      xiShen = woKeWx;         // 财星耗我
      jiShen = dayMasterWx;    // 比劫帮身
      chouShen = motherWx;     // 印星生身
      xianShen = woShengWx;    // 食伤
      yongShenReason = "日主" + dayMasterChar + "（" + dayMasterWx + "）身强，需要克制和消耗。用神" + yongShen + "（官杀克身），喜神" + xiShen + "（财星耗身）。遇" + yongShen + "、" + xiShen + "运势提升。";
      jiShenReason = "忌" + jiShen + "（比劫帮身）和" + chouShen + "（印星生身）。身强再遇生扶则过旺为灾。";
    } else {
      yongShen = motherWx;     // 印星生我
      xiShen = dayMasterWx;    // 比劫帮我
      jiShen = keWoWx;         // 官杀克我
      chouShen = woKeWx;       // 财星耗我
      xianShen = woShengWx;    // 食伤
      yongShenReason = "日主" + dayMasterChar + "（" + dayMasterWx + "）身弱，需要生扶帮助。用神" + yongShen + "（印星生身），喜神" + xiShen + "（比劫帮身）。遇" + yongShen + "、" + xiShen + "运势提升。";
      jiShenReason = "忌" + jiShen + "（官杀克身）和" + chouShen + "（财星耗身）。身弱再遇克泄则力不从心。";
    }

    // 调候提示（补充说明，不覆盖用神）
    var tiaohouNote = "";
    var mzSeason2 = {"子":"冬","丑":"冬","亥":"冬","午":"夏","未":"夏","巳":"夏"};
    var mzS = mzSeason2[pillars[1].zhi];
    if (mzS === "冬") tiaohouNote = "调候提示：生于冬月，命局偏寒。宜多接触火属性事物暖局（南方、红色、灯光）。";
    else if (mzS === "夏") tiaohouNote = "调候提示：生于夏月，命局偏燥。宜多接触水属性事物润局（北方、蓝黑色、近水）。";

    var finalYongShen = yongShen;
    var finalYongShenMethod = "扶抑";
    var needTiaohou = !!mzS;
    var tiaohou = mzS === "冬" ? "丙" : mzS === "夏" ? "壬" : null;
    var tiaohouReason = tiaohouNote;
    var tongguan = null, tongguanReason = "";

    // ====== 地支关系 (zhiRelations) ======
    var zhiRelations = [];
    (function() {
      var branches = [
        { zhi: pillars[0].zhi, pillar: '年' },
        { zhi: pillars[1].zhi, pillar: '月' },
        { zhi: pillars[2].zhi, pillar: '日' },
        { zhi: pillars[3].zhi, pillar: '时' }
      ];

      var chongPairs = { '子午':true, '午子':true, '丑未':true, '未丑':true, '寅申':true, '申寅':true,
                         '卯酉':true, '酉卯':true, '辰戌':true, '戌辰':true, '巳亥':true, '亥巳':true };
      var hePairs = { '子丑':'土', '丑子':'土', '寅亥':'木', '亥寅':'木', '卯戌':'火', '戌卯':'火',
                      '辰酉':'金', '酉辰':'金', '巳申':'水', '申巳':'水', '午未':'火', '未午':'火' };
      var haiPairs = { '子未':true, '未子':true, '丑午':true, '午丑':true, '寅巳':true, '巳寅':true,
                       '卯辰':true, '辰卯':true, '申亥':true, '亥申':true, '酉戌':true, '戌酉':true };

      for (var i = 0; i < 4; i++) {
        for (var j = i + 1; j < 4; j++) {
          var key = branches[i].zhi + branches[j].zhi;
          if (chongPairs[key]) {
            zhiRelations.push({ type: '冲', zhi1: branches[i].zhi, zhi2: branches[j].zhi,
              pillar1: branches[i].pillar, pillar2: branches[j].pillar,
              desc: branches[i].pillar + '支' + branches[i].zhi + '与' + branches[j].pillar + '支' + branches[j].zhi + '相冲，主变动、冲突。' });
          }
          if (hePairs[key]) {
            zhiRelations.push({ type: '合', zhi1: branches[i].zhi, zhi2: branches[j].zhi,
              pillar1: branches[i].pillar, pillar2: branches[j].pillar, heWx: hePairs[key],
              desc: branches[i].pillar + '支' + branches[i].zhi + '与' + branches[j].pillar + '支' + branches[j].zhi + '六合化' + hePairs[key] + '，主和谐、合作。' });
          }
          if (haiPairs[key]) {
            zhiRelations.push({ type: '害', zhi1: branches[i].zhi, zhi2: branches[j].zhi,
              pillar1: branches[i].pillar, pillar2: branches[j].pillar,
              desc: branches[i].pillar + '支' + branches[i].zhi + '与' + branches[j].pillar + '支' + branches[j].zhi + '相害，主暗伤、不和。' });
          }
        }
      }

      // 三刑 checks
      var branchSet = {};
      branches.forEach(function(b) { branchSet[b.zhi] = (branchSet[b.zhi] || 0) + 1; });

      var xingGroups = [
        { members: ['寅','巳','申'], name: '无恩之刑', desc: '寅巳申三刑（无恩之刑），主恩将仇报、忘恩负义之事。' },
        { members: ['丑','戌','未'], name: '恃势之刑', desc: '丑戌未三刑（恃势之刑），主倚势凌人、骄横跋扈之象。' }
      ];
      xingGroups.forEach(function(g) {
        var count = 0;
        g.members.forEach(function(m) { if (branchSet[m]) count++; });
        if (count >= 2) {
          var present = g.members.filter(function(m) { return branchSet[m]; });
          zhiRelations.push({ type: '刑', members: present, name: g.name,
            desc: (count >= 3 ? '三' : '二') + '支齐见：' + g.desc });
        }
      });

      // 子卯相刑（无礼之刑）
      if (branchSet['子'] && branchSet['卯']) {
        zhiRelations.push({ type: '刑', members: ['子','卯'], name: '无礼之刑',
          desc: '子卯相刑（无礼之刑），主缺乏礼数、任性妄为。' });
      }

      // 自刑：辰辰、午午、酉酉、亥亥
      ['辰','午','酉','亥'].forEach(function(z) {
        if (branchSet[z] && branchSet[z] >= 2) {
          zhiRelations.push({ type: '刑', members: [z, z], name: '自刑',
            desc: z + z + '自刑，主自我矛盾、内心纠结。' });
        }
      });

      // 三合局 checks
      var sanHeGroups = [
        { members: ['寅','午','戌'], wx: '火', desc: '寅午戌三合火局' },
        { members: ['申','子','辰'], wx: '水', desc: '申子辰三合水局' },
        { members: ['亥','卯','未'], wx: '木', desc: '亥卯未三合木局' },
        { members: ['巳','酉','丑'], wx: '金', desc: '巳酉丑三合金局' }
      ];
      sanHeGroups.forEach(function(g) {
        var count = 0;
        g.members.forEach(function(m) { if (branchSet[m]) count++; });
        if (count >= 3) {
          zhiRelations.push({ type: '三合', members: g.members, wx: g.wx,
            desc: g.desc + '，' + g.wx + '气大旺，力量倍增。' });
        }
      });
    })();

    // ====== 旬空 (xunKong) ======
    var xunKong = '', xunKongDesc = '';
    (function() {
      try {
        xunKong = ec.getDayXunKong();
        if (xunKong && xunKong.length === 2) {
          xunKongDesc = '日柱旬空为' + xunKong.charAt(0) + '、' + xunKong.charAt(1) + '。逢空则虚，空亡之支所代表的六亲或事项力量减弱。';
        } else if (xunKong) {
          xunKongDesc = '日柱旬空为' + xunKong + '。';
        }
      } catch(e) {
        // getDayXunKong not available, compute manually
        var gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
        var zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
        var gI = gans.indexOf(pillars[2].gan);
        var zI = zhis.indexOf(pillars[2].zhi);
        var startZhi = ((zI - gI) % 12 + 12) % 12;
        var k1 = zhis[(startZhi + 10) % 12];
        var k2 = zhis[(startZhi + 11) % 12];
        xunKong = k1 + k2;
        xunKongDesc = '日柱旬空为' + k1 + '、' + k2 + '。逢空则虚，空亡之支所代表的六亲或事项力量减弱。';
      }
    })();

    // ShiShen count (use library's data)
    var shiShenCount = {};
    var supportCount = 0, drainCount = 0;
    pillars.forEach(function(p, idx) {
      if (p.shiShen && p.shiShen !== '日主') {
        shiShenCount[p.shiShen] = (shiShenCount[p.shiShen] || 0) + 1;
        if (['比肩','劫财','正印','偏印'].indexOf(p.shiShen) >= 0) supportCount++; else drainCount++;
      }
      p.cangGan.forEach(function(cg) {
        if (cg.shiShen && cg.shiShen !== '日主' && cg.shiShen !== '比肩') {
          shiShenCount[cg.shiShen] = (shiShenCount[cg.shiShen] || 0) + (cg === p.cangGan[0] ? 0.7 : 0.3);
        }
      });
    });

    var dominantSS = '', dominantVal = 0;
    for (var ss in shiShenCount) { if (shiShenCount[ss] > dominantVal) { dominantVal = shiShenCount[ss]; dominantSS = ss; } }

    var zodiac = lunar ? lunar.getYearShengXiao() : '';
    var dayMasterInfo = DAY_MASTER_READINGS[dayMasterChar] || {};

    return {
      pillars: pillars, dayMaster: dayGanIdx, dayMasterChar: dayMasterChar,
      dayMasterWuxing: dayMasterWx, dayMasterInfo: dayMasterInfo,
      elements: elements, elementPct: elementPct,
      isStrong: isStrong, strengthDesc: isStrong ? '身强' : '身弱',
      strengthScore: strengthScore, otherScore: otherScore,
      season: season, seasonLabel: seasonLabel, seasonFactor: seasonFactor, seasonWeights: seasonWeights,
      supportCount: supportCount, drainCount: drainCount, motherWx: motherWx,
      yongShen: yongShen, xiShen: xiShen, jiShen: jiShen, chouShen: chouShen, xianShen: xianShen,
      yongShenReason: yongShenReason, jiShenReason: jiShenReason, tiaohouNote: tiaohouNote,
      tiaohou: tiaohou, tiaohouReason: tiaohouReason, needTiaohou: needTiaohou,
      tongguan: tongguan, tongguanReason: tongguanReason,
      finalYongShen: finalYongShen, finalYongShenMethod: finalYongShenMethod,
      zhiRelations: zhiRelations,
      xunKong: xunKong, xunKongDesc: xunKongDesc,
      shiShenCount: shiShenCount, dominantSS: dominantSS,
      gender: gender, zodiac: zodiac,
      taiYuan: taiYuan, taiXi: taiXi, mingGong: mingGong, shenGong: shenGong,
      dayunList: dayunList,
      lunar: { year: lunar ? lunar.getYear() : 0, month: lunar ? parseInt(lunar.getMonth()) : 0,
               day: lunar ? parseInt(lunar.getDay()) : 0, isLeap: false },
      _tst: data._tst, _stdTime: data._stdTime, _longitude: data._longitude
    };
  }

  /* ====================================================================
   *  render(result) — 渲染 HTML
   * ==================================================================== */

  function render(result) {
    // If result has .ec (lunar-javascript EightChar), convert to our format
    if (result.ec && !result.pillars) {
      var converted = convertFromLunarJS(result);
      // Copy converted data back to original object so FengShui can access it
      for (var ck in converted) { result[ck] = converted[ck]; }
    }

    var html = [];

    function elSpan(text, wx) {
      return '<span class="' + Lunar.elementClass(wx) + '">' + text + '</span>';
    }
    function elBgSpan(text, wx) {
      return '<span class="' + Lunar.elementBgClass(wx) + ' ' + Lunar.elementClass(wx) + '">' + text + '</span>';
    }

    var pillarNames = ['年柱', '月柱', '日柱', '时柱'];
    var wxOrder = ['木', '火', '土', '金', '水'];
    // Use comprehensive yongShen if available
    var useYongShen = result.finalYongShen || result.yongShen;

    // ==================== 1. 真太阳时显示 ====================
    if (result._tst) {
      var tst = result._tst;
      var tstStr = (typeof tst === 'object' && tst.str) ? tst.str : (typeof tst === 'object' && tst.trueTimeStr) ? tst.trueTimeStr : String(tst);
      var tstDesc = (typeof tst === 'object' && tst.desc) ? tst.desc : (typeof tst === 'object' && tst.description) ? tst.description : '';
      var cityName = (typeof tst === 'object' && tst.cityName) ? tst.cityName : '';
      var stdSC = (typeof tst === 'object' && tst.stdShichen) ? tst.stdShichen : '';
      var trueSC = (typeof tst === 'object' && tst.trueShichen) ? tst.trueShichen : '';
      var scChanged = (typeof tst === 'object') ? tst.shichenChanged : false;
      var tstLng = (typeof tst === 'object' && tst.longitude) ? tst.longitude : result._longitude;

      html.push('<div class="interp-card" style="border-left:4px solid var(--gold,#c5922e)">');
      html.push('<h3>真太阳时校正</h3>');
      html.push('<table class="info-table"><tbody>');
      if (cityName) html.push('<tr><td style="width:100px">出生地</td><td><strong>' + cityName + '</strong>' + (tstLng ? '（东经' + Math.abs(tstLng).toFixed(2) + '°）' : '') + '</td></tr>');
      html.push('<tr><td>标准北京时间</td><td>' + (result._stdTime || '—') + (stdSC ? '（' + stdSC + '）' : '') + '</td></tr>');
      html.push('<tr><td>真太阳时</td><td><strong style="color:var(--vermillion,#c53d43);font-size:1.1rem">' + tstStr + '</strong>' + (trueSC ? '（<strong>' + trueSC + '</strong>）' : '') + '</td></tr>');
      if (tstDesc) html.push('<tr><td>校正明细</td><td style="font-size:.84rem">' + tstDesc + '</td></tr>');
      html.push('</tbody></table>');

      if (scChanged) {
        html.push('<p style="padding:8px 12px;background:rgba(197,61,67,.06);border-radius:4px;color:var(--vermillion);font-weight:600">注意：真太阳时校正后时辰发生变化（' + stdSC + ' → ' + trueSC + '），八字时柱以真太阳时为准。这对命盘结果有重要影响。</p>');
      } else {
        html.push('<p style="font-size:.84rem;color:var(--ink-light)">校正后时辰未变（仍为' + trueSC + '），对排盘结果无影响。</p>');
      }

      html.push('<p style="font-size:.82rem;color:var(--ink-light);margin-top:6px">说明：中国统一使用北京时间（东经120°标准），但各地实际日照时间因经度不同而有差异。真太阳时是根据出生地实际经度和当日太阳位置计算的当地真实时间，八字排盘以真太阳时确定时柱方为精确。</p>');
      html.push('</div>');
    }

    // ==================== 2. 基本信息 ====================
    html.push('<div class="interp-card">');
    html.push('<h3>命主基本信息</h3>');
    html.push('<table class="info-table"><tbody>');
    html.push('<tr><td>农历日期</td><td>' + result.lunar.year + '年' +
      (result.lunar.isLeap ? '闰' : '') + result.lunar.month + '月' + result.lunar.day + '日</td></tr>');
    html.push('<tr><td>生肖</td><td>' + result.zodiac + '</td></tr>');
    html.push('<tr><td>性别</td><td>' + (result.gender === 'male' ? '男' : '女') + '命</td></tr>');
    html.push('<tr><td>日主</td><td>' + elSpan(result.dayMasterChar + '（' + result.dayMasterWuxing + '）', result.dayMasterWuxing) + '</td></tr>');
    html.push('<tr><td>旺衰</td><td><strong>' + result.strengthDesc + '</strong></td></tr>');
    html.push('</tbody></table>');
    html.push('</div>');

    // ==================== 3. 四柱排盘 ====================
    html.push('<div class="pillar-table">');

    result.pillars.forEach(function (p, i) {
      html.push('<div class="pillar">');
      html.push('<div class="pillar-header">' + pillarNames[i] + '</div>');
      html.push('<div class="pillar-shishen">' + p.shiShen + '</div>');
      html.push('<div class="pillar-gan ' + p.ganBg + '"><span class="' + p.ganClass + '">' + p.gan + '</span><br><small>' + p.ganWuxing + '</small></div>');
      html.push('<div class="pillar-zhi ' + p.zhiBg + '"><span class="' + p.zhiClass + '">' + p.zhi + '</span><br><small>' + p.zhiWuxing + '</small></div>');
      html.push('<div class="pillar-canggan">');
      if (p.cangGan.length > 0) {
        p.cangGan.forEach(function (cg, ci) {
          var label = ci === 0 ? '本' : (ci === 1 ? '中' : '余');
          html.push('<div class="canggan-item"><span class="canggan-label">' + label + '</span>' +
            elSpan(cg.gan, cg.wuxing) +
            '<span class="canggan-ss">' + cg.shiShen + '</span></div>');
        });
      }
      html.push('</div>');
      html.push('</div>');
    });

    html.push('</div>');

    // ==================== 导航目录 ====================
    html.push('<div class="interp-card" style="padding:12px 16px;text-align:center">');
    html.push('<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">');
    var bzNavItems = [
      {id:'bz-sec-dm',label:'日主论命'},{id:'bz-sec-ys',label:'用神分析'},
      {id:'bz-sec-wx',label:'五行分布'},{id:'bz-sec-ss',label:'十神格局'},
      {id:'bz-sec-zhi',label:'地支关系'},{id:'bz-sec-career',label:'事业财运'},
      {id:'bz-sec-love',label:'感情婚姻'},{id:'bz-sec-health',label:'健康'},
      {id:'bz-sec-shensha',label:'神煞'},{id:'bz-sec-dayun',label:'大运流年'},
      {id:'bz-sec-kaiyun',label:'开运方案'}
    ];
    bzNavItems.forEach(function(item) {
      html.push('<a href="#' + item.id + '" style="display:inline-block;padding:5px 14px;border-radius:20px;font-size:.82rem;background:var(--cream,#faf8f5);border:1px solid var(--border,#e8e4dd);color:var(--ink,#1a1a2e);text-decoration:none;font-family:var(--font-h);transition:all .15s" onmouseover="this.style.background=\'var(--vermillion)\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'var(--cream,#faf8f5)\';this.style.color=\'var(--ink)\'">' + item.label + '</a>');
    });
    html.push('</div></div>');
    html.push('<div style="text-align:center;margin:16px 0 8px;color:var(--ink-light);font-size:.85rem;letter-spacing:.15em">── 详 细 解 读 ──</div>');

    // ==================== 4. 纳音 ====================
    html.push('<div class="interp-card">');
    html.push('<h3>纳音五行</h3>');
    html.push('<table class="info-table"><tbody>');
    result.pillars.forEach(function (p, i) {
      html.push('<tr><td>' + pillarNames[i] + '</td><td>' + p.text + '</td><td><strong>' + p.nayin + '</strong></td></tr>');
    });
    html.push('</tbody></table>');
    html.push('</div>');

    // ==================== 5. 五行分布 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-wx">五行力量分布</h3>');
    html.push('<div class="element-bars">');

    var barColors = {'木':'bar-wood','火':'bar-fire','土':'bar-earth','金':'bar-metal','水':'bar-water'};
    wxOrder.forEach(function (wx) {
      var pct = result.elementPct[wx] || 0;
      var val = result.elements[wx] ? result.elements[wx].toFixed(1) : '0.0';
      var cls = barColors[wx] || Lunar.elementBgClass(wx);
      html.push('<div class="element-bar-row">');
      html.push('<div class="element-bar-label ' + Lunar.elementClass(wx) + '">' + wx + '</div>');
      html.push('<div class="element-bar-track"><div class="element-bar-fill ' + cls + '" style="width:' + pct + '%">' + pct + '%</div></div>');
      html.push('<span class="element-bar-value">' + val + '</span>');
      html.push('</div>');
    });

    html.push('</div>');

    // 五行平衡提示
    var maxWx = wxOrder[0], minWx = wxOrder[0];
    wxOrder.forEach(function (wx) {
      if (result.elementPct[wx] > result.elementPct[maxWx]) maxWx = wx;
      if (result.elementPct[wx] < result.elementPct[minWx]) minWx = wx;
    });

    html.push('<p style="margin-top:8px">五行最旺：' + elSpan(maxWx + '（' + result.elementPct[maxWx] + '%）', maxWx) +
      '　五行最弱：' + elSpan(minWx + '（' + result.elementPct[minWx] + '%）', minWx) + '</p>');

    // ===== 五行缺失真假分析 =====
    var useYS = result.finalYongShen || result.yongShen;
    var useJS = result.jiShen;
    var missingWx = wxOrder.filter(function(wx) { return result.elementPct[wx] === 0; });
    var weakWx = wxOrder.filter(function(wx) { return result.elementPct[wx] > 0 && result.elementPct[wx] <= 10; });
    var strongWx = wxOrder.filter(function(wx) { return result.elementPct[wx] >= 30; });

    // 始终显示五行平衡分析
    html.push('<h4>五行平衡分析</h4>');
    html.push('<p style="font-size:.84rem;color:var(--ink-light)">民间常说「缺什么补什么」，这是不准确的。正确的做法是<strong>看用神需要什么才补什么</strong>。缺失或偏弱的五行如果是忌神，不补反而更好。</p>');

    if (missingWx.length === 0 && weakWx.length === 0) {
      html.push('<p>命局五行无完全缺失，分布相对均衡。</p>');
    }

      var cityMap = {
        '木': '东方城市（上海、杭州、南京、苏州、日本方向），或名含「木、林、森、东」的地方',
        '火': '南方城市（深圳、广州、海南、香港、新加坡、澳洲方向），或名含「阳、明、南、火」的地方',
        '土': '本地发展最佳，或中部城市（武汉、长沙、郑州），或名含「山、城、坤」的地方',
        '金': '西方城市（成都、重庆、西安），或西方国家（欧美方向），名含「金、银、西」的地方',
        '水': '北方城市（北京、天津、哈尔滨），或靠水城市（大连、青岛、厦门），名含「海、河、江、水」的地方'
      };
      var jewelMap = {
        '木': '翡翠、绿幽灵水晶、木质手串（沉香、小叶紫檀）、绿松石',
        '火': '红玛瑙、石榴石、红纹石、紫水晶、红色手绳',
        '土': '黄水晶、蜜蜡琥珀、和田玉、虎眼石、陶瓷饰品',
        '金': '金银首饰、白水晶、钛晶、铂金、不锈钢手表',
        '水': '黑曜石、海蓝宝、蓝宝石、墨翠、黑玛瑙'
      };
      var petMap = {
        '木': '养绿植（发财树、富贵竹）、养兔、养猫',
        '火': '养狗、养鹦鹉等鸟类、养红色观赏鱼',
        '土': '养狗、养陆龟、多接触大地（赤脚走草地）',
        '金': '养鸡、养白色宠物、养金鱼',
        '水': '养鱼（黑色为佳）、养龟、放水族箱'
      };
      var colorMap = {'木':'绿色、青色','火':'红色、紫色、粉色','土':'黄色、棕色、米色','金':'白色、银色、金色','水':'黑色、深蓝、藏青'};
      var numMap = {'木':'3、8','火':'2、7','土':'5、0','金':'4、9','水':'1、6'};
      var dirMap = {'木':'东方、东南方','火':'南方','土':'中央、东北、西南','金':'西方、西北方','水':'北方'};

      missingWx.forEach(function(wx) {
        var isYongShen = (wx === useYS);
        var isJiShen = (wx === useJS);
        var isTiaohou = result.tiaohou && (result.tiaohou === '丙' && wx === '火' || result.tiaohou === '壬' && wx === '水');

        var tagColor, tagText, borderColor, bgColor;
        if (isYongShen || isTiaohou) {
          tagColor = '#dc2626'; tagText = '真缺 — 必须补！'; borderColor = '#dc2626'; bgColor = 'rgba(220,38,38,.04)';
        } else if (isJiShen) {
          tagColor = '#16a34a'; tagText = '假缺 — 缺了是福！'; borderColor = '#16a34a'; bgColor = 'rgba(22,163,74,.04)';
        } else {
          tagColor = '#d97706'; tagText = '闲缺 — 可补可不补'; borderColor = '#d97706'; bgColor = 'rgba(217,119,6,.04)';
        }

        html.push('<div style="border:2px solid '+borderColor+';background:'+bgColor+';padding:14px 18px;margin:8px 0;border-radius:8px">');
        html.push('<p style="font-size:1rem"><strong>' + elSpan('命局缺' + wx, wx) + '</strong> <span style="color:'+tagColor+';font-weight:700;font-size:.88rem">' + tagText + '</span></p>');

        if (isYongShen || isTiaohou) {
          html.push('<p>' + wx + '是命局用神' + (isTiaohou ? '（调候急需）':'') + '，缺失会严重影响运势。必须通过后天方式积极补充：</p>');
          html.push('<details class="yearly-detail" open><summary class="yearly-summary"><span class="yr-palace">补' + wx + '方案</span></summary><div class="yearly-content">');
          html.push('<p><strong>方位：</strong>' + dirMap[wx] + '</p>');
          html.push('<p><strong>适合发展城市：</strong>' + cityMap[wx] + '</p>');
          html.push('<p><strong>颜色：</strong>日常穿着、家居装饰宜用 ' + colorMap[wx] + '</p>');
          html.push('<p><strong>数字：</strong>手机号、车牌、楼层宜含 ' + numMap[wx] + '</p>');
          html.push('<p><strong>饰品：</strong>' + jewelMap[wx] + '</p>');
          html.push('<p><strong>宠物/植物：</strong>' + petMap[wx] + '</p>');
          html.push('<p><strong>行业：</strong>从事五行属' + wx + '的行业最有利</p>');
          html.push('</div></details>');
        } else if (isJiShen) {
          html.push('<p>' + wx + '是命局忌神，缺失反而对命主有利。<strong>千万不要刻意去补！</strong>补了忌神等于给自己添堵，运势反而下降。</p>');
          html.push('<p style="font-size:.85rem;color:var(--ink-light)">很多人误以为五行要齐全才好，这是最大的命理误区。忌神五行越弱越好，缺了更妙。</p>');
        } else {
          html.push('<p>' + wx + '既非用神也非忌神（闲神），缺失影响不大。如果想补可以适当补一点，但不必过度在意。</p>');
        }
        html.push('</div>');
      });

    // 弱但不缺的五行（用神偏弱需增强）
    weakWx.forEach(function(wx) {
      if (missingWx.indexOf(wx) >= 0) return; // already handled above
      var isYS = (wx === useYS);
      var isJS = (wx === useJS);
      if (isYS) {
        html.push('<div style="border-left:3px solid #d97706;background:rgba(217,119,6,.04);padding:10px 14px;margin:6px 0;border-radius:0 6px 6px 0">');
        html.push('<p><strong>' + elSpan(wx + '偏弱（' + result.elementPct[wx] + '%）— 用神力量不足', wx) + '</strong></p>');
        html.push('<p>' + wx + '是用神但力量偏弱，宜适当增强。方位 ' + dirMap[wx] + '，颜色 ' + colorMap[wx] + '，数字 ' + numMap[wx] + '。</p>');
        html.push('<p>适合发展城市：' + cityMap[wx] + '</p>');
        html.push('<p>推荐饰品：' + jewelMap[wx] + '</p>');
        html.push('</div>');
      } else if (!isJS) {
        html.push('<div style="border-left:3px solid var(--border);padding:8px 14px;margin:4px 0;border-radius:0 6px 6px 0">');
        html.push('<p>' + elSpan(wx + '偏弱（' + result.elementPct[wx] + '%）', wx) + ' — 非用神非忌神，影响不大。</p>');
        html.push('</div>');
      }
    });

    // 偏旺的五行（忌神偏旺需化解）
    strongWx.forEach(function(wx) {
      var isJS = (wx === useJS);
      if (isJS) {
        var keWx = {'木':'金','火':'水','土':'木','金':'火','水':'土'}[wx] || '';
        html.push('<div style="border-left:3px solid var(--vermillion);background:rgba(220,38,38,.04);padding:10px 14px;margin:6px 0;border-radius:0 6px 6px 0">');
        html.push('<p><strong style="color:var(--vermillion)">' + elSpan(wx + '偏旺（' + result.elementPct[wx] + '%）— 忌神过旺！', wx) + '</strong></p>');
        html.push('<p>' + wx + '是忌神且力量过旺，对命局不利。宜用' + keWx + '（克制' + wx + '的五行）来化解。减少接触五行属' + wx + '的事物。</p>');
        html.push('</div>');
      }
    });

    // 五行全不缺也没偏弱偏旺时，给出用神方位建议
    if (missingWx.length === 0 && weakWx.length === 0) {
      html.push('<p>虽然五行不缺，但仍需根据用神方向调整：</p>');
      html.push('<div style="border-left:3px solid var(--jade);background:rgba(22,163,74,.04);padding:10px 14px;margin:6px 0;border-radius:0 6px 6px 0">');
      html.push('<p><strong>用神 ' + elSpan(useYS, useYS) + ' 增强建议：</strong>方位 ' + dirMap[useYS] + '，颜色 ' + colorMap[useYS] + '，数字 ' + numMap[useYS] + '</p>');
      html.push('<p>适合发展城市：' + cityMap[useYS] + '</p>');
      html.push('<p>推荐饰品：' + jewelMap[useYS] + '</p>');
      html.push('</div>');
    }

    html.push('</div>');

    // ==================== 6. 日主旺衰分析 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-ys">日主旺衰分析</h3>');

    // 季节分析
    html.push('<h4>令分析（季节影响）</h4>');
    html.push('<p>日主 ' + elSpan(result.dayMasterChar + '（' + result.dayMasterWuxing + '）', result.dayMasterWuxing) +
      ' 生于 <strong>' + result.seasonLabel + '</strong>（月支' + result.pillars[1].zhi + '），');

    var sfLabel;
    if (result.seasonFactor >= 2) sfLabel = '当令，气势最旺';
    else if (result.seasonFactor >= 1.5) sfLabel = '相令，得季节之生';
    else if (result.seasonFactor >= 1) sfLabel = '休令，气势平平';
    else if (result.seasonFactor >= 0.7) sfLabel = '囚令，气势偏弱';
    else sfLabel = '死令，气势最弱';

    html.push(result.dayMasterWuxing + '在' + result.seasonLabel + '为<strong>' + sfLabel + '</strong>。</p>');

    // 五行季节状态表
    html.push('<table class="info-table"><thead><tr><th>五行</th>');
    wxOrder.forEach(function (wx) {
      html.push('<th>' + elSpan(wx, wx) + '</th>');
    });
    html.push('</tr></thead><tbody><tr><td>季节权重</td>');
    wxOrder.forEach(function (wx) {
      var sw = result.seasonWeights[wx] || 1;
      var lb = sw >= 2 ? '旺' : sw >= 1.5 ? '相' : sw >= 1 ? '休' : sw >= 0.7 ? '囚' : '死';
      html.push('<td>' + sw + '（' + lb + '）</td>');
    });
    html.push('</tr></tbody></table>');

    // 逐柱分析
    html.push('<h4>四柱力量逐项分析</h4>');
    html.push('<table class="info-table"><thead><tr><th>柱位</th><th>天干</th><th>十神</th><th>助/耗</th><th>地支藏干</th><th>主气十神</th><th>助/耗</th></tr></thead><tbody>');
    result.pillars.forEach(function(p, idx) {
      if (idx === 2) return; // skip day pillar itself
      var ganSupport = ['比肩','劫财','正印','偏印'].indexOf(p.shiShen) >= 0;
      var mainCG = p.cangGan[0];
      var cgSupport = mainCG ? ['比肩','劫财','正印','偏印'].indexOf(mainCG.shiShen) >= 0 : false;
      html.push('<tr>');
      html.push('<td>' + p.name + '柱</td>');
      html.push('<td>' + elSpan(p.gan + '(' + p.ganWuxing + ')', p.ganWuxing) + '</td>');
      html.push('<td>' + p.shiShen + '</td>');
      html.push('<td style="color:' + (ganSupport ? 'var(--jade)' : 'var(--vermillion)') + ';font-weight:600">' + (ganSupport ? '助身' : '耗身') + '</td>');
      html.push('<td>' + (mainCG ? elSpan(mainCG.gan + '(' + mainCG.wuxing + ')', mainCG.wuxing) : '—') + '</td>');
      html.push('<td>' + (mainCG ? mainCG.shiShen : '—') + '</td>');
      html.push('<td style="color:' + (cgSupport ? 'var(--jade)' : 'var(--vermillion)') + ';font-weight:600">' + (mainCG ? (cgSupport ? '助身' : '耗身') : '—') + '</td>');
      html.push('</tr>');
    });
    html.push('</tbody></table>');

    // 综合判断
    html.push('<h4>综合判断</h4>');
    html.push('<table class="info-table"><tbody>');
    html.push('<tr><td style="width:140px">助身力量</td><td>比劫 + 印星 = <strong>' + result.supportCount + '</strong> 处（生我、帮我的力量）</td></tr>');
    html.push('<tr><td>耗身力量</td><td>食伤 + 财星 + 官杀 = <strong>' + result.drainCount + '</strong> 处（泄我、耗我、克我的力量）</td></tr>');
    html.push('<tr><td>日主得令</td><td>' + result.dayMasterWuxing + '在' + result.seasonLabel + '为' + (result.seasonFactor >= 1.5 ? '<strong style="color:var(--jade)">得令</strong>（气势较旺）' : result.seasonFactor >= 1 ? '平令（气势一般）' : '<strong style="color:var(--vermillion)">失令</strong>（气势偏弱）') + '</td></tr>');
    html.push('<tr><td>日主得地</td><td>' + (result.pillars[2].diShi || '') + ((['长生','沐浴','冠带','临官','帝旺'].indexOf(result.pillars[2].diShi) >= 0) ? ' — <strong style="color:var(--jade)">得地</strong>（日支有根）' : ' — <strong style="color:var(--vermillion)">失地</strong>（日支无强根）') + '</td></tr>');
    html.push('<tr><td>力量对比</td><td>助身 <strong>' + result.strengthScore.toFixed(1) + '</strong> vs 耗身 <strong>' + result.otherScore.toFixed(1) + '</strong></td></tr>');
    html.push('<tr><td style="font-size:1.05rem;font-weight:700">最终判断</td><td style="font-size:1.05rem"><strong style="color:var(--vermillion)">' + result.strengthDesc + '</strong></td></tr>');
    html.push('</tbody></table>');

    // 喜用神展示
    html.push('<h4>喜用五行</h4>');
    html.push('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0">');
    html.push('<div style="padding:16px;background:rgba(45,143,111,.06);border:2px solid var(--jade);border-radius:8px;text-align:center">');
    html.push('<div style="font-size:.75rem;color:var(--jade);font-weight:700">用神（最需要）</div>');
    html.push('<div style="font-size:1.5rem;font-weight:900;margin:6px 0">' + elSpan(result.yongShen, result.yongShen) + '</div>');
    html.push('</div>');
    html.push('<div style="padding:16px;background:rgba(45,143,111,.04);border:1px solid var(--jade);border-radius:8px;text-align:center">');
    html.push('<div style="font-size:.75rem;color:var(--jade);font-weight:700">喜神（辅助用神）</div>');
    html.push('<div style="font-size:1.5rem;font-weight:900;margin:6px 0">' + elSpan(result.xiShen||'', result.xiShen||result.yongShen) + '</div>');
    html.push('</div></div>');
    html.push('<p>' + result.yongShenReason + '</p>');

    if (result.tiaohouNote) {
      html.push('<p style="font-size:.85rem;padding:8px 12px;background:rgba(197,146,46,.06);border-left:3px solid var(--gold);border-radius:0 4px 4px 0;margin:8px 0">' + result.tiaohouNote + '</p>');
    }

    html.push('<h4>忌仇五行</h4>');
    html.push('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0">');
    html.push('<div style="padding:16px;background:rgba(220,38,38,.05);border:2px solid var(--vermillion);border-radius:8px;text-align:center">');
    html.push('<div style="font-size:.75rem;color:var(--vermillion);font-weight:700">忌神（最不利）</div>');
    html.push('<div style="font-size:1.5rem;font-weight:900;margin:6px 0">' + elSpan(result.jiShen, result.jiShen) + '</div>');
    html.push('</div>');
    html.push('<div style="padding:16px;background:rgba(220,38,38,.03);border:1px solid var(--vermillion);border-radius:8px;text-align:center">');
    html.push('<div style="font-size:.75rem;color:var(--vermillion);font-weight:700">仇神（生助忌神）</div>');
    html.push('<div style="font-size:1.5rem;font-weight:900;margin:6px 0">' + elSpan(result.chouShen||'', result.chouShen||result.jiShen) + '</div>');
    html.push('</div></div>');
    html.push('<p>' + result.jiShenReason + '</p>');

    // 喜忌一览表
    var wxSheng2 = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
    var wxKe2 = {'木':'金','火':'水','土':'木','金':'火','水':'土'};
    html.push('<h4>五行喜忌一览</h4>');
    html.push('<table class="info-table"><thead><tr><th>五行</th><th>与日主关系</th><th>喜/忌</th><th>说明</th></tr></thead><tbody>');
    wxOrder.forEach(function(wx) {
      var rel = '', verdict = '', desc = '';
      if (wx === result.dayMasterWuxing) { rel = '比劫（同类）'; }
      else if (wxSheng2[wx] === result.dayMasterWuxing) { rel = '食伤（我生）'; }
      else if (wx === wxSheng2[result.dayMasterWuxing]) { rel = '财星（我克）'; }
      else if (wxKe2[wx] === result.dayMasterWuxing) { rel = '印星（生我）'; }
      else { rel = '官杀（克我）'; }

      if (wx === result.yongShen) { verdict = '用神'; desc = '命局最需要的五行，越多越好。'; }
      else if (wx === (result.xiShen||'')) { verdict = '喜神'; desc = '辅助用神的五行，多多益善。'; }
      else if (wx === result.jiShen) { verdict = '忌神'; desc = '命局最忌讳的五行，越少越好。'; }
      else if (wx === (result.chouShen||'')) { verdict = '仇神'; desc = '生助忌神的五行，不宜过旺。'; }
      else { verdict = '闲神'; desc = '对命局影响中性。'; }

      var vColor = (verdict === '用神' || verdict === '喜神') ? 'var(--jade)' : (verdict === '忌神' || verdict === '仇神') ? 'var(--vermillion)' : 'var(--ink-light)';
      html.push('<tr><td>' + elSpan(wx, wx) + '</td><td>' + rel + '</td><td style="color:' + vColor + ';font-weight:700">' + verdict + '</td><td>' + desc + '</td></tr>');
    });
    html.push('</tbody></table>');

    html.push('</div>');

    // ==================== 7. 日主论命 ====================
    var dmi = result.dayMasterInfo;
    if (dmi && dmi.label) {
      html.push('<div class="interp-card">');
      html.push('<h3 id="bz-sec-dm">日主论命 —— ' + dmi.label + '</h3>');
      html.push('<p style="font-style:italic;opacity:.8">' + dmi.nature + ' · ' + dmi.summary + '</p>');

      html.push('<h4>性格特质</h4><p>' + dmi.personality + '</p>');
      html.push('<h4>事业方向</h4><p>' + dmi.career + '</p>');
      html.push('<h4>财运分析</h4><p>' + dmi.wealth + '</p>');
      html.push('<h4>感情特质</h4><p>' + dmi.relationship + '</p>');
      html.push('<h4>健康提示</h4><p>' + dmi.health + '</p>');

      html.push('</div>');
    }

    // ==================== 8. 十神分布 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-ss">十神分布</h3>');

    var allSS = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];
    html.push('<table class="info-table shishen-table"><thead><tr><th>十神</th><th>力量</th><th>含义</th></tr></thead><tbody>');
    allSS.forEach(function (ss) {
      var val = result.shiShenCount[ss] || 0;
      var bar = '';
      for (var b = 0; b < Math.round(val * 2); b++) bar += '█';
      var highlight = (ss === result.dominantSS) ? ' style="background:rgba(197,146,46,0.12)"' : '';
      html.push('<tr' + highlight + '><td><strong>' + ss + '</strong></td><td>' + val.toFixed(1) + ' ' + bar + '</td><td>' + (SHISHEN_DESC[ss] || '') + '</td></tr>');
    });
    html.push('</tbody></table>');

    // 最旺十神分析
    if (result.dominantSS) {
      html.push('<h4>主导十神：' + result.dominantSS + '</h4>');
      html.push('<p>' + (SHISHEN_DESC[result.dominantSS] || '') + '</p>');

      var ssAnalysis = {
        '比肩': '比肩旺者独立自主、自信心强，但需注意与人合作时的分歧。做事靠自己，不愿假手于人。朋友多但竞争对手也多。在事业上宜独立发展，在财务上宜独立经营，合伙则多生嫌隙。',
        '劫财': '劫财旺者胆大豪爽、善于社交，但花钱如流水，容易因朋友破财。投资需谨慎，避免盲目跟风。人生多戏剧性变化，大起大落是家常便饭。需培养理财意识和风险意识。',
        '食神': '食神旺者才华出众、生活安逸，天生有口福和才艺。性格温和，人缘极好。适合从事创意和技术类工作。食神生财，靠才华吃饭，一生物质条件优渥。然过于安逸则失去上进心。',
        '伤官': '伤官旺者聪明绝顶、思维超前，但个性叛逆、不服权威。有极强的表现欲和创造力，适合在自由环境中发挥才能。伤官见官为祸百端，与上司领导容易发生冲突。宜从事自由度高的创造性工作。',
        '偏财': '偏财旺者善于经营、人脉广阔。财来财去，大进大出。适合做贸易、投资、销售等需要人际关系的工作。偏财运佳则一生不缺钱花，但需防止奢靡浪费。男命偏财旺主异性缘佳。',
        '正财': '正财旺者勤劳节俭、理财有方。靠正当渠道积累财富，一步一个脚印。为人诚实守信，商业信誉极佳。婚姻方面，男命正财旺主得贤妻，家庭幸福。财运稳定，老年多有积蓄。',
        '七杀': '七杀旺者魄力过人、敢于拼搏。在压力和竞争中越战越勇，适合做开拓性工作。但需注意控制脾气，以免与人结怨。七杀有制则为权，无制则为灾。宜以食神制杀或印星化杀为上。',
        '正官': '正官旺者品行端正、自律严谨。容易获得社会地位和上级赏识。为人中规中矩，适合在体制内发展。正官为贵，一生行事光明正大，名誉运极佳。女命正官旺主得良夫。',
        '偏印': '偏印旺者思维独特、灵感丰富。在非主流领域常有独到建树。然性格较为孤僻内向，需注意排解郁闷。偏印夺食者需防意外变故和心情抑郁。宜培养广泛的兴趣爱好，多与人交流。',
        '正印': '正印旺者学业优秀、贵人运旺。一生多遇良师益友的帮助。为人慈善宽厚，福报深厚。正印为护身之神，一生少灾少难。适合走学术路线或从事教育、文化事业。'
      };
      html.push('<p>' + (ssAnalysis[result.dominantSS] || '') + '</p>');
    }

    html.push('</div>');

    // ==================== 9. 命局格局分析 ====================
    html.push('<div class="interp-card">');
    html.push('<h3>命局格局分析</h3>');

    var patternKey = result.dominantSS;
    var patternInfo = PATTERN_DESC[patternKey] || PATTERN_DESC['比肩'];

    html.push('<h4>' + patternInfo.name + '</h4>');
    html.push('<p>' + patternInfo.desc + '</p>');
    html.push('<p><strong>适宜行业：</strong>' + patternInfo.career + '</p>');
    html.push('<p><strong>性格特征：</strong>' + patternInfo.trait + '</p>');

    // 身强身弱影响
    html.push('<h4>' + result.strengthDesc + '对命局的影响</h4>');
    if (result.isStrong) {
      html.push('<p>日主身强，自身力量充沛。命主个性坚强、独立自主，行事果断有魄力。身强之人能承受较大的压力和挑战，遇到困难不轻易退缩。在事业上宜走食伤生财或官杀制身的路线——即用才华技能赚取财富，或在规矩制度中获取地位。</p>');
      html.push('<p>身强者忌再遇比劫印星大运流年，否则过旺无泄反为灾。喜行财官食伤运，命局得到平衡方能顺遂如意。</p>');
    } else {
      html.push('<p>日主身弱，自身力量不足。命主内心敏感细腻，做事谨慎小心。身弱之人宜借助外力——贵人相助、团队合作，不宜孤军奋战。在事业上宜走印星扶身或比劫帮身的路线——即通过学习深造提升自身，或借助合伙人、朋友的力量发展。</p>');
      html.push('<p>身弱者忌再遇财官食伤大运流年，否则力不从心、压力倍增。喜行印比运，得到扶助方能发挥所长。</p>');
    }

    html.push('</div>');

    // ==================== 9.5 地支关系 ====================
    if (result.zhiRelations && result.zhiRelations.length > 0) {
      html.push('<div class="interp-card">');
      html.push('<h3 id="bz-sec-zhi">地支关系</h3>');
      html.push('<p style="font-size:.84rem;color:var(--ink-light)">四柱地支之间的冲、合、刑、害关系，揭示命局中的矛盾与助力。</p>');

      var zhiIcons = {'冲':'⚡','合':'🤝','三合':'🔺','刑':'⚠️','害':'💔','自刑':'🔄'};
      var zhiColors = {'冲':'#dc2626','合':'#16a34a','三合':'#16a34a','刑':'#d97706','害':'#9333ea','自刑':'#64748b'};

      result.zhiRelations.forEach(function(rel) {
        var icon = zhiIcons[rel.type] || '•';
        var color = zhiColors[rel.type] || 'var(--ink)';
        var isGood = (rel.type === '合' || rel.type === '三合');
        var bg = isGood ? 'rgba(22,163,74,.04)' : 'rgba(220,38,38,.04)';
        // Handle both field formats (zhi1/zhi2 or members array)
        var title = '';
        if (rel.zhi1 && rel.pillar1) {
          title = rel.pillar1 + '支' + rel.zhi1 + ' ' + rel.type + ' ' + rel.pillar2 + '支' + rel.zhi2;
        } else if (rel.members) {
          title = rel.members.join('') + ' ' + (rel.name || rel.type);
        } else {
          title = rel.type;
        }
        html.push('<div style="border-left:3px solid '+color+';background:'+bg+';padding:10px 14px;margin:6px 0;border-radius:0 6px 6px 0">');
        html.push('<p><strong style="color:'+color+'">' + icon + ' ' + title + '</strong></p>');
        if (rel.desc) html.push('<p style="font-size:.88rem">' + rel.desc + '</p>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // ==================== 9.6 旬空 ====================
    if (result.xunKong) {
      html.push('<div class="interp-card">');
      html.push('<h4>旬空（空亡）</h4>');
      html.push('<p>日柱旬空：<strong>' + result.xunKong + '</strong></p>');
      if (result.xunKongDesc) html.push('<p>' + result.xunKongDesc + '</p>');

      // Check if any pillar branch is in xunKong
      var xkChars = result.xunKong.split('');
      var xkHit = [];
      result.pillars.forEach(function(p) {
        for (var xi = 0; xi < xkChars.length; xi++) {
          if (p.zhi === xkChars[xi]) xkHit.push(p.name + '支' + p.zhi);
        }
      });
      if (xkHit.length > 0) {
        html.push('<p style="color:var(--vermillion)"><strong>命中落空：' + xkHit.join('、') + '</strong> — 空亡的地支代表的领域容易落空、不实或延迟。但空亡逢冲则填实，逢合则解空。空亡也可能代表超脱世俗的特质。</p>');
      } else {
        html.push('<p>四柱地支均未落入旬空，命局较为充实。</p>');
      }
      html.push('</div>');
    }

    // ==================== 10. 事业财运分析 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-career">事业财运分析</h3>');

    var careerByWx = {
      '木': '教育、文化、出版、林业、家具、服装、医药、公务员等与木相关的行业',
      '火': '能源、电子、餐饮、娱乐、传媒、美容、照明等与火相关的行业',
      '土': '房地产、建筑、农业、矿业、陶瓷、仓储、保险等与土相关的行业',
      '金': '金融、银行、机械、五金、汽车、司法、军警等与金相关的行业',
      '水': '贸易、物流、旅游、航运、渔业、饮品、传播等与水相关的行业'
    };

    html.push('<h4>行业方向</h4>');
    html.push('<p>根据用神 ' + elSpan(result.yongShen, result.yongShen) + '，命主最宜从事五行属<strong>' + result.yongShen + '</strong>的行业：</p>');
    html.push('<p>' + (careerByWx[result.yongShen] || '') + '</p>');
    html.push('<p>日主 ' + elSpan(result.dayMasterWuxing, result.dayMasterWuxing) + ' 本身适合的领域：' + (careerByWx[result.dayMasterWuxing] || '') + '</p>');

    // 命局十神对事业的影响
    if (result.shiShenCount['正官'] || result.shiShenCount['七杀']) {
      html.push('<p>命带官杀，有管理才能和领导潜力。适合在组织体系中发展，或自主创业带领团队。</p>');
    }
    if (result.shiShenCount['食神'] || result.shiShenCount['伤官']) {
      html.push('<p>命带食伤，才华出众，有创意和表达能力。适合文艺创作、教育培训、技术研发等。</p>');
    }

    html.push('<h4>财运特点</h4>');

    var zcVal = result.shiShenCount['正财'] || 0;
    var pcVal = result.shiShenCount['偏财'] || 0;
    var totalCai = zcVal + pcVal;

    if (totalCai >= 2) {
      html.push('<p>命局财星旺盛，一生与财富有缘。赚钱能力强，财路广阔。');
      if (pcVal > zcVal) {
        html.push('偏财重于正财，适合投资理财、商业贸易，有意外之财的机会。但需注意理财规划，避免挥霍无度。');
      } else {
        html.push('正财重于偏财，适合正当职业稳步积累。靠勤劳和专业获取财富，虽无横财但胜在稳定持久。');
      }
      html.push('</p>');
    } else if (totalCai >= 1) {
      html.push('<p>命局财星适中，财运平稳。不会大富大贵但也衣食无忧。把握好用神方向，通过持续努力可以逐步改善经济状况。</p>');
    } else {
      html.push('<p>命局财星偏弱，求财之路需要更多耐心和努力。不宜贪图捷径，脚踏实地方为正道。可通过提升自身技能和知识来增加收入。佩戴或使用五行属' + result.yongShen + '的物品可适当改善财运。</p>');
    }

    html.push('</div>');

    // ==================== 11. 感情婚姻分析 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-love">感情婚姻分析</h3>');

    var isMale = (result.gender === 'male');
    var spouseStar1 = isMale ? '正财' : '正官';
    var spouseStar2 = isMale ? '偏财' : '七杀';
    var spouseLabel = isMale ? '妻星' : '夫星';
    var spouseVal1 = result.shiShenCount[spouseStar1] || 0;
    var spouseVal2 = result.shiShenCount[spouseStar2] || 0;
    var totalSpouse = spouseVal1 + spouseVal2;

    html.push('<h4>' + spouseLabel + '分析（' + (isMale ? '男命看财星' : '女命看官杀') + '）</h4>');

    if (isMale) {
      html.push('<p>男命以正财为妻、偏财为情人或外遇。</p>');
      if (spouseVal1 > 0 && spouseVal2 === 0) {
        html.push('<p>命局正财显现而偏财不见，主婚姻忠贞，夫妻感情稳定。配偶贤惠持家，婚后生活和美。</p>');
      } else if (spouseVal2 > spouseVal1) {
        html.push('<p>命局偏财强于正财，主风流多情，异性缘佳。需注意约束自己，避免感情纠纷影响婚姻。婚后宜多关注家庭。</p>');
      } else if (totalSpouse >= 2) {
        html.push('<p>命局财星旺盛，异性缘极佳。桃花运旺但也容易引发感情困扰。婚前多经历感情波折，婚后需专心致志。</p>');
      } else if (totalSpouse === 0) {
        html.push('<p>命局财星较弱，婚缘来得较晚。不必着急，缘分到了自然水到渠成。建议在社交活动中多展现自己的优点。</p>');
      } else {
        html.push('<p>命局财星适中，婚姻运程平稳。择偶宜选择性格互补之人，婚后相互包容则感情长久。</p>');
      }
    } else {
      html.push('<p>女命以正官为夫、七杀为情人或不正当的感情。</p>');
      if (spouseVal1 > 0 && spouseVal2 === 0) {
        html.push('<p>命局正官显现而七杀不见，主婚姻稳定，丈夫正派有能力。夫妻感情融洽，家庭幸福。</p>');
      } else if (spouseVal2 > spouseVal1) {
        html.push('<p>命局七杀强于正官，感情经历较为曲折。容易遇到霸道强势的异性，需擦亮眼睛慎重选择。婚后丈夫可能性格较强势。</p>');
      } else if (totalSpouse >= 2) {
        html.push('<p>命局官杀混杂，感情纷扰较多。异性缘虽佳但选择困难，婚前宜慎重考虑。婚后需避免第三者介入。</p>');
      } else if (totalSpouse === 0) {
        html.push('<p>命局官星较弱，姻缘来得较迟。不必焦虑，可通过社交扩大交际圈。选择伴侣时注重内在品质而非外在条件。</p>');
      } else {
        html.push('<p>命局官星适中，婚姻运程平顺。找到合适的伴侣后，婚姻生活稳定幸福。</p>');
      }
    }

    // 日主感情特质
    if (result.dayMasterInfo && result.dayMasterInfo.relationship) {
      html.push('<h4>日主感情特质</h4>');
      html.push('<p>' + result.dayMasterInfo.relationship + '</p>');
    }

    html.push('</div>');

    // ==================== 12. 健康提示 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-health">健康养生提示</h3>');

    // 基于日主五行
    var dmHealth = HEALTH_MAP[result.dayMasterWuxing];
    if (dmHealth) {
      html.push('<h4>日主五行（' + result.dayMasterWuxing + '）对应健康</h4>');
      html.push('<p><strong>对应脏腑：</strong>' + dmHealth.organ + '</p>');
      html.push('<p><strong>易患疾病：</strong>' + dmHealth.risks + '</p>');
      html.push('<p><strong>养生建议：</strong>' + dmHealth.advice + '</p>');
    }

    // 基于五行失衡
    html.push('<h4>五行失衡健康预警</h4>');

    var hasWarning = false;
    wxOrder.forEach(function (wx) {
      var pct = result.elementPct[wx] || 0;
      var hm = HEALTH_MAP[wx];
      if (pct >= 35) {
        html.push('<p style="color:var(--vermillion,#C53D43)">' + elSpan(wx, wx) + ' <strong>偏旺（' + pct + '%）</strong>：' + wx + '气过盛，' + hm.organ + '功能亢进，需注意' + hm.risks.split('、').slice(0, 2).join('、') + '等问题。' + hm.advice + '</p>');
        hasWarning = true;
      } else if (pct <= 5) {
        html.push('<p style="color:var(--vermillion,#C53D43)">' + elSpan(wx, wx) + ' <strong>偏弱（' + pct + '%）</strong>：' + wx + '气不足，' + hm.organ + '功能偏弱，容易出现' + hm.risks.split('、').slice(0, 2).join('、') + '等症状。宜适当补充五行属' + wx + '的食物和活动。</p>');
        hasWarning = true;
      }
    });

    if (!hasWarning) {
      html.push('<p>五行分布较为均衡，整体体质尚可。日常注意保养即可。</p>');
    }

    // 综合养生建议
    html.push('<h4>综合养生方案</h4>');
    html.push('<p>根据命局用神为 ' + elSpan(result.yongShen, result.yongShen) + '，在日常养生中宜多接触五行属' + result.yongShen + '的事物：</p>');

    var yongAdvice = {
      '木': '多亲近自然，散步于林荫道、公园绿地。饮食多食绿色蔬菜。居住环境宜多种植物。穿着以青色、绿色为宜。方位宜东方。',
      '火': '保持积极乐观的心态，多参加社交活动。饮食适当食用红色食物（红枣、枸杞等）。穿着以红色、紫色为宜。方位宜南方。',
      '土': '保持规律的生活作息，注重脾胃调理。饮食多食五谷杂粮、薯类食物。穿着以黄色、咖色为宜。方位宜中央或西南。',
      '金': '多做深呼吸和有氧运动，保持呼吸系统健康。饮食多食白色食物（银耳、百合、梨等）。穿着以白色、金色为宜。方位宜西方。',
      '水': '多饮水，适当游泳或泡温泉。饮食多食黑色食物（黑豆、黑芝麻、海带等）。穿着以黑色、深蓝色为宜。方位宜北方。'
    };
    html.push('<p>' + (yongAdvice[result.yongShen] || '') + '</p>');

    html.push('</div>');

    // ==================== 12.5 胎元命宫身宫 ====================
    if (result.taiYuan || result.mingGong) {
      html.push('<div class="interp-card">');
      html.push('<h3>胎元·命宫·身宫</h3>');
      if (result.taiYuan) html.push('<p><strong>胎元：</strong>' + result.taiYuan + '　<span style="font-size:.84rem;color:var(--ink-light)">胎元为受胎之月的干支，反映先天禀赋和胎儿时期的信息。胎元与年柱月柱相合者，先天条件优越。</span></p>');
      if (result.taiXi) html.push('<p><strong>胎息：</strong>' + result.taiXi + '</p>');
      if (result.mingGong) html.push('<p><strong>命宫：</strong>' + result.mingGong + '　<span style="font-size:.84rem;color:var(--ink-light)">命宫为先天根基所在，反映一个人的先天禀赋和基本性格倾向。</span></p>');
      if (result.shenGong) html.push('<p><strong>身宫：</strong>' + result.shenGong + '　<span style="font-size:.84rem;color:var(--ink-light)">身宫为后天发展方向，反映一生的际遇和归宿。</span></p>');
      html.push('</div>');
    }

    // ==================== 12.6 大运流年 ====================
    if (result.dayunList && result.dayunList.length > 0) {
      html.push('<div class="interp-card">');
      html.push('<h3 id="bz-sec-dayun">大运走势</h3>');
      html.push('<p style="font-size:.84rem;color:var(--ink-light)">大运每十年一变，揭示人生各阶段的运势主题。点击展开查看详细解读和逐年流年。</p>');

      // Timeline
      html.push('<div class="dayun-timeline">');
      result.dayunList.forEach(function(dy) {
        if (!dy.ganZhi) return;
        var isCur = (currentAge >= dy.startAge && currentAge < dy.startAge + 10);
        html.push('<div class="dayun-item' + (isCur?' current':'') + '">');
        html.push('<div class="dayun-age">' + dy.startAge + '~' + (dy.startAge+9) + '岁</div>');
        html.push('<div class="dayun-gz">' + dy.ganZhi + '</div>');
        html.push('</div>');
      });
      html.push('</div>');

      // Expandable detail for each 大运
      var currentAge = new Date().getFullYear() - (result.lunar.year || 1990);
      var dayunInterp = {
        '比肩':'此运比劫当头，独立自主的十年。凡事靠自己，竞争激烈但也锻炼意志。交友广泛但需防破财。',
        '劫财':'此运劫财主事，花钱大方、社交活跃的十年。投资需谨慎，合伙经营须防分歧。',
        '食神':'此运食神当值，才华横溢、生活安逸的十年。口福好、创造力强，适合发展才艺和技术。',
        '伤官':'此运伤官主事，聪慧超群但叛逆不羁的十年。创新能力强但易与领导冲突，宜走自由职业路线。',
        '偏财':'此运偏财当值，财路广阔、人缘旺盛的十年。投资机会多，社交生财。但需防因财惹祸、因色破财。',
        '正财':'此运正财主事，勤劳致富、稳步积累的十年。事业平稳上升，婚姻稳定，是积累家业的好时期。',
        '七杀':'此运七杀当值，压力与机遇并存的十年。竞争激烈、挑战重重，但若能化杀为权则成就非凡。注意健康和安全。',
        '正官':'此运正官主事，名誉地位上升的十年。仕途顺利、升迁有望。为人处事宜正直稳重，遵纪守法。',
        '偏印':'此运偏印当值，思维独特、灵感迸发的十年。适合学习新技能、钻研偏门学问。但需防精神压力和孤独感。',
        '正印':'此运正印主事，学业有成、贵人扶持的十年。适合进修深造、考取证书。母亲和长辈的帮助会很大。'
      };

      result.dayunList.forEach(function(dy, dyIdx) {
        if (!dy.ganZhi) return;
        var isCur = (currentAge >= dy.startAge && currentAge < dy.startAge + 10);
        var dyGan = dy.ganZhi.charAt(0);
        var ganWxMap = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
        var dyWx = ganWxMap[dyGan] || '';
        var dySS = Lunar.shiShen(result.dayMaster, Lunar.TIAN_GAN.indexOf(dyGan));
        var currentYear = new Date().getFullYear();

        html.push('<details class="yearly-detail' + (isCur?' current-year-detail':'') + '"' + (isCur?' open':'') + '>');
        html.push('<summary class="yearly-summary">');
        html.push('<span class="yr-year">' + dy.startAge + '~' + (dy.startAge+9) + '岁</span>');
        html.push('<span class="yr-gz">' + dy.ganZhi + '</span>');
        html.push('<span class="yr-palace">' + (dySS||'') + '</span>');
        if (isCur) html.push('<span class="yr-current">当前</span>');
        html.push('</summary><div class="yearly-content">');

        // 大运十神解读
        if (dySS) {
          html.push('<p><strong>大运十神：' + dySS + '</strong></p>');
          html.push('<p>' + (dayunInterp[dySS] || '此运运势平稳。') + '</p>');
        }

        // 大运五行与用神关系
        if (dyWx) {
          var rel = '';
          if (dyWx === result.yongShen) rel = '大运五行与用神相同，此运运势较为顺利，是人生的上升期。';
          else if (dyWx === result.jiShen) rel = '大运五行与忌神相同，此运需多加注意，可能面临挑战和压力。';
          else rel = '大运五行（' + dyWx + '）与命局用忌关系中性，此运平稳过渡。';
          html.push('<p>' + rel + '</p>');
        }

        // 逐年流年（可展开详解）
        if (dy.liunian && dy.liunian.length > 0) {
          html.push('<div style="margin-top:10px"><strong>逐年流年：</strong>（点击展开详解）</div>');

          var lnSSInterp = {
            '比肩': {
              summary: '比肩流年，竞争之年',
              career: '今年同行竞争加剧，需凭实力取胜。适合独立开展项目，不宜过度依赖他人。同事间可能有暗中较劲。',
              wealth: '财运中平。花钱较多，容易因朋友应酬而破费。投资需谨慎，不宜合伙经营。',
              relationship: '感情上可能遇到竞争对手。已婚者注意防范第三者。单身者社交活跃但难定情。',
              health: '精力充沛但容易逞强。注意运动过量导致的损伤。'
            },
            '劫财': {
              summary: '劫财流年，变动之年',
              career: '今年事业上有较大变动，可能换岗或转行。机会与风险并存，需审慎决策。',
              wealth: '破财风险较大。切忌借贷担保，远离高风险投资。钱财易因朋友或合作而损失。',
              relationship: '感情波动大，容易因金钱或第三者问题产生矛盾。沟通是关键。',
              health: '注意意外伤害和血光之灾。出行需格外小心。'
            },
            '食神': {
              summary: '食神流年，才华之年',
              career: '今年才思泉涌，创造力旺盛。适合发表作品、展示才艺、技术创新。工作中容易得到认可。',
              wealth: '财运稳中有升。食神生财，以技术和才华换取收入。口福好，饮食方面花费增多。',
              relationship: '感情和谐甜蜜。单身者有机会通过才艺展示吸引异性。女命主子女缘佳。',
              health: '整体健康良好。但需注意饮食过量导致的肠胃问题和体重增加。'
            },
            '伤官': {
              summary: '伤官流年，突破之年',
              career: '今年思维活跃、不甘平庸，渴望突破现状。创业冲动强烈，但容易与上司发生冲突。适合走自由路线。',
              wealth: '财运起伏不定。伤官生财有创意赚钱的机会，但花钱也大胆。',
              relationship: '感情上较为自我，容易因言语冲突伤害伴侣。单身者魅力四射但挑剔。男命需防口舌官非。',
              health: '精神亢奋，容易失眠多梦。注意情绪管理，避免过度兴奋。'
            },
            '偏财': {
              summary: '偏财流年，财运之年',
              career: '今年人脉广阔、商机多多。适合拓展业务、开发新客户。社交能力是今年的核心竞争力。',
              wealth: '偏财运旺，有意外收入的机会。投资、投机、贸易皆有利。但来财快去财也快，需做好理财规划。',
              relationship: '异性缘极佳，桃花运旺盛。单身者机会多但需辨别真心。已婚者注意感情忠诚。',
              health: '社交应酬多，注意饮酒过量和作息不规律。肝脏需要保护。'
            },
            '正财': {
              summary: '正财流年，收获之年',
              career: '今年工作稳定上升，通过勤劳努力获得回报。适合踏实做事、积累业绩。升职加薪有望。',
              wealth: '正财运佳，收入稳步增长。适合储蓄和稳健投资。不宜冒险投机。',
              relationship: '男命有利姻缘，今年适合求婚或结婚。女命则适合理财持家。感情平稳和美。',
              health: '身体状况良好。注意劳逸结合，不要因为忙于赚钱而忽视健康。'
            },
            '七杀': {
              summary: '七杀流年，挑战之年',
              career: '今年压力较大，面临强劲的竞争和考验。但压力也是动力，能激发潜能。适合迎难而上、主动出击。',
              wealth: '财运有压力。可能需要大额支出或投资。宜谨慎理财，避免冲动消费。',
              relationship: '感情上可能遇到强势的对象或面临感情考验。已婚者注意夫妻关系紧张。',
              health: '压力大、容易焦虑失眠。注意血压和心脏问题。宜多运动减压。防意外伤害。'
            },
            '正官': {
              summary: '正官流年，荣誉之年',
              career: '今年贵人运旺，容易得到上级提拔和赏识。适合在体制内发展，考试求职皆利。名声和地位上升。',
              wealth: '财运跟随事业水涨船高。以正当方式获取收入，稳定可靠。',
              relationship: '女命有利姻缘，适合恋爱结婚。男命则事业优先。感情关系正式化。',
              health: '整体健康平稳。注意因工作压力导致的肩颈问题和精神疲劳。'
            },
            '偏印': {
              summary: '偏印流年，沉淀之年',
              career: '今年适合学习充电、钻研新技能。灵感丰富，适合创意和研究工作。但表现欲不强，容易被忽视。',
              wealth: '财运平淡。不宜大额投资，适合积累知识和人脉。偏门收入有可能性。',
              relationship: '感情上较为淡漠，容易沉浸在自己的世界里。需要主动关心伴侣。单身者恋爱兴趣不高。',
              health: '注意精神状态。容易出现失眠、多虑、情绪低落等问题。多与人交流，避免自我封闭。'
            },
            '正印': {
              summary: '正印流年，贵人之年',
              career: '今年贵人运极佳，学业事业都有长辈或领导的扶持。适合进修考证、申请晋升。文书运好。',
              wealth: '财运稳定，虽不主横财但衣食无忧。可能通过学历提升获得更高收入。',
              relationship: '感情中获得对方的关爱和呵护。与母亲的关系更加亲密。婚姻稳定和谐。',
              health: '身心状态良好，有养生的意识和行动。适合调理身体、改善体质。'
            }
          };

          dy.liunian.forEach(function(ln) {
            var isCurLn = (ln.year === currentYear);
            var lnGan = ln.ganZhi.charAt(0);
            var lnZhi = ln.ganZhi.charAt(1);
            var lnGanSS = Lunar.shiShen(result.dayMaster, Lunar.TIAN_GAN.indexOf(lnGan));
            var lnZhiIdx = Lunar.DI_ZHI.indexOf(lnZhi);
            var lnZhiWx = Lunar.zhiWuXing(lnZhiIdx);
            var lnInterp = lnSSInterp[lnGanSS];
            var isGoodYear = (ganWxMap[lnGan] === result.yongShen || lnZhiWx === result.yongShen);
            var isBadYear = (ganWxMap[lnGan] === result.jiShen && lnZhiWx === result.jiShen);

            html.push('<details class="yearly-detail' + (isCurLn?' current-year-detail':'') + '"' + (isCurLn?' open':'') + '>');
            html.push('<summary class="yearly-summary">');
            html.push('<span class="yr-year">' + ln.year + '年</span>');
            html.push('<span class="yr-gz">' + ln.ganZhi + '</span>');
            html.push('<span class="yr-age">' + ln.age + '岁</span>');
            html.push('<span class="yr-palace">' + (lnGanSS||'') + '</span>');
            if (isGoodYear) html.push('<span style="color:var(--jade);font-size:.75rem">吉</span>');
            if (isBadYear) html.push('<span style="color:var(--vermillion);font-size:.75rem">凶</span>');
            if (isCurLn) html.push('<span class="yr-current">今年</span>');
            html.push('</summary>');

            html.push('<div class="yearly-content">');

            // 流年干支分析
            html.push('<p><strong>流年干支：</strong>' + ln.ganZhi + '（天干' + lnGan + '属' + (ganWxMap[lnGan]||'') + '，地支' + lnZhi + '属' + lnZhiWx + '）</p>');

            // 天干十神
            if (lnGanSS) {
              html.push('<p><strong>流年天干十神：' + lnGanSS + '</strong></p>');
              if (lnInterp) {
                html.push('<p style="font-weight:600;color:var(--vermillion)">' + lnInterp.summary + '</p>');
                html.push('<p><strong>事业：</strong>' + lnInterp.career + '</p>');
                html.push('<p><strong>财运：</strong>' + lnInterp.wealth + '</p>');
                html.push('<p><strong>感情：</strong>' + lnInterp.relationship + '</p>');
                html.push('<p><strong>健康：</strong>' + lnInterp.health + '</p>');
              }
            }

            // 用神忌神关系
            var ysRel = [];
            if (ganWxMap[lnGan] === result.yongShen) ysRel.push('流年天干合用神（' + result.yongShen + '），此年天干助力较大');
            if (ganWxMap[lnGan] === result.jiShen) ysRel.push('流年天干犯忌神（' + result.jiShen + '），天干方面有阻碍');
            if (lnZhiWx === result.yongShen) ysRel.push('流年地支合用神（' + result.yongShen + '），地支助力较大');
            if (lnZhiWx === result.jiShen) ysRel.push('流年地支犯忌神（' + result.jiShen + '），地支方面有压力');
            if (ysRel.length > 0) {
              html.push('<p style="padding:8px 12px;background:rgba(0,0,0,.02);border-radius:4px;font-size:.85rem"><strong>用神分析：</strong>' + ysRel.join('；') + '。</p>');
            }

            // 综合评价
            var score = 0;
            if (ganWxMap[lnGan] === result.yongShen) score += 2;
            if (lnZhiWx === result.yongShen) score += 2;
            if (ganWxMap[lnGan] === result.jiShen) score -= 2;
            if (lnZhiWx === result.jiShen) score -= 2;
            var overallText = score >= 3 ? '整体运势上佳，宜积极把握机会，大胆进取。' :
              score >= 1 ? '整体运势偏好，顺势而为可获佳绩。' :
              score >= -1 ? '整体运势平稳，宜守成为主，稳中求进。' :
              score >= -3 ? '整体运势偏弱，宜谨慎行事，避免冒险。' :
              '整体运势欠佳，宜韬光养晦，积蓄力量待来年。';
            html.push('<p style="font-style:italic;color:var(--ink-light);margin-top:6px">' + overallText + '</p>');

            html.push('</div></details>');
          });
        }

        html.push('</div></details>');
      });

      html.push('</div>');
    }

    // ==================== 13. 神煞与特殊格局 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-shensha">神煞与特殊格局</h3>');

    var specialFound = false;
    var pArr = result.pillars;

    // 天乙贵人
    var tianyi = {'甲':'丑未','戊':'丑未','乙':'子申','己':'子申','丙':'酉亥','丁':'酉亥','庚':'丑未','辛':'寅午','壬':'卯巳','癸':'卯巳'};
    var dayChar = pArr[2].gan;
    var tyChars = tianyi[dayChar] || '';
    var hasTianyi = false;
    pArr.forEach(function(p){ if (tyChars.indexOf(p.zhi) >= 0) hasTianyi = true; });
    if (hasTianyi) {
      html.push('<h4>天乙贵人</h4><p>命带天乙贵人，一生常遇贵人相助，逢凶化吉。遇到困难时总有人伸出援手。此为大吉之神煞，主聪明、有人缘、少灾厄。贵人星越多，福气越深。</p>');
      specialFound = true;
    }

    // 驿马星
    var yima = {'寅午戌':'申','申子辰':'寅','亥卯未':'巳','巳酉丑':'亥'};
    var yearZhi = pArr[0].zhi;
    for (var yk in yima) {
      if (yk.indexOf(yearZhi) >= 0) {
        var yimaZhi = yima[yk];
        var hasYima = false;
        pArr.forEach(function(p){ if (p.zhi === yimaZhi) hasYima = true; });
        if (hasYima) {
          html.push('<h4>驿马星</h4><p>命带驿马星，一生多走动、多变迁。适合从事与出行、物流、贸易、外交相关的工作。命主不宜安于一隅，越动越旺。若驿马逢冲，则变动尤为剧烈，人生充满变化和冒险。</p>');
          specialFound = true;
        }
        break;
      }
    }

    // 桃花星
    var taohua = {'寅午戌':'卯','申子辰':'酉','亥卯未':'子','巳酉丑':'午'};
    for (var tk in taohua) {
      if (tk.indexOf(yearZhi) >= 0) {
        var thZhi = taohua[tk];
        var hasTh = false;
        pArr.forEach(function(p){ if (p.zhi === thZhi) hasTh = true; });
        if (hasTh) {
          html.push('<h4>桃花星（咸池）</h4><p>命带桃花星，异性缘极佳，人缘好，社交魅力出众。桃花入命者多才多艺、风流倜傥。但需注意感情上的节制，桃花过旺则容易招惹感情纠纷。正桃花主良缘，偏桃花主烂桃花。</p>');
          specialFound = true;
        }
        break;
      }
    }

    // 华盖星
    var huagai = {'寅午戌':'戌','申子辰':'辰','亥卯未':'未','巳酉丑':'丑'};
    for (var hk in huagai) {
      if (hk.indexOf(yearZhi) >= 0) {
        var hgZhi = huagai[hk];
        var hasHg = false;
        pArr.forEach(function(p){ if (p.zhi === hgZhi) hasHg = true; });
        if (hasHg) {
          html.push('<h4>华盖星</h4><p>命带华盖星，主聪明好学、才华出众、悟性极高。华盖星为艺术之星，命主多有文艺天赋，适合从事学术、宗教、哲学、玄学、艺术创作等领域。然华盖也主孤独清高，不合群，内心世界丰富但不易被人理解。</p>');
          specialFound = true;
        }
        break;
      }
    }

    // 天德贵人/月德贵人
    var monthZhi = pArr[1].zhi;
    var tiande = {'寅':'丁','卯':'申','辰':'壬','巳':'辛','午':'亥','未':'甲','申':'癸','酉':'寅','戌':'丙','亥':'乙','子':'巳','丑':'庚'};
    var tdGan = tiande[monthZhi];
    if (tdGan) {
      var hasTd = false;
      pArr.forEach(function(p){ if (p.gan === tdGan) hasTd = true; });
      if (hasTd) {
        html.push('<h4>天德贵人</h4><p>命带天德贵人，一生逢凶化吉，有上天庇佑。为人品德高尚，常行善积德，自然感召福报。天德贵人主化解灾厄、消除是非，是极为难得的吉星。</p>');
        specialFound = true;
      }
    }

    // 地支相冲
    var chong = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥','午':'子','未':'丑','申':'寅','酉':'卯','戌':'辰','亥':'巳'};
    var chongPairs = [];
    for (var ci = 0; ci < 4; ci++) {
      for (var cj = ci + 1; cj < 4; cj++) {
        if (chong[pArr[ci].zhi] === pArr[cj].zhi) {
          chongPairs.push(pArr[ci].name + '(' + pArr[ci].zhi + ') 冲 ' + pArr[cj].name + '(' + pArr[cj].zhi + ')');
        }
      }
    }
    if (chongPairs.length > 0) {
      html.push('<h4>地支相冲</h4><p>命局中存在相冲：' + chongPairs.join('；') + '。相冲代表矛盾、变动和冲突的能量。冲到用神则不利，冲到忌神则为好事。命主性格中有矛盾对立的一面，人生中也会经历较大的变动。关键在于如何化解冲突、顺势而为。</p>');
      specialFound = true;
    }

    // 三合局
    var sanhe = [['寅','午','戌','火'],['申','子','辰','水'],['亥','卯','未','木'],['巳','酉','丑','金']];
    var zhiList = pArr.map(function(p){ return p.zhi; });
    sanhe.forEach(function(sh) {
      var count = 0;
      sh.slice(0,3).forEach(function(z){ if (zhiList.indexOf(z) >= 0) count++; });
      if (count === 3) {
        html.push('<h4>三合' + sh[3] + '局</h4><p>命局中' + sh[0] + sh[1] + sh[2] + '三合' + sh[3] + '局，三合局代表和谐统一的力量。此局成化则' + sh[3] + '气增强，对命局影响深远。三合局在命主人格中体现为善于整合资源、团结协作，人生中也更容易获得各方面的支持。</p>');
        specialFound = true;
      }
    });

    if (!specialFound) {
      html.push('<p>命局中未见显著的特殊神煞和组合。整体格局以五行平衡和十神配置为主导，属于常规命局。</p>');
    }
    html.push('</div>');

    // ==================== 14. 综合开运方案 ====================
    html.push('<div class="interp-card">');
    html.push('<h3 id="bz-sec-kaiyun">综合开运方案</h3>');
    html.push('<p style="font-size:.84rem;color:var(--ink-light)">以下建议均基于命局用神 <strong>' + result.yongShen + '</strong> 制定，旨在通过后天调整补充命局所需五行，趋吉避凶。</p>');

    var ys = result.yongShen;
    var js = result.jiShen;

    var fullData = {
      '木': {
        dir: '东方、东南方', dirDetail: '居住地和工作地宜选在出生地的东方或东南方。卧室宜安排在住宅的东侧。办公桌面朝东方。',
        color: '绿色、青色、翠绿色', colorDetail: '日常穿着以绿色系为主色调，可选翠绿、草绿、橄榄绿等。领带、围巾、包包等配饰用绿色点缀。家居主色调宜用浅绿或原木色。',
        num: '3、8', numDetail: '手机尾号含3或8为佳。楼层选3楼、8楼、13楼、18楼等。车牌号宜含3、8。',
        food: '绿色蔬菜（菠菜、西兰花、芹菜）、酸味食物（柠檬、醋）、猪肝、绿茶',
        item: '翡翠、绿幽灵水晶、木质手串（沉香、檀木）、绿松石',
        pet: '养植物最佳（发财树、绿萝、富贵竹），也可养兔',
        sport: '晨跑、登山、高尔夫、园艺、太极拳',
        industry: '教育培训、文化出版、医药卫生、林业园艺、服装纺织、家具木材、环保绿化',
        bedDir: '床头朝东，吸纳东方木气。卧室可放绿植，但不宜过多（阴气重）。',
        avoid: '少穿白色和金属饰品（金克木），少去西方和西北方。减少接触金属器械和刀具。'
      },
      '火': {
        dir: '南方', dirDetail: '居住地和工作地宜在出生地的南方。卧室宜安排在住宅南侧，采光要好。办公桌面朝南。',
        color: '红色、紫色、粉红、橙色', colorDetail: '日常穿着以暖色调为主，如酒红、玫红、紫色等。家居可用暖色灯光、红色装饰画。但不宜全红，点缀为佳。',
        num: '2、7', numDetail: '手机尾号含2或7为佳。楼层选2楼、7楼、12楼、17楼等。',
        food: '红色食物（红枣、枸杞、西红柿、红豆）、苦味食物（苦瓜、莲子心）、羊肉、红茶',
        item: '红玛瑙、石榴石、红纹石、紫水晶、红色手绳',
        pet: '养马图挂画、养蛇（属火），养红色观赏鱼',
        sport: '瑜伽、跑步、骑行、烹饪、篮球等有激情的运动',
        industry: '能源电力、餐饮烹饪、美容化妆、娱乐传媒、照明灯饰、电子科技、加工冶炼',
        bedDir: '床头朝南，接引南方火气。卧室灯光可稍亮暖，放红色抱枕或床品。',
        avoid: '少穿黑色和蓝色（水克火），少去北方。少接触水族箱和冷色调环境。'
      },
      '土': {
        dir: '本地为佳，或东北、西南方', dirDetail: '土主中央，宜在家乡或出生地附近发展。若需外出，东北和西南方向有利。住宅宜在地势平坦开阔处。',
        color: '黄色、棕色、卡其色、咖啡色', colorDetail: '穿着以大地色系为主，如驼色、卡其、深棕等。家居用暖黄灯光，装饰以陶瓷和石材为主。',
        num: '5、0', numDetail: '手机尾号含5或0为佳。楼层选5楼、10楼、15楼、20楼等。',
        food: '黄色食物（南瓜、玉米、小米、土豆）、甘甜食物、牛肉、蜂蜜',
        item: '黄水晶、虎眼石、蜜蜡琥珀、和田玉、陶瓷摆件',
        pet: '养狗、养牛摆件（属土），养陆龟',
        sport: '太极、登山、园艺、陶艺、散步冥想',
        industry: '房地产、建筑工程、农业种植、陶瓷石材、仓储物流、保险信托、矿业开采',
        bedDir: '床头朝东北或西南。卧室可放黄色水晶球或陶瓷花瓶。地面铺地毯增加土气。',
        avoid: '少穿绿色（木克土），少去东方密林区域。减少接触木质器具。'
      },
      '金': {
        dir: '西方、西北方', dirDetail: '居住地和工作地宜在出生地的西方或西北方。卧室安排在住宅西侧。办公桌面朝西。',
        color: '白色、银色、金色、浅灰', colorDetail: '穿着以白色和金属色为主。佩戴银饰、金饰效果极好。家居风格宜简洁明亮，金属质感。',
        num: '4、9', numDetail: '手机尾号含4或9为佳。楼层选4楼、9楼、14楼、19楼等。',
        food: '白色食物（银耳、百合、梨、白萝卜、莲藕）、辛味食物（姜、葱、蒜）、鸡肉',
        item: '金银首饰、白水晶、钛晶、铜钱挂饰、金属手表',
        pet: '养鸡（属金）、金鱼、白色宠物',
        sport: '击剑、射箭、拳击、金属乐器（萨克斯、小号）',
        industry: '金融银行、五金机械、汽车制造、珠宝首饰、司法执法、军警武术、IT硬件',
        bedDir: '床头朝西或西北。卧室可放金属摆件或风铃。窗帘选白色或浅灰色。',
        avoid: '少穿红色和紫色（火克金），少去南方高温地区。减少接触火源和高温环境。'
      },
      '水': {
        dir: '北方', dirDetail: '居住地和工作地宜在出生地的北方。卧室安排在住宅北侧。办公桌面朝北。住宅近水（河、湖、海）更佳。',
        color: '黑色、深蓝、藏青、灰色', colorDetail: '穿着以深色调为主，如藏青、深蓝、黑色等。佩戴深色饰品。家居可用蓝色调软装。',
        num: '1、6', numDetail: '手机尾号含1或6为佳。楼层选1楼、6楼、11楼、16楼等。',
        food: '黑色食物（黑豆、黑芝麻、黑木耳、海带、紫菜）、咸味食物、鱼虾海鲜、豆腐',
        item: '黑曜石、蓝宝石、海蓝宝、墨翠、黑玛瑙',
        pet: '养鱼（黑色或蓝色为佳）、养龟、水族箱',
        sport: '游泳、冲浪、帆船、钓鱼、泡温泉、滑冰',
        industry: '贸易进出口、航运物流、旅游酒店、水产养殖、饮品酒水、清洁环保、传播通讯',
        bedDir: '床头朝北。卧室可放小型水景或加湿器。蓝色或黑色床品有助补水。',
        avoid: '少穿黄色和棕色（土克水），少去干燥沙漠地区。减少接触陶瓷和石材装饰。'
      }
    };

    var ysData = fullData[ys] || {};
    var jsData = fullData[js] || {};

    // 吉利方位
    html.push('<h4>吉利方位</h4>');
    html.push('<p><strong>最佳方位：' + (ysData.dir||'') + '</strong></p>');
    html.push('<p>' + (ysData.dirDetail||'') + '</p>');

    // 幸运颜色
    html.push('<h4>幸运颜色</h4>');
    html.push('<p><strong>宜用：' + (ysData.color||'') + '</strong></p>');
    html.push('<p>' + (ysData.colorDetail||'') + '</p>');

    // 吉利数字
    html.push('<h4>吉利数字与楼层</h4>');
    html.push('<p><strong>吉数：' + (ysData.num||'') + '</strong></p>');
    html.push('<p>' + (ysData.numDetail||'') + '</p>');

    // 饮食调理
    html.push('<h4>饮食调理</h4>');
    html.push('<p>宜多食：' + (ysData.food||'') + '</p>');

    // 开运物品
    html.push('<h4>开运物品与饰品</h4>');
    html.push('<p>' + (ysData.item||'') + '</p>');

    // 开运宠物
    html.push('<h4>开运宠物与植物</h4>');
    html.push('<p>' + (ysData.pet||'') + '</p>');

    // 开运运动
    html.push('<h4>有利运动</h4>');
    html.push('<p>' + (ysData.sport||'') + '</p>');

    // 最佳行业
    html.push('<h4>最佳行业</h4>');
    html.push('<p>五行属<strong>' + ys + '</strong>的行业最有利：' + (ysData.industry||'') + '</p>');

    // 卧室与床位
    html.push('<h4>卧室与床位</h4>');
    html.push('<p>' + (ysData.bedDir||'') + '</p>');

    // 禁忌
    html.push('<h4>注意事项</h4>');
    html.push('<p style="color:var(--vermillion)">' + (ysData.avoid||'') + '</p>');

    html.push('</div>');

    // ==================== 结语 ====================
    html.push('<div class="interp-card" style="text-align:center;font-size:.85rem;color:var(--ink-light,#6b7280)">');
    html.push('<p>以上分析基于八字命理学理论，仅供参考。命运三分天注定，七分靠打拼。</p>');
    html.push('<p>八字揭示的是先天禀赋与运势趋势，后天的努力、选择与修为同样至关重要。</p>');
    html.push('<p style="margin-top:8px;font-family:var(--font-h,serif);color:var(--gold,#c5922e)">知命者不怨天，知己者不尤人。</p>');
    html.push('</div>');

    return html.join('\n');
  }

  /* ====================================================================
   *  导出
   * ==================================================================== */

  return {
    calculate: calculate,
    render: render
  };

})();
