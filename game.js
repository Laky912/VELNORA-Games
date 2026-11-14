(() => {
"use strict";
const $=id=>document.getElementById(id),canvas=$("game"),ctx=canvas.getContext("2d");
const SAVE="velnora-mining-empire-v1",OLD=["velnora-mining-empire-v02","velnora-mining-empire-v01"];
const W=15,H=13,ORE=["coal","copper","iron","gold","crystal"],PRICES={coal:5,copper:12,iron:20,gold:55,crystal:110};
const REGIONS=[
{name:"Mina abandonada",short:"MINA ABANDONADA",unlock:0,desc:"Los primeros túneles de la antigua compañía.",ores:["coal","copper","iron"],color:["#344b56","#1b303b"],chance:[.27,.15,.08]},
{name:"Galerías profundas",short:"GALERÍAS PROFUNDAS",unlock:900,desc:"El hierro abunda y aparecen vetas de oro.",ores:["coal","copper","iron","gold"],color:["#3e4652","#242b38"],chance:[.2,.16,.16,.08]},
{name:"Caverna cristalina",short:"CAVERNA CRISTALINA",unlock:2600,desc:"Una red de cristales ilumina las paredes.",ores:["copper","iron","gold","crystal"],color:["#31515a","#1b3542"],chance:[.12,.18,.14,.13]},
{name:"Cuenca volcánica",short:"CUENCA VOLCÁNICA",unlock:6500,desc:"Calor extremo, minerales raros y grandes riesgos.",ores:["coal","iron","gold","crystal"],color:["#593d39","#30232c"],chance:[.13,.2,.17,.12]},
{name:"Abismo congelado",short:"ABISMO CONGELADO",unlock:14000,desc:"Bajo el hielo duerme una energía desconocida.",ores:["iron","gold","crystal"],color:["#35556b","#1c354b"],chance:[.19,.2,.18]},
{name:"Núcleo antiguo",short:"NÚCLEO ANTIGUO",unlock:30000,desc:"El corazón de la mina y el secreto de la compañía.",ores:["gold","crystal"],color:["#51456b","#282440"],chance:[.24,.28]}
];
const MISSIONS=[
{title:"Un nuevo comienzo",text:"Extrae 5 bloques para demostrar que la mina aún tiene futuro.",goal:s=>s.mined>=5,progress:s=>Math.min(5,s.mined)+ " / 5 bloques",reward:100},
{title:"Primeros ingresos",text:"Vende minerales por un total acumulado de ¢100.",goal:s=>s.sold>=100,progress:s=>"¢"+Math.min(100,s.sold)+" / ¢100 vendidos",reward:180},
{title:"Herramientas profesionales",text:"Mejora tu pico hasta el nivel 2.",goal:s=>s.pickaxe>=2,progress:s=>"Nivel "+s.pickaxe+" / 2",reward:250},
{title:"Hacia las profundidades",text:"Desbloquea las Galerías profundas.",goal:s=>s.region>=1,progress:s=>s.region>=1?"Región desbloqueada":"Requiere desbloquear región 2",reward:400},
{title:"Producción automatizada",text:"Instala tu primera máquina de extracción.",goal:s=>s.machines.drill>=1,progress:s=>s.machines.drill+" / 1 taladro",reward:650},
{title:"Riquezas ocultas",text:"Extrae 10 unidades de oro.",goal:s=>s.lifetime.gold>=10,progress:s=>Math.min(10,s.lifetime.gold)+" / 10 oro",reward:1000},
{title:"Luz en la oscuridad",text:"Consigue 10 cristales en la Caverna cristalina.",goal:s=>s.lifetime.crystal>=10,progress:s=>Math.min(10,s.lifetime.crystal)+" / 10 cristales",reward:1800},
{title:"El corazón de la mina",text:"Llega al Núcleo antiguo y extrae su cristal central.",goal:s=>s.coreFound,progress:s=>s.coreFound?"Núcleo descubierto":"Explora la última región",reward:10000}
];
const defaultState=()=>({money:250,energy:100,region:0,coal:0,copper:0,iron:0,gold:0,crystal:0,capacity:35,pickaxe:1,mined:0,sold:0,xp:0,level:1,mission:0,coreFound:false,drillTick:0,machines:{drill:0,worker:0,generator:0},lifetime:{coal:0,copper:0,iron:0,gold:0,crystal:0},achievements:[],unlocked:[],player:{x:7,y:5},seenIntro:false});
function load(){try{let s=JSON.parse(localStorage.getItem(SAVE));if(!s)for(const k of OLD){s=JSON.parse(localStorage.getItem(k));if(s)break}return s||defaultState()}catch{return defaultState()}}
let state={...defaultState(),...load()};state.machines={...defaultState().machines,...(state.machines||{})};state.lifetime={...defaultState().lifetime,...(state.lifetime||{})};state.achievements=state.achievements||[];state.unlocked=state.unlocked||[];
const defaultKeys={up:"w",down:"s",left:"a",right:"d"};let keys={...defaultKeys,...safeJSON(SAVE+"-keys",defaultKeys)};
function safeJSON(k,f){try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}}
const mineScene=new Image();mineScene.src="assets/mine-abandoned.svg";mineScene.onload=()=>draw();
let tiles=[],player={x:state.player?.x??7,y:state.player?.y??5},selected=null,binding=null,toastTimer=null,animation=0,lastTick=Date.now(),tileW=40,tileH=20,originX=0,originY=0;
function save(){state.player=player;try{localStorage.setItem(SAVE,JSON.stringify(state));localStorage.setItem(SAVE+"-keys",JSON.stringify(keys));localStorage.setItem(SAVE+"-tiles-v2",JSON.stringify(tiles))}catch(e){notify("No se pudo guardar: almacenamiento lleno.")}}
function notify(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2100)}
function total(){return ORE.reduce((n,k)=>n+state[k],0)}
function addXP(n){state.xp+=n;while(state.xp>=state.level*100){state.xp-=state.level*100;state.level++;state.energy=100;notify("¡Nivel de operario "+state.level+"! + energía")} }
function updateHud(){
for(const k of ["money",...ORE])$(k).textContent=state[k].toLocaleString("es");
for(const k of ORE)$("inv"+k[0].toUpperCase()+k.slice(1)).textContent=state[k].toLocaleString("es");
$("energyText").textContent=Math.floor(state.energy)+" / 100";$("energyBar").style.width=state.energy+"%";$("xpText").textContent=state.xp+" / "+state.level*100+" XP";$("xpBar").style.width=(state.xp/(state.level*100)*100)+"%";
$("capacityText").textContent=total()+" / "+state.capacity;$("depth").textContent="NIVEL "+String(state.region+1).padStart(2,"0");$("sectorName").textContent="SECTOR "+String(state.region+1).padStart(2,"0")+" / "+REGIONS[state.region].short;
$("workerRank").textContent=(state.level<3?"NOVATO":state.level<6?"EXPERTO":"MAESTRO")+" · NIVEL "+state.level;
$("machineCount").textContent=Object.values(state.machines).reduce((a,b)=>a+b,0);$("achievementCount").textContent=state.achievements.length+"/8";
const m=MISSIONS[Math.min(state.mission,MISSIONS.length-1)];$("missionTitle").textContent=m.title;$("missionText").textContent=m.text;$("missionCount").textContent=m.progress(state);$("missionProgress").style.width=(m.goal(state)?100:Math.min(95,missionRatio()))+"%";
$("hint").textContent="MOVER: WASD / FLECHAS · CLIC EN MINERAL: ACERCARSE Y EXCAVAR · E: EXPEDICIONES · ALMACÉN "+total()+"/"+state.capacity;
}
function missionRatio(){const s=state;if(s.mission===0)return Math.min(100,s.mined/5*100);if(s.mission===1)return Math.min(100,s.sold);if(s.mission===2)return Math.min(100,s.pickaxe/2*100);if(s.mission===3)return s.region?100:0;if(s.mission===4)return s.machines.drill?100:0;if(s.mission===5)return Math.min(100,s.lifetime.gold*10);if(s.mission===6)return Math.min(100,s.lifetime.crystal*10);return s.coreFound?100:0}
function checkMission(){while(state.mission<MISSIONS.length&&MISSIONS[state.mission].goal(state)){const m=MISSIONS[state.mission];state.money+=m.reward;state.mission++;notify("Objetivo completado: +¢"+m.reward);if(state.mission>=MISSIONS.length){notify("¡Campaña principal completada! Tu imperio ya tiene historia.")} }}
function checkAchievements(){const tests=[["Primeros pasos",state.mined>=1],["Pico trabajador",state.mined>=50],["Pequeña fortuna",state.sold>=1000],["Empresario",state.money>=5000],["Automatización",state.machines.drill>=1],["Coleccionista",ORE.every(k=>state.lifetime[k]>=20)],["Explorador",state.region>=3],["Al núcleo",state.coreFound]];for(const [name,ok] of tests)if(ok&&!state.achievements.includes(name)){state.achievements.push(name);state.money+=100;notify("Logro: "+name+" · +¢100")}}
function makeTiles(){const old=safeJSON(SAVE+"-tiles-v2",null);if(old&&old.length===W*H&&state._tilesRegion===state.region){tiles=old;return}tiles=[];const reg=REGIONS[state.region];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const edge=x===0||y===0||x===W-1||y===H-1;const path=(y===6&&x>=1&&x<=13)||(x===7&&y>=2&&y<=10)||((x+y)%7===0&&x>2&&x<12&&y>2&&y<10);let type="empty";if(edge)type="wall";else if(!path&&Math.random()<.32){const r=Math.random(),sum=reg.chance.reduce((a,b)=>a+b,0);if(r<sum){let n=r;for(let i=0;i<reg.ores.length;i++){n-=reg.chance[i];if(n<=0){type=reg.ores[i];break}}}else type="stone"}tiles.push({x,y,type,hp:type==="stone"?2:type==="coal"?2:type==="copper"?3:type==="iron"?4:5,removed:type==="empty"||type==="wall"})}
for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const t=tiles[y*W+x];if(t.type==="empty"&&Math.random()<.055){const ore=reg.ores[Math.floor(Math.random()*reg.ores.length)];t.type=ore;t.hp=ore==="coal"?2:ore==="copper"?3:ore==="iron"?4:5;t.removed=false}}
if(state.region===5){const t=tiles[6*W+7];t.type="crystal";t.hp=18;t.core=true;t.removed=false}
state._tilesRegion=state.region;player={x:7,y:5};save()}
function tileAt(x,y){return tiles[y*W+x]}
function iso(x,y){return{x:originX+(x-y)*tileW/2,y:originY+(x+y)*tileH/2}}
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function diamond(x,y,fill,stroke){poly([{x,y:y-tileH/2},{x:x+tileW/2,y},{x,y:y+tileH/2},{x:x-tileW/2,y}],fill,stroke)}
function drawRock(p,type,scale=1){
const palettes={stone:["#596b70","#aab4b4","#34474c"],coal:["#27333a","#879397","#111d24"],copper:["#8c4d35","#f2b27b","#512d25"],iron:["#687d88","#dce5e6","#3d515b"],gold:["#a07830","#ffe79a","#5c421e"],crystal:["#287789","#c2ffff","#123d50"]};
const c=palettes[type]||palettes.stone;
ctx.save();ctx.translate(p.x,p.y-5);ctx.scale(scale,scale);
ctx.fillStyle="#10191b88";ctx.beginPath();ctx.ellipse(0,5,18,7,0,0,Math.PI*2);ctx.fill();
poly([{x:-18,y:0},{x:-15,y:-10},{x:-8,y:-17},{x:-3,y:-24},{x:7,y:-21},{x:15,y:-13},{x:18,y:-3},{x:13,y:5},{x:1,y:9},{x:-11,y:7}],c[0],"#202d32");
poly([{x:-15,y:-10},{x:-8,y:-17},{x:-3,y:-24},{x:7,y:-21},{x:2,y:-10},{x:-7,y:-5}],c[1]);
poly([{x:2,y:-10},{x:7,y:-21},{x:15,y:-13},{x:18,y:-3},{x:13,y:5},{x:1,y:9},{x:-1,y:-2}],c[2]);
poly([{x:-15,y:-10},{x:-7,y:-5},{x:-11,y:7},{x:-18,y:0}],type==="stone"?"#46585d":c[0]);
if(type==="coal"){ctx.fillStyle="#aab6b8";ctx.globalAlpha=.72;for(const q of [[-8,-11,2.5],[3,-7,3.5],[8,0,2],[-2,2,2]]){ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,Math.PI*2);ctx.fill()}}
else if(type==="crystal"){poly([{x:-10,y:1},{x:-8,y:-14},{x:-3,y:-29},{x:1,y:-10}],"#65cbd1","#d6ffff");poly([{x:-1,y:4},{x:3,y:-17},{x:9,y:-25},{x:11,y:0}],"#2d8799","#aafaff");poly([{x:4,y:2},{x:12,y:-11},{x:17,y:-15},{x:15,y:3}],"#1b5c72","#8be9ef")}
else if(type!=="stone"){ctx.strokeStyle=type==="gold"?"#fff0b0":type==="copper"?"#ffd0a3":"#edf6f8";ctx.lineWidth=2;ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(-9,-9);ctx.lineTo(-4,-16);ctx.moveTo(2,-3);ctx.lineTo(8,-11);ctx.stroke();ctx.fillStyle=c[1];ctx.beginPath();ctx.arc(-5,-5,2.7,0,Math.PI*2);ctx.arc(8,-1,2,0,Math.PI*2);ctx.fill()}
ctx.restore();
}
function draw(){const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);if(mineScene.complete&&mineScene.naturalWidth){ctx.drawImage(mineScene,0,0,r.width,r.height)}else{const bg=ctx.createLinearGradient(0,0,0,r.height);bg.addColorStop(0,"#8a7048");bg.addColorStop(1,"#293b3e");ctx.fillStyle=bg;ctx.fillRect(0,0,r.width,r.height)}
const regionAtmosphere=["#b77a3a","#536b83","#2a9ca5","#d75b36","#72b8e4","#8871c7"];
ctx.save();ctx.globalAlpha=.13;ctx.fillStyle=regionAtmosphere[state.region]||regionAtmosphere[0];ctx.fillRect(0,0,r.width,r.height);ctx.restore();
const ambient=ctx.createRadialGradient(r.width*.5,r.height*.42,20,r.width*.5,r.height*.42,r.width*.68);ambient.addColorStop(0,"#fff0c0");ambient.addColorStop(1,"#00000000");ctx.fillStyle=ambient;ctx.fillRect(0,0,r.width,r.height);
// Ore deposits are placed as natural outcrops over the illustrated cave floor, not as a solid block grid.
for(let sum=0;sum<W+H-1;sum++)for(let y=0;y<H;y++){const x=sum-y;if(x<0||x>=W)continue;const t=tileAt(x,y),p=iso(x,y);if(t.removed||t.type==="empty"||t.type==="wall")continue;ctx.save();ctx.translate(p.x,p.y+((x+y)%2)*2);if(t.type==="stone"){drawRock(p,t.type,.68)}else{drawRock(p,t.type,.86);if(t.type==="gold"||t.type==="crystal"){ctx.globalAlpha=.25;ctx.fillStyle=t.type==="gold"?"#ffe18a":"#8ffaff";ctx.beginPath();ctx.ellipse(0,0,17,8,0,0,Math.PI*2);ctx.fill()}}ctx.restore();if(selected&&selected.x===x&&selected.y===y){ctx.strokeStyle="#fff0b4";ctx.lineWidth=2;diamond(p.x,p.y,"#ffffff10","#ffe09a")}}
if(state.machines.drill){const p=iso(2,2);for(let i=0;i<state.machines.drill;i++){const ox=i*24;ctx.fillStyle="#26333b";ctx.fillRect(p.x-13+ox,p.y-27,25,27);ctx.fillStyle="#d5a34e";ctx.fillRect(p.x-8+ox,p.y-34,16,8);ctx.fillStyle="#8da0a9";ctx.fillRect(p.x-3+ox,p.y-45,6,12)}}
if(state.machines.generator){const p=iso(11,2);ctx.fillStyle="#26333b";ctx.fillRect(p.x-12,p.y-25,24,25);ctx.fillStyle="#78c7a0";ctx.fillRect(p.x-7,p.y-34,14,10);ctx.fillStyle="#f5d47a";ctx.fillRect(p.x+11,p.y-20,4,4)}
const p=iso(player.x,player.y);
drawMiner(p);
ctx.fillStyle="#fff0c0cc";ctx.font="9px monospace";ctx.fillText("VELNORA MINING CO.",13,20)}
function drawMiner(p){
const moving=walking,phase=moving?Math.sin(Date.now()/72):0,bob=moving?Math.abs(phase)*2:Math.sin(Date.now()/650)*.6;
const fx=facing==="left"?-1:facing==="right"?1:1,lean=facing==="up"?-1:facing==="down"?1:0;
ctx.save();ctx.translate(p.x,p.y+bob);
ctx.fillStyle="#07111699";ctx.beginPath();ctx.ellipse(0,5,15,7,0,0,Math.PI*2);ctx.fill();
// boots and animated legs
ctx.save();ctx.translate(0,-5);
const stride=moving?phase*3:0;
ctx.fillStyle="#26333a";ctx.fillRect(-7+stride,-1,6,9);ctx.fillRect(2-stride,-1,6,9);
ctx.fillStyle="#9b7046";ctx.fillRect(-9+stride,6,8,4);ctx.fillRect(1-stride,6,8,4);
ctx.restore();
// durable work trousers and jacket
poly([{x:-9,y:-20},{x:9,y:-20},{x:8,y:-7},{x:6,y:1},{x:-6,y:1},{x:-8,y:-7}],"#344c58","#182b34");
poly([{x:-9,y:-19},{x:0,y:-16},{x:0,y:-3},{x:-7,y:-4}],"#496674");
ctx.fillStyle="#d5a64f";ctx.fillRect(-7,-16,14,3);ctx.fillStyle="#d7e0dc";ctx.fillRect(-2,-15,4,4);
ctx.fillStyle="#b9794f";ctx.beginPath();ctx.arc(0,-27,7.5,0,Math.PI*2);ctx.fill();
ctx.fillStyle="#5b3928";ctx.fillRect(-7,-29,14,5);
ctx.fillStyle="#e0ad4e";ctx.beginPath();ctx.ellipse(0,-33,11,6,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-11,-34,22,4);
ctx.fillStyle="#263943";ctx.fillRect(-8,-33,16,3);ctx.fillStyle="#f9dc91";ctx.fillRect(4,-35,5,3);
ctx.shadowColor="#ffd878";ctx.shadowBlur=9;ctx.fillStyle="#fff0ae";ctx.beginPath();ctx.arc(7,-34,2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
// arms, gloves and pickaxe follow facing direction
const armSwing=moving?phase*2:Math.sin(Date.now()/500)*.6;
ctx.strokeStyle="#b9794f";ctx.lineWidth=5;ctx.lineCap="round";
ctx.beginPath();ctx.moveTo(-7,-17);ctx.lineTo(-11-armSwing,-8);ctx.stroke();
ctx.fillStyle="#55402f";ctx.beginPath();ctx.arc(-11-armSwing,-8,3,0,Math.PI*2);ctx.fill();
ctx.strokeStyle="#b9794f";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(7,-17);ctx.lineTo(11+armSwing,-10);ctx.stroke();
ctx.strokeStyle="#805a36";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(10+armSwing,-10);ctx.lineTo(18+fx*2,-25);ctx.stroke();
ctx.strokeStyle="#d8e1e2";ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(13+fx*2,-26);ctx.lineTo(24+fx*2,-30);ctx.stroke();
ctx.beginPath();ctx.moveTo(13+fx*2,-26);ctx.lineTo(8+fx*2,-21);ctx.stroke();
ctx.fillStyle="#fff4cf";ctx.font="bold 9px monospace";ctx.textAlign="center";ctx.fillText("MINERO",0,-48);ctx.textAlign="left";
ctx.restore();
}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);tileW=Math.min(48,Math.max(27,r.width/(W+3)));tileH=tileW*.5;originX=r.width/2;originY=Math.max(100,r.height*.19);draw()}
function move(dx,dy){if(autoWalking)return;const nx=Math.max(1,Math.min(W-2,player.x+dx)),ny=Math.max(1,Math.min(H-2,player.y+dy));if(nx===player.x&&ny===player.y)return;const target=tileAt(nx,ny);if(!target||target.type==="wall"){notify("Ese túnel está bloqueado.");return}facing=dx<0?"left":dx>0?"right":dy<0?"up":"down";player.x=nx;player.y=ny;walking=true;draw();save();clearTimeout(walkStopTimer);walkStopTimer=setTimeout(()=>{walking=false;draw()},170)}
function mine(x,y,auto=false){const t=tileAt(x,y);if(!t||t.removed)return;if(!auto&&Math.abs(x-player.x)+Math.abs(y-player.y)>1){notify("Acércate al bloque para excavar.");return}if(state.energy<1&&!auto){notify("Sin energía. Espera o instala un generador.");return}if(total()>=state.capacity){notify("Almacén lleno. Vende recursos o amplíalo.");return}t.hp-=auto?1:state.pickaxe;if(!auto)state.energy=Math.max(0,state.energy-3);if(t.hp<=0){t.removed=true;if(t.type!=="stone"){state[t.type]++;state.lifetime[t.type]++;notify("+"+1+" "+t.type.toUpperCase())}else{state.coal++;state.lifetime.coal++;notify("+1 CARBÓN")}state.mined++;addXP(t.type==="gold"?12:t.type==="crystal"?18:5);if(t.core){state.coreFound=true;notify("¡Has encontrado el núcleo original!")}checkMission();checkAchievements()}else if(!auto)notify("Piedra dañada · "+Math.max(0,t.hp)+" resistencia");updateHud();save();draw()}
function canvasPos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function pickTile(pos){let best=null,d0=Infinity;for(const t of tiles){if(t.removed)continue;const p=iso(t.x,t.y),d=Math.abs(pos.x-p.x)/(tileW/2)+Math.abs(pos.y-p.y)/(tileH/2);if(d<1&&d<d0){best=t;d0=d}}return best}
canvas.addEventListener("pointerdown",e=>{const t=pickTile(canvasPos(e));if(t){selected={x:t.x,y:t.y};approachAndMine(t)}else{selected=null;draw()}});
let autoWalking=false,walking=false,facing="down",walkStopTimer=null;
function approachAndMine(target){
if(autoWalking)return;
const tx=target.x,ty=target.y;
if(Math.abs(tx-player.x)+Math.abs(ty-player.y)<=1){mine(tx,ty);return}
const queue=[[player.x,player.y]],parents=new Map(),seen=new Set([player.x+","+player.y]);
let goal=null;
for(let qi=0;qi<queue.length&&!goal;qi++){
const [x,y]=queue[qi];
if(Math.abs(tx-x)+Math.abs(ty-y)<=1){goal=[x,y];break}
for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
const nx=x+dx,ny=y+dy,key=nx+","+ny;
if(nx<1||ny<1||nx>W-2||ny>H-2||seen.has(key))continue;
const cell=tileAt(nx,ny);if(!cell||cell.type==="wall")continue;
seen.add(key);parents.set(key,[x,y]);queue.push([nx,ny]);
}
}
if(!goal){notify("No hay un camino libre hasta ese mineral.");return}
const path=[];let cur=goal;
while(cur[0]!==player.x||cur[1]!==player.y){path.unshift(cur);cur=parents.get(cur[0]+","+cur[1]);if(!cur)break}
autoWalking=true;
const step=()=>{if(!path.length){autoWalking=false;walking=false;save();draw();mine(tx,ty);return}
const [nx,ny]=path.shift(),dx=nx-player.x,dy=ny-player.y;
facing=Math.abs(dx)>Math.abs(dy)?(dx<0?"left":"right"):(dy<0?"up":"down");
player.x=nx;player.y=ny;walking=true;draw();save();setTimeout(step,125)};
step();
}
function moveByAction(a){const d={up:[-1,-1],down:[1,1],left:[-1,1],right:[1,-1]}[a];if(d)move(...d)}
function actionFor(k){if(k==="arrowup")return"up";if(k==="arrowdown")return"down";if(k==="arrowleft")return"left";if(k==="arrowright")return"right";return Object.keys(keys).find(a=>keys[a]===k)}
window.addEventListener("keydown",e=>{if(binding){if(e.key.length===1||e.key.startsWith("Arrow")){keys[binding]=e.key.toLowerCase();binding=null;document.querySelectorAll(".key-bind").forEach(b=>b.classList.remove("listening"));renderKeys();save()}return}const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();if(["i"].includes(k)){openModule("inventory");return}if(k==="e"){interact();return}if(k==="escape"){if($("moduleDialog").open)$("moduleDialog").close();else if($("settings").open)$("settings").close();return}const a=actionFor(k);if(a)moveByAction(a)});
document.querySelectorAll("[data-move]").forEach(b=>{const run=()=>moveByAction(b.dataset.move);b.addEventListener("pointerdown",e=>{e.preventDefault();run()})});
function sell(){const amount=ORE.reduce((n,k)=>n+state[k]*PRICES[k],0);if(!amount){notify("No tienes minerales para vender.");return}state.money+=amount;state.sold+=amount;for(const k of ORE)state[k]=0;addXP(Math.floor(amount/10));notify("Venta completada: +¢"+amount.toLocaleString("es"));checkMission();checkAchievements();updateHud();save()}
$("sellBtn").addEventListener("click",sell);$("saveBtn").addEventListener("click",()=>{save();notify("Partida guardada.")});$("settingsBtn").addEventListener("click",()=>$("settings").showModal());
document.querySelectorAll(".key-bind").forEach(b=>b.addEventListener("click",()=>{binding=b.dataset.action;b.classList.add("listening");b.textContent="PULSA…"}));
function renderKeys(){for(const a of ["up","down","left","right"])$("key"+a[0].toUpperCase()+a.slice(1)).textContent=keys[a].toUpperCase()}
$("resetKeys").addEventListener("click",()=>{keys={...defaultKeys};renderKeys();save();notify("Controles restaurados.")});
$("resetSave").addEventListener("click",()=>{if(!confirm("¿Borrar toda la partida y comenzar desde cero?"))return;localStorage.removeItem(SAVE);localStorage.removeItem(SAVE+"-tiles-v2");localStorage.removeItem(SAVE+"-keys");for(const k of OLD){localStorage.removeItem(k);localStorage.removeItem(k+"-tiles");localStorage.removeItem(k+"-keys")}location.reload()});
const dlg=$("moduleDialog");
function addOption(title,detail,cost,action,disabled=false,tag=""){const b=document.createElement("button");b.className="module-option";b.disabled=disabled;b.innerHTML='<span><b>'+title+'</b><small>'+detail+(tag?" · "+tag:"")+'</small></span><strong>'+(cost===0?"GESTIONAR":"¢"+cost.toLocaleString("es"))+'</strong>';b.addEventListener("click",action);$("moduleOptions").appendChild(b)}
function buy(cost,fn){if(state.money<cost){notify("No tienes suficiente capital.");return false}state.money-=cost;fn();checkMission();checkAchievements();updateHud();save();return true}
function openModule(tab){const list=$("moduleOptions");list.innerHTML="";const title=$("moduleTitle"),desc=$("moduleDescription");
if(tab==="upgrades"){title.textContent="Mejoras";desc.textContent="Invierte en tecnología para excavar más rápido y ampliar la capacidad de tu empresa.";
addOption("Pico industrial · Nivel "+state.pickaxe,"Aumenta el daño de cada golpe. Máximo nivel 8.",180*state.pickaxe,()=>{if(buy(180*state.pickaxe,()=>{state.pickaxe++;notify("Pico mejorado al nivel "+state.pickaxe)}))openModule(tab)},state.pickaxe>=8);
addOption("Almacén reforzado · "+state.capacity+" espacios","Añade 25 espacios de inventario. Máximo 160.",220,()=>{if(buy(220,()=>{state.capacity+=25;notify("Almacén ampliado.")}))openModule(tab)},state.capacity>=160);
addOption("Traje de energía","Aumenta la recuperación de energía un 50%.",850,()=>{if(state.energyRate)return notify("Ya tienes este traje.");if(buy(850,()=>{state.energyRate=1;notify("Traje de energía instalado.")}))openModule(tab)},!!state.energyRate);
addOption("Capacitación avanzada","Gana experiencia extra por cada bloque extraído.",1200,()=>{if(state.xpBoost)return notify("Ya tienes capacitación.");if(buy(1200,()=>{state.xpBoost=true;notify("Capacitación completada.")}))openModule(tab)},!!state.xpBoost)}
else if(tab==="build"){title.textContent="Fábrica y automatización";desc.textContent="Construye instalaciones que trabajan mientras tú exploras. Cada taladro extrae recursos de forma automática.";
addOption("Taladro automático · "+state.machines.drill,"Extrae un bloque de la mina cada 9 segundos.",650+state.machines.drill*450,()=>{const c=650+state.machines.drill*450;if(buy(c,()=>{state.machines.drill++;notify("Taladro instalado.")}))openModule(tab)},state.machines.drill>=4);
addOption("Generador · "+state.machines.generator,"Recupera energía adicional cada pocos segundos.",900+state.machines.generator*600,()=>{const c=900+state.machines.generator*600;if(buy(c,()=>{state.machines.generator++;notify("Generador conectado.")}))openModule(tab)},state.machines.generator>=3);
addOption("Contratar trabajador · "+state.machines.worker,"Cada trabajador produce monedas periódicamente.",1200+state.machines.worker*900,()=>{const c=1200+state.machines.worker*900;if(buy(c,()=>{state.machines.worker++;notify("Nuevo trabajador contratado.")}))openModule(tab)},state.machines.worker>=5);
addOption("Vender inventario","Convierte todos tus minerales en capital.",0,()=>{sell();openModule(tab)})}
else if(tab==="regions"){title.textContent="Expediciones";desc.textContent="Desciende a nuevas zonas. Cada región contiene minerales más valiosos y desafíos mayores.";
REGIONS.forEach((r,i)=>{const unlocked=i<=state.region||state.unlocked.includes(i),cost=r.unlock;addOption((i+1)+". "+r.name,r.desc,unlocked?0:cost,()=>{if(!unlocked){if(state.money<cost){notify("Necesitas ¢"+cost.toLocaleString("es")+" para financiar la expedición.");return}state.money-=cost;state.unlocked.push(i);state.region=i;makeTiles();notify("Expedición desbloqueada: "+r.name)}else if(state.region!==i){state.region=i;makeTiles();notify("Has regresado a "+r.name)}updateHud();save();draw();openModule(tab)},!unlocked&&state.money<cost,i===state.region?"ZONA ACTUAL":unlocked?"DESBLOQUEADA":"BLOQUEADA")})}
else if(tab==="inventory"){title.textContent="Almacén";desc.textContent="Tus recursos disponibles y su valor estimado de venta.";ORE.forEach(k=>addOption(k.toUpperCase()+" · "+state[k], "Valor unitario: ¢"+PRICES[k],0,()=>{},true))}
dlg.showModal()}
function interact(){if(state.region===5&&!state.coreFound){const t=tileAt(7,6);if(t&&!t.removed){notify("El núcleo está cerca. Excava el cristal central.");return}}openModule("regions")}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");if(b.dataset.tab==="mine"){dlg.close();return}openModule(b.dataset.tab)}));
$("closeModule").addEventListener("click",()=>dlg.close());
let drillClock=0,passiveClock=0,energyClock=0;
setInterval(()=>{const now=Date.now(),dt=Math.min(3,(now-lastTick)/1000);lastTick=now;energyClock+=dt;drillClock+=dt;passiveClock+=dt;
if(energyClock>=2){energyClock=0;const regen=state.machines.generator?1+state.machines.generator*.7:1;state.energy=Math.min(100,state.energy+regen*(state.energyRate?1.5:1));updateHud()}
if(drillClock>=9){drillClock=0;for(let n=0;n<state.machines.drill;n++){const t=tiles.find(t=>!t.removed&&t.type!=="stone"&&Math.abs(t.x-2)+Math.abs(t.y-2)<=4&&t.x>1&&t.y>1);if(t)mine(t.x,t.y,true);else{const rock=tiles.find(t=>!t.removed&&Math.abs(t.x-2)+Math.abs(t.y-2)<=4&&t.x>1&&t.y>1);if(rock)mine(rock.x,rock.y,true)}}}
if(passiveClock>=10){passiveClock=0;if(state.machines.worker){state.money+=state.machines.worker*8;updateHud();save()}}
},1000);
function render(){updateHud();draw();save()}
makeTiles();if(state.region===5&&state.coreFound){const c=tileAt(7,6);if(c)c.removed=true}
renderKeys();render();window.addEventListener("resize",resize);resize();
if(!state.seenIntro){state.seenIntro=true;save();setTimeout(()=>notify("Bienvenido a VELNORA Mining Co. Tu historia comienza bajo tierra."),500)}
})();