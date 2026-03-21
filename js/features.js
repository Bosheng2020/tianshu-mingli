(function() {
    'use strict';

    // ========== Inject Styles ==========
    var style = document.createElement('style');
    style.textContent = [
        /* Export bar */
        '.export-bar{display:flex;gap:8px;justify-content:flex-end;margin-bottom:12px;flex-wrap:wrap}',
        '.export-btn{font-family:var(--font-h);font-size:.78rem;padding:5px 14px;border:1px solid var(--border);border-radius:20px;background:var(--card);color:var(--ink-light);cursor:pointer;transition:all .15s}',
        '.export-btn:hover{border-color:var(--gold);color:var(--gold);background:rgba(197,146,46,.05)}',
        /* Bookmark star */
        '.bookmark-star{background:none;border:none;cursor:pointer;font-size:1.1rem;padding:0 4px;vertical-align:middle;opacity:.6;transition:opacity .15s}',
        '.bookmark-star:hover,.bookmark-star.active{opacity:1}',
        '.bookmark-star.active{color:#c5922e}',
        /* Favorites panel */
        '.fav-trigger{position:fixed;bottom:70px;left:16px;z-index:900;width:40px;height:40px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--gold);font-size:1.2rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;transition:all .2s}',
        '.fav-trigger:hover{transform:scale(1.1);border-color:var(--gold)}',
        '.fav-trigger .fav-count{position:absolute;top:-4px;right:-4px;background:var(--vermillion,#c53d43);color:#fff;font-size:.6rem;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}',
        '.fav-panel{position:fixed;bottom:118px;left:16px;z-index:901;width:260px;max-height:340px;background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg,12px);box-shadow:0 4px 20px rgba(0,0,0,.15);overflow:hidden;display:none}',
        '.fav-panel.open{display:block}',
        '.fav-panel-header{padding:10px 14px;font-size:.85rem;font-weight:700;border-bottom:1px solid var(--border);color:var(--gold)}',
        '.fav-panel-list{overflow-y:auto;max-height:280px;padding:6px 0}',
        '.fav-panel-item{display:flex;align-items:center;padding:8px 14px;cursor:pointer;font-size:.8rem;color:var(--ink);transition:background .12s}',
        '.fav-panel-item:hover{background:rgba(197,146,46,.06)}',
        '.fav-panel-item .fav-label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.fav-panel-item .fav-remove{background:none;border:none;cursor:pointer;color:var(--ink-light);font-size:.9rem;padding:0 4px;opacity:.5;transition:opacity .12s}',
        '.fav-panel-item .fav-remove:hover{opacity:1;color:var(--vermillion,#c53d43)}',
        '.fav-panel-empty{padding:20px;text-align:center;color:var(--ink-light);font-size:.8rem}'
    ].join('\n');
    document.head.appendChild(style);


    // ========================================================
    // Feature 1: Dark Mode Toggle
    // ========================================================
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        var savedTheme = localStorage.getItem('tianshu_theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '\u2600\uFE0F \u4EAE\u8272';
        }

        themeToggle.addEventListener('click', function() {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                themeToggle.textContent = '\uD83C\uDF19 \u6697\u8272';
                localStorage.setItem('tianshu_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggle.textContent = '\u2600\uFE0F \u4EAE\u8272';
                localStorage.setItem('tianshu_theme', 'dark');
            }
        });
    }


    // ========================================================
    // Feature 2: Language Toggle (简体/繁体/English)
    // ========================================================

    // Simplified-to-Traditional character mapping — ONLY pairs where S !== T
    var S2T_MAP = {
        // Metaphysics core
        '\u7B7E':'\u7C64','\u8FD0':'\u904B','\u76D8':'\u76E4','\u672F':'\u8853','\u6570':'\u6578',
        '\u6C14':'\u6C23','\u98CE':'\u98A8','\u9634':'\u9670','\u9633':'\u967D','\u5E08':'\u5E2B','\u5BAB':'\u5BAE',
        '\u8D22':'\u8CA1','\u53D1':'\u767C','\u65F6':'\u6642','\u5173':'\u95DC','\u95E8':'\u9580','\u5F00':'\u958B',
        '\u8282':'\u7BC0','\u94B1':'\u9322','\u9A6C':'\u99AC','\u9F99':'\u9F8D','\u9E21':'\u96DE','\u5934':'\u982D',
        '\u4E66':'\u66F8','\u5B66':'\u5B78','\u4E1A':'\u696D','\u89C1':'\u898B','\u89C2':'\u89C0','\u8BF4':'\u8AAA',
        '\u8BDD':'\u8A71','\u8BED':'\u8A9E','\u8BFB':'\u8B80','\u8BB2':'\u8B1B','\u8BA4':'\u8A8D','\u8F66':'\u8ECA',
        '\u4E1C':'\u6771','\u8FDB':'\u9032','\u8FDC':'\u9060','\u8FD8':'\u9084','\u8FC7':'\u904E','\u8FD9':'\u9019',
        '\u79CD':'\u7A2E','\u51E4':'\u9CF3','\u7ECF':'\u7D93','\u4E49':'\u7FA9','\u95F4':'\u9593',
        '\u6597':'\u9B25', // 斗→鬥 (紫微斗数)
        '\u7984':'\u797F', // 禄→祿  (actually keep original mapping)
        // Common general (only differing pairs)
        '\u4E07':'\u842C','\u4E0E':'\u8207','\u4E13':'\u5C08','\u4E30':'\u8C50','\u4E3A':'\u70BA','\u4E3D':'\u9E97',
        '\u4E48':'\u9EBC','\u4E60':'\u7FD2','\u4E61':'\u9109','\u4E70':'\u8CB7','\u4E71':'\u4E82',
        '\u4EA7':'\u7522','\u4EB2':'\u89AA','\u4ECE':'\u5F9E','\u4ED3':'\u5009',
        '\u4F1A':'\u6703','\u4F20':'\u50B3','\u4F24':'\u50B7','\u4F53':'\u9AD4','\u4F59':'\u9918',
        '\u4FA0':'\u4BF6','\u50A8':'\u5132',
        '\u515A':'\u9EE8','\u5170':'\u862D','\u5174':'\u8208','\u517B':'\u990A',
        '\u5185':'\u5167','\u518C':'\u518A','\u5199':'\u5BEB','\u519B':'\u8ECD','\u51B2':'\u6C96',
        '\u51B3':'\u6C7A','\u51C0':'\u6DE8','\u51C6':'\u6E96','\u51CF':'\u6E1B','\u51E0':'\u5E7E',
        '\u5212':'\u5283','\u521B':'\u5275','\u522B':'\u5225','\u5267':'\u5287',
        '\u529E':'\u8FA6','\u52A1':'\u52D9','\u52A8':'\u52D5','\u52B1':'\u52F5','\u52B3':'\u52DE','\u52BF':'\u52E2',
        '\u533A':'\u5340','\u534E':'\u83EF','\u5355':'\u55AE','\u5386':'\u6B77',
        '\u53C2':'\u53C3','\u53CC':'\u96D9','\u53D8':'\u8B8A','\u53F0':'\u81FA',
        '\u540E':'\u5F8C','\u542F':'\u555F','\u5458':'\u54E1','\u54CD':'\u97FF',
        '\u56E2':'\u5718','\u56FD':'\u570B','\u56FE':'\u5716','\u573A':'\u5834',
        '\u575B':'\u58C7','\u5757':'\u584A',
        '\u5904':'\u8655','\u5907':'\u5099','\u590D':'\u5FA9',
        '\u5B59':'\u5B6B','\u5B81':'\u5BE7','\u5B9E':'\u5BE6',
        '\u5BF9':'\u5C0D','\u5BFC':'\u5C0E','\u5C06':'\u5C07','\u5C14':'\u723E','\u5C42':'\u5C64','\u5C5E':'\u5C6C',
        '\u5C81':'\u6B72','\u5C97':'\u5D17','\u5C9B':'\u5CF6',
        '\u5E03':'\u4F48','\u5E26':'\u5E36','\u5E72':'\u5E79','\u5E76':'\u4E26',
        '\u5E7F':'\u5EE3','\u5E93':'\u5EAB','\u5E94':'\u61C9',
        '\u5F20':'\u5F35','\u5F3A':'\u5F37','\u5F52':'\u6B78','\u5F53':'\u7576','\u5F55':'\u9304',
        '\u5F7B':'\u5FB9','\u6001':'\u614B','\u604B':'\u6200',
        '\u6218':'\u6230','\u6237':'\u6236','\u6267':'\u57F7','\u6269':'\u64F4',
        '\u62A5':'\u5831','\u62E9':'\u64C7','\u6362':'\u63DB','\u636E':'\u64DA','\u6444':'\u651D',
        '\u65E0':'\u7121','\u65E7':'\u820A','\u663E':'\u986F','\u673A':'\u6A5F','\u6740':'\u6BBA',
        '\u6742':'\u96DC','\u6743':'\u6B0A','\u6761':'\u689D','\u6765':'\u4F86','\u6781':'\u6975',
        '\u6807':'\u6A19','\u6811':'\u6A39','\u6837':'\u6A23','\u68A6':'\u5922','\u697C':'\u6A13',
        '\u6B22':'\u6B61','\u6BD5':'\u7562','\u6C49':'\u6F22','\u6C64':'\u6E6F',
        '\u6CA1':'\u6C92','\u6D4B':'\u6E2C','\u6D4E':'\u6FDF','\u6E29':'\u6EAB','\u6E38':'\u904A','\u6E7E':'\u7063',
        '\u6EE1':'\u6EFF','\u706F':'\u71C8','\u70B9':'\u9EDE','\u70ED':'\u71B1',
        '\u7231':'\u611B','\u72B6':'\u72C0','\u72EC':'\u7368','\u73B0':'\u73FE','\u73AF':'\u74B0',
        '\u7535':'\u96FB','\u76D1':'\u76E3','\u786E':'\u78BA',
        '\u795F':'\u7984','\u79BB':'\u96E2','\u79EF':'\u7A4D','\u7A33':'\u7A69',
        '\u7B14':'\u7B46','\u7B80':'\u7C21','\u7C7B':'\u985E',
        '\u7EA2':'\u7D05','\u7EA6':'\u7D04','\u7EA7':'\u7D1A','\u7EAA':'\u7D00',
        '\u7EC4':'\u7D44','\u7EC6':'\u7D30','\u7EC8':'\u7D42','\u7ED3':'\u7D50','\u7ED9':'\u7D66',
        '\u7EDF':'\u7D71','\u7EE7':'\u7E7C','\u7EED':'\u7E8C','\u7EF4':'\u7DAD','\u7F51':'\u7DB2',
        '\u8054':'\u806F','\u811A':'\u8173',
        '\u8303':'\u7BC4','\u8363':'\u69AE','\u83B7':'\u7372','\u8425':'\u71DF','\u8427':'\u856D','\u8428':'\u85A9',
        '\u8865':'\u88DC','\u88C5':'\u88DD',
        '\u89C4':'\u898F','\u89C6':'\u8996','\u89C8':'\u89BD','\u89C9':'\u89BA',
        '\u8BA1':'\u8A08','\u8BA2':'\u8A02','\u8BA8':'\u8A0E','\u8BA9':'\u8B93','\u8BAD':'\u8A13','\u8BAE':'\u8B70',
        '\u8BB0':'\u8A18','\u8BB8':'\u8A31','\u8BBA':'\u8AD6','\u8BBE':'\u8A2D','\u8BC1':'\u8B49','\u8BC4':'\u8A55',
        '\u8BC6':'\u8B58','\u8BCD':'\u8A5E','\u8BD5':'\u8A66','\u8BD7':'\u8A69','\u8BDA':'\u8AA0',
        '\u8BE5':'\u8A72','\u8BE6':'\u8A73','\u8BF7':'\u8ACB','\u8BF8':'\u8AF8',
        '\u8C01':'\u8AB0','\u8C03':'\u8ABF','\u8C08':'\u8AC7',
        '\u8D24':'\u8CE2','\u8D25':'\u6557','\u8D26':'\u5E33','\u8D27':'\u8CA8','\u8D28':'\u8CEA',
        '\u8D2B':'\u8CA7','\u8D2D':'\u8CFC','\u8D34':'\u8CBC','\u8D35':'\u8CB4','\u8D37':'\u8CB8','\u8D38':'\u8CBF',
        '\u8D39':'\u8CBB','\u8D4F':'\u8CDE','\u8D5E':'\u8D0A','\u8D60':'\u8D08','\u8D62':'\u8D0F',
        '\u8F6C':'\u8F49','\u8F68':'\u8ECB','\u8F6E':'\u8F2A','\u8F7B':'\u8F15','\u8F7D':'\u8F09',
        '\u8F83':'\u8F03','\u8F85':'\u8F14','\u8F89':'\u8F1D','\u8F91':'\u8F2F','\u8F93':'\u8F38','\u8F96':'\u8F44',
        '\u8FBE':'\u9054','\u8FC1':'\u9077','\u8FDE':'\u9023','\u8FDF':'\u9072',
        '\u9002':'\u9069','\u9009':'\u9078','\u90AE':'\u90F5',
        '\u91C7':'\u63A1','\u91CC':'\u88E1',
        '\u9488':'\u91DD','\u94A2':'\u92FC','\u94C1':'\u9435','\u94F6':'\u9280',
        '\u94FA':'\u92EA','\u9501':'\u9396','\u9519':'\u932F','\u9547':'\u93AE','\u957F':'\u9577',
        '\u95EA':'\u9583','\u95ED':'\u9589','\u95EE':'\u554F','\u95F2':'\u9592',
        '\u9605':'\u95B1','\u9635':'\u9663','\u9645':'\u969B','\u9646':'\u9678','\u9648':'\u9673',
        '\u9669':'\u96AA','\u968F':'\u96A8','\u96BE':'\u96E3','\u96CF':'\u96DB',
        '\u9759':'\u975C','\u97E9':'\u97D3',
        '\u9875':'\u9801','\u9876':'\u9802','\u9879':'\u9805','\u987B':'\u9808','\u9884':'\u9810',
        '\u9886':'\u9818','\u9891':'\u983B','\u9898':'\u984C','\u98DE':'\u98DB',
        '\u9970':'\u98FE','\u9A7B':'\u99D0','\u9A7E':'\u99D5','\u9A8C':'\u9A57',
        '\u9C7C':'\u9B5A','\u9E1F':'\u9CE5','\u9F9F':'\u9F9C',
        // Additional metaphysics
        '\u7EBF':'\u7DDA','\u53F7':'\u865F','\u8BF5':'\u8AA6','\u6076':'\u60E1',
        '\u7740':'\u8457','\u852C':'\u8526','\u8D23':'\u8CAC','\u8BAB':'\u8AE7','\u8C0A':'\u8ABC',
        '\u4F63':'\u50AD' // 佣→傭
    };

    // Build reverse map (Traditional -> Simplified)
    var T2S_MAP = {};
    var sKey;
    for (sKey in S2T_MAP) {
        if (S2T_MAP.hasOwnProperty(sKey)) {
            T2S_MAP[S2T_MAP[sKey]] = sKey;
        }
    }

    // English UI string translations (~150+ entries)
    var EN = {
        // Site title & subtitle
        '\u5929\u67A2\u547D\u7406': 'TianShu Astrology',
        '\u516B\u5B57 \u00B7 \u7D2B\u5FAE\u6597\u6570 \u00B7 \u5408\u5A5A\u914D\u5BF9 \u00B7 \u6885\u82B1\u6613\u6570 \u00B7 \u89C2\u97F3\u7075\u7B7E \u00B7 \u98CE\u6C34\u582A\u8206': 'BaZi \u00B7 Zi Wei Dou Shu \u00B7 Marriage Match \u00B7 Plum Blossom \u00B7 Oracle \u00B7 Feng Shui',
        // Module names
        '\u516B\u5B57\u547D\u76D8': 'BaZi Chart',
        '\u7D2B\u5FAE\u6597\u6570': 'Zi Wei Dou Shu',
        '\u98CE\u6C34\u582A\u8206': 'Feng Shui',
        '\u4ECA\u65E5\u5B9C\u5FCC': 'Daily Fortune',
        '\u516B\u5B57\u5408\u5A5A': 'Marriage Match',
        '\u4E8B\u4E1A\u5408\u76D8': 'Partner Match',
        '\u6885\u82B1\u6613\u6570': 'Plum Blossom',
        '\u89C2\u97F3\u7075\u7B7E': 'Oracle',
        '\u63B7\u7B4A\u95EE\u4E8B': 'Moon Blocks',
        // Tab group labels
        '\u6BCF\u65E5': 'Daily',
        '\u547D\u7406': 'Destiny',
        '\u914D\u5BF9': 'Match',
        '\u5360\u535C': 'Divination',
        // Form elements
        '\u51FA\u751F\u65E5\u671F\uFF08\u9633\u5386\uFF09': 'Birth Date (Solar)',
        '\u51FA\u751F\u65F6\u95F4': 'Birth Time',
        '\u7701\u4EFD': 'Province',
        '\u57CE\u5E02': 'City',
        '\u6027\u522B': 'Gender',
        '\u7537': 'Male',
        '\u5973': 'Female',
        '\u5F00\u59CB\u6392\u76D8': 'Calculate',
        '\u5F00\u59CB\u5408\u5A5A': 'Analyze Marriage',
        '\u5F00\u59CB\u5408\u76D8': 'Analyze Partnership',
        // Placeholder texts
        '\u5FC3\u4E2D\u6240\u6C42\u4E4B\u4E8B': 'Your question',
        '\u8BF7\u793A\u795E\u660E\u4E4B\u4E8B': 'Ask the gods',
        '\u5FC3\u4E2D\u6240\u6C42\u4E4B\u4E8B\uFF08\u5982\uFF1A\u4E8B\u4E1A\u3001\u611F\u60C5\u3001\u8D22\u8FD0...\uFF09': 'Your wish (career, love, wealth...)',
        // Button texts
        '\u8BDA\u5FC3\u62BD\u7B7E': 'Draw Oracle',
        '\u63B7\u7B4A\u4E09\u6B21': 'Cast 3 Times',
        '\u518D\u62BD\u4E00\u7B7E': 'Draw Again',
        '\u518D\u63B7\u4E00\u6B21': 'Cast Again',
        '\u67E5\u7B7E': 'Look Up',
        '\u5237\u65B0': 'Refresh',
        '\u8D77\u5366': 'Cast',
        '\u8D77\u5366\u65B9\u5F0F': 'Method',
        '\u6570\u5B57\u8D77\u5366': 'By Number',
        '\u65F6\u95F4\u8D77\u5366': 'By Time',
        '\u968F\u673A\u8D77\u5366': 'Random',
        '\u8BF7\u8F93\u5165\u6570\u5B57\uFF081\u301C3\u4E2A\uFF09': 'Enter numbers (1-3)',
        '\u6240\u95EE\u4E4B\u4E8B\uFF08\u53EF\u9009\uFF09': 'Your question (optional)',
        // Section headers
        '\u7B7E\u8BD7': 'Oracle Poem',
        '\u7B7E\u89E3': 'Interpretation',
        '\u767D\u8BDD\u7FFB\u8BD1': 'Translation',
        '\u5178\u6545': 'Allusion',
        '\u4E8B\u4E1A': 'Career',
        '\u611F\u60C5': 'Love',
        '\u8D22\u8FD0': 'Wealth',
        '\u5065\u5EB7': 'Health',
        '\u5B66\u4E1A': 'Study',
        '\u8BC9\u8BBC': 'Legal',
        '\u884C\u52A8\u5EFA\u8BAE': 'Advice',
        '\u5B9C': 'Auspicious',
        '\u5FCC': 'Inauspicious',
        // Daily fortune
        '\u4ECA\u65E5\u65E5\u671F': "Today's Date",
        '\u4ECA\u65E5\u5B9C\u5FCC': "Today's Do & Don't",
        '\u4ECA\u65E5\u65F6\u8FB0': "Today's Hours",
        '\u4E2A\u4EBA\u5316\u8FD0\u52BF': 'Personal Fortune',
        '\u4E8C\u5341\u516B\u5BBF': '28 Mansions',
        // Result area placeholders
        '\u8BF7\u5728\u4E0A\u65B9\u8F93\u5165\u51FA\u751F\u4FE1\u606F\u540E\u70B9\u51FB\u300C\u5F00\u59CB\u6392\u76D8\u300D': 'Enter birth info above, then click "Calculate"',
        // Feng shui
        '\u98CE\u6C34\u582A\u8206': 'Feng Shui',
        '\u516B\u5B85\u547D\u5366': 'Eight Mansions',
        '\u6D41\u5E74\u98DE\u661F': 'Annual Flying Stars',
        '\u6D41\u6708\u98DE\u661F': 'Monthly Flying Stars',
        '\u5C45\u5BB6\u5E03\u5C40': 'Home Layout',
        '\u5367\u5BA4\u4E0E\u5E8A\u4F4D': 'Bedroom',
        '\u50AC\u8D22\u5E03\u5C40': 'Wealth Layout',
        '\u98CE\u6C34\u7981\u5FCC': 'Taboos',
        '\u529E\u516C\u5BA4\u98CE\u6C34': 'Office Feng Shui',
        // Hehun / Partner
        '\u7532\u65B9': 'Person A',
        '\u4E59\u65B9': 'Person B',
        '\u59D3\u540D(\u9009\u586B)': 'Name (optional)',
        '\u51FA\u751F\u65E5\u671F': 'Birth Date',
        '\u51FA\u751F\u65F6\u8FB0': 'Birth Hour',
        // Footer
        '\u547D\u7531\u5929\u5B9A\uFF0C\u8FD0\u7531\u5DF1\u9020\u3002\u4EC5\u4F9B\u53C2\u8003\u3002': "Destiny is heaven's gift; fortune is your making. For reference only.",
        // Export / Bookmark
        '\u4FDD\u5B58PDF': 'Save PDF',
        '\u590D\u5236\u6587\u5B57': 'Copy Text',
        '\u5206\u4EAB': 'Share',
        '\u6211\u7684\u6536\u85CF': 'My Bookmarks',
        '\u6682\u65E0\u6536\u85CF': 'No bookmarks yet',
        // Misc existing
        '\u5DF2\u77E5\u7B7E\u53F7\uFF1F\u76F4\u63A5\u67E5\u7B7E\uFF1A': 'Know your number? Look up:',
        '\u4FDD\u5B58\u56FE\u7247': 'Save Image',
        '\u52A0\u8F7D\u4ECA\u65E5\u9EC4\u5386': 'Loading almanac\u2026',
        '\u6700\u8FD1\u67E5\u8BE2\uFF1A': 'Recent:',
        '\u5220\u9664': 'Delete',
        '\u7075\u7B7E': 'Oracle',
        '\u5171\u4E00\u767E\u7B7E': '100 oracles total',
        '\u6885\u82B1\u6613\u6570\u4E3A\u5360\u535C\u4E4B\u672F\uFF0C\u5FC3\u8BDA\u5219\u7075\u3002\u8D77\u5366\u65F6\u8BF7\u4E13\u6CE8\u4E8E\u6240\u95EE\u4E4B\u4E8B\u3002': 'Plum Blossom Numerology: focus on your question while casting.',
        '\u5FC3\u4E2D\u9ED8\u5FF5\u6240\u6C42\u4E4B\u4E8B\uFF0C\u8BDA\u5FC3\u7948\u8BF7\u89C2\u4E16\u97F3\u83E9\u8428\u6307\u5F15\u3002': 'Focus on your wish and pray sincerely.',
        '\u8F93\u5165\u53CC\u65B9\u51FA\u751F\u4FE1\u606F\uFF0C\u4ECE\u65E5\u4E3B\u914D\u5408\u3001\u5E74\u652F\u5408\u51B2\u3001\u7528\u795E\u4E92\u8865\u3001\u5C5E\u76F8\u7EB3\u97F3\u7B49\u7EF4\u5EA6\u7EFC\u5408\u8BC4\u5224\u5A5A\u59FB\u7F18\u5206\u3002': 'Analyze marriage compatibility through BaZi elements.',
        '\u5206\u6790\u53CC\u65B9\u516B\u5B57\u5728\u4E8B\u4E1A\u5C42\u9762\u7684\u914D\u5408\u5EA6\uFF0C\u5305\u62EC\u65E5\u4E3B\u4E92\u52A8\u3001\u8D22\u661F\u914D\u5408\u3001\u5341\u795E\u89D2\u8272\u5206\u5DE5\uFF0C\u4E3A\u5408\u4F19\u51B3\u7B56\u63D0\u4F9B\u53C2\u8003\u3002': 'Analyze business partnership compatibility through BaZi.',
        // Select option suffixes
        '\u5E74': 'Year',
        '\u6708': 'Month',
        '\u65E5': 'Day',
        // Additional UI
        '\u786E\u8BA4': 'Confirm',
        '\u53D6\u6D88': 'Cancel',
        '\u8FD4\u56DE': 'Back',
        '\u4E0B\u4E00\u6B65': 'Next',
        '\u91CD\u7F6E': 'Reset',
        '\u7ED3\u679C': 'Result',
        '\u8BE6\u7EC6\u5206\u6790': 'Detailed Analysis',
        '\u603B\u8BC4': 'Summary',
        '\u7EFC\u5408\u8BC4\u5206': 'Overall Score',
        '\u5927\u8FD0': 'Major Fate',
        '\u6D41\u5E74': 'Annual Luck',
        '\u65E5\u4E3B': 'Day Master',
        '\u7528\u795E': 'Useful God',
        '\u5FCC\u795E': 'Unfavorable God',
        '\u4E94\u884C': 'Five Elements',
        '\u91D1': 'Metal',
        '\u6728': 'Wood',
        '\u6C34': 'Water',
        '\u706B': 'Fire',
        '\u571F': 'Earth',
        '\u5C5E\u76F8': 'Zodiac',
        '\u8FD8\u6CA1\u6709\u6536\u85CF\u5185\u5BB9': 'No bookmarks yet',
        '\u6536\u85CF': 'Bookmark',
        // Zi Wei Dou Shu palaces & terms
        '\u547D\u5BAB': 'Life Palace',
        '\u5144\u5F1F\u5BAB': 'Siblings Palace',
        '\u592B\u59BB\u5BAB': 'Spouse Palace',
        '\u5B50\u5973\u5BAB': 'Children Palace',
        '\u8D22\u5E1B\u5BAB': 'Wealth Palace',
        '\u75BE\u5384\u5BAB': 'Health Palace',
        '\u8FC1\u79FB\u5BAB': 'Travel Palace',
        '\u4EA4\u53CB\u5BAB': 'Friends Palace',
        '\u5B98\u7984\u5BAB': 'Career Palace',
        '\u7530\u5B85\u5BAB': 'Property Palace',
        '\u798F\u5FB7\u5BAB': 'Fortune Palace',
        '\u7236\u6BCD\u5BAB': 'Parents Palace',
        // Heavenly stems
        '\u7532': 'Jia',
        '\u4E59': 'Yi',
        '\u4E19': 'Bing',
        '\u4E01': 'Ding',
        '\u620A': 'Wu',
        '\u5DF1': 'Ji',
        '\u5E9A': 'Geng',
        '\u8F9B': 'Xin',
        '\u58EC': 'Ren',
        '\u7678': 'Gui',
        // Earthly branches
        '\u5B50': 'Zi',
        '\u4E11': 'Chou',
        '\u5BC5': 'Yin',
        '\u536F': 'Mao',
        '\u8FB0': 'Chen',
        '\u5DF3': 'Si',
        '\u5348': 'Wu',
        '\u672A': 'Wei',
        '\u7533': 'Shen',
        '\u9149': 'You',
        '\u620C': 'Xu',
        '\u4EA5': 'Hai',
        // BaZi pillars
        '\u5E74\u67F1': 'Year Pillar',
        '\u6708\u67F1': 'Month Pillar',
        '\u65E5\u67F1': 'Day Pillar',
        '\u65F6\u67F1': 'Hour Pillar',
        // Oracle lot results
        '\u4E0A\u4E0A\u7B7E': 'Best Lot',
        '\u4E0A\u7B7E': 'Good Lot',
        '\u4E2D\u7B7E': 'Fair Lot',
        '\u4E0B\u7B7E': 'Poor Lot',
        '\u4E0B\u4E0B\u7B7E': 'Worst Lot',
        // Moon blocks results
        '\u5723\u7B4A': 'Holy Blocks (Yes)',
        '\u7B11\u7B4A': 'Laughing Blocks (Ask again)',
        '\u6012\u7B4A': 'Angry Blocks (No)',
        // Common result labels
        '\u5409': 'Auspicious',
        '\u51F6': 'Inauspicious',
        '\u5927\u5409': 'Very Auspicious',
        '\u5927\u51F6': 'Very Inauspicious',
        '\u5E73': 'Neutral',
        // Navigation & actions
        '\u66F4\u591A': 'More',
        '\u5C55\u5F00': 'Expand',
        '\u6536\u8D77': 'Collapse',
        '\u52A0\u8F7D\u4E2D': 'Loading...',
        '\u8BA1\u7B97\u4E2D': 'Calculating...'
    };

    // Build sorted EN keys for substring matching (longest first)
    var EN_KEYS_SORTED = Object.keys(EN).sort(function(a, b) { return b.length - a.length; });

    // Build reverse English map
    var EN_REV = {};
    var enKey;
    for (enKey in EN) {
        if (EN.hasOwnProperty(enKey)) {
            EN_REV[EN[enKey]] = enKey;
        }
    }

    // Language state: 'zh-CN', 'zh-TW', 'en'
    var currentLang = localStorage.getItem('tianshu_lang') || 'zh-CN';
    var langToggle = document.getElementById('lang-toggle');

    // Store original simplified text for each text node
    var originalTexts = new WeakMap();

    function walkTextNodes(root, callback) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        var node;
        var nodes = [];
        while ((node = walker.nextNode())) {
            nodes.push(node);
        }
        for (var i = 0; i < nodes.length; i++) {
            callback(nodes[i]);
        }
    }

    function storeOriginalTexts(root) {
        walkTextNodes(root, function(node) {
            if (!originalTexts.has(node)) {
                originalTexts.set(node, node.nodeValue);
            }
        });
    }

    function convertSimplifiedToTraditional(text) {
        var result = '';
        for (var i = 0; i < text.length; i++) {
            var ch = text.charAt(i);
            result += S2T_MAP[ch] || ch;
        }
        return result;
    }

    function convertToEnglish(text) {
        var trimmed = text.trim();
        // Exact match first
        if (EN[trimmed]) {
            var leading = text.match(/^(\s*)/)[1];
            var trailing = text.match(/(\s*)$/)[1];
            return leading + EN[trimmed] + trailing;
        }
        // Substring match for longer texts — find longest EN key contained in trimmed
        for (var k = 0; k < EN_KEYS_SORTED.length; k++) {
            var key = EN_KEYS_SORTED[k];
            if (key.length >= 4 && trimmed.indexOf(key) !== -1) {
                var leading2 = text.match(/^(\s*)/)[1];
                var trailing2 = text.match(/(\s*)$/)[1];
                var replaced = trimmed.replace(key, EN[key]);
                return leading2 + replaced + trailing2;
            }
        }
        return null; // null means "don't change"
    }

    function getTranslatableRoots() {
        var roots = [];
        var header = document.querySelector('header');
        if (header) roots.push(header);
        var nav = document.querySelector('nav.tabs');
        if (nav) roots.push(nav);
        var birthBar = document.querySelector('.birth-info-bar');
        if (birthBar) roots.push(birthBar);
        // ALL tab-content sections (not just active) for seamless tab switching
        var allTabs = document.querySelectorAll('.tab-content');
        for (var t = 0; t < allTabs.length; t++) {
            roots.push(allTabs[t]);
        }
        // Footer
        var footer = document.querySelector('footer');
        if (footer) roots.push(footer);
        return roots;
    }

    function applyLanguage(lang) {
        var roots = getTranslatableRoots();
        var i;
        for (i = 0; i < roots.length; i++) {
            storeOriginalTexts(roots[i]);
        }

        for (i = 0; i < roots.length; i++) {
            walkTextNodes(roots[i], function(node) {
                var original = originalTexts.get(node);
                if (!original || !original.trim()) return;

                if (lang === 'zh-CN') {
                    node.nodeValue = original;
                } else if (lang === 'zh-TW') {
                    node.nodeValue = convertSimplifiedToTraditional(original);
                } else if (lang === 'en') {
                    var enText = convertToEnglish(original);
                    if (enText !== null) {
                        node.nodeValue = enText;
                    } else {
                        // Leave as simplified Chinese for untranslated strings
                        node.nodeValue = original;
                    }
                }
            });
        }

        // Handle placeholder attributes, title attributes, and <option> elements
        var allInputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
        allInputs.forEach(function(el) {
            if (!el.dataset.origPlaceholder) {
                el.dataset.origPlaceholder = el.getAttribute('placeholder') || '';
            }
            var ph = el.dataset.origPlaceholder;
            if (lang === 'en') {
                if (EN[ph]) {
                    el.setAttribute('placeholder', EN[ph]);
                } else {
                    // Try substring match for placeholders too
                    for (var k = 0; k < EN_KEYS_SORTED.length; k++) {
                        var key = EN_KEYS_SORTED[k];
                        if (key.length >= 4 && ph.indexOf(key) !== -1) {
                            el.setAttribute('placeholder', ph.replace(key, EN[key]));
                            break;
                        }
                    }
                }
            } else if (lang === 'zh-TW') {
                el.setAttribute('placeholder', convertSimplifiedToTraditional(ph));
            } else {
                el.setAttribute('placeholder', ph);
            }
        });

        // Handle title attributes on buttons
        var allBtns = document.querySelectorAll('button[title], [title]');
        allBtns.forEach(function(el) {
            if (!el.dataset.origTitle) {
                el.dataset.origTitle = el.getAttribute('title') || '';
            }
            var t = el.dataset.origTitle;
            if (lang === 'en' && EN[t]) {
                el.setAttribute('title', EN[t]);
            } else if (lang === 'zh-TW') {
                el.setAttribute('title', convertSimplifiedToTraditional(t));
            } else {
                el.setAttribute('title', t);
            }
        });

        // Handle <option> elements in selects (年/月/日 suffixes etc.)
        var allOptions = document.querySelectorAll('select option');
        allOptions.forEach(function(opt) {
            if (!opt.dataset.origText) {
                opt.dataset.origText = opt.textContent;
            }
            var ot = opt.dataset.origText;
            if (lang === 'en') {
                // Handle suffixes like "2024年", "3月", "15日"
                var yearMatch = ot.match(/^(\d+)\u5E74$/);
                var monthMatch = ot.match(/^(\d+)\u6708$/);
                var dayMatch = ot.match(/^(\d+)\u65E5$/);
                if (yearMatch) {
                    opt.textContent = yearMatch[1];
                } else if (monthMatch) {
                    opt.textContent = monthMatch[1];
                } else if (dayMatch) {
                    opt.textContent = dayMatch[1];
                } else if (EN[ot.trim()]) {
                    opt.textContent = EN[ot.trim()];
                } else {
                    opt.textContent = ot;
                }
            } else if (lang === 'zh-TW') {
                opt.textContent = convertSimplifiedToTraditional(ot);
            } else {
                opt.textContent = ot;
            }
        });

        // Update toggle button text
        if (langToggle) {
            if (lang === 'zh-CN') {
                langToggle.textContent = '\u7E41/EN';
            } else if (lang === 'zh-TW') {
                langToggle.textContent = '\u7B80/EN';
            } else {
                langToggle.textContent = '\u7B80/\u7E41';
            }
        }
    }

    if (langToggle) {
        // Cycle: zh-CN -> zh-TW -> en -> zh-CN
        langToggle.addEventListener('click', function() {
            if (currentLang === 'zh-CN') {
                currentLang = 'zh-TW';
            } else if (currentLang === 'zh-TW') {
                currentLang = 'en';
            } else {
                currentLang = 'zh-CN';
            }
            localStorage.setItem('tianshu_lang', currentLang);
            applyLanguage(currentLang);
        });
    }

    // Apply saved language on load
    if (currentLang !== 'zh-CN') {
        applyLanguage(currentLang);
    } else if (langToggle) {
        // Set the correct button label even for default
        langToggle.textContent = '\u7E41/EN';
    }

    // Re-apply language when tabs switch (since content may need translation)
    document.addEventListener('click', function(e) {
        var tab = e.target.closest && e.target.closest('.tab');
        if (tab && currentLang !== 'zh-CN') {
            // Slight delay to let the tab content become active
            setTimeout(function() { applyLanguage(currentLang); }, 50);
        }
    });

    // Expose reapply function for MutationObserver (Feature 4) to call on dynamic content
    window._reapplyLang = function() {
        if (currentLang !== 'zh-CN') {
            applyLanguage(currentLang);
        }
    };


    // ========================================================
    // Feature 3: Export/Share Results
    // ========================================================

    function addExportButtons() {
        var areas = document.querySelectorAll('.result-area');
        for (var i = 0; i < areas.length; i++) {
            var area = areas[i];
            if (area.querySelector('.export-bar')) continue;
            if (!area.innerHTML.trim()) continue;
            if (area.querySelector('.placeholder-card')) continue;
            if (area.querySelector('.loading')) continue;

            var bar = document.createElement('div');
            bar.className = 'export-bar';
            bar.innerHTML = '<button class="export-btn" data-type="pdf" title="保存为PDF">📄 保存PDF</button>' +
                '<button class="export-btn" data-type="copy" title="复制文字">📋 复制文字</button>' +
                '<button class="export-btn" data-type="share" title="分享">🔗 分享</button>';
            area.insertBefore(bar, area.firstChild);
        }
    }

    function handleExportClick(e) {
        var btn = e.target.closest && e.target.closest('.export-btn');
        if (!btn) return;

        var area = btn.closest('.result-area');
        if (!area) return;

        var exportType = btn.getAttribute('data-type');

        if (exportType === 'pdf') {
            exportAsPDF(area);
        } else if (exportType === 'copy') {
            exportAsText(area);
        } else if (exportType === 'share') {
            exportShare(area);
        }
    }

    function exportAsPDF(area) {
        // Open a new window with just the result content, styled for print
        var content = area.innerHTML;
        // Remove export bars from the print content
        var temp = document.createElement('div');
        temp.innerHTML = content;
        var bars = temp.querySelectorAll('.export-bar');
        for (var i = 0; i < bars.length; i++) bars[i].remove();
        var stars = temp.querySelectorAll('.bookmark-star');
        for (var j = 0; j < stars.length; j++) stars[j].remove();

        var printWin = window.open('', '_blank', 'width=800,height=600');
        if (!printWin) { showToast('请允许弹出窗口后重试'); return; }

        // Get computed styles for CSS variables
        var cs = getComputedStyle(document.documentElement);
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        printWin.document.write([
            '<!DOCTYPE html><html><head><meta charset="UTF-8">',
            '<title>天枢命理 — 命理报告</title>',
            '<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&display=swap" rel="stylesheet">',
            '<style>',
            ':root{--ink:#1a1a2e;--ink-light:#6b7280;--vermillion:#c53d43;--gold:#c5922e;--jade:#2d8f6f;--cream:#faf8f5;--card:#fff;--border:#e8e4dd;--font-h:"Noto Serif SC",serif;--font-b:"Noto Serif SC",sans-serif;--r:8px;--r-lg:12px;--shadow:0 1px 3px rgba(0,0,0,.06);--shadow-md:0 4px 12px rgba(0,0,0,.07);--wood:#2e7d32;--fire:#c62828;--earth:#bf8c30;--metal:#607d8b;--water:#1565c0}',
            'body{font-family:var(--font-b);color:var(--ink);line-height:1.75;background:#fff;padding:20px 30px;max-width:900px;margin:0 auto}',
            '.interp-card{border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 22px;margin:12px 0;background:var(--card);page-break-inside:avoid}',
            'h2,h3,h4{font-family:var(--font-h);margin:12px 0 8px}',
            'h2{font-size:1.4rem;color:var(--vermillion);text-align:center;border-bottom:2px solid var(--gold);padding-bottom:8px}',
            'h3{font-size:1.1rem;color:var(--ink)}',
            'details{border:1px solid var(--border);border-radius:var(--r);margin:6px 0;padding:8px 12px}',
            'summary{cursor:pointer;font-weight:600}',
            '.dayun-timeline{display:flex;gap:6px;overflow:visible;flex-wrap:wrap;padding:8px 0}',
            '.dayun-item{min-width:80px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r);text-align:center;font-size:.78rem}',
            '.dayun-item.current{border-color:var(--vermillion);background:rgba(197,61,67,.06)}',
            '.print-header{text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid var(--gold)}',
            '.print-header h1{font-family:var(--font-h);font-size:1.6rem;color:var(--gold);letter-spacing:.15em}',
            '.print-header p{font-size:.8rem;color:var(--ink-light);margin-top:4px}',
            '.print-footer{text-align:center;margin-top:30px;padding-top:12px;border-top:1px solid var(--border);font-size:.75rem;color:var(--ink-light)}',
            '@media print{body{padding:10px}@page{margin:15mm 10mm;size:A4}}',
            '</style></head><body>',
            '<div class="print-header"><h1>天枢命理</h1><p>命理报告 · ' + new Date().toLocaleDateString('zh-CN') + '</p></div>',
            temp.innerHTML,
            '<div class="print-footer"><p>天枢命理 · 命由天定，运由己造 · 仅供参考</p></div>',
            '</body></html>'
        ].join(''));
        printWin.document.close();

        // Wait for fonts to load then print
        setTimeout(function() {
            printWin.print();
            showToast('PDF保存窗口已打开');
        }, 800);
    }

    function exportAsText(area) {
        var text = area.innerText || area.textContent || '';
        // Remove export button text from the copied content
        text = text.replace(/📄 保存PDF/g, '');
        text = text.replace(/📋 复制文字/g, '');
        text = text.replace(/🔗 分享/g, '');
        text = text.trim();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showToast('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F');
            }).catch(function() {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F');
        } catch (e) {
            showToast('\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236');
        }
        document.body.removeChild(ta);
    }

    function exportShare(area) {
        var text = (area.innerText || '').trim().substring(0, 300);
        var shareData = {
            title: '\u5929\u67A2\u547D\u7406',
            text: text,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(function() {
                // User cancelled or error, fall back to copy link
                copyLink();
            });
        } else {
            copyLink();
        }
    }

    function copyLink() {
        var url = window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function() {
                showToast('\u94FE\u63A5\u5DF2\u590D\u5236');
            });
        } else {
            fallbackCopy(url);
        }
    }

    function showToast(msg) {
        var existing = document.querySelector('.features-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'features-toast';
        toast.textContent = msg;
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:8px 20px;border-radius:20px;font-size:.82rem;z-index:9999;pointer-events:none;opacity:0;transition:opacity .3s';
        document.body.appendChild(toast);

        // Fade in
        setTimeout(function() { toast.style.opacity = '1'; }, 10);
        // Fade out and remove
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.remove(); }, 300);
        }, 2000);
    }

    document.addEventListener('click', handleExportClick);


    // ========================================================
    // Feature 4: Bookmark/Favorites
    // ========================================================

    var FAVORITES_KEY = 'tianshu_favorites';

    function getFavorites() {
        try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch (e) { return []; }
    }

    function saveFavorite(id, label) {
        var favs = getFavorites();
        if (!favs.some(function(f) { return f.id === id; })) {
            favs.push({ id: id, label: label, time: Date.now() });
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
        }
        updateFavoritesPanel();
        updateFavTriggerCount();
    }

    function removeFavorite(id) {
        var favs = getFavorites().filter(function(f) { return f.id !== id; });
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
        // Update star UI
        var star = document.querySelector('.bookmark-star[data-target="' + id + '"]');
        if (star) {
            star.classList.remove('active');
            star.textContent = '\u2606';
        }
        updateFavoritesPanel();
        updateFavTriggerCount();
    }

    function isFavorited(id) {
        return getFavorites().some(function(f) { return f.id === id; });
    }

    function addBookmarkStars() {
        var cards = document.querySelectorAll('.interp-card');
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var headings = card.querySelectorAll('h3[id]');
            for (var j = 0; j < headings.length; j++) {
                var h3 = headings[j];
                if (h3.querySelector('.bookmark-star')) continue;

                var star = document.createElement('button');
                star.className = 'bookmark-star';
                star.setAttribute('data-target', h3.id);
                star.title = '\u6536\u85CF';
                if (isFavorited(h3.id)) {
                    star.textContent = '\u2605';
                    star.classList.add('active');
                } else {
                    star.textContent = '\u2606';
                }
                h3.appendChild(star);
            }
        }
    }

    // Handle star clicks via delegation
    document.addEventListener('click', function(e) {
        var star = e.target.closest && e.target.closest('.bookmark-star');
        if (!star) return;
        e.preventDefault();
        e.stopPropagation();

        var targetId = star.getAttribute('data-target');
        if (!targetId) return;

        if (isFavorited(targetId)) {
            removeFavorite(targetId);
            star.textContent = '\u2606';
            star.classList.remove('active');
        } else {
            var heading = document.getElementById(targetId);
            var label = heading ? heading.textContent.replace(/[\u2606\u2605]/g, '').trim() : targetId;
            saveFavorite(targetId, label);
            star.textContent = '\u2605';
            star.classList.add('active');
        }
    });

    // Favorites trigger button (bottom-left)
    var favTrigger = document.createElement('button');
    favTrigger.className = 'fav-trigger';
    favTrigger.title = '\u6211\u7684\u6536\u85CF';
    favTrigger.innerHTML = '\u2606<span class="fav-count" style="display:none">0</span>';
    document.body.appendChild(favTrigger);

    // Favorites panel
    var favPanel = document.createElement('div');
    favPanel.className = 'fav-panel';
    favPanel.innerHTML = '<div class="fav-panel-header">\u2606 \u6211\u7684\u6536\u85CF</div><div class="fav-panel-list"></div>';
    document.body.appendChild(favPanel);

    function updateFavTriggerCount() {
        var favs = getFavorites();
        var countEl = favTrigger.querySelector('.fav-count');
        if (favs.length > 0) {
            countEl.style.display = '';
            countEl.textContent = favs.length;
        } else {
            countEl.style.display = 'none';
        }
    }

    function updateFavoritesPanel() {
        var list = favPanel.querySelector('.fav-panel-list');
        var favs = getFavorites();

        if (favs.length === 0) {
            list.innerHTML = '<div class="fav-panel-empty">\u8FD8\u6CA1\u6709\u6536\u85CF\u5185\u5BB9</div>';
            return;
        }

        var html = '';
        for (var i = 0; i < favs.length; i++) {
            html += '<div class="fav-panel-item" data-id="' + favs[i].id + '">' +
                '<span class="fav-label">\u2605 ' + favs[i].label + '</span>' +
                '<button class="fav-remove" data-id="' + favs[i].id + '" title="\u53D6\u6D88\u6536\u85CF">\u00D7</button>' +
                '</div>';
        }
        list.innerHTML = html;
    }

    favTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = favPanel.classList.contains('open');
        if (isOpen) {
            favPanel.classList.remove('open');
        } else {
            updateFavoritesPanel();
            favPanel.classList.add('open');
        }
    });

    // Handle clicks inside favorites panel
    favPanel.addEventListener('click', function(e) {
        e.stopPropagation();

        var removeBtn = e.target.closest && e.target.closest('.fav-remove');
        if (removeBtn) {
            var removeId = removeBtn.getAttribute('data-id');
            if (removeId) removeFavorite(removeId);
            return;
        }

        var item = e.target.closest && e.target.closest('.fav-panel-item');
        if (item) {
            var targetId = item.getAttribute('data-id');
            if (!targetId) return;

            // Find the target element and its parent tab
            var targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            // Find which tab-content section it belongs to
            var tabContent = targetEl.closest('.tab-content');
            if (tabContent) {
                var tabId = tabContent.id;
                // Activate the correct tab
                var tabBtn = document.querySelector('.tab[data-tab="' + tabId + '"]');
                if (tabBtn) tabBtn.click();
            }

            // Scroll to the element after a short delay for tab switch
            setTimeout(function() {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Brief highlight effect
                targetEl.style.transition = 'background .3s';
                targetEl.style.background = 'rgba(197,146,46,.15)';
                setTimeout(function() { targetEl.style.background = ''; }, 1500);
            }, 100);

            favPanel.classList.remove('open');
        }
    });

    // Close panel when clicking outside
    document.addEventListener('click', function() {
        favPanel.classList.remove('open');
    });

    // Initialize favorites count
    updateFavTriggerCount();


    // ========================================================
    // Smart Init: MutationObserver instead of setInterval
    // ========================================================
    function refreshUI() {
        addExportButtons();
        addBookmarkStars();
        // Re-apply language translation to newly rendered dynamic content
        if (window._reapplyLang) window._reapplyLang();
    }

    // Watch for DOM changes in result areas (new content rendered)
    var observer = new MutationObserver(function(mutations) {
        // Debounce: only refresh once per batch of mutations
        clearTimeout(observer._timer);
        observer._timer = setTimeout(refreshUI, 300);
    });

    // Observe all result areas + main content
    document.querySelectorAll('.result-area').forEach(function(area) {
        observer.observe(area, { childList: true, subtree: true });
    });
    // Also observe tab switches
    var mainEl = document.querySelector('main');
    if (mainEl) observer.observe(mainEl, { childList: true, subtree: false });

    // Run once immediately
    refreshUI();

})();
