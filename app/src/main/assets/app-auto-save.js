(function(){
  'use strict';
  var VERSION='v2';
  var PREFIX='retirement_app_auto_save_'+VERSION+'_';
  var page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  var isDirections=page==='01_directions.html';
  var isPage2=page==='02_income_expensesetup.html';
  var saveTimer=0;
  var synchronizedIds={monthlyIncome:1,monthlyIncomeValue:1,monthly401k:1,monthly401kValue:1,monthlyRoth:1,monthlyRothValue:1,income:1,'income-slider-value':1,'contrib-value':1,'roth-value':1};

  function storageAvailable(){
    try{var k='__retirement_save_test__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true;}catch(e){return false;}
  }
  if(!storageAvailable()) return;

  function stateKey(){return PREFIX+'page_'+page;}
  function selectorFor(el){
    if(el.id) return '#'+CSS.escape(el.id);
    if(el.name){
      var n='[name="'+String(el.name).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"]';
      if((el.type||'').toLowerCase()==='radio') n+='[value="'+String(el.value).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"]';
      return el.tagName.toLowerCase()+n;
    }
    return null;
  }
  function eligible(el){
    if(!el||!el.tagName) return false;
    var tag=el.tagName.toLowerCase();
    if(tag!=='input'&&tag!=='select'&&tag!=='textarea') return false;
    var type=(el.type||'').toLowerCase();
    if(['button','submit','reset','file','image','hidden'].indexOf(type)>=0) return false;
    if(el.dataset&&el.dataset.noAutoSave==='true') return false;
    if(el.id&&synchronizedIds[el.id]) return false;
    if(el.closest&&el.closest('.noUi-target,.noUi-base,[data-calculated="true"]')) return false;
    return !!selectorFor(el);
  }
  function collect(){
    var values={};
    document.querySelectorAll('input,select,textarea').forEach(function(el){
      if(!eligible(el)) return;
      var sel=selectorFor(el); if(!sel) return;
      var type=(el.type||'').toLowerCase();
      values[sel]={type:type||el.tagName.toLowerCase(),value:el.value,checked:!!el.checked};
    });
    return {version:VERSION,page:page,savedAt:Date.now(),values:values};
  }
  function saveNow(){
    try{
      localStorage.setItem(stateKey(),JSON.stringify(collect()));
      localStorage.setItem(PREFIX+'last_saved_at',String(Date.now()));
      window.dispatchEvent(new CustomEvent('retirement-app-autosaved'));
    }catch(e){console.warn('Automatic save failed',e);}
  }
  function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,180);}
  function restore(){
    var data;
    try{data=JSON.parse(localStorage.getItem(stateKey())||'null');}catch(e){console.warn('Automatic restore data was invalid',e);return;}
    if(!data||!data.values) return;
    Object.keys(data.values).forEach(function(sel){
      var el; try{el=document.querySelector(sel);}catch(e){return;}
      if(!el||!eligible(el)) return;
      var saved=data.values[sel], type=(el.type||'').toLowerCase();
      if(type==='checkbox'||type==='radio'){
        if(el.checked!==!!saved.checked){el.checked=!!saved.checked;el.dispatchEvent(new Event('change',{bubbles:true}));}
      }else if(saved.value!=null&&el.value!==String(saved.value)){
        el.value=String(saved.value);
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
      }
    });
  }

  function markDirectionsExit(){
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href]'); if(!a) return;
      var href=(a.getAttribute('href')||'').toLowerCase();
      if(href.indexOf('02_income_expensesetup.html')>=0){
        try{sessionStorage.setItem('retirement_show_save_notice','1');}catch(err){}
      }
    },true);
  }

  function installSaveNotice(){
    var DISCLAIMER_VERSION='retirement-calculator-disclaimer-v1-2026-08-01';
    var DISCLAIMER_KEY='retirement_calculator_disclaimer_acceptance';
    var disclaimerText='This retirement calculator is an informational and educational tool only. It provides estimates and hypothetical illustrations based on the information and assumptions entered. It is not investment, financial, tax, legal, accounting, or Social Security advice, and it does not recommend any investment or strategy. Actual results may differ substantially. Investing in the market involves risk; profits are not guaranteed, and you may lose some or all of the money you invest. Historical results and projected returns do not guarantee future performance. Fees, taxes, inflation, market changes, laws, benefit rules, and personal circumstances can affect results. Consider reviewing important decisions with qualified professionals.';
    var accepted=null;
    try{accepted=JSON.parse(localStorage.getItem(DISCLAIMER_KEY)||'null');}catch(e){}
    var needsAcceptance=!accepted || accepted.version!==DISCLAIMER_VERSION;
    var shouldShowSave=false;
    try{shouldShowSave=sessionStorage.getItem('retirement_show_save_notice')==='1';sessionStorage.removeItem('retirement_show_save_notice');}catch(e){}
    if(!needsAcceptance && !shouldShowSave) return;

    var overlay=document.createElement('div');
    overlay.id='automaticSaveNotice';
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','automaticSaveNoticeTitle');
    var warningSection=needsAcceptance
      ? '<div class="calculator-warning"><h2 id="automaticSaveNoticeTitle">Retirement Calculator Notice</h2><p>'+disclaimerText+'</p><label class="warning-check"><input type="checkbox" id="calculatorWarningCheck"> <span>I have read and understand this notice, including that market investing is not guaranteed and I could lose money.</span></label></div>'
      : '<h2 id="automaticSaveNoticeTitle">Your progress saves automatically</h2>';
    overlay.innerHTML='<div class="automatic-save-card"><div class="automatic-save-icon" aria-hidden="true">!</div>'+warningSection+'<div class="save-explanation"><h3>Your entries save automatically</h3><p>This app saves entries privately in this browser on this device so you can return later.</p><p class="automatic-save-small">Nothing is uploaded by this static app. Clearing browser data, using private browsing, or switching browsers or devices can remove or hide saved entries and the acceptance record.</p></div><button type="button" id="automaticSaveNoticeContinue" '+(needsAcceptance?'disabled':'')+'>'+(needsAcceptance?'Accept and Continue':'Continue')+'</button></div>';
    var style=document.createElement('style');
    style.id='automaticSaveNoticeStyle';
    style.textContent='#automaticSaveNotice{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.76);backdrop-filter:blur(3px)}.automatic-save-card{width:min(620px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border:2px solid #b91c1c;border-radius:18px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.38);font-family:inherit;color:#111827}.automatic-save-icon{width:54px;height:54px;margin:0 auto 10px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fee2e2;border:2px solid #dc2626;color:#991b1b;font-size:32px;font-weight:1000}.automatic-save-card h2{margin:0 0 12px;text-align:center;font-size:24px;line-height:1.15}.automatic-save-card h3{margin:15px 0 6px;font-size:17px}.automatic-save-card p{font-size:15px;line-height:1.48}.calculator-warning{padding:14px;border:1px solid #fecaca;border-radius:12px;background:#fff7f7}.warning-check{display:flex;gap:10px;align-items:flex-start;margin-top:14px;padding:12px;border:2px solid #f59e0b;border-radius:10px;background:#fffbeb;font-size:14px;font-weight:800;line-height:1.4;cursor:pointer}.warning-check input{width:20px;height:20px;flex:0 0 auto;margin-top:1px}.automatic-save-small{padding:10px 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;font-size:13px!important;color:#475569}.automatic-save-card button{display:block;width:100%;margin-top:16px;padding:13px 16px;border:2px solid #15803d;border-radius:12px;background:#16a34a;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer}.automatic-save-card button:disabled{background:#9ca3af;border-color:#6b7280;cursor:not-allowed}.automatic-save-card button:active:not(:disabled){transform:scale(.99)}';
    document.head.appendChild(style);document.body.appendChild(overlay);
    var btn=document.getElementById('automaticSaveNoticeContinue');
    var check=document.getElementById('calculatorWarningCheck');
    if(check) check.addEventListener('change',function(){btn.disabled=!check.checked;});
    function close(){overlay.remove();style.remove();}
    btn.addEventListener('click',function(){
      if(needsAcceptance){
        if(!check || !check.checked) return;
        var record={version:DISCLAIMER_VERSION,accepted:true,acceptedAt:new Date().toISOString(),acceptedAtEpoch:Date.now(),text:disclaimerText,page:location.pathname,userAgent:navigator.userAgent};
        try{localStorage.setItem(DISCLAIMER_KEY,JSON.stringify(record));}catch(e){console.warn('Could not save disclaimer acceptance',e);}
        window.dispatchEvent(new CustomEvent('retirement-disclaimer-accepted',{detail:record}));
      }
      close();
    });
    setTimeout(function(){(check||btn).focus();},0);
  }

  function initializeSlidersAtLeftOnFirstVisit(){
    if(isDirections || page==='index.html' || page==='01_privacy_policy.html') return;
    var firstKey=PREFIX+'sliders_initialized_'+page;
    try{if(localStorage.getItem(firstKey)==='1') return;}catch(e){return;}
    function minOfRange(range){
      if(range==null) return 0;
      if(typeof range==='number') return range;
      if(typeof range==='object'){
        if(Number.isFinite(Number(range.min))) return Number(range.min);
        var nums=Object.keys(range).map(function(k){return Number(range[k]);}).filter(Number.isFinite);
        if(nums.length) return Math.min.apply(Math,nums);
      }
      return 0;
    }
    function reset(){
      document.querySelectorAll('.noUi-target').forEach(function(el){
        var api=el.noUiSlider;if(!api) return;
        try{api.set(minOfRange(api.options&&api.options.range));}catch(e){}
      });
      document.querySelectorAll('input[type="range"]').forEach(function(el){
        var min=Number(el.min);if(!Number.isFinite(min)) min=0;
        el.value=String(min);
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
      });
    }
    setTimeout(reset,350);setTimeout(reset,900);setTimeout(function(){reset();try{localStorage.setItem(firstKey,'1');}catch(e){}saveNow();},1700);
  }

  function init(){
    if(isDirections) markDirectionsExit();
    if(!isDirections){
      restore();
      document.addEventListener('input',queueSave,true);
      document.addEventListener('change',queueSave,true);
      document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('button,[role="button"]'))setTimeout(queueSave,30);},true);
      window.addEventListener('pagehide',saveNow);
      window.addEventListener('beforeunload',saveNow);
      setInterval(saveNow,15000);
    }
    initializeSlidersAtLeftOnFirstVisit();
    if(isPage2) installSaveNotice();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
