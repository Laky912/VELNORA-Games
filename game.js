(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),$=id=>document.getElementById(id);
const SAVE_KEY="velnora-mining-empire-v02",OLD_KEY="velnora-mining-empire-v01";
const defaults={up:["w","arrowup"],down:["s","arrowdown"],left:["a","arrowleft"],right:["d","arrowright"]};
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
let keys=read(SAVE_KEY+"-keys",read(OLD_KEY+"-keys",defaults));
let state=read(SAVE_KEY,read(OLD_KEY,{money:250,coal:0,copper:0,iron:0,energy:100,mined:0}));
state={money:250,coal:0,copper:0,iron:0,energy:100,mined:0,pickaxe:1,capacity:30,drill:false,...state};
const W=13,H=11,tiles=[];let player={x:6,y:4},tileW=46,tileH=23,originX=0,originY=0,selected=null,binding=null,toastTimer;
const savedTiles=read(SAVE_KEY+"-tiles",null);
if(savedTiles&&savedTiles.length===W*H)savedTiles.forEach(t=>tiles.push(t));
else{
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const edge=x===0||y===0||x===W-1||y===H-1,r=Math.random();const type=edge?"stone":r<.13?"coal":r<.23?"copper":r<.31?"iron":"stone";tiles.push({x,y,type,hp:type==="stone"?1:type==="coal"?2:3,removed:false});}
[[6,5,"coal"],[7,5,"copper"],[5,6,"iron"],[7,6,"coal"],[6,7,"copper"]].forEach(([x,y,t])=>{const a=tileAt(x,y);a.type=t;a.hp=t==="coal"?2:3;});
}
function tileAt(x,y){return tiles[y*W+x]}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));localStorage.setItem(SAVE_KEY+"-tiles",JSON.stringify(tiles));localStorage.setItem(SAVE_KEY+"-keys",JSON.stringify(keys));}
function notify(s){const t=$("toast");t.textContent=s;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1700)}
function totalItems(){return state.coal+state.copper+state.iron}
function updateHud(){
["money","coal","copper","iron"].forEach(k=>$(k).textContent=state[k].toLocaleString("es"));
$("invCoal").textContent=state.coal;$("invCopper").textContent=state.copper;$("invIron").textContent=state.iron;
$("energyText").textContent=state.energy+" / 100";$("energyBar").style.width=state.energy+"%";
$("missionProgress").style.width=Math.min(100,state.mined/5*100)+"%";$("missionCount").textContent=Math.min(state.mined,5)+" / 5 BLOQUES";
$("depth").textContent="NIVEL 01";$("hint").textContent="MUEVE: WASD / FLECHAS  •  EXCAVA: CLIC EN UN BLOQUE  •  INVENTARIO "+totalItems()+"/"+state.capacity;
}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);tileW=Math.min(54,Math.max(31,r.width/(W+2)));tileH=tileW*.5;originX=r.width/2;originY=Math.max(105,r.height*.23);draw()}
function iso(x,y){return{x:originX+(x-y)*tileW/2,y:originY+(x+y)*tileH/2}}
function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function diamond(x,y,fill,stroke){polygon([{x,y:y-tileH/2},{x:x+tileW/2,y},{x,y:y+tileH/2},{x:x-tileW/2,y}],fill,stroke)}
function drawRock(p,type,scale=1){const colors={stone:["#657581","#82919a","#465761"],coal:["#4c535b","#7c8790","#303942"],copper:["#a96542","#dc9862","#75432f"],iron:["#89969c","#c1cbd0","#58666e"]},c=colors[type]||colors.stone;ctx.save();ctx.translate(p.x,p.y-3);ctx.scale(scale,scale);polygon([{x:-tileW*.22,y:0},{x:-tileW*.16,y:-13},{x:-2,y:-20},{x:tileW*.19,y:-13},{x:tileW*.23,y:0},{x:0,y:8}],c[0],"#26343c");polygon([{x:-tileW*.16,y:-13},{x:-2,y:-20},{x:tileW*.19,y:-13},{x:tileW*.05,y:-7}],c[1]);polygon([{x:-tileW*.22,y:0},{x:0,y:8},{x:tileW*.23,y:0},{x:tileW*.19,y:-13},{x:0,y:-5}],c[2]);if(type!=="stone"){ctx.fillStyle=type==="coal"?"#c2cbd0":type==="copper"?"#f4b17b":"#dce6e8";ctx.beginPath();ctx.arc(-4,-9,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(7,-4,2,0,Math.PI*2);ctx.fill()}ctx.restore()}
function draw(){const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);const bg=ctx.createLinearGradient(0,0,0,r.height);bg.addColorStop(0,"#314957");bg.addColorStop(1,"#172a34");ctx.fillStyle=bg;ctx.fillRect(0,0,r.width,r.height);for(let i=0;i<12;i++){const x=i*r.width/10-30;ctx.fillStyle=i%2?"#29404b":"#2c4551";ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+40,0);ctx.lineTo(x+20,45+(i%3)*13);ctx.lineTo(x-12,58);ctx.fill()}
for(let sum=0;sum<W+H-1;sum++)for(let y=0;y<H;y++){const x=sum-y;if(x<0||x>=W)continue;const t=tileAt(x,y),p=iso(x,y);diamond(p.x,p.y,t.removed?"#344d57":((x+y)%2?"#405b65":"#3a535e"),"#263e49");if(!t.removed)drawRock(p,t.type,.92);if(selected&&selected.x===x&&selected.y===y){ctx.strokeStyle="#f3c36d";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y-tileH/2);ctx.lineTo(p.x+tileW/2,p.y);ctx.lineTo(p.x,p.y+tileH/2);ctx.lineTo(p.x-tileW/2,p.y);ctx.closePath();ctx.stroke()}}
for(let x=1;x<W;x+=3){const p=iso(x,1);ctx.fillStyle="#79583d";ctx.fillRect(p.x-2,p.y-36,4,28);ctx.fillStyle="#eacb83";ctx.beginPath();ctx.arc(p.x,p.y-37,4,0,Math.PI*2);ctx.fill()}
if(state.drill){const p=iso(2,2);ctx.fillStyle="#26333b";ctx.fillRect(p.x-13,p.y-27,26,27);ctx.fillStyle="#d5a34e";ctx.fillRect(p.x-8,p.y-34,16,8);ctx.fillStyle="#8da0a9";ctx.fillRect(p.x-3,p.y-45,6,12);ctx.fillStyle="#f0c66d";ctx.fillRect(p.x+12,p.y-22,5,5)}
const p=iso(player.x,player.y);ctx.fillStyle="#17252b88";ctx.beginPath();ctx.ellipse(p.x,p.y+3,11,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#263b4a";ctx.fillRect(p.x-7,p.y-22,14,19);ctx.fillStyle="#d99b65";ctx.beginPath();ctx.arc(p.x,p.y-28,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e5b94f";ctx.beginPath();ctx.ellipse(p.x,p.y-34,9,4,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(p.x-8,p.y-34,16,3);ctx.fillStyle="#dce8eb";ctx.fillRect(p.x+5,p.y-18,3,9);ctx.fillStyle="#d4e1e5";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText("TÚ",p.x,p.y-45);ctx.textAlign="left";ctx.fillStyle="#c2d0d455";ctx.font="9px monospace";ctx.fillText("NIVEL 01",14,22)}
function move(dx,dy){const nx=Math.max(1,Math.min(W-2,player.x+dx)),ny=Math.max(1,Math.min(H-2,player.y+dy));if(nx===player.x&&ny===player.y)return;player.x=nx;player.y=ny;draw()}
function mine(x,y,automatic=false){const t=tileAt(x,y);if(!t||t.removed)return;if(!automatic&&Math.abs(x-player.x)+Math.abs(y-player.y)>2){notify("Acércate al bloque para excavar.");return}if(state.energy<=0){notify("Sin energía. Espera un momento.");return}if(totalItems()>=state.capacity){notify("Inventario lleno. Vende recursos o amplía el almacén.");return}t.hp-=automatic?1:state.pickaxe;if(!automatic)state.energy=Math.max(0,state.energy-3);if(t.hp<=0){t.removed=true;state[t.type==="stone"?"coal":t.type]++;state.mined++;if(!automatic)notify("+"+(t.type==="stone"?"Carbón":t.type==="coal"?"Carbón":t.type==="copper"?"Cobre":"Hierro"))}else if(!automatic)notify("Excavando…");updateHud();save();draw()}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function pickTile(pos){let best=null,bestD=Infinity;for(const t of tiles){if(t.removed)continue;const p=iso(t.x,t.y),d=Math.abs(pos.x-p.x)/(tileW/2)+Math.abs(pos.y-p.y)/(tileH/2);if(d<1&&d<bestD){best=t;bestD=d}}return best}
canvas.addEventListener("pointerdown",e=>{const t=pickTile(canvasPoint(e));if(t){selected={x:t.x,y:t.y};mine(t.x,t.y)}else selected=null;draw()});
function actionFor(key){return Object.keys(keys).find(a=>keys[a].includes(key))}
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(binding){if(k.startsWith("arrow")||k.length===1){keys[binding]=[k];binding=null;document.querySelectorAll(".key-bind").forEach(b=>b.classList.remove("listening"));renderKeys();save()}return}if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();const a=actionFor(k);if(a){const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},d=dirs[a];move(...d)}});
$("sellBtn").addEventListener("click",()=>{const total=state.coal*4+state.copper*9+state.iron*14;if(!total){notify("No tienes minerales para vender.");return}state.money+=total;state.coal=state.copper=state.iron=0;notify("Venta completada: +¢"+total);updateHud();save()});
$("settingsBtn").addEventListener("click",()=>$("settings").showModal());
document.querySelectorAll(".key-bind").forEach(b=>b.addEventListener("click",()=>{binding=b.dataset.action;b.classList.add("listening");b.textContent="PULSA…"}));
function renderKeys(){const ids={up:"keyUp",down:"keyDown",left:"keyLeft",right:"keyRight"};Object.entries(ids).forEach(([a,id])=>$(id).textContent=keys[a][0].toUpperCase())}
$("resetKeys").addEventListener("click",()=>{keys=JSON.parse(JSON.stringify(defaults));renderKeys();save();notify("Controles restaurados.")});
const module=$("moduleDialog");
function option(title,detail,cost,action,disabled=false){const b=document.createElement("button");b.className="module-option";b.disabled=disabled;b.innerHTML='<span><b>'+title+'</b><small>'+detail+'</small></span><strong>'+(cost===0?"INSTALADO":"¢"+cost)+'</strong>';b.addEventListener("click",action);$("moduleOptions").appendChild(b)}
function openModule(tab){$("moduleOptions").innerHTML="";if(tab==="upgrades"){$("moduleTitle").textContent="Mejoras";$("moduleDescription").textContent="Invierte las ganancias para mejorar tu equipo y capacidad de extracción.";
option("Pico reforzado · Nivel "+state.pickaxe,"Cada mejora aumenta el daño al excavar",150*state.pickaxe,()=>{const cost=150*state.pickaxe;if(state.money<cost){notify("No tienes suficiente dinero.");return}state.money-=cost;state.pickaxe++;notify("Pico mejorado al nivel "+state.pickaxe);updateHud();save();openModule("upgrades")},state.pickaxe>=5);
option("Almacén ampliado · "+state.capacity+" espacios,"+"Aumenta el inventario en 20 espacios",120,()=>{if(state.money<120){notify("No tienes suficiente dinero.");return}state.money-=120;state.capacity+=20;notify("Almacén ampliado.");updateHud();save();openModule("upgrades")},state.capacity>=110)}
else{$("moduleTitle").textContent="Construcción";$("moduleDescription").textContent="Instala maquinaria en tu mina. Las máquinas trabajan mientras exploras.";
option("Taladro automático","Extrae un recurso cercano cada 12 segundos. Requiere espacio libre en (3, 3).",350,()=>{if(state.drill){notify("Ya tienes un taladro instalado.");return}if(state.money<350){notify("Necesitas ¢350.");return}state.money-=350;state.drill=true;notify("Taladro automático instalado.");updateHud();save();draw();openModule("build")},state.drill);
option("Vender minerales","Convierte todo tu inventario en dinero al precio actual.",0,()=>{$("sellBtn").click();module.close()})}
module.showModal()}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");if(b.dataset.tab==="mine"){module.close();return}openModule(b.dataset.tab)}));
$("closeModule").addEventListener("click",()=>module.close());
setInterval(()=>{if(state.energy<100){state.energy=Math.min(100,state.energy+1);updateHud();save()}},1800);
setInterval(()=>{if(state.drill){const target=tiles.find(t=>!t.removed&&Math.abs(t.x-2)+Math.abs(t.y-2)<=2&&t.x>1&&t.y>1);if(target)mine(target.x,target.y,true)}},12000);
window.addEventListener("resize",resize);renderKeys();updateHud();resize();
})();