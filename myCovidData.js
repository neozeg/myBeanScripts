/*
cron "0 0-23/1 * * *" myCovidData.js, tag:新冠数字
 */

const { env } = require("process");

//详细说明参考 http://www.free-api.com/doc/436

// prettier-ignore


const $ = new Env(`my新冠数字信息`);
const notify = $.isNode() ? require('./sendNotify'):''; 
const mqttMsg = $.isNode() ? require(`./sendMqttMsg`):'';
// const delay = ms => new Promise((resolve, reject) => setTimeout(resolve,ms));
// let add_daily;
let covidData;
let nameOfData = '';
let todayFullData;

let listOfSub = [`中国`,`广东`,`深圳`,`香港`,`美国`]; 

let MY_MQTT_COVIDDATA_TOPIC = 'hass/covid_data'

if (process.env.MY_MQTT_COVIDDATA_TOPIC)MY_MQTT_COVIDDATA_TOPIC = process.env.MY_MQTT_COVIDDATA_TOPIC;

!(async()=>{

    if(!listOfSub[0]){
        $.msg($.name,`请加入需要查询国家/省份/城市`);
        return;
    }
    
    todayFullData = new Object();
    await getCovidData();

    for(i = 0;i<listOfSub.length;i++){
        covidData = new Object();
        covidData.today = new Object();
        covidData.total = new Object();
        nameOfData = listOfSub[i];
        await parseCovidData();
        showMsg();
		await mqttMsg.sendMqttMessage(`${MY_MQTT_COVIDDATA_TOPIC}/${i+1}`,JSON.stringify(covidData));
		// await mqttMsg.delay(100);
    }
	// mqttMsg.sendMqttMsg("hihi",12);
	// mqttMsg.sendMqttMessage(`hass/hohome`,`hello`);



})().catch((e) => {
	$.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
}).finally(()=>{
    $.done();
})


function parseCovidData(){
    return new Promise(async resolve =>{
        for(let area of todayFullData.data.areaTree){
            for(let area_sub of area.children){
                // console.log(area_sub.name);
                    if(area_sub.name.search(nameOfData) != -1){
                        covidData.areaName = area_sub.name;
                        covidData.id = area_sub.id;
                        //确诊新增：
                        covidData.today.confirm = area_sub.today.confirm;
                        //确诊累计：
                        covidData.total.confirm = area_sub.total.confirm;
                        //治愈新增：
                        covidData.today.heal = area_sub.today.heal;
                        //治愈累计：
                        covidData.total.heal = area_sub.total.heal;
                        //死亡新增：
                        covidData.today.dead = area_sub.today.dead ;
                        //死亡累计：
                        covidData.total.dead = area_sub.total.dead ;
                        covidData.today.storeConfirm = area_sub.total.confirm - area_sub.total.dead - area_sub.total.heal;
						covidData.lastUpdateTime = area_sub.lastUpdateTime;
                        break;
                    }
                for(let area_sub_sub of area_sub.children){
                    // console.log(area_sub_sub.name);
                    if(area_sub_sub.name.search(nameOfData) != -1){
                        covidData.areaName = area_sub_sub.name;
                        covidData.id = area_sub_sub.id;
                        //确诊新增：
                        covidData.today.confirm = area_sub_sub.today.confirm;
                        //确诊累计：
                        covidData.total.confirm = area_sub_sub.total.confirm;
                        //治愈新增：
                        covidData.today.heal = area_sub_sub.today.heal;
                        //治愈累计：
                        covidData.total.heal = area_sub_sub.total.heal;
                        //死亡新增：
                        covidData.today.dead = area_sub_sub.today.dead ;
                        //死亡累计：
                        covidData.total.dead = area_sub_sub.total.dead ;
                        covidData.today.storeConfirm = area_sub_sub.total.confirm - area_sub_sub.total.dead - area_sub_sub.total.heal;
						covidData.lastUpdateTime = area_sub_sub.lastUpdateTime;
                        break;
                    }
                }

            }
            if(area.name.search(nameOfData) != -1){
				covidData.areaName = area.name;
                covidData.id = area.id;
                //确诊新增：
                covidData.today.confirm = area.today.confirm;
                //确诊累计：
                covidData.total.confirm = area.total.confirm;
                //治愈新增：
                covidData.today.heal = area.today.heal;
                //治愈累计：
                covidData.total.heal = area.total.heal;
                //死亡新增：
                covidData.today.dead = area.today.dead ;
                //死亡累计：
                covidData.total.dead = area.total.dead ;
                covidData.today.storeConfirm = area.total.confirm - area.total.dead - area.total.heal;
				covidData.lastUpdateTime = area.lastUpdateTime;

                // console.log(JSON.stringify(covidData));
                break;
            }
            
        }

        resolve();
    })

}

function getCovidData(){
    return new Promise(async resolve =>{
        const options = {
            // url: "https://interface.sina.cn/news/wap/fymap2020_data.d.json",
            url: "https://c.m.163.com/ug/api/wuhan/app/data/list-total",
            headers:{
				"Accept": "application/json,text/plain, */*",
				"Content-Type": "application/x-www-form-urlencoded",
				"Accept-Encoding": "gzip, deflate, br",
				"Accept-Language": "zh-cn",
				"Connection": "keep-alive",
				// "Cookie": cookie,
				// "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                // "User-Agent": "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
				"User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      
            }
        }
        $.get(options,(err,resp,data) => {
            try{
                if(err){
                    $.logErr(err)
                }else{
                    if(data){
                        todayFullData = JSON.parse(data);
                        // add_daily = data.data.add_daily;
                        // console.log(JSON.stringify(data.data.add_daily));   

                        

                    }else{
                        $.log('API返回空数据');
                    }
                }
            }catch(e){
                $.logErr(e);
            }
            finally{
                resolve()
            }
        })

    })
}

async function showMsg(){
    let message = '';
    message += `\n【${covidData.areaName}】【${covidData.id}】`;
    // message += `今日数据:`;
    message += `\n确诊新增：` ;
    message += (covidData.today.confirm)?`${covidData.today.confirm}`:`-`;
    message += `\n确诊累计：` ;
    message += (covidData.total.confirm)?`${covidData.total.confirm}`:`-`;
    // message += `\n疑似新增：` ;
    // message += (covidData.today.suspect)?`${covidData.today.suspect}`:`-`;
    // message += ` / ${covidData.total.suspect}`;
    message += `\n治愈新增：`;
    message += (covidData.today.heal)?`${covidData.today.heal}`:`-`;
    message += `\n治愈累计：`;
    message += (covidData.total.heal)?`${covidData.total.heal}`:`-`;
    message += `\n死亡新增：`;
    message += (covidData.today.dead)?`${covidData.today.dead}`:`-` ;
    message += `\n死亡累计：`;
    message += (covidData.total.dead)?`${covidData.total.dead}`:`-` ;
    message += `\n现存确诊：`;
    message += (covidData.today.storeConfirm)?`${covidData.today.storeConfirm}`:`-`;
	message += `\n更新时间：`;
    message += (covidData.lastUpdateTime)?`${covidData.lastUpdateTime}`:`-`;
    
    // message += `\n境外输入：`;
    // message += (covidData.today.input)?`${covidData.today.input}`:`-` ;
    // message += `\n输入累计：`;
    // message += (covidData.total.input)?`${covidData.total.input}`:`-` ;
    // message += `\n`;


    console.log(message);
    // notify.sendNotify(`新冠数据`,message);

}



// prettier-ignore
function Env(t, e) {
	"undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
	class s {
		constructor(t) {
			this.env = t
		}
		send(t, e = "GET") {
			t = "string" == typeof t ? {
				url: t
			}
			 : t;
			let s = this.get;
			return "POST" === e && (s = this.post),
			new Promise((e, i) => {
				s.call(this, t, (t, s, r) => {
					t ? i(t) : e(s)
				})
			})
		}
		get(t) {
			return this.send.call(this.env, t)
		}
		post(t) {
			return this.send.call(this.env, t, "POST")
		}
	}
	return new class {
		constructor(t, e) {
			this.name = t,
			this.http = new s(this),
			this.data = null,
			this.dataFile = "box.dat",
			this.logs = [],
			this.isMute = !1,
			this.isNeedRewrite = !1,
			this.logSeparator = "\n",
			this.startTime = (new Date).getTime(),
			Object.assign(this, e),
			this.log("", `🔔${this.name}, 开始!`)
		}
		isNode() {
			return "undefined" != typeof module && !!module.exports
		}
		isQuanX() {
			return "undefined" != typeof $task
		}
		isSurge() {
			return "undefined" != typeof $httpClient && "undefined" == typeof $loon
		}
		isLoon() {
			return "undefined" != typeof $loon
		}
		toObj(t, e = null) {
			try {
				return JSON.parse(t)
			} catch {
				return e
			}
		}
		toStr(t, e = null) {
			try {
				return JSON.stringify(t)
			} catch {
				return e
			}
		}
		getjson(t, e) {
			let s = e;
			const i = this.getdata(t);
			if (i)
				try {
					s = JSON.parse(this.getdata(t))
				} catch {}
			return s
		}
		setjson(t, e) {
			try {
				return this.setdata(JSON.stringify(t), e)
			} catch {
				return !1
			}
		}
		getScript(t) {
			return new Promise(e => {
				this.get({
					url: t
				}, (t, s, i) => e(i))
			})
		}
		runScript(t, e) {
			return new Promise(s => {
				let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
				i = i ? i.replace(/\n/g, "").trim() : i;
				let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
				r = r ? 1 * r : 20,
				r = e && e.timeout ? e.timeout : r;
				const[o, h] = i.split("@"),
				n = {
					url: `http://${h}/v1/scripting/evaluate`,
					body: {
						script_text: t,
						mock_type: "cron",
						timeout: r
					},
					headers: {
						"X-Key": o,
						Accept: "*/*"
					}
				};
				this.post(n, (t, e, i) => s(i))
			}).catch(t => this.logErr(t))
		}
		loaddata() {
			if (!this.isNode())
				return {}; {
				this.fs = this.fs ? this.fs : require("fs"),
				this.path = this.path ? this.path : require("path");
				const t = this.path.resolve(this.dataFile),
				e = this.path.resolve(process.cwd(), this.dataFile),
				s = this.fs.existsSync(t),
				i = !s && this.fs.existsSync(e);
				if (!s && !i)
					return {}; {
					const i = s ? t : e;
					try {
						return JSON.parse(this.fs.readFileSync(i))
					} catch (t) {
						return {}
					}
				}
			}
		}
		writedata() {
			if (this.isNode()) {
				this.fs = this.fs ? this.fs : require("fs"),
				this.path = this.path ? this.path : require("path");
				const t = this.path.resolve(this.dataFile),
				e = this.path.resolve(process.cwd(), this.dataFile),
				s = this.fs.existsSync(t),
				i = !s && this.fs.existsSync(e),
				r = JSON.stringify(this.data);
				s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
			}
		}
		lodash_get(t, e, s) {
			const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
			let r = t;
			for (const t of i)
				if (r = Object(r)[t], void 0 === r)
					return s;
			return r
		}
		lodash_set(t, e, s) {
			return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
		}
		getdata(t) {
			let e = this.getval(t);
			if (/^@/.test(t)) {
				const[, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
				r = s ? this.getval(s) : "";
				if (r)
					try {
						const t = JSON.parse(r);
						e = t ? this.lodash_get(t, i, "") : e
					} catch (t) {
						e = ""
					}
			}
			return e
		}
		setdata(t, e) {
			let s = !1;
			if (/^@/.test(e)) {
				const[, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
				o = this.getval(i),
				h = i ? "null" === o ? null : o || "{}" : "{}";
				try {
					const e = JSON.parse(h);
					this.lodash_set(e, r, t),
					s = this.setval(JSON.stringify(e), i)
				} catch (e) {
					const o = {};
					this.lodash_set(o, r, t),
					s = this.setval(JSON.stringify(o), i)
				}
			} else
				s = this.setval(t, e);
			return s
		}
		getval(t) {
			return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
		}
		setval(t, e) {
			return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
		}
		initGotEnv(t) {
			this.got = this.got ? this.got : require("got"),
			this.cktough = this.cktough ? this.cktough : require("tough-cookie"),
			this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar,
			t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
		}
		get(t, e = (() => {})) {
			t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
			this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
						"X-Surge-Skip-Scripting": !1
					})), $httpClient.get(t, (t, s, i) => {
					!t && s && (s.body = i, s.statusCode = s.status),
					e(t, s, i)
				})) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
						hints: !1
					})), $task.fetch(t).then(t => {
					const {
						statusCode: s,
						statusCode: i,
						headers: r,
						body: o
					} = t;
					e(null, {
						status: s,
						statusCode: i,
						headers: r,
						body: o
					}, o)
				}, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
					try {
						if (t.headers["set-cookie"]) {
							const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
							s && this.ckjar.setCookieSync(s, null),
							e.cookieJar = this.ckjar
						}
					} catch (t) {
						this.logErr(t)
					}
				}).then(t => {
					const {
						statusCode: s,
						statusCode: i,
						headers: r,
						body: o
					} = t;
					e(null, {
						status: s,
						statusCode: i,
						headers: r,
						body: o
					}, o)
				}, t => {
					const {
						message: s,
						response: i
					} = t;
					e(s, i, i && i.body)
				}))
		}
		post(t, e = (() => {})) {
			if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon())
				this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
						"X-Surge-Skip-Scripting": !1
					})), $httpClient.post(t, (t, s, i) => {
					!t && s && (s.body = i, s.statusCode = s.status),
					e(t, s, i)
				});
			else if (this.isQuanX())
				t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
						hints: !1
					})), $task.fetch(t).then(t => {
					const {
						statusCode: s,
						statusCode: i,
						headers: r,
						body: o
					} = t;
					e(null, {
						status: s,
						statusCode: i,
						headers: r,
						body: o
					}, o)
				}, t => e(t));
			else if (this.isNode()) {
				this.initGotEnv(t);
				const {
					url: s,
					...i
				} = t;
				this.got.post(s, i).then(t => {
					const {
						statusCode: s,
						statusCode: i,
						headers: r,
						body: o
					} = t;
					e(null, {
						status: s,
						statusCode: i,
						headers: r,
						body: o
					}, o)
				}, t => {
					const {
						message: s,
						response: i
					} = t;
					e(s, i, i && i.body)
				})
			}
		}
		time(t, e = null) {
			const s = e ? new Date(e) : new Date;
			let i = {
				"M+": s.getMonth() + 1,
				"d+": s.getDate(),
				"H+": s.getHours(),
				"m+": s.getMinutes(),
				"s+": s.getSeconds(),
				"q+": Math.floor((s.getMonth() + 3) / 3),
				S: s.getMilliseconds()
			};
			/(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
			for (let e in i)
				new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
			return t
		}
		msg(e = t, s = "", i = "", r) {
			const o = t => {
				if (!t)
					return t;
				if ("string" == typeof t)
					return this.isLoon() ? t : this.isQuanX() ? {
						"open-url": t
					}
				 : this.isSurge() ? {
					url: t
				}
				 : void 0;
				if ("object" == typeof t) {
					if (this.isLoon()) {
						let e = t.openUrl || t.url || t["open-url"],
						s = t.mediaUrl || t["media-url"];
						return {
							openUrl: e,
							mediaUrl: s
						}
					}
					if (this.isQuanX()) {
						let e = t["open-url"] || t.url || t.openUrl,
						s = t["media-url"] || t.mediaUrl;
						return {
							"open-url": e,
							"media-url": s
						}
					}
					if (this.isSurge()) {
						let e = t.url || t.openUrl || t["open-url"];
						return {
							url: e
						}
					}
				}
			};
			if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
				let t = ["", "==============📣系统通知📣=============="];
				t.push(e),
				s && t.push(s),
				i && t.push(i),
				console.log(t.join("\n")),
				this.logs = this.logs.concat(t)
			}
		}
		log(...t) {
			t.length > 0 && (this.logs = [...this.logs, ...t]),
			console.log(t.join(this.logSeparator))
		}
		logErr(t, e) {
			const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
			s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
		}
		wait(t) {
			return new Promise(e => setTimeout(e, t))
		}
		done(t = {}) {
			const e = (new Date).getTime(),
			s = (e - this.startTime) / 1e3;
			this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`),
			this.log(),
			(this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
		}
	}
	(t, e)
}

