/* VAULT: goal-based earmarked savings. Balances remain in their original pockets. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const money=n=>yen(n);
const whole=n=>Math.max(0,Math.round(Number(n)||0));
const goals=()=>Array.isArray(data.goals)?data.goals:(data.goals=[]);
const earmarked=(pocketId,ignoreId)=>goals().reduce((total,g)=>total+(g.id===ignoreId?0:(g.allocations||[]).filter(a=>a.pocketId===pocketId).reduce((s,a)=>s+whole(a.amount),0)),0);
const held=g=>(g.allocations||[]).reduce((s,a)=>s+whole(a.amount),0);
const available=id=>Math.max(0,(getPocket(id)?.balance||0)-earmarked(id));
const options=selected=>data.pockets.map(p=>'<option value="'+escapeHtml(p.id)+'"'+(selected===p.id?' selected':'')+'>'+escapeHtml((p.emoji||"💰")+" "+p.name)+'</option>').join("");
const escapeAttr=s=>escapeHtml(s);
function clean(){
  data.goals=goals().filter(g=>g&&typeof g==="object").map(g=>({
    id:String(g.id||uid()),name:String(g.name||"積立目標"),target:whole(g.target),
    pocketId:String(g.pocketId||""),mode:["fixed","percent","none"].includes(g.mode)?g.mode:"none",
    value:whole(g.value),paused:!!g.paused,
    allocations:Array.isArray(g.allocations)?g.allocations.filter(a=>a&&a.pocketId).map(a=>({pocketId:String(a.pocketId),amount:whole(a.amount)})).filter(a=>a.amount>0):[]
  }));
}
function record(g,pid,amount){
  if(amount<=0)return;
  const a=g.allocations.find(a=>a.pocketId===pid);
  if(a)a.amount+=amount;else g.allocations.push({pocketId:pid,amount});
}
function renderGoals(){
  clean();
  const container=$("goalList");if(!container)return;
  container.innerHTML="";
  if(!goals().length){container.innerHTML='<div class="empty">欲しいものや長期目標を登録できます。<br>お金箱を増やす必要はありません。</div>';}
  goals().forEach(g=>{
    const sum=held(g),pct=g.target?Math.min(100,sum/g.target*100):0;
    const src=(g.allocations||[]).map(a=>{const p=getPocket(a.pocketId);return escapeHtml(p?.name||"削除済みの箱")+" "+money(a.amount)}).join(" / ");
    const policy=g.mode==="fixed"?money(g.value)+"/給料":g.mode==="percent"?"給料の"+g.value+"%":"手動のみ";
    const el=document.createElement("button");el.className="pocket goal-item";el.type="button";
    el.innerHTML='<div class="pocket-emoji">🎯</div><div><div class="pocket-name">'+escapeHtml(g.name)+'</div><div class="pocket-meta">'+escapeHtml(policy)+(g.paused?" ・ 一時停止":"")+'</div></div><div class="pocket-value">'+money(sum)+'</div><div class="goal-wrap"><div class="goal-row"><span>目標 '+money(g.target)+'</span><span>'+Math.round(pct)+'% ・ 残り '+money(Math.max(0,g.target-sum))+'</span></div><div class="goal-bar"><span style="width:'+pct+'%;background:#6ea8fe"></span></div><div class="pocket-meta" style="margin-top:7px">確保先：'+(src||"まだ積立なし")+'</div></div>';
    el.onclick=()=>openGoal(g.id);container.appendChild(el);
  });
  const summary=$("reservedTotal");if(summary)summary.textContent="積立確保 −"+money(goals().reduce((s,g)=>s+held(g),0));
  const total=data.pockets.reduce((s,p)=>s+(Number(p.balance)||0),0);
  const usable=total-commitmentTotal()-goals().reduce((s,g)=>s+held(g),0);
  const usableEl=$("usableBalance");if(usableEl){usableEl.textContent="使える "+money(usable);usableEl.style.background=usable<0?"rgba(255,110,110,.28)":"rgba(255,255,255,.12)";}
  const pocketSummaries=$("goalPocketSummary");if(pocketSummaries){
    pocketSummaries.innerHTML=data.pockets.map(p=>'<div class="settings-row"><span>'+escapeHtml(p.emoji||"💰")+' '+escapeHtml(p.name)+'</span><span>自由 '+money((p.balance||0)-earmarked(p.id))+' / 確保 '+money(earmarked(p.id))+'</span></div>').join("");
  }
}
function openGoal(id){
  const g=goals().find(g=>g.id===id);
  $("goalDialogTitle").textContent=g?"積立目標を編集":"積立目標を追加";
  $("goalId").value=g?.id||"";
  $("goalName").value=g?.name||"";
  $("goalTarget").value=g?.target||"";
  $("goalPocket").innerHTML=options(g?.pocketId||data.pockets[0]?.id);
  $("goalMode").value=g?.mode||"fixed";
  $("goalValue").value=g?.value||0;
  $("goalPaused").checked=!!g?.paused;
  $("goalDelete").hidden=!g;
  $("goalManage").hidden=!g;
  $("goalAmount").value="";
  $("goalAction").value="reserve";
  updateGoalEditor();
  openAppDialog($("goalDialog"));
}
function updateGoalEditor(){
  const g=goals().find(g=>g.id===$("goalId").value);
  const mode=$("goalMode").value;
  $("goalValueField").hidden=mode==="none";
  $("goalValueLabel").textContent=mode==="percent"?"給料の何％を確保？":"給料ごとの積立金額";
  $("goalValue").max=mode==="percent"?"100":"";
  const active=getPocket($("goalPocket").value);
  $("goalAvailable").textContent=active?"自由に使える残高："+money(available(active.id)):"";
  $("goalHeld").textContent=g?"確保済み "+money(held(g)):"目標を保存すると手動積立もできます";
}
function saveGoal(e){
  e.preventDefault();
  const id=$("goalId").value, name=$("goalName").value.trim(), target=whole($("goalTarget").value);
  const pid=$("goalPocket").value,mode=$("goalMode").value,value=whole($("goalValue").value);
  if(!name||!target||!getPocket(pid)){alert("名前・目標金額・積立元を確認してください。");return}
  if(mode==="percent"&&value>100){alert("割合は100%以内で指定してください");return}
  const g=goals().find(x=>x.id===id);
  if(g)Object.assign(g,{name,target,pocketId:pid,mode,value,paused:$("goalPaused").checked});
  else goals().push({id:uid(),name,target,pocketId:pid,mode,value,paused:$("goalPaused").checked,allocations:[]});
  save();closeAppDialog($("goalDialog"));showToast("積立目標を保存しました");
}
function adjustGoal(e){
  e.preventDefault();
  const g=goals().find(x=>x.id===$("goalId").value);if(!g)return;
  const amount=whole($("goalAmount").value),pid=$("goalPocket").value,action=$("goalAction").value;
  if(!amount){alert("金額を入力してください");return}
  if(action==="reserve"){
    const can=Math.min(available(pid),Math.max(0,g.target-held(g)));
    if(amount>can){alert("積立元の自由残高か、目標までの残額を超えています。");return}
    record(g,pid,amount);
  }else{
    let remaining=amount;
    for(const a of g.allocations){
      const take=Math.min(a.amount,remaining);a.amount-=take;remaining-=take;
      if(!remaining)break;
    }
    if(remaining){alert("確保済みの金額を超えています。");return}
    g.allocations=g.allocations.filter(a=>a.amount>0);
  }
  save();updateGoalEditor();$("goalAmount").value="";showToast(action==="reserve"?"積立を確保しました":"積立を解除しました");
}
function processSalaryGoals(salaryAmount,breakdown){
  clean();
  // Share only the newly deposited amount in each pocket among goals,
  // in goal order, without consuming previously earmarked funds.
  const remaining={};
  breakdown.forEach(a=>remaining[a.pocketId]=(remaining[a.pocketId]||0)+whole(a.amount));
  for(const g of goals()){
    if(g.paused||g.mode==="none"||!getPocket(g.pocketId))continue;
    const targetRemaining=Math.max(0,g.target-held(g));
    const wanted=g.mode==="fixed"?whole(g.value):Math.round(whole(salaryAmount)*g.value/100);
    const amount=Math.min(targetRemaining,wanted,remaining[g.pocketId]||0,available(g.pocketId));
    if(amount>0){record(g,g.pocketId,amount);remaining[g.pocketId]-=amount;}
  }
}
function checkSpending(pid,amount){
  const after=(getPocket(pid)?.balance||0)-amount;
  const reserved=earmarked(pid);
  if(after>=reserved)return true;
  return confirm("この支出・移動によって積立目標の確保額を下回ります。積立の金額は維持されるため、自由残高がマイナスになります。続けますか？");
}
function init(){
  clean();
  $("addGoalBtn").onclick=()=>{if(!data.pockets.length){showToast("先にお金箱を追加してください");return}openGoal()};
  $("goalSave").onclick=saveGoal;
  $("goalAdjust").onclick=adjustGoal;
  $("goalPocket").onchange=updateGoalEditor;$("goalMode").onchange=updateGoalEditor;
  $("goalDelete").onclick=()=>{
    const id=$("goalId").value,g=goals().find(x=>x.id===id);if(!g)return;
    if(!confirm("この積立目標を削除しますか？ 確保金は元の箱で自由に使える状態に戻ります。"))return;
    data.goals=goals().filter(x=>x.id!==id);save();closeAppDialog($("goalDialog"));showToast("目標を削除しました");
  };
  window.processSalaryGoals=processSalaryGoals;
  window.goalCheckSpending=checkSpending;
  const previousRender=render;
  render=function(){previousRender();renderGoals();};
  renderGoals();
}
init();
})();