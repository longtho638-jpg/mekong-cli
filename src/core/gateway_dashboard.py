"""
Mekong CLI - Gateway Dashboard HTML Template

The "Washing Machine" UI served at GET /.
Uses safe DOM methods (createElement, textContent) — no innerHTML.
Includes WebSocket live streaming and project selector.
"""

# Placeholders replaced at serve time:
#   __PRESETS_JSON__  → JSON array of preset actions
#   __VERSION__       → current version string

DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mekong Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column}
header{text-align:center;padding:2rem 1rem 1rem;border-bottom:1px solid #1e293b}
header h1{font-size:1.8rem;background:linear-gradient(135deg,#38bdf8,#818cf8);
-webkit-background-clip:text;-webkit-text-fill-color:transparent}
header p{color:#94a3b8;margin-top:.3rem;font-size:.9rem}
.token-bar{display:flex;gap:.5rem;max-width:400px;margin:1rem auto 0;align-items:center}
.token-bar input{flex:1;padding:.5rem .75rem;border:1px solid #334155;border-radius:.5rem;
background:#1e293b;color:#e2e8f0;font-size:.85rem}
.token-bar button{padding:.5rem 1rem;border:none;border-radius:.5rem;
background:#334155;color:#e2e8f0;cursor:pointer;font-size:.85rem}
.token-bar button:hover{background:#475569}
.project-bar{max-width:400px;margin:.5rem auto 0}
.project-bar select{width:100%;padding:.5rem .75rem;border:1px solid #334155;border-radius:.5rem;
background:#1e293b;color:#e2e8f0;font-size:.85rem;cursor:pointer}
main{flex:1;padding:1.5rem;max-width:800px;margin:0 auto;width:100%}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-top:1rem}
.btn{display:flex;flex-direction:column;align-items:center;justify-content:center;
padding:1.5rem 1rem;border:2px solid #334155;border-radius:1rem;background:#1e293b;
cursor:pointer;transition:all .2s;min-height:140px;text-align:center}
.btn:hover{border-color:#38bdf8;transform:translateY(-2px);box-shadow:0 4px 20px rgba(56,189,248,.15)}
.btn:active{transform:translateY(0)}
.btn.running{border-color:#f59e0b;animation:pulse 1.5s infinite}
.btn.success{border-color:#22c55e}
.btn.error{border-color:#ef4444}
.btn .icon{font-size:2.5rem;margin-bottom:.5rem}
.btn .label{font-size:1rem;font-weight:600}
.btn .label-vi{font-size:.75rem;color:#94a3b8;margin-top:.2rem}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
#result{margin-top:1.5rem;padding:1rem;border-radius:.75rem;background:#1e293b;
border:1px solid #334155;display:none;max-height:400px;overflow-y:auto}
#result.show{display:block}
.custom-bar{display:flex;gap:.5rem;margin-top:1rem}
.custom-bar input{flex:1;padding:.75rem 1rem;border:1px solid #334155;border-radius:.75rem;
background:#1e293b;color:#e2e8f0;font-size:1rem}
.custom-bar button{padding:.75rem 1.5rem;border:none;border-radius:.75rem;
background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;
font-weight:700;cursor:pointer;font-size:1rem}
.custom-bar button:hover{opacity:.9}
.live-log{margin-top:1rem;border:1px solid #334155;border-radius:.75rem;
background:#1e293b;max-height:260px;overflow-y:auto;display:none}
.live-log.active{display:block}
.live-log-hdr{padding:.5rem .75rem;border-bottom:1px solid #334155;font-weight:600;
font-size:.85rem;color:#94a3b8}
.log-entry{padding:.35rem .75rem;border-bottom:1px solid rgba(51,65,85,.4);
font-size:.8rem;display:flex;align-items:center;gap:.5rem}
.log-entry.ok{color:#22c55e}
.log-entry.fail{color:#ef4444}
.log-entry.info{color:#94a3b8}
.spin-icon{display:inline-block;animation:spin .8s linear infinite}
@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
footer{text-align:center;padding:1rem;color:#475569;font-size:.75rem;border-top:1px solid #1e293b}
.summary-box{padding:.75rem;border-radius:.5rem;margin-bottom:.75rem}
.summary-ok{background:#052e16;border:1px solid #22c55e}
.summary-fail{background:#450a0a;border:1px solid #ef4444}
.summary-partial{background:#422006;border:1px solid #f59e0b}
details{margin-top:.5rem}
details summary{cursor:pointer;color:#94a3b8;font-size:.85rem}
details pre{font-size:.75rem;color:#94a3b8;white-space:pre-wrap;margin-top:.5rem}
.tabs{display:flex;gap:0;margin-bottom:1rem;border-bottom:2px solid #334155}
.tab{padding:.6rem 1.2rem;cursor:pointer;color:#94a3b8;font-weight:600;font-size:.9rem;
border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .2s}
.tab:hover{color:#e2e8f0}
.tab.active{color:#38bdf8;border-bottom-color:#38bdf8}
.tab-content{display:none}
.tab-content.active{display:block}
.swarm-nodes{display:grid;gap:.75rem}
.swarm-node{padding:1rem;border:1px solid #334155;border-radius:.75rem;background:#1e293b;
display:flex;align-items:center;gap:1rem}
.swarm-node .node-status{width:10px;height:10px;border-radius:50%}
.swarm-node .node-status.healthy{background:#22c55e}
.swarm-node .node-status.unhealthy{background:#f59e0b}
.swarm-node .node-status.unreachable{background:#ef4444}
.swarm-node .node-status.unknown{background:#475569}
.swarm-node .node-info{flex:1}
.swarm-node .node-name{font-weight:600;font-size:.95rem}
.swarm-node .node-host{color:#94a3b8;font-size:.8rem}
.swarm-node .node-btn{padding:.4rem .8rem;border:1px solid #334155;border-radius:.5rem;
background:#0f172a;color:#e2e8f0;cursor:pointer;font-size:.8rem}
.swarm-node .node-btn:hover{border-color:#38bdf8}
.swarm-empty{color:#94a3b8;text-align:center;padding:2rem;font-size:.9rem}
.swarm-stats{display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap}
.swarm-stat{padding:.5rem .75rem;border-radius:.5rem;background:#1e293b;border:1px solid #334155;font-size:.85rem}
</style>
</head>
<body>
<header>
<h1>Mekong Dashboard</h1>
<p>AgencyOS — Press a button, get things done.</p>
<div class="token-bar">
<input type="password" id="token" placeholder="API Token" />
<button onclick="saveToken()">Save</button>
</div>
<div class="project-bar">
<select id="project-select"><option value="">All Projects</option></select>
</div>
</header>
<main>
<div class="tabs">
<div class="tab active" onclick="switchTab('actions')">Actions</div>
<div class="tab" onclick="switchTab('swarm')">Swarm</div>
</div>
<div id="tab-actions" class="tab-content active">
<div class="grid" id="buttons"></div>
<div class="custom-bar">
<input type="text" id="custom-goal" placeholder="Or type a custom goal..." />
<button onclick="runCustom()">Run</button>
</div>
</div>
<div id="tab-swarm" class="tab-content">
<div class="swarm-stats" id="swarm-stats"></div>
<div class="swarm-nodes" id="swarm-nodes"><div class="swarm-empty">Loading nodes...</div></div>
</div>
<div id="live-log" class="live-log">
<div class="live-log-hdr">Live Progress</div>
<div id="log-entries"></div>
</div>
<div id="result"></div>
</main>
<footer>Mekong CLI __VERSION__ — OpenClaw Hybrid Commander</footer>
<script>
var PRESETS=__PRESETS_JSON__;
function saveToken(){localStorage.setItem('mekong_token',document.getElementById('token').value)}
function getToken(){return document.getElementById('token').value||localStorage.getItem('mekong_token')||''}
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e}

/* --- Project selector --- */
function loadProjects(){
fetch('/projects').then(function(r){return r.json()}).then(function(list){
var sel=document.getElementById('project-select');
list.forEach(function(p){var o=document.createElement('option');o.value=p.name;o.textContent=p.name;sel.appendChild(o)});
}).catch(function(){})
}

/* --- Live log helpers --- */
function showLiveLog(){document.getElementById('live-log').className='live-log active'}
function hideLiveLog(){document.getElementById('live-log').className='live-log'}
function clearLog(){var c=document.getElementById('log-entries');while(c.firstChild)c.removeChild(c.firstChild)}
function addLogEntry(cls,icon,text){
var c=document.getElementById('log-entries');var row=el('div','log-entry '+cls);
row.appendChild(el('span','',icon));row.appendChild(el('span','',text));
c.appendChild(row);c.scrollTop=c.scrollHeight}
function addLogStep(msg){
var icon=msg.passed?'\u2705':'\u274c';var cls=msg.passed?'ok':'fail';
addLogEntry(cls,icon,'Step '+msg.order+': '+msg.title+' — '+msg.summary)}
function addLogStatus(text){addLogEntry('info','\u23f3',text)}
function addLogError(text){addLogEntry('fail','\u26a0\ufe0f',text)}

/* --- Result display --- */
function showResult(content){var r=document.getElementById('result');r.className='show';
while(r.firstChild)r.removeChild(r.firstChild);
if(typeof content==='string'){r.appendChild(el('h3','',content))}else{r.appendChild(content)}}
function buildResultFragment(d){
var frag=document.createDocumentFragment();
var hs=d.human_summary;var cls=d.status==='success'?'summary-ok':d.status==='partial'?'summary-partial':'summary-fail';
var box=el('div','summary-box '+cls);
if(hs){box.appendChild(el('strong','',hs.en));var vi=el('div','',hs.vi);vi.style.marginTop='.3rem';vi.style.color='#94a3b8';box.appendChild(vi)}
else{box.appendChild(el('div','','Status: '+d.status+' ('+d.success_rate+'%)'))}
frag.appendChild(box);
var det=document.createElement('details');det.appendChild(el('summary','','Technical Details'));
det.appendChild(el('pre','',JSON.stringify(d,null,2)));frag.appendChild(det);return frag}

/* --- WebSocket execution (live streaming) --- */
function runGoalWS(goal,btnId){
var token=getToken();var btn=btnId?document.getElementById('btn-'+btnId):null;
if(btn)btn.className='btn running';
showLiveLog();clearLog();addLogStatus('Connecting...');
var proto=location.protocol==='https:'?'wss':'ws';
var ws;
try{ws=new WebSocket(proto+'://'+location.host+'/ws')}catch(e){runGoalHTTP(goal,btnId);return}
ws.onopen=function(){addLogStatus('Planning and executing...');ws.send(JSON.stringify({goal:goal,token:token}))};
ws.onmessage=function(e){
var msg=JSON.parse(e.data);
if(msg.type==='step'){addLogStep(msg)}
else if(msg.type==='status'){addLogStatus(msg.message)}
else if(msg.type==='complete'){
showResult(buildResultFragment(msg));
if(btn)btn.className='btn '+(msg.status==='success'?'success':'error');ws.close()}
else if(msg.type==='error'){addLogError(msg.message);if(btn)btn.className='btn error';ws.close()}
};
ws.onerror=function(){addLogStatus('WebSocket unavailable, falling back to HTTP...');runGoalHTTP(goal,btnId)};
}

/* --- HTTP execution (fallback) --- */
async function runGoalHTTP(goal,btnId){
var token=getToken();var btn=btnId?document.getElementById('btn-'+btnId):null;
if(btn)btn.className='btn running';showResult('Running...');
try{
var r=await fetch('/cmd',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({goal:goal,token:token})});
var d=await r.json();
if(!r.ok){var errBox=el('div','');errBox.appendChild(el('h3','','Error'));errBox.appendChild(el('pre','',JSON.stringify(d,null,2)));showResult(errBox);if(btn)btn.className='btn error';return}
showResult(buildResultFragment(d));
if(btn)btn.className='btn '+(d.status==='success'?'success':'error');
}catch(e){showResult('Network Error: '+e.message);if(btn)btn.className='btn error'}
}

/* --- Main entry: try WS, fall back to HTTP --- */
function runGoal(goal,btnId){
var token=getToken();if(!token){alert('Please enter your API token first.');return}
if(typeof WebSocket!=='undefined'){runGoalWS(goal,btnId)}else{runGoalHTTP(goal,btnId)}
}
function runCustom(){var g=document.getElementById('custom-goal').value.trim();
if(!g){alert('Please enter a goal.');return}runGoal(g,null)}

/* --- Tabs --- */
function switchTab(name){
document.querySelectorAll('.tab').forEach(function(t){t.className='tab'});
document.querySelectorAll('.tab-content').forEach(function(c){c.className='tab-content'});
document.querySelector('[onclick="switchTab(\''+name+'\')"]').className='tab active';
document.getElementById('tab-'+name).className='tab-content active';
if(name==='swarm')loadSwarmNodes();
}

/* --- Swarm --- */
function loadSwarmNodes(){
fetch('/swarm/nodes').then(function(r){return r.json()}).then(function(nodes){
var container=document.getElementById('swarm-nodes');
while(container.firstChild)container.removeChild(container.firstChild);
var stats=document.getElementById('swarm-stats');
while(stats.firstChild)stats.removeChild(stats.firstChild);
if(!nodes.length){container.appendChild(el('div','swarm-empty','No nodes registered. Use CLI: mekong swarm add'));return}
var healthy=0,total=nodes.length;
nodes.forEach(function(n){if(n.status==='healthy')healthy++});
stats.appendChild(el('div','swarm-stat','Nodes: '+total));
stats.appendChild(el('div','swarm-stat','Healthy: '+healthy+'/'+total));
nodes.forEach(function(n){
var row=el('div','swarm-node');
var dot=el('div','node-status '+n.status);
var info=el('div','node-info');
info.appendChild(el('div','node-name',n.name));
info.appendChild(el('div','node-host',n.host+':'+n.port+' ('+n.status+')'));
var btn=el('button','node-btn','Dispatch');
btn.onclick=function(){dispatchToNode(n.id,n.name)};
row.appendChild(dot);row.appendChild(info);row.appendChild(btn);
container.appendChild(row);
});
}).catch(function(){
var c=document.getElementById('swarm-nodes');
while(c.firstChild)c.removeChild(c.firstChild);
c.appendChild(el('div','swarm-empty','Failed to load swarm nodes.'));
})
}
function dispatchToNode(nodeId,nodeName){
var goal=prompt('Enter goal to dispatch to '+nodeName+':');
if(!goal)return;
showLiveLog();clearLog();addLogStatus('Dispatching to '+nodeName+'...');
fetch('/swarm/dispatch',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({node_id:nodeId,goal:goal})})
.then(function(r){return r.json()}).then(function(d){
if(d.error){addLogError(d.error)}else{addLogStatus('Dispatch complete');showResult(buildResultFragment(d))}
}).catch(function(e){addLogError('Dispatch failed: '+e.message)})
}

/* --- Init --- */
window.onload=function(){
document.getElementById('token').value=localStorage.getItem('mekong_token')||'';
var grid=document.getElementById('buttons');
PRESETS.forEach(function(p){
var d=el('div','btn');d.id='btn-'+p.id;
d.appendChild(el('span','icon',p.icon));
d.appendChild(el('span','label',p.label));
d.appendChild(el('span','label-vi',p.label_vi));
d.onclick=function(){runGoal(p.goal,p.id)};
grid.appendChild(d);
});
loadProjects();
};
</script>
</body>
</html>"""


__all__ = ["DASHBOARD_HTML"]
