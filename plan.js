// ---------- Workout plan builder (profile + quiz + generated weekly plan) ----------
// Equipment tiers: 0 bodyweight (pull-up bar, bench/chair, step, wall allowed) · 1 home basics · 2 gym (everything else)
const SET_B = new Set(["Push-Up","Pike Push-Up","Diamond Push-Up","Bench Dip","Crunch","Front Plank","Hollow Body Hold","Reverse Crunch","Dead Bug","Lying Leg Raise","Mountain Climber","Side Plank","Bicycle Crunch","Bird Dog","Superman","Glute Bridge","Copenhagen Plank","Side-Lying Hip Adduction","Cossack Squat","Tibialis Raise","Single-Leg Calf Raise","Standing Calf Raise","Walking Lunge","Nordic Hamstring Curl","Pull-Up","Chin-Up","Dead Hang","Hanging Knee Raise","Hanging Leg Raise","Side-Lying Hip Abduction","Reverse Nordic"]);
const SET_H = new Set(["Dumbbell Shrug","Farmer's Carry","Prone Y-Raise","Band Pull-Apart","Lateral Raise","Reverse Dumbbell Fly","Seated Dumbbell Shoulder Press","Incline Dumbbell Press","Dumbbell Bench Press","Hammer Curl","Incline Dumbbell Curl","Overhead Dumbbell Extension","Dumbbell Wrist Curl","Reverse Wrist Curl","Stability Ball Crunch","Suitcase Carry","One-Arm Dumbbell Row","Goblet Squat","Bulgarian Split Squat","Step-Up","Kettlebell Swing","Banded Lateral Walk","Sumo Squat","Single-Leg Romanian Deadlift","Stability Ball Leg Curl","Jump Rope","Pallof Press"]);
const tierOf = n => SET_B.has(n) ? 0 : SET_H.has(n) ? 1 : 2;

// Exercises left out when the user flags an area to protect
const AVOID = {
 knee:["Reverse Nordic","Bulgarian Split Squat","Walking Lunge","Jump Rope","Cossack Squat","Barbell Back Squat","Front Squat","Leg Extension","Step-Up","Nordic Hamstring Curl","Mountain Climber"],
 back:["Conventional Deadlift","Good Morning","Barbell Back Squat","Front Squat","Rack Pull","Barbell Bent-Over Row","Kettlebell Swing","Romanian Deadlift","Ab Wheel Rollout","Standing Overhead Press","Superman","Reverse Hyperextension","Hanging Leg Raise"],
 shoulder:["Standing Overhead Press","Seated Dumbbell Shoulder Press","Pike Push-Up","Chest Dip","Bench Dip","Skull Crusher","Barbell Bench Press","Pull-Up","Chin-Up","Dead Hang","Hanging Knee Raise","Hanging Leg Raise","Overhead Dumbbell Extension"]
};

// Day templates: muscle-group slots in priority order (first two are the main lifts)
const PAD = ["upperAbs","glutes","obliques","calves","lowerAbs"];
const TPL = {
 fbA:["quads","chest","lats","hamstrings","delts","upperAbs","biceps","calves"],
 fbB:["glutes","lats","chest","quads","delts","obliques","triceps","lowerBack"],
 fbC:["hamstrings","chest","lats","quads","traps","lowerAbs","biceps","triceps"],
 upA:["chest","lats","delts","lats","chest","triceps","biceps","traps"],
 upB:["lats","chest","delts","chest","lats","biceps","triceps","forearms"],
 loA:["quads","hamstrings","glutes","quads","calves","upperAbs","adductors","lowerAbs"],
 loB:["glutes","quads","hamstrings","hamstrings","calves","obliques","lowerBack","lowerAbs"],
 push:["chest","delts","chest","triceps","delts","triceps","upperAbs","chest"],
 pull:["lats","lats","traps","biceps","traps","biceps","forearms","lowerBack"],
 legs:["quads","hamstrings","glutes","quads","calves","adductors","lowerAbs","obliques"]
};
TPL.push2 = TPL.push; TPL.pull2 = TPL.pull; TPL.legs2 = TPL.legs;
const WEEKDAYS = {2:[0,3],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,4,5],6:[0,1,2,3,4,5]};
const RX = {strength:[["4 × 4–6","2–3 min"],["3 × 8–10","90 s"]], muscle:[["4 × 6–10","2 min"],["3 × 10–15","60–90 s"]],
 fat:[["3 × 10–12","60 s"],["3 × 12–15","45 s"]], health:[["3 × 8–12","90 s"],["2 × 12–15","60 s"]], endurance:[["3 × 15–20","45 s"],["2–3 × 15–20","30 s"]]};

const P_UI = {
en:{
 tabMap:"Muscle map", tabPlan:"Workout plan",
 step:(i,n)=>`Step ${i} of ${n}`, back:"Back", next:"Continue", build:"Build my plan",
 aboutT:"About you", aboutS:"Used to estimate your calories and tailor the plan. Saved only in this browser.",
 sex:"Gender", m:"Male", f:"Female", age:"Age (years)", h:"Height (cm)", w:"Weight (kg)",
 eSex:"Choose your gender.", eAge:"Enter an age between 14 and 90.", eH:"Enter a height between 120 and 230 cm.", eW:"Enter a weight between 30 and 250 kg.",
 q:{
  goal:{t:"What's your main goal?",o:{fat:["Lose fat","Burn fat while keeping your muscle"],muscle:["Build muscle","Get bigger and more defined"],strength:["Get stronger","Lift heavier on the big lifts"],health:["Stay fit and healthy","Feel better and move better"],endurance:["Improve endurance","Last longer and recover faster"]}},
  exp:{t:"How much have you trained before?",o:{beg:["Beginner","Never, or less than 6 months"],int:["Intermediate","6 months to 2 years of regular training"],adv:["Advanced","Over 2 years, comfortable with barbell lifts"]}},
  where:{t:"Where will you work out?",o:{body:["At home, bodyweight only","No equipment. A pull-up bar helps a lot."],home:["At home with basic equipment","Dumbbells, kettlebell, resistance bands, a bench"],gym:["In a gym","Machines, cables, barbells and everything else"]}},
  days:{t:"How many days a week can you train?",o:{2:["2 days","The minimum for steady progress"],3:["3 days","The most popular choice"],4:["4 days","Upper and lower body split"],5:["5 days","More volume, needs good recovery"],6:["6 days","For experienced lifters"]}},
  len:{t:"How long can each session be?",o:{30:["30 min","About 4 exercises"],45:["45 min","About 5 exercises"],60:["60 min","About 6 exercises"],90:["90 min","About 8 exercises"]}},
  lim:{t:"Any areas you need to protect?",s:"We'll leave out the riskiest exercises for these. This doesn't replace advice from a doctor or physiotherapist.",o:{none:["No problems",""],knee:["Knees",""],back:["Lower back",""],shoulder:["Shoulders",""]}}
 },
 resT:"Your plan", edit:"Edit answers", restart:"Start over",
 bmi:"BMI", bmiCat:["Underweight","Healthy range","Overweight","Obesity range"], bmiNote:"BMI can't tell muscle from fat.",
 kcal:"Daily calories", kcalS:{fat:t=>`About 450 below your maintenance of ${t} kcal`,muscle:t=>`About 250 above your maintenance of ${t} kcal`,strength:t=>`About 150 above your maintenance of ${t} kcal`,health:t=>`Your estimated maintenance`,endurance:t=>`Your estimated maintenance`,lowBmi:t=>`Maintenance (${t} kcal). Your BMI is already low, so we don't suggest a deficit.`},
 protein:"Protein", protS:"grams per day, spread over 3–5 meals",
 cardio:"Cardio", cardioT:{fat:"2–3 × 20–40 min brisk walking or cycling, plus 7–10k steps a day",muscle:"1–2 × 20–30 min easy cardio for heart health",strength:"1–2 × 20–30 min easy cardio for heart health",health:"150 min a week of moderate cardio, such as brisk walking",endurance:"3 × 30–45 min easy cardio plus 1 interval session"},
 week:"Your week", rest:"Rest", day:i=>`Day ${i}`, wdShort:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], wdLong:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
 titles:{fbA:"Full body A",fbB:"Full body B",fbC:"Full body C",upA:"Upper A",upB:"Upper B",loA:"Lower A",loB:"Lower B",push:"Push",pull:"Pull",legs:"Legs",push2:"Push B",pull2:"Pull B",legs2:"Legs B"},
 rest_:"rest", openHint:"Tap an exercise for step-by-step technique.",
 tipsT:"How to run this plan",
 tips:{warm:"Warm up for 5–10 minutes with light cardio, then do 1–2 lighter sets of your first exercise.",
  prog:"Progress with double progression: once you hit the top of the rep range on every set, add the smallest weight step next session.",
  body:"With bodyweight exercises, move to a harder variation (feet raised, slower tempo, one leg) when you can beat the rep range.",
  beg:"For the first 2 weeks, do one set fewer than listed while you learn the movements.",
  deload:"Every 6–8 weeks, take an easier week with about half the sets.",
  amrap:"“max −2” means as many clean reps as you can, stopping about 2 reps before failure.",
  sleep:"Aim for 7–9 hours of sleep. Muscles grow during recovery, not during the workout.",
  old:"After 60, keep balance and leg strength a priority and check with your doctor before starting hard training.",
  young:"Under 18: train with supervision and focus on technique before load.",
  fatX:"End each session with 5–10 minutes of intervals (bike, rower or jump rope) if you have time."},
 disclaimer:"Estimates from standard formulas (Mifflin–St Jeor). Not medical advice."
},
hr:{
 tabMap:"Karta mišića", tabPlan:"Plan treninga",
 step:(i,n)=>`Korak ${i} od ${n}`, back:"Natrag", next:"Dalje", build:"Izradi moj plan",
 aboutT:"O tebi", aboutS:"Koristi se za procjenu kalorija i prilagodbu plana. Sprema se samo u ovom pregledniku.",
 sex:"Spol", m:"Muško", f:"Žensko", age:"Dob (godine)", h:"Visina (cm)", w:"Težina (kg)",
 eSex:"Odaberi spol.", eAge:"Upiši dob između 14 i 90.", eH:"Upiši visinu između 120 i 230 cm.", eW:"Upiši težinu između 30 i 250 kg.",
 q:{
  goal:{t:"Koji ti je glavni cilj?",o:{fat:["Gubitak masnoće","Topi masnoću i zadrži mišiće"],muscle:["Izgradnja mišića","Veći i definiraniji mišići"],strength:["Veća snaga","Dizanje većih težina u osnovnim vježbama"],health:["Kondicija i zdravlje","Osjećaj se bolje i kreći se bolje"],endurance:["Bolja izdržljivost","Izdrži dulje i brže se oporavi"]}},
  exp:{t:"Koliko si do sada trenirao/la?",o:{beg:["Početnik","Nikad ili manje od 6 mjeseci"],int:["Srednja razina","6 mjeseci do 2 godine redovitog treninga"],adv:["Napredno","Više od 2 godine, sigurno radiš sa šipkom"]}},
  where:{t:"Gdje ćeš trenirati?",o:{body:["Kod kuće, samo vlastita težina","Bez opreme. Šipka za zgibove puno pomaže."],home:["Kod kuće s osnovnom opremom","Bučice, kettlebell, elastične gume, klupa"],gym:["U teretani","Sprave, sajle, šipke i sve ostalo"]}},
  days:{t:"Koliko dana tjedno možeš trenirati?",o:{2:["2 dana","Minimum za stalan napredak"],3:["3 dana","Najčešći izbor"],4:["4 dana","Podjela na gornji i donji dio tijela"],5:["5 dana","Više volumena, treba dobar oporavak"],6:["6 dana","Za iskusne vježbače"]}},
  len:{t:"Koliko dugo može trajati trening?",o:{30:["30 min","Oko 4 vježbe"],45:["45 min","Oko 5 vježbi"],60:["60 min","Oko 6 vježbi"],90:["90 min","Oko 8 vježbi"]}},
  lim:{t:"Trebaš li paziti na neki dio tijela?",s:"Izostavit ćemo najrizičnije vježbe za te dijelove. Ovo ne zamjenjuje savjet liječnika ili fizioterapeuta.",o:{none:["Nemam problema",""],knee:["Koljena",""],back:["Donja leđa",""],shoulder:["Ramena",""]}}
 },
 resT:"Tvoj plan", edit:"Uredi odgovore", restart:"Počni ispočetka",
 bmi:"ITM (BMI)", bmiCat:["Pothranjenost","Zdrav raspon","Prekomjerna težina","Raspon pretilosti"], bmiNote:"ITM ne razlikuje mišiće od masnoće.",
 kcal:"Dnevne kalorije", kcalS:{fat:t=>`Oko 450 manje od tvojeg održavanja od ${t} kcal`,muscle:t=>`Oko 250 više od tvojeg održavanja od ${t} kcal`,strength:t=>`Oko 150 više od tvojeg održavanja od ${t} kcal`,health:t=>`Tvoje procijenjeno održavanje`,endurance:t=>`Tvoje procijenjeno održavanje`,lowBmi:t=>`Održavanje (${t} kcal). Tvoj ITM je već nizak pa ne preporučujemo manjak kalorija.`},
 protein:"Proteini", protS:"grama dnevno, raspoređeno na 3–5 obroka",
 cardio:"Kardio", cardioT:{fat:"2–3 × 20–40 min žustrog hodanja ili bicikla, uz 7–10 tisuća koraka dnevno",muscle:"1–2 × 20–30 min laganog kardija za zdravlje srca",strength:"1–2 × 20–30 min laganog kardija za zdravlje srca",health:"150 min tjedno umjerenog kardija, npr. žustrog hodanja",endurance:"3 × 30–45 min laganog kardija i 1 intervalni trening"},
 week:"Tvoj tjedan", rest:"Odmor", day:i=>`Dan ${i}`, wdShort:["Pon","Uto","Sri","Čet","Pet","Sub","Ned"], wdLong:["Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota","Nedjelja"],
 titles:{fbA:"Cijelo tijelo A",fbB:"Cijelo tijelo B",fbC:"Cijelo tijelo C",upA:"Gornji dio A",upB:"Gornji dio B",loA:"Donji dio A",loB:"Donji dio B",push:"Guranje",pull:"Povlačenje",legs:"Noge",push2:"Guranje B",pull2:"Povlačenje B",legs2:"Noge B"},
 rest_:"odmor", openHint:"Dodirni vježbu za tehniku korak po korak.",
 tipsT:"Kako provoditi plan",
 tips:{warm:"Zagrij se 5–10 minuta laganim kardijem, zatim napravi 1–2 lakše serije prve vježbe.",
  prog:"Napreduj dvostrukom progresijom: kad u svim serijama dosegneš gornju granicu ponavljanja, sljedeći put dodaj najmanji mogući uteg.",
  body:"Kod vježbi s vlastitom težinom prijeđi na težu varijantu (podignuta stopala, sporiji tempo, jedna noga) kad nadmašiš raspon ponavljanja.",
  beg:"Prva 2 tjedna radi jednu seriju manje od navedenog dok učiš pokrete.",
  deload:"Svakih 6–8 tjedana napravi lakši tjedan s otprilike pola serija.",
  amrap:"„max −2” znači onoliko čistih ponavljanja koliko možeš, stani otprilike 2 prije otkaza.",
  sleep:"Spavaj 7–9 sati. Mišići rastu tijekom oporavka, ne tijekom treninga.",
  old:"Nakon 60. godine prioritet su ravnoteža i snaga nogu, a prije težeg treninga posavjetuj se s liječnikom.",
  young:"Mlađi od 18: treniraj pod nadzorom i usredotoči se na tehniku prije opterećenja.",
  fatX:"Ako imaš vremena, završi trening s 5–10 minuta intervala (bicikl, veslač ili preskakanje užeta)."},
 disclaimer:"Procjene prema standardnim formulama (Mifflin–St Jeor). Nije medicinski savjet."
}};
const PU = () => P_UI[lang];
const Q_ORDER = ["goal","exp","where","days","len","lim"];
const TOTAL = Q_ORDER.length + 1;

let prof = {sex:null, age:"", h:"", w:"", goal:null, exp:null, where:null, days:null, len:null, lim:null};
let pStep = 0;   // 0 = about you, 1..6 = questions, 7 = result
try { const s = JSON.parse(localStorage.getItem("ma-plan")); if (s && typeof s === "object") { prof = {...prof, ...s}; if (complete()) pStep = 7; } } catch(e){}
function save(){ try { localStorage.setItem("ma-plan", JSON.stringify(prof)); } catch(e){} }
function complete(){ return !profErrors().length && Q_ORDER.every(k => prof[k] != null); }
function profErrors(){
  const u = PU(), e = [], a = +prof.age, h = +prof.h, w = +prof.w;
  if (!prof.sex) e.push(u.eSex);
  if (!(a >= 14 && a <= 90)) e.push(u.eAge);
  if (!(h >= 120 && h <= 230)) e.push(u.eH);
  if (!(w >= 30 && w <= 250)) e.push(u.eW);
  return e;
}

// ---------- Plan logic ----------
function splitFor(p){
  const d = +p.days;
  if (d === 2) return ["fbA","fbB"];
  if (d === 3) return (p.exp === "beg" || ["fat","health","endurance"].includes(p.goal)) ? ["fbA","fbB","fbC"] : ["push","pull","legs"];
  if (d === 4) return ["upA","loA","upB","loB"];
  if (d === 5) return ["upA","loA","push","pull","legs"];
  return ["push","pull","legs","push2","pull2","legs2"];
}
function pick(gid, c){
  const pool = G[gid].ex.filter(x => tierOf(x.n) <= c.tier && !c.avoid.has(x.n) && !c.usedDay.has(x.n));
  let cand = pool.filter(x => x.lvl <= c.maxLvl);
  if (!cand.length) cand = pool.filter(x => x.lvl <= c.maxLvl + 1);
  if (!cand.length) return null;
  return cand.map((x,i) => ({x,i})).sort((a,b) =>
    (c.usedPlan.get(a.x.n)||0) - (c.usedPlan.get(b.x.n)||0) ||
    (c.main ? tierOf(b.x.n) - tierOf(a.x.n) : 0) ||
    (c.main ? b.x.int - a.x.int : a.x.int - b.x.int) || a.i - b.i)[0].x;
}
function buildPlan(p){
  const tier = {body:0, home:1, gym:2}[p.where];
  let maxLvl = {beg:1, int:2, adv:3}[p.exp];
  if (+p.age >= 60) maxLvl = Math.min(maxLvl, 2);
  const avoid = new Set((p.lim||[]).flatMap(l => AVOID[l] || []));
  const n = {30:4, 45:5, 60:6, 90:8}[p.len];
  const usedPlan = new Map();
  return splitFor(p).map((key,i) => {
    const usedDay = new Set(), items = [];
    for (const gid of [...TPL[key], ...PAD]){
      if (items.length >= n) break;
      const x = pick(gid, {tier, maxLvl, avoid, usedDay, usedPlan, main: items.length < 2});
      if (!x) continue;
      usedDay.add(x.n); usedPlan.set(x.n, (usedPlan.get(x.n)||0) + 1);
      items.push({gid, x, main: items.length < 2});
    }
    return {key, wd: WEEKDAYS[p.days][i], items};
  });
}
const isTimed = rx => /\d\s*(s|m)\b|round/.test(rx.split("·")[0]);
function rxFor(x, main){
  if (isTimed(x.rx) || (tierOf(x.n) === 0 && (prof.goal === "strength" || x.lvl >= 2))) return xT(x).rx;
  const [sets, rest] = RX[prof.goal][main ? 0 : 1], hr = lang === "hr";
  const reps = x.rx.includes("as many") ? `${sets.split(" × ")[0]} × ${hr ? "max −2" : "max −2"}` : sets;
  return `${reps} · ${hr ? "odmor" : "rest"} ${rest}`;
}
function nutrition(p){
  const h = +p.h, w = +p.w, a = +p.age;
  const bmi = w / ((h/100) ** 2);
  const bmr = 10*w + 6.25*h - 5*a + (p.sex === "m" ? 5 : -161);
  const tdee = bmr * {2:1.375, 3:1.45, 4:1.55, 5:1.6, 6:1.7}[p.days];
  const lowBmi = p.goal === "fat" && bmi < 18.5;
  const adj = lowBmi ? 0 : {fat:-450, muscle:250, strength:150, health:0, endurance:0}[p.goal];
  const pr = {fat:[1.8,2.2], muscle:[1.6,2.2], strength:[1.6,2.0], health:[1.2,1.6], endurance:[1.4,1.8]}[p.goal];
  const r10 = v => Math.round(v/10)*10;
  return {bmi, cat: bmi < 18.5 ? 0 : bmi < 25 ? 1 : bmi < 30 ? 2 : 3, tdee: r10(tdee), kcal: r10(Math.max(tdee + adj, bmr)), lowBmi, prot: [Math.round(pr[0]*w), Math.round(pr[1]*w)]};
}

// ---------- Rendering ----------
const planEl = document.getElementById("planView");
function header(i){
  return `<div class="progress" aria-hidden="true"><i style="width:${Math.round(i/TOTAL*100)}%"></i></div><p class="q-count">${PU().step(i,TOTAL)}</p>`;
}
function renderAbout(){
  const u = PU();
  return `<div class="quiz">${header(1)}
   <h2 class="q-title">${u.aboutT}</h2><p class="q-sub">${u.aboutS}</p>
   <div><p class="flabel">${u.sex}</p><div class="opts row" style="margin-top:6px">
     ${["m","f"].map(s=>`<button class="opt" data-sex="${s}" aria-pressed="${prof.sex===s}"><b>${u[s]}</b></button>`).join("")}
   </div></div>
   <div class="fields">
     <div class="field"><label for="p-age">${u.age}</label><input id="p-age" type="number" inputmode="numeric" min="14" max="90" value="${esc(prof.age)}"></div>
     <div class="field"><label for="p-h">${u.h}</label><input id="p-h" type="number" inputmode="numeric" min="120" max="230" value="${esc(prof.h)}"></div>
     <div class="field"><label for="p-w">${u.w}</label><input id="p-w" type="number" inputmode="decimal" min="30" max="250" step="0.1" value="${esc(prof.w)}"></div>
   </div>
   <p class="err" id="p-err" role="alert"></p>
   <div class="q-nav"><span></span><button class="btn primary" data-act="about-next">${u.next}</button></div>
  </div>`;
}
function renderQ(i){
  const u = PU(), key = Q_ORDER[i-1], q = u.q[key], multi = key === "lim";
  const val = prof[key];
  const opts = Object.entries(q.o).map(([k,[t,d]]) => {
    const on = multi ? (val||[]).includes(k) || (k==="none" && Array.isArray(val) && !val.length) : String(val) === k;
    return `<button class="opt" data-q="${key}" data-v="${k}" aria-pressed="${on}"><b>${t}</b>${d?`<span>${d}</span>`:""}</button>`;
  }).join("");
  return `<div class="quiz">${header(i+1)}
   <h2 class="q-title">${q.t}</h2>${q.s?`<p class="q-sub">${q.s}</p>`:""}
   <div class="opts${key==="days"||key==="len"?" row":""}">${opts}</div>
   <div class="q-nav"><button class="btn" data-act="back">${u.back}</button>
   ${multi?`<button class="btn primary" data-act="finish" ${val==null?"disabled":""}>${u.build}</button>`:""}</div>
  </div>`;
}
function renderResult(){
  const u = PU(), p = prof, plan = buildPlan(p), nu = nutrition(p);
  const chips = [u.q.goal.o[p.goal][0], u.q.exp.o[p.exp][0], u.q.where.o[p.where][0], u.q.days.o[p.days][0], u.q.len.o[p.len][0]];
  const week = u.wdShort.map((d,i) => { const day = plan.find(x => x.wd === i);
    return `<div class="wd ${day?"on":"off"}"><b>${d}</b><span>${day ? esc(u.titles[day.key]) : u.rest}</span></div>`; }).join("");
  const days = plan.map((d,i) => `<section class="day">
     <div><p class="eyebrow">${u.day(i+1)} · ${u.wdLong[d.wd]}</p><h3>${esc(u.titles[d.key])}</h3></div>
     <ol>${d.items.map(it => `<li>
       <button class="xbtn" data-open="${it.gid}" data-ex="${esc(it.x.n)}">${esc(xT(it.x).n)}</button>
       <span class="xm">${esc(gT(it.gid).name)} · <span class="lvl-${it.x.lvl}">${U().lvl[it.x.lvl]}</span></span>
       <span class="xrx">${esc(rxFor(it.x, it.main))}</span></li>`).join("")}</ol>
   </section>`).join("");
  const tips = [u.tips.warm, u.tips.prog, p.where==="body" && u.tips.body, p.exp==="beg" && u.tips.beg, p.exp!=="beg" && u.tips.deload,
    (p.goal==="fat"||p.goal==="endurance") && u.tips.fatX, plan.some(d => d.items.some(it => it.x.rx.includes("as many"))) && p.goal!=="strength" && u.tips.amrap, u.tips.sleep, +p.age>=60 && u.tips.old, +p.age<18 && u.tips.young].filter(Boolean);
  return `<div class="res-head"><div><p class="eyebrow">${u[p.sex]} · ${+p.age} · ${+p.h} cm · ${+p.w} kg</p><h2>${u.resT}</h2>
     <div class="chips-row">${chips.map(c=>`<span class="tag">${esc(c)}</span>`).join("")}</div></div>
     <div class="q-nav"><button class="btn" data-act="edit">${u.edit}</button><button class="btn" data-act="restart">${u.restart}</button></div></div>
   <div class="stats">
     <div class="stat"><span class="k">${u.bmi}</span><span class="v">${nu.bmi.toFixed(1)}</span><span class="s">${u.bmiCat[nu.cat]}. ${u.bmiNote}</span></div>
     <div class="stat"><span class="k">${u.kcal}</span><span class="v">≈ ${nu.kcal} kcal</span><span class="s">${u.kcalS[nu.lowBmi?"lowBmi":p.goal](nu.tdee)}</span></div>
     <div class="stat"><span class="k">${u.protein}</span><span class="v">${nu.prot[0]}–${nu.prot[1]} g</span><span class="s">${u.protS}</span></div>
     <div class="stat"><span class="k">${u.cardio}</span><span class="s" style="color:var(--fg);font-size:14px">${u.cardioT[p.goal]}</span></div>
   </div>
   <div><h3 class="sec-title">${u.week}</h3><div class="week">${week}</div></div>
   <p class="legend">${u.openHint}</p>
   <div class="days">${days}</div>
   <div class="tips"><h3 class="sec-title">${u.tipsT}</h3><ul>${tips.map(t=>`<li>${t}</li>`).join("")}</ul></div>
   <p class="legend">${u.disclaimer}</p>`;
}
function renderPlan(){
  planEl.innerHTML = pStep === 0 ? renderAbout() : pStep === 7 ? renderResult() : renderQ(pStep);
}
function go(s){ pStep = s; renderPlan(); planEl.scrollIntoView({block:"start"}); const f = planEl.querySelector(".opt[aria-pressed=true], .opt, input"); if (f && s>0 && s<7) f.focus({preventScroll:true}); }

planEl.addEventListener("input", e => {
  const id = e.target.id; if (id === "p-age") prof.age = e.target.value; if (id === "p-h") prof.h = e.target.value; if (id === "p-w") prof.w = e.target.value;
});
planEl.addEventListener("click", e => {
  const sx = e.target.closest("[data-sex]");
  if (sx){ prof.sex = sx.dataset.sex; planEl.querySelectorAll("[data-sex]").forEach(b => b.setAttribute("aria-pressed", b===sx)); return; }
  const o = e.target.closest("[data-q]");
  if (o){
    const k = o.dataset.q, v = o.dataset.v;
    if (k === "lim"){
      let cur = Array.isArray(prof.lim) ? prof.lim : [];
      prof.lim = v === "none" ? [] : (cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
      save(); renderPlan(); return;
    }
    prof[k] = k === "days" || k === "len" ? +v : v; save(); go(pStep + 1); return;
  }
  const op = e.target.closest("[data-open]");
  if (op){
    showTab("map"); select(op.dataset.open, null, false);
    const det = [...document.querySelectorAll("details.ex")].find(d => d.dataset.ex === op.dataset.ex);
    document.querySelectorAll("details.ex").forEach(d => d.open = d === det);
    (det || document.getElementById("sheet")).scrollIntoView({block:"start"});
    return;
  }
  const a = e.target.closest("[data-act]"); if (!a) return;
  const act = a.dataset.act;
  if (act === "about-next"){ const errs = profErrors(); document.getElementById("p-err").textContent = errs.join(" "); if (!errs.length){ save(); go(1); } }
  if (act === "back") go(pStep - 1);
  if (act === "finish"){ save(); go(7); }
  if (act === "edit") go(0);
  if (act === "restart"){ prof = {sex:null, age:"", h:"", w:"", goal:null, exp:null, where:null, days:null, len:null, lim:null}; try { localStorage.removeItem("ma-plan"); } catch(e){} go(0); }
});

// ---------- Tabs ----------
function showTab(t){
  document.getElementById("mapView").hidden = t !== "map";
  planEl.hidden = t !== "plan";
  document.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  if (t === "plan"){ renderPlan(); try { history.replaceState(null,"","#plan"); } catch(e){} }
  else if (current) { try { history.replaceState(null,"","#"+current+(currentPart ? "/"+currentPart : "")); } catch(e){} }
}
document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
function renderTabs(){ const u = PU(); document.getElementById("tab-map").textContent = u.tabMap; document.getElementById("tab-plan").textContent = u.tabPlan; }
window.onLang = () => { renderTabs(); if (!planEl.hidden) renderPlan(); };
renderTabs();
showTab(window.START_HASH === "#plan" ? "plan" : "map");
