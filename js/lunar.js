/**
 * 农历/阳历转换 & 天干地支工具 & 真太阳时计算
 * Fixed lunar conversion algorithm
 */
const Lunar = (() => {
    const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
    const GAN_WUXING = ['木','木','火','火','土','土','金','金','水','水'];
    const ZHI_WUXING = ['水','土','木','木','土','火','火','土','金','金','土','水'];
    const GAN_YINYANG = [0,1,0,1,0,1,0,1,0,1];

    const CANG_GAN = {
        '子':['癸'],'丑':['己','癸','辛'],'寅':['甲','丙','戊'],'卯':['乙'],
        '辰':['戊','乙','癸'],'巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],
        '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']
    };

    const NA_YIN = [
        '海中金','海中金','炉中火','炉中火','大林木','大林木','路旁土','路旁土','剑锋金','剑锋金',
        '山头火','山头火','涧下水','涧下水','城头土','城头土','白蜡金','白蜡金','杨柳木','杨柳木',
        '泉中水','泉中水','屋上土','屋上土','霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
        '砂石金','砂石金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金',
        '覆灯火','覆灯火','天河水','天河水','大驿土','大驿土','钗钏金','钗钏金','桑柘木','桑柘木',
        '大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'
    ];

    // Lunar data 1900-2100
    // bits 20-16: leap month (0=none), bit 16: leap month days (0=29,1=30)
    // bits 15-4: months 1-12 days (0=29, 1=30), bits 3-0: leap month number
    const LUNAR_INFO = [
        0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
        0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
        0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
        0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
        0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
        0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
        0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
        0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
        0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
        0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
        0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
        0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
        0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
        0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
        0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
        0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
        0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
        0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
        0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
        0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
        0x0d520
    ];
    const BASE_YEAR = 1900;

    function leapMonth(y) { return LUNAR_INFO[y - BASE_YEAR] & 0xf; }

    function leapDays(y) {
        if (!leapMonth(y)) return 0;
        return (LUNAR_INFO[y - BASE_YEAR] & 0x10000) ? 30 : 29;
    }

    function monthDays(y, m) {
        return (LUNAR_INFO[y - BASE_YEAR] & (0x10000 >> m)) ? 30 : 29;
    }

    function lunarYearDays(y) {
        let sum = 348;
        for (let i = 0x8000; i > 0x8; i >>= 1) {
            sum += (LUNAR_INFO[y - BASE_YEAR] & i) ? 1 : 0;
        }
        return sum + leapDays(y);
    }

    // ===== FIXED Solar to Lunar conversion =====
    function solarToLunar(sy, sm, sd) {
        // Validate input
        if (sy < 1900 || sy > 2100) return { year: sy, month: 1, day: 1, isLeap: false };

        const baseDate = new Date(1900, 0, 31); // 1900-01-31 = 农历庚子年正月初一
        const targetDate = new Date(sy, sm - 1, sd);
        let offset = Math.round((targetDate - baseDate) / 86400000);

        if (offset < 0) return { year: 1900, month: 1, day: 1, isLeap: false };

        // Step 1: Find lunar year
        let lunarYear = 1900;
        let yearDays;
        while (lunarYear < 2101) {
            yearDays = lunarYearDays(lunarYear);
            if (offset < yearDays) break;
            offset -= yearDays;
            lunarYear++;
        }

        // Step 2: Find lunar month
        let lunarMonth = 1;
        let lunarDay;
        let isLeapMonth = false;
        const leap = leapMonth(lunarYear);
        let isAfterLeap = false;

        for (lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
            let days;
            // Check if this position is a leap month
            if (leap > 0 && lunarMonth === leap + 1 && !isAfterLeap) {
                // This is the leap month position
                days = leapDays(lunarYear);
                isAfterLeap = true;
                lunarMonth--; // Stay on the same month number

                if (offset < days) {
                    isLeapMonth = true;
                    lunarDay = offset + 1;
                    return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeap: true };
                }
                offset -= days;
                lunarMonth++; // Continue to next month
            }

            days = monthDays(lunarYear, lunarMonth);
            if (offset < days) {
                lunarDay = offset + 1;
                return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeap: false };
            }
            offset -= days;
        }

        // Fallback (shouldn't reach here)
        return { year: lunarYear, month: 12, day: offset + 1, isLeap: false };
    }

    // Lunar day name (初一, 初二, ..., 三十)
    function lunarDayName(day) {
        const tens = ['初','十','廿','三'];
        const ones = ['','一','二','三','四','五','六','七','八','九','十'];
        if (day === 10) return '初十';
        if (day === 20) return '二十';
        if (day === 30) return '三十';
        return tens[Math.floor(day / 10)] + ones[day % 10];
    }

    // Lunar month name
    function lunarMonthName(month) {
        const names = ['','正','二','三','四','五','六','七','八','九','十','冬','腊'];
        return names[month] || month.toString();
    }

    // Format full lunar date string
    function formatLunar(lunarObj) {
        const yearGZ = yearGanZhi(lunarObj.year);
        return `${yearGZ.text}年（${SHENG_XIAO[yearGZ.zhiIdx]}）${lunarObj.isLeap ? '闰' : ''}${lunarMonthName(lunarObj.month)}月${lunarDayName(lunarObj.day)}`;
    }

    // ===== Cities =====
    const CITIES = [
{name:"北京",province:"北京",lng:116.41},
{name:"天津",province:"天津",lng:117.2},
{name:"石家庄",province:"河北",lng:114.51},
{name:"唐山",province:"河北",lng:118.18},
{name:"秦皇岛",province:"河北",lng:119.6},
{name:"邯郸",province:"河北",lng:114.49},
{name:"邢台",province:"河北",lng:114.5},
{name:"保定",province:"河北",lng:115.46},
{name:"张家口",province:"河北",lng:114.88},
{name:"承德",province:"河北",lng:117.96},
{name:"沧州",province:"河北",lng:116.86},
{name:"廊坊",province:"河北",lng:116.68},
{name:"衡水",province:"河北",lng:115.67},
{name:"太原",province:"山西",lng:112.55},
{name:"大同",province:"山西",lng:113.3},
{name:"阳泉",province:"山西",lng:113.58},
{name:"长治",province:"山西",lng:113.12},
{name:"晋城",province:"山西",lng:112.85},
{name:"朔州",province:"山西",lng:112.43},
{name:"晋中",province:"山西",lng:112.75},
{name:"运城",province:"山西",lng:111.01},
{name:"忻州",province:"山西",lng:112.73},
{name:"临汾",province:"山西",lng:111.52},
{name:"吕梁",province:"山西",lng:111.14},
{name:"呼和浩特",province:"内蒙古",lng:111.75},
{name:"包头",province:"内蒙古",lng:109.84},
{name:"乌海",province:"内蒙古",lng:106.79},
{name:"赤峰",province:"内蒙古",lng:118.89},
{name:"通辽",province:"内蒙古",lng:122.24},
{name:"鄂尔多斯",province:"内蒙古",lng:109.99},
{name:"呼伦贝尔",province:"内蒙古",lng:119.77},
{name:"巴彦淖尔",province:"内蒙古",lng:107.39},
{name:"乌兰察布",province:"内蒙古",lng:113.13},
{name:"沈阳",province:"辽宁",lng:123.43},
{name:"大连",province:"辽宁",lng:121.62},
{name:"鞍山",province:"辽宁",lng:122.99},
{name:"抚顺",province:"辽宁",lng:123.96},
{name:"本溪",province:"辽宁",lng:123.77},
{name:"丹东",province:"辽宁",lng:124.38},
{name:"锦州",province:"辽宁",lng:121.13},
{name:"营口",province:"辽宁",lng:122.23},
{name:"阜新",province:"辽宁",lng:121.67},
{name:"辽阳",province:"辽宁",lng:123.17},
{name:"盘锦",province:"辽宁",lng:122.07},
{name:"铁岭",province:"辽宁",lng:123.84},
{name:"朝阳",province:"辽宁",lng:120.45},
{name:"葫芦岛",province:"辽宁",lng:120.84},
{name:"长春",province:"吉林",lng:125.32},
{name:"吉林市",province:"吉林",lng:126.55},
{name:"四平",province:"吉林",lng:124.35},
{name:"辽源",province:"吉林",lng:125.14},
{name:"通化",province:"吉林",lng:125.94},
{name:"白山",province:"吉林",lng:126.42},
{name:"松原",province:"吉林",lng:124.82},
{name:"白城",province:"吉林",lng:122.84},
{name:"哈尔滨",province:"黑龙江",lng:126.63},
{name:"齐齐哈尔",province:"黑龙江",lng:123.95},
{name:"鸡西",province:"黑龙江",lng:130.97},
{name:"鹤岗",province:"黑龙江",lng:130.28},
{name:"双鸭山",province:"黑龙江",lng:131.16},
{name:"大庆",province:"黑龙江",lng:125.1},
{name:"伊春",province:"黑龙江",lng:128.9},
{name:"佳木斯",province:"黑龙江",lng:130.36},
{name:"牡丹江",province:"黑龙江",lng:129.63},
{name:"黑河",province:"黑龙江",lng:127.53},
{name:"绥化",province:"黑龙江",lng:126.97},
{name:"上海",province:"上海",lng:121.47},
{name:"南京",province:"江苏",lng:118.78},
{name:"无锡",province:"江苏",lng:120.3},
{name:"徐州",province:"江苏",lng:117.18},
{name:"常州",province:"江苏",lng:119.97},
{name:"苏州",province:"江苏",lng:120.62},
{name:"南通",province:"江苏",lng:120.86},
{name:"连云港",province:"江苏",lng:119.22},
{name:"淮安",province:"江苏",lng:119.02},
{name:"盐城",province:"江苏",lng:120.16},
{name:"扬州",province:"江苏",lng:119.41},
{name:"镇江",province:"江苏",lng:119.45},
{name:"泰州",province:"江苏",lng:119.92},
{name:"宿迁",province:"江苏",lng:118.28},
{name:"杭州",province:"浙江",lng:120.15},
{name:"宁波",province:"浙江",lng:121.55},
{name:"温州",province:"浙江",lng:120.7},
{name:"嘉兴",province:"浙江",lng:120.76},
{name:"湖州",province:"浙江",lng:120.09},
{name:"绍兴",province:"浙江",lng:120.58},
{name:"金华",province:"浙江",lng:119.65},
{name:"衢州",province:"浙江",lng:118.87},
{name:"舟山",province:"浙江",lng:122.11},
{name:"台州",province:"浙江",lng:121.42},
{name:"丽水",province:"浙江",lng:119.92},
{name:"合肥",province:"安徽",lng:117.28},
{name:"芜湖",province:"安徽",lng:118.38},
{name:"蚌埠",province:"安徽",lng:117.39},
{name:"淮南",province:"安徽",lng:117.02},
{name:"马鞍山",province:"安徽",lng:118.51},
{name:"淮北",province:"安徽",lng:116.79},
{name:"铜陵",province:"安徽",lng:117.81},
{name:"安庆",province:"安徽",lng:117.04},
{name:"黄山",province:"安徽",lng:118.34},
{name:"滁州",province:"安徽",lng:118.32},
{name:"阜阳",province:"安徽",lng:115.81},
{name:"宿州",province:"安徽",lng:116.96},
{name:"六安",province:"安徽",lng:116.52},
{name:"亳州",province:"安徽",lng:115.78},
{name:"池州",province:"安徽",lng:117.49},
{name:"宣城",province:"安徽",lng:118.76},
{name:"福州",province:"福建",lng:119.3},
{name:"厦门",province:"福建",lng:118.09},
{name:"莆田",province:"福建",lng:119.01},
{name:"三明",province:"福建",lng:117.64},
{name:"泉州",province:"福建",lng:118.68},
{name:"漳州",province:"福建",lng:117.65},
{name:"南平",province:"福建",lng:118.18},
{name:"龙岩",province:"福建",lng:117.03},
{name:"宁德",province:"福建",lng:119.53},
{name:"南昌",province:"江西",lng:115.86},
{name:"景德镇",province:"江西",lng:117.21},
{name:"萍乡",province:"江西",lng:113.85},
{name:"九江",province:"江西",lng:116},
{name:"新余",province:"江西",lng:114.92},
{name:"鹰潭",province:"江西",lng:117.07},
{name:"赣州",province:"江西",lng:114.94},
{name:"吉安",province:"江西",lng:114.99},
{name:"宜春",province:"江西",lng:114.39},
{name:"抚州",province:"江西",lng:116.36},
{name:"上饶",province:"江西",lng:117.97},
{name:"济南",province:"山东",lng:117},
{name:"青岛",province:"山东",lng:120.38},
{name:"淄博",province:"山东",lng:118.05},
{name:"枣庄",province:"山东",lng:117.32},
{name:"东营",province:"山东",lng:118.67},
{name:"烟台",province:"山东",lng:121.39},
{name:"潍坊",province:"山东",lng:119.16},
{name:"济宁",province:"山东",lng:116.59},
{name:"泰安",province:"山东",lng:117.09},
{name:"威海",province:"山东",lng:122.12},
{name:"日照",province:"山东",lng:119.46},
{name:"临沂",province:"山东",lng:118.36},
{name:"德州",province:"山东",lng:116.36},
{name:"聊城",province:"山东",lng:115.98},
{name:"滨州",province:"山东",lng:118.02},
{name:"菏泽",province:"山东",lng:115.48},
{name:"郑州",province:"河南",lng:113.65},
{name:"开封",province:"河南",lng:114.35},
{name:"洛阳",province:"河南",lng:112.45},
{name:"平顶山",province:"河南",lng:113.19},
{name:"安阳",province:"河南",lng:114.35},
{name:"鹤壁",province:"河南",lng:114.3},
{name:"新乡",province:"河南",lng:113.88},
{name:"焦作",province:"河南",lng:113.24},
{name:"濮阳",province:"河南",lng:115.03},
{name:"许昌",province:"河南",lng:113.85},
{name:"漯河",province:"河南",lng:114.02},
{name:"三门峡",province:"河南",lng:111.2},
{name:"南阳",province:"河南",lng:112.53},
{name:"商丘",province:"河南",lng:115.65},
{name:"信阳",province:"河南",lng:114.07},
{name:"周口",province:"河南",lng:114.65},
{name:"驻马店",province:"河南",lng:114.02},
{name:"武汉",province:"湖北",lng:114.3},
{name:"黄石",province:"湖北",lng:115.04},
{name:"十堰",province:"湖北",lng:110.8},
{name:"宜昌",province:"湖北",lng:111.29},
{name:"襄阳",province:"湖北",lng:112.14},
{name:"鄂州",province:"湖北",lng:114.89},
{name:"荆门",province:"湖北",lng:112.2},
{name:"孝感",province:"湖北",lng:113.92},
{name:"荆州",province:"湖北",lng:112.24},
{name:"黄冈",province:"湖北",lng:114.87},
{name:"咸宁",province:"湖北",lng:114.32},
{name:"随州",province:"湖北",lng:113.38},
{name:"恩施",province:"湖北",lng:109.49},
{name:"长沙",province:"湖南",lng:112.97},
{name:"株洲",province:"湖南",lng:113.13},
{name:"湘潭",province:"湖南",lng:112.94},
{name:"衡阳",province:"湖南",lng:112.57},
{name:"邵阳",province:"湖南",lng:111.47},
{name:"岳阳",province:"湖南",lng:113.13},
{name:"常德",province:"湖南",lng:111.69},
{name:"张家界",province:"湖南",lng:110.48},
{name:"益阳",province:"湖南",lng:112.36},
{name:"郴州",province:"湖南",lng:113.01},
{name:"永州",province:"湖南",lng:111.61},
{name:"怀化",province:"湖南",lng:110},
{name:"娄底",province:"湖南",lng:112},
{name:"湘西",province:"湖南",lng:109.74},
{name:"广州",province:"广东",lng:113.26},
{name:"韶关",province:"广东",lng:113.6},
{name:"深圳",province:"广东",lng:114.07},
{name:"珠海",province:"广东",lng:113.58},
{name:"汕头",province:"广东",lng:116.68},
{name:"佛山",province:"广东",lng:113.12},
{name:"江门",province:"广东",lng:113.08},
{name:"湛江",province:"广东",lng:110.36},
{name:"茂名",province:"广东",lng:110.92},
{name:"肇庆",province:"广东",lng:112.47},
{name:"惠州",province:"广东",lng:114.42},
{name:"梅州",province:"广东",lng:116.12},
{name:"汕尾",province:"广东",lng:115.37},
{name:"河源",province:"广东",lng:114.7},
{name:"阳江",province:"广东",lng:111.98},
{name:"清远",province:"广东",lng:113.06},
{name:"东莞",province:"广东",lng:113.75},
{name:"中山",province:"广东",lng:113.38},
{name:"潮州",province:"广东",lng:116.62},
{name:"揭阳",province:"广东",lng:116.37},
{name:"云浮",province:"广东",lng:112.04},
{name:"南宁",province:"广西",lng:108.37},
{name:"柳州",province:"广西",lng:109.41},
{name:"桂林",province:"广西",lng:110.29},
{name:"梧州",province:"广西",lng:111.28},
{name:"北海",province:"广西",lng:109.12},
{name:"防城港",province:"广西",lng:108.35},
{name:"钦州",province:"广西",lng:108.65},
{name:"贵港",province:"广西",lng:109.6},
{name:"玉林",province:"广西",lng:110.18},
{name:"百色",province:"广西",lng:106.62},
{name:"贺州",province:"广西",lng:111.55},
{name:"河池",province:"广西",lng:108.06},
{name:"来宾",province:"广西",lng:109.22},
{name:"崇左",province:"广西",lng:107.36},
{name:"海口",province:"海南",lng:110.35},
{name:"三亚",province:"海南",lng:109.51},
{name:"三沙",province:"海南",lng:112.33},
{name:"儋州",province:"海南",lng:109.58},
{name:"重庆",province:"重庆",lng:106.55},
{name:"成都",province:"四川",lng:104.07},
{name:"自贡",province:"四川",lng:104.77},
{name:"攀枝花",province:"四川",lng:101.72},
{name:"泸州",province:"四川",lng:105.44},
{name:"德阳",province:"四川",lng:104.4},
{name:"绵阳",province:"四川",lng:104.73},
{name:"广元",province:"四川",lng:105.84},
{name:"遂宁",province:"四川",lng:105.59},
{name:"内江",province:"四川",lng:105.06},
{name:"乐山",province:"四川",lng:103.77},
{name:"南充",province:"四川",lng:106.08},
{name:"眉山",province:"四川",lng:103.85},
{name:"宜宾",province:"四川",lng:104.64},
{name:"广安",province:"四川",lng:106.63},
{name:"达州",province:"四川",lng:107.5},
{name:"雅安",province:"四川",lng:103},
{name:"巴中",province:"四川",lng:106.76},
{name:"资阳",province:"四川",lng:104.63},
{name:"阿坝",province:"四川",lng:102.22},
{name:"甘孜",province:"四川",lng:101.96},
{name:"凉山",province:"四川",lng:102.27},
{name:"贵阳",province:"贵州",lng:106.71},
{name:"六盘水",province:"贵州",lng:104.83},
{name:"遵义",province:"贵州",lng:106.93},
{name:"安顺",province:"贵州",lng:105.95},
{name:"毕节",province:"贵州",lng:105.28},
{name:"铜仁",province:"贵州",lng:109.19},
{name:"黔西南",province:"贵州",lng:104.9},
{name:"黔东南",province:"贵州",lng:107.98},
{name:"黔南",province:"贵州",lng:107.52},
{name:"昆明",province:"云南",lng:102.73},
{name:"曲靖",province:"云南",lng:103.8},
{name:"玉溪",province:"云南",lng:102.55},
{name:"保山",province:"云南",lng:99.17},
{name:"昭通",province:"云南",lng:103.72},
{name:"丽江",province:"云南",lng:100.23},
{name:"普洱",province:"云南",lng:101.04},
{name:"临沧",province:"云南",lng:100.09},
{name:"大理",province:"云南",lng:100.23},
{name:"红河",province:"云南",lng:103.38},
{name:"文山",province:"云南",lng:104.24},
{name:"西双版纳",province:"云南",lng:100.8},
{name:"德宏",province:"云南",lng:98.58},
{name:"迪庆",province:"云南",lng:99.7},
{name:"拉萨",province:"西藏",lng:91.13},
{name:"日喀则",province:"西藏",lng:88.88},
{name:"昌都",province:"西藏",lng:97.17},
{name:"林芝",province:"西藏",lng:94.36},
{name:"山南",province:"西藏",lng:91.77},
{name:"那曲",province:"西藏",lng:92.05},
{name:"西安",province:"陕西",lng:108.94},
{name:"铜川",province:"陕西",lng:108.94},
{name:"宝鸡",province:"陕西",lng:107.14},
{name:"咸阳",province:"陕西",lng:108.71},
{name:"渭南",province:"陕西",lng:109.5},
{name:"延安",province:"陕西",lng:109.49},
{name:"汉中",province:"陕西",lng:107.03},
{name:"榆林",province:"陕西",lng:109.73},
{name:"安康",province:"陕西",lng:109.03},
{name:"商洛",province:"陕西",lng:109.94},
{name:"兰州",province:"甘肃",lng:103.83},
{name:"嘉峪关",province:"甘肃",lng:98.29},
{name:"金昌",province:"甘肃",lng:102.19},
{name:"白银",province:"甘肃",lng:104.17},
{name:"天水",province:"甘肃",lng:105.72},
{name:"武威",province:"甘肃",lng:102.64},
{name:"张掖",province:"甘肃",lng:100.45},
{name:"平凉",province:"甘肃",lng:106.67},
{name:"酒泉",province:"甘肃",lng:98.49},
{name:"庆阳",province:"甘肃",lng:107.64},
{name:"定西",province:"甘肃",lng:104.63},
{name:"陇南",province:"甘肃",lng:104.92},
{name:"西宁",province:"青海",lng:101.77},
{name:"海东",province:"青海",lng:102.1},
{name:"海北",province:"青海",lng:100.9},
{name:"海南州",province:"青海",lng:100.62},
{name:"果洛",province:"青海",lng:100.24},
{name:"玉树",province:"青海",lng:97.01},
{name:"海西",province:"青海",lng:97.37},
{name:"银川",province:"宁夏",lng:106.27},
{name:"石嘴山",province:"宁夏",lng:106.38},
{name:"吴忠",province:"宁夏",lng:106.2},
{name:"固原",province:"宁夏",lng:106.28},
{name:"中卫",province:"宁夏",lng:105.2},
{name:"乌鲁木齐",province:"新疆",lng:87.62},
{name:"克拉玛依",province:"新疆",lng:84.87},
{name:"吐鲁番",province:"新疆",lng:89.19},
{name:"哈密",province:"新疆",lng:93.51},
{name:"昌吉",province:"新疆",lng:87.31},
{name:"博尔塔拉",province:"新疆",lng:82.07},
{name:"巴音郭楞",province:"新疆",lng:86.15},
{name:"阿克苏",province:"新疆",lng:80.26},
{name:"克孜勒苏",province:"新疆",lng:76.17},
{name:"喀什",province:"新疆",lng:75.99},
{name:"和田",province:"新疆",lng:79.93},
{name:"伊犁",province:"新疆",lng:81.33},
{name:"塔城",province:"新疆",lng:82.99},
{name:"阿勒泰",province:"新疆",lng:88.13},
{name:"台北",province:"台湾",lng:121.56},
{name:"新北",province:"台湾",lng:121.47},
{name:"桃园",province:"台湾",lng:121.3},
{name:"台中",province:"台湾",lng:120.68},
{name:"台南",province:"台湾",lng:120.23},
{name:"高雄",province:"台湾",lng:120.31},
{name:"基隆",province:"台湾",lng:121.74},
{name:"新竹",province:"台湾",lng:120.97},
{name:"嘉义",province:"台湾",lng:120.45},
{name:"花莲",province:"台湾",lng:121.6},
{name:"台东",province:"台湾",lng:121.15},
{name:"宜兰",province:"台湾",lng:121.76},
{name:"屏东",province:"台湾",lng:120.49},
{name:"彰化",province:"台湾",lng:120.54},
{name:"南投",province:"台湾",lng:120.69},
{name:"云林",province:"台湾",lng:120.53},
{name:"苗栗",province:"台湾",lng:120.82},
{name:"香港",province:"香港",lng:114.17},
{name:"澳门",province:"澳门",lng:113.54},
{name:"新加坡",province:"海外",lng:103.82},
{name:"吉隆坡",province:"海外",lng:101.69},
{name:"曼谷",province:"海外",lng:100.5},
{name:"东京",province:"海外",lng:139.69},
{name:"首尔",province:"海外",lng:126.98},
{name:"悉尼",province:"海外",lng:151.21},
{name:"墨尔本",province:"海外",lng:144.96},
{name:"纽约",province:"海外",lng:-74.01},
{name:"洛杉矶",province:"海外",lng:-118.24},
{name:"旧金山",province:"海外",lng:-122.42},
{name:"温哥华",province:"海外",lng:-123.12},
{name:"多伦多",province:"海外",lng:-79.38},
{name:"伦敦",province:"海外",lng:-0.12}
];

    // ===== True Solar Time =====
    function getTimezoneMeridian(lng) {
        if (lng >= 73 && lng <= 135) return 120;
        if (lng >= 135 && lng <= 150) return 135;
        if (lng >= 97 && lng < 105) return 105;
        return Math.round(lng / 15) * 15;
    }

    function equationOfTime(dayOfYear) {
        const B = 2 * Math.PI * (dayOfYear - 81) / 364;
        return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    }

    function dayOfYear(year, month, day) {
        const d = new Date(year, month - 1, day);
        const start = new Date(year, 0, 0);
        return Math.floor((d - start) / 86400000);
    }

    function trueSolarTime(year, month, day, hour, minute, longitude) {
        const refMeridian = getTimezoneMeridian(longitude);
        const doy = dayOfYear(year, month, day);
        const eot = equationOfTime(doy);
        const lngCorrection = (longitude - refMeridian) * 4;
        const offsetMinutes = Math.round(lngCorrection + eot);
        let totalMinutes = hour * 60 + minute + offsetMinutes;
        let dayOffset = 0;
        if (totalMinutes < 0) { dayOffset = -1; totalMinutes += 1440; }
        else if (totalMinutes >= 1440) { dayOffset = 1; totalMinutes -= 1440; }
        const trueHour = Math.floor(totalMinutes / 60);
        const trueMinute = totalMinutes % 60;
        let shichen = Math.floor(((trueHour + 1) % 24) / 2);
        const sign = offsetMinutes >= 0 ? '+' : '';
        const description = `经度修正 ${(lngCorrection >= 0?'+':'') + lngCorrection.toFixed(1)}分 + 时差修正 ${(eot >= 0?'+':'') + eot.toFixed(1)}分 = 共${sign}${offsetMinutes}分`;
        return { trueHour, trueMinute, trueTotalMinutes: totalMinutes, offsetMinutes, dayOffset, shichen, description,
            trueTimeStr: `${String(trueHour).padStart(2,'0')}:${String(trueMinute).padStart(2,'0')}` };
    }

    // ===== Gan-Zhi =====
    function julianDayNumber(y, m, d) {
        if (m <= 2) { y -= 1; m += 12; }
        const A = Math.floor(y / 100);
        const B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    }

    function yearGanZhi(lunarYear) {
        const ganIdx = (lunarYear - 4) % 10;
        const zhiIdx = (lunarYear - 4) % 12;
        return {gan:TIAN_GAN[ganIdx],zhi:DI_ZHI[zhiIdx],ganIdx,zhiIdx,text:TIAN_GAN[ganIdx]+DI_ZHI[zhiIdx]};
    }
    function monthGanZhi(yearGanIdx, lunarMonth) {
        const zhiIdx = (lunarMonth + 1) % 12;
        const startGan = [2,4,6,8,0];
        const ganIdx = (startGan[yearGanIdx % 5] + lunarMonth - 1) % 10;
        return {gan:TIAN_GAN[ganIdx],zhi:DI_ZHI[zhiIdx],ganIdx,zhiIdx,text:TIAN_GAN[ganIdx]+DI_ZHI[zhiIdx]};
    }
    function dayGanZhi(sy, sm, sd) {
        const jdn = julianDayNumber(sy, sm, sd);
        const idx = ((Math.floor(jdn + 0.5) + 9) % 60 + 60) % 60;
        return {gan:TIAN_GAN[idx%10],zhi:DI_ZHI[idx%12],ganIdx:idx%10,zhiIdx:idx%12,jiaziIdx:idx,text:TIAN_GAN[idx%10]+DI_ZHI[idx%12]};
    }
    function hourGanZhi(dayGanIdx, hourIdx) {
        const startGan = [0,2,4,6,8];
        const ganIdx = (startGan[dayGanIdx % 5] + hourIdx) % 10;
        return {gan:TIAN_GAN[ganIdx],zhi:DI_ZHI[hourIdx],ganIdx,zhiIdx:hourIdx,text:TIAN_GAN[ganIdx]+DI_ZHI[hourIdx]};
    }
    function getNaYin(ganIdx, zhiIdx) {
        const cycle60 = [];
        for (let g = 0; g < 10; g++) for (let z = 0; z < 12; z++) if (g % 2 === z % 2) cycle60.push({g,z});
        for (let i = 0; i < 60; i++) if (cycle60[i].g === ganIdx && cycle60[i].z === zhiIdx) return NA_YIN[i];
        return '';
    }
    function ganWuXing(i) { return GAN_WUXING[i]; }
    function zhiWuXing(i) { return ZHI_WUXING[i]; }
    function ganYinYang(i) { return GAN_YINYANG[i]; }
    function elementClass(e) { return 'element-'+({'木':'wood','火':'fire','土':'earth','金':'metal','水':'water'}[e]||''); }
    function elementBgClass(e) { return 'bg-'+({'木':'wood','火':'fire','土':'earth','金':'metal','水':'water'}[e]||''); }
    function shiShen(dayGanIdx, otherGanIdx) {
        const d=GAN_WUXING[dayGanIdx],o=GAN_WUXING[otherGanIdx],s=GAN_YINYANG[dayGanIdx]===GAN_YINYANG[otherGanIdx];
        const r={'木木':s?'比肩':'劫财','木火':s?'食神':'伤官','木土':s?'偏财':'正财','木金':s?'七杀':'正官','木水':s?'偏印':'正印',
            '火火':s?'比肩':'劫财','火土':s?'食神':'伤官','火金':s?'偏财':'正财','火水':s?'七杀':'正官','火木':s?'偏印':'正印',
            '土土':s?'比肩':'劫财','土金':s?'食神':'伤官','土水':s?'偏财':'正财','土木':s?'七杀':'正官','土火':s?'偏印':'正印',
            '金金':s?'比肩':'劫财','金水':s?'食神':'伤官','金木':s?'偏财':'正财','金火':s?'七杀':'正官','金土':s?'偏印':'正印',
            '水水':s?'比肩':'劫财','水木':s?'食神':'伤官','水火':s?'偏财':'正财','水土':s?'七杀':'正官','水金':s?'偏印':'正印'};
        return r[d+o]||'';
    }
    function wuxingRelation(e1, e2) {
        if (e1===e2) return 'same';
        const g={'木':'火','火':'土','土':'金','金':'水','水':'木'},r={'木':'土','火':'金','土':'水','金':'木','水':'火'};
        if (g[e1]===e2) return 'generate'; if (r[e1]===e2) return 'restrain';
        if (g[e2]===e1) return 'generated'; if (r[e2]===e1) return 'restrained'; return 'none';
    }

    return {
        TIAN_GAN, DI_ZHI, SHENG_XIAO, GAN_WUXING, ZHI_WUXING, GAN_YINYANG,
        CANG_GAN, NA_YIN, CITIES,
        solarToLunar, formatLunar, lunarDayName, lunarMonthName,
        yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi,
        getNaYin, ganWuXing, zhiWuXing, ganYinYang,
        elementClass, elementBgClass, shiShen, wuxingRelation,
        leapMonth, monthDays, leapDays, trueSolarTime
    };
})();
