/**
 * 梅花易数 - Plum Blossom Numerology Engine
 */
const MeiHua = (() => {
    // 八卦 Eight Trigrams
    // Index 1-8 (先天八卦序): 乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
    const BA_GUA = {
        1: { name: '乾', symbol: '☰', nature: '天', element: '金', lines: [1,1,1], desc: '刚健中正' },
        2: { name: '兑', symbol: '☱', nature: '泽', element: '金', lines: [1,1,0], desc: '喜悦和乐' },
        3: { name: '离', symbol: '☲', nature: '火', element: '火', lines: [1,0,1], desc: '光明依附' },
        4: { name: '震', symbol: '☳', nature: '雷', element: '木', lines: [0,0,1], desc: '震动奋起' },
        5: { name: '巽', symbol: '☴', nature: '风', element: '木', lines: [1,1,0], desc: '顺入无阻' },
        6: { name: '坎', symbol: '☵', nature: '水', element: '水', lines: [0,1,0], desc: '险难重重' },
        7: { name: '艮', symbol: '☶', nature: '山', element: '土', lines: [1,0,0], desc: '静止不动' },
        8: { name: '坤', symbol: '☷', nature: '地', element: '土', lines: [0,0,0], desc: '厚德载物' },
    };

    // 64 Hexagrams: [upper_trigram][lower_trigram] = { name, meaning, judgment }
    // Index by upper*8+lower for compact storage
    const HEX_64 = {
        '11': { name: '乾为天', meaning: '大吉', judgment: '元亨利贞。龙行天下，自强不息。事业亨通，宜积极进取。', advice: '宜：创业、晋升、决策、投资。' },
        '12': { name: '天泽履', meaning: '中吉', judgment: '履虎尾，不咥人。行事谨慎，如履薄冰则无忧。', advice: '宜：谨慎行事，循规蹈矩。' },
        '13': { name: '天火同人', meaning: '吉', judgment: '同人于野，亨。志同道合，和衷共济。', advice: '宜：合作、团队、社交。' },
        '14': { name: '天雷无妄', meaning: '中平', judgment: '无妄之灾，勿药有喜。顺应天道，不可妄为。', advice: '宜：守正、等待、修身。' },
        '15': { name: '天风姤', meaning: '中平', judgment: '女壮，勿用取女。意外相遇，需审慎对待。', advice: '宜：观察、等待、慎重交往。' },
        '16': { name: '天水讼', meaning: '凶', judgment: '有孚窒，惕中吉。争讼不利，宜和为贵。', advice: '忌：争讼、对抗。宜：和解、退让。' },
        '17': { name: '天山遁', meaning: '小凶', judgment: '亨，小利贞。退隐为上，以退为进。', advice: '宜：退让、隐忍、休养。' },
        '18': { name: '天地否', meaning: '凶', judgment: '否之匪人，不利君子贞。天地不交，闭塞不通。', advice: '忌：冒进。宜：韬光养晦，等待时机。' },

        '21': { name: '泽天夬', meaning: '中吉', judgment: '扬于王庭。果断决定，除旧布新。', advice: '宜：决断、改革、清除障碍。' },
        '22': { name: '兑为泽', meaning: '吉', judgment: '亨，利贞。喜悦交流，和气生财。', advice: '宜：交际、谈判、恋爱。' },
        '23': { name: '泽火革', meaning: '中吉', judgment: '己日乃孚。革故鼎新，变化更新。', advice: '宜：改革、创新、转变。' },
        '24': { name: '泽雷随', meaning: '吉', judgment: '元亨利贞，无咎。随机应变，顺势而为。', advice: '宜：随缘、顺应、灵活应对。' },
        '25': { name: '泽风大过', meaning: '凶', judgment: '栋桡，利有攸往。负担过重，需量力而行。', advice: '忌：过度操劳。宜：减负、求助。' },
        '26': { name: '泽水困', meaning: '凶', judgment: '亨，贞，大人吉。困境中守正，终将突破。', advice: '忌：冒险。宜：坚持、忍耐。' },
        '27': { name: '泽山咸', meaning: '吉', judgment: '亨，利贞。感应相通，有情人终成眷属。', advice: '宜：恋爱、结婚、合作。' },
        '28': { name: '泽地萃', meaning: '吉', judgment: '亨。聚合团结，人气旺盛。', advice: '宜：聚会、合作、团队建设。' },

        '31': { name: '火天大有', meaning: '大吉', judgment: '元亨。光明普照，事业大有可为。', advice: '宜：事业扩展、投资、领导。' },
        '32': { name: '火泽睽', meaning: '小凶', judgment: '小事吉。意见不合，但小事可成。', advice: '宜：求同存异、独立行事。' },
        '33': { name: '离为火', meaning: '中吉', judgment: '利贞，亨。光明依附，文明之象。', advice: '宜：文艺、考试、展示。' },
        '34': { name: '火雷噬嗑', meaning: '中吉', judgment: '亨，利用狱。铲除障碍，公正执法。', advice: '宜：解决问题、清除障碍。' },
        '35': { name: '火风鼎', meaning: '大吉', judgment: '元吉，亨。革新变化，鼎新之象。', advice: '宜：创新、改制、新项目。' },
        '36': { name: '火水未济', meaning: '中平', judgment: '亨，小狐汔济。事未完成，仍需努力。', advice: '宜：继续努力，不可松懈。' },
        '37': { name: '火山旅', meaning: '小吉', judgment: '小亨，旅贞吉。旅行在外，宜谨慎。', advice: '宜：旅行、短期项目、变动。' },
        '38': { name: '火地晋', meaning: '吉', judgment: '康侯用锡马蕃庶。步步高升，前途光明。', advice: '宜：晋升、求职、发展。' },

        '41': { name: '雷天大壮', meaning: '吉', judgment: '利贞。声势浩大，但宜守正。', advice: '宜：积极进取，但勿过度。' },
        '42': { name: '雷泽归妹', meaning: '凶', judgment: '征凶，无攸利。急于求成，反受其害。', advice: '忌：急躁。宜：等待、准备。' },
        '43': { name: '雷火丰', meaning: '大吉', judgment: '亨，王假之。丰盛繁荣，事业巅峰。', advice: '宜：扩展、庆祝、享受成果。' },
        '44': { name: '震为雷', meaning: '中吉', judgment: '亨。震来虩虩，笑言哑哑。', advice: '宜：振作、行动、开创。' },
        '45': { name: '雷风恒', meaning: '吉', judgment: '亨，无咎。持之以恒，始终如一。', advice: '宜：坚持、长期计划、婚姻。' },
        '46': { name: '雷水解', meaning: '吉', judgment: '利西南。困难解除，阴霾散去。', advice: '宜：解决纠纷、化解矛盾。' },
        '47': { name: '雷山小过', meaning: '中平', judgment: '亨，利贞。小事可为，大事不宜。', advice: '宜：谦逊行事，不宜冒进。' },
        '48': { name: '雷地豫', meaning: '吉', judgment: '利建侯行师。和乐之象，心想事成。', advice: '宜：娱乐、规划、享乐。' },

        '51': { name: '风天小畜', meaning: '中吉', judgment: '亨。密云不雨，蓄势待发。', advice: '宜：积蓄力量，准备就绪。' },
        '52': { name: '风泽中孚', meaning: '吉', judgment: '豚鱼吉。诚信感人，心心相印。', advice: '宜：诚信交往、谈判、合作。' },
        '53': { name: '风火家人', meaning: '吉', judgment: '利女贞。家庭和睦，各安其位。', advice: '宜：家事、管理、内务。' },
        '54': { name: '风雷益', meaning: '大吉', judgment: '利有攸往。有利可图，越来越好。', advice: '宜：投资、发展、助人。' },
        '55': { name: '巽为风', meaning: '中吉', judgment: '小亨，利有攸往。顺风顺水，渐入佳境。', advice: '宜：柔和处事、渐进发展。' },
        '56': { name: '风水涣', meaning: '中平', judgment: '亨。涣散不聚，宜整合资源。', advice: '宜：整合、疏通、调解。' },
        '57': { name: '风山渐', meaning: '吉', judgment: '女归吉。循序渐进，步步为营。', advice: '宜：长期规划、恋爱、发展。' },
        '58': { name: '风地观', meaning: '中平', judgment: '盥而不荐。观察等待，不宜行动。', advice: '宜：观察、学习、等待。' },

        '61': { name: '水天需', meaning: '吉', judgment: '有孚，光亨。等待时机，终将如愿。', advice: '宜：耐心等待，准备充分。' },
        '62': { name: '水泽节', meaning: '中吉', judgment: '亨。节制有度，适可而止。', advice: '宜：节省、控制、自律。' },
        '63': { name: '水火既济', meaning: '吉', judgment: '亨小，利贞。功成名就，但需防盛极而衰。', advice: '宜：巩固成果，居安思危。' },
        '64': { name: '水雷屯', meaning: '中平', judgment: '元亨利贞。创业艰难，但前途可期。', advice: '宜：坚持、积累、不放弃。' },
        '65': { name: '水风井', meaning: '中吉', judgment: '改邑不改井。滋养他人，源源不断。', advice: '宜：教育、服务、修身。' },
        '66': { name: '坎为水', meaning: '凶', judgment: '有孚，维心亨。险中求胜，需勇气和智慧。', advice: '忌：冒险。宜：谨慎、坚守。' },
        '67': { name: '水山蹇', meaning: '凶', judgment: '利西南。前路艰难，宜退避。', advice: '忌：冒进。宜：退守、等待。' },
        '68': { name: '水地比', meaning: '吉', judgment: '吉。亲近和善，众人归附。', advice: '宜：交友、合作、团结。' },

        '71': { name: '山天大畜', meaning: '大吉', judgment: '利贞。积蓄丰厚，厚积薄发。', advice: '宜：学习、积累、长期投资。' },
        '72': { name: '山泽损', meaning: '中平', judgment: '有孚。有所损失，但损中有益。', advice: '宜：减少开支、修身养性。' },
        '73': { name: '山火贲', meaning: '中吉', judgment: '亨，小利有攸往。文饰之美，注重外表。', advice: '宜：装饰、打扮、美化。' },
        '74': { name: '山雷颐', meaning: '中吉', judgment: '贞吉。自养养人，注重营养。', advice: '宜：养生、教育、培养。' },
        '75': { name: '山风蛊', meaning: '中平', judgment: '元亨。整治腐败，拨乱反正。', advice: '宜：改正错误、整顿治理。' },
        '76': { name: '山水蒙', meaning: '中平', judgment: '亨。蒙昧待启，需要教育引导。', advice: '宜：学习、请教、虚心。' },
        '77': { name: '艮为山', meaning: '中平', judgment: '艮其背。止而不动，静待时机。', advice: '宜：冥想、休息、等待。' },
        '78': { name: '山地剥', meaning: '凶', judgment: '不利有攸往。衰落剥蚀，宜静守。', advice: '忌：行动。宜：静守、保全。' },

        '81': { name: '地天泰', meaning: '大吉', judgment: '小往大来。天地交泰，万事亨通。', advice: '宜：一切事务，大吉大利。' },
        '82': { name: '地泽临', meaning: '吉', judgment: '元亨利贞。君临天下，有权有势。', advice: '宜：领导、管理、决策。' },
        '83': { name: '地火明夷', meaning: '凶', judgment: '利艰贞。光明受损，韬光养晦。', advice: '忌：出风头。宜：低调、隐忍。' },
        '84': { name: '地雷复', meaning: '吉', judgment: '亨。一阳来复，否极泰来。', advice: '宜：重新开始、恢复、返回。' },
        '85': { name: '地风升', meaning: '吉', judgment: '元亨。稳步上升，前途无量。', advice: '宜：晋升、发展、求学。' },
        '86': { name: '地水师', meaning: '中平', judgment: '贞丈人吉。统率有方，纪律严明。', advice: '宜：团队领导、组织管理。' },
        '87': { name: '地山谦', meaning: '大吉', judgment: '亨，君子有终。谦虚为怀，百事皆顺。', advice: '宜：一切事务，谦逊处世。' },
        '88': { name: '坤为地', meaning: '大吉', judgment: '元亨，利牝马之贞。厚德载物，包容万象。', advice: '宜：承受、配合、柔顺处事。' },
    };

    // Calculate hexagram from numbers
    function calculate(method, nums, question) {
        let upperNum, lowerNum, changingNum;
        const now = new Date();

        if (method === 'time') {
            // 时间起卦: year+month+day = upper, year+month+day+hour = lower, total = changing
            const lunar = Lunar.solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
            const hourIdx = Math.floor((now.getHours() + 1) % 24 / 2);
            upperNum = lunar.year + lunar.month + lunar.day;
            lowerNum = upperNum + hourIdx;
            changingNum = lowerNum;
        } else if (method === 'random') {
            upperNum = Math.floor(Math.random() * 1000) + 1;
            lowerNum = Math.floor(Math.random() * 1000) + 1;
            changingNum = upperNum + lowerNum;
        } else {
            // Number method
            if (nums.length === 1) {
                upperNum = nums[0];
                lowerNum = nums[0];
                changingNum = nums[0];
            } else if (nums.length === 2) {
                upperNum = nums[0];
                lowerNum = nums[1];
                changingNum = nums[0] + nums[1];
            } else {
                upperNum = nums[0] + nums[1];
                lowerNum = nums[1] + nums[2];
                changingNum = nums[0] + nums[1] + nums[2];
            }
        }

        // Map to trigrams (1-8)
        let upper = upperNum % 8;
        if (upper === 0) upper = 8;
        let lower = lowerNum % 8;
        if (lower === 0) lower = 8;

        // Changing line (1-6, bottom to top)
        let changingLine = changingNum % 6;
        if (changingLine === 0) changingLine = 6;

        // Build original hexagram lines (bottom to top: lower trigram then upper)
        const upperGua = BA_GUA[upper];
        const lowerGua = BA_GUA[lower];

        // Lines array: index 0 = bottom line, index 5 = top line
        // Lower trigram: lines[0], [1], [2]; Upper trigram: lines[3], [4], [5]
        const lines = [
            ...lowerGua.lines.slice().reverse(),  // bottom to top for lower
            ...upperGua.lines.slice().reverse()   // bottom to top for upper
        ];
        // Fix: trigram lines are stored top-to-bottom, we need bottom-to-top
        const origLines = [
            lowerGua.lines[2], lowerGua.lines[1], lowerGua.lines[0],
            upperGua.lines[2], upperGua.lines[1], upperGua.lines[0]
        ];

        // Changed hexagram: flip the changing line
        const changedLines = [...origLines];
        changedLines[changingLine - 1] = changedLines[changingLine - 1] === 1 ? 0 : 1;

        // Determine changed hexagram trigrams
        const changedLowerLines = [changedLines[2], changedLines[1], changedLines[0]];
        const changedUpperLines = [changedLines[5], changedLines[4], changedLines[3]];
        const changedUpper = findTrigram(changedUpperLines);
        const changedLower = findTrigram(changedLowerLines);

        // Mutual hexagram (互卦): lines 2,3,4 = lower; lines 3,4,5 = upper (1-indexed)
        const huLowerLines = [origLines[3], origLines[2], origLines[1]]; // top-to-bottom
        const huUpperLines = [origLines[4], origLines[3], origLines[2]]; // top-to-bottom
        const huUpper = findTrigram(huUpperLines);
        const huLower = findTrigram(huLowerLines);

        // Look up hexagram info
        const origKey = `${upper}${lower}`;
        const changedKey = `${changedUpper}${changedLower}`;
        const huKey = `${huUpper}${huLower}`;

        const origHex = HEX_64[origKey] || { name: '未知', meaning: '', judgment: '', advice: '' };
        const changedHex = HEX_64[changedKey] || { name: '未知', meaning: '', judgment: '', advice: '' };
        const huHex = HEX_64[huKey] || { name: '未知', meaning: '', judgment: '', advice: '' };

        // Ti-Yong analysis
        // The trigram with the changing line is Yong (用), the other is Ti (体)
        let tiGua, yongGua;
        if (changingLine <= 3) {
            // Changing line in lower trigram
            yongGua = lowerGua;
            tiGua = upperGua;
        } else {
            // Changing line in upper trigram
            yongGua = upperGua;
            tiGua = lowerGua;
        }

        const tiYongRelation = Lunar.wuxingRelation(tiGua.element, yongGua.element);
        const tiYongVerdict = getTiYongVerdict(tiYongRelation);

        return {
            method,
            question: question || '',
            upper, lower, upperGua, lowerGua,
            origLines, changedLines, changingLine,
            changedUpper, changedLower,
            huUpper, huLower,
            origHex, changedHex, huHex,
            tiGua, yongGua,
            tiYongRelation, tiYongVerdict,
            time: now
        };
    }

    function findTrigram(linesTopToBottom) {
        for (let i = 1; i <= 8; i++) {
            const g = BA_GUA[i];
            if (g.lines[0] === linesTopToBottom[0] &&
                g.lines[1] === linesTopToBottom[1] &&
                g.lines[2] === linesTopToBottom[2]) {
                return i;
            }
        }
        return 1;
    }

    function getTiYongVerdict(relation) {
        switch (relation) {
            case 'same': return { text: '比和', level: 'good', desc: '体用相同，事情平顺，可以顺利进行。' };
            case 'generate': return { text: '体生用', level: 'neutral', desc: '体卦生用卦，精力消耗，有所付出但未必有回报。宜节制。' };
            case 'restrain': return { text: '体克用', level: 'good', desc: '体卦克用卦，我方占优，事情可成，有利可图。' };
            case 'generated': return { text: '用生体', level: 'good', desc: '用卦生体卦，外力相助，贵人运旺，事情顺利。大吉。' };
            case 'restrained': return { text: '用克体', level: 'bad', desc: '用卦克体卦，阻力重重，不利于行动。宜退守。' };
            default: return { text: '比和', level: 'neutral', desc: '关系平和。' };
        }
    }

    function render(result) {
        let html = '<div class="card">';

        if (result.question) {
            html += `<h3>所问之事</h3><p style="font-style:italic">${escapeHtml(result.question)}</p>`;
        }

        html += `<p style="color:#666;font-size:0.85rem;">起卦时间：${result.time.toLocaleString('zh-CN')}</p>`;

        // Hexagram display
        html += '<div class="hexagram-display">';

        // Original hexagram
        html += renderHexagramBox('本卦', result.origLines, result.changingLine, result.upper, result.lower, result.origHex);

        html += '<div class="arrow">→</div>';

        // Changed hexagram
        html += renderHexagramBox('变卦', result.changedLines, 0, result.changedUpper, result.changedLower, result.changedHex);

        html += '<div class="arrow">⇌</div>';

        // Mutual hexagram
        const huLines = [
            BA_GUA[result.huLower].lines[2], BA_GUA[result.huLower].lines[1], BA_GUA[result.huLower].lines[0],
            BA_GUA[result.huUpper].lines[2], BA_GUA[result.huUpper].lines[1], BA_GUA[result.huUpper].lines[0]
        ];
        html += renderHexagramBox('互卦', huLines, 0, result.huUpper, result.huLower, result.huHex);

        html += '</div>'; // hexagram-display

        // Ti-Yong Analysis
        html += '<div class="tiyong-analysis">';
        html += `<h4>体用分析</h4>`;
        html += `<p>体卦：${result.tiGua.name}（${result.tiGua.element}）| 用卦：${result.yongGua.name}（${result.yongGua.element}）</p>`;
        html += `<div class="verdict verdict-${result.tiYongVerdict.level}">${result.tiYongVerdict.text}</div>`;
        html += `<p>${result.tiYongVerdict.desc}</p>`;
        html += '</div>';

        // Interpretations
        html += '<h3>本卦解读</h3>';
        html += `<div class="interp-card">
            <h4>${result.origHex.name}（${result.origHex.meaning}）</h4>
            <p>${result.origHex.judgment}</p>
            <p><strong>${result.origHex.advice}</strong></p>
        </div>`;

        html += '<h3>变卦提示</h3>';
        html += `<div class="interp-card">
            <h4>${result.changedHex.name}（${result.changedHex.meaning}）</h4>
            <p>${result.changedHex.judgment}</p>
            <p><strong>${result.changedHex.advice}</strong></p>
            <p>动爻：第${result.changingLine}爻（${result.changingLine <= 3 ? '下卦' : '上卦'}）</p>
        </div>`;

        html += '<h3>互卦参考</h3>';
        html += `<div class="interp-card">
            <h4>${result.huHex.name}（${result.huHex.meaning}）</h4>
            <p>互卦反映事情发展的过程和内在因素。</p>
            <p>${result.huHex.judgment}</p>
        </div>`;

        // Overall verdict
        html += '<h3>综合判断</h3>';
        html += `<div class="interp-card">
            <h4>总论</h4>
            <p>${getOverallVerdict(result)}</p>
        </div>`;

        html += '</div>'; // card
        return html;
    }

    function renderHexagramBox(title, lines, changingLine, upperIdx, lowerIdx, hexInfo) {
        let html = `<div class="hexagram-box">
            <h4>${title}</h4>
            <div class="hexagram-lines">`;

        // Render from top (line 6) to bottom (line 1)
        for (let i = 5; i >= 0; i--) {
            const isYang = lines[i] === 1;
            const isChanging = changingLine > 0 && (i + 1) === changingLine;
            html += `<div class="hex-line ${isYang ? 'yang' : 'yin'} ${isChanging ? 'changing' : ''}"></div>`;
        }

        html += '</div>';
        html += `<div class="hexagram-name">${hexInfo.name}</div>`;
        html += `<div class="hexagram-element">${BA_GUA[upperIdx].name}${BA_GUA[upperIdx].symbol} / ${BA_GUA[lowerIdx].name}${BA_GUA[lowerIdx].symbol}</div>`;
        html += '</div>';
        return html;
    }

    function getOverallVerdict(result) {
        const meanings = {
            '大吉': 5, '吉': 4, '中吉': 3, '小吉': 2, '中平': 1, '小凶': -1, '凶': -2
        };
        const origScore = meanings[result.origHex.meaning] || 0;
        const changedScore = meanings[result.changedHex.meaning] || 0;
        const tiYongScore = result.tiYongVerdict.level === 'good' ? 2 : (result.tiYongVerdict.level === 'bad' ? -2 : 0);
        const total = origScore + changedScore + tiYongScore;

        let verdict = '';
        if (total >= 8) verdict = '大吉之象。天时地利人和，万事如意，宜积极把握机会。';
        else if (total >= 5) verdict = '吉象。整体形势有利，可以积极行动，但仍需谨慎。';
        else if (total >= 2) verdict = '中吉。事情基本顺利，但有小波折，宜稳中求进。';
        else if (total >= 0) verdict = '平和之象。事情无大碍，但也无大利，宜守常。';
        else if (total >= -3) verdict = '小有不利。需要谨慎行事，避免冲动决策。';
        else verdict = '不利之象。当前形势不佳，宜退守等待，不宜冒进。';

        verdict += `\n\n本卦${result.origHex.name}示现当前状态，变卦${result.changedHex.name}指示发展方向。`;
        verdict += `${result.tiYongVerdict.text}，${result.tiYongVerdict.desc}`;

        return verdict;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { calculate, render, BA_GUA };
})();
