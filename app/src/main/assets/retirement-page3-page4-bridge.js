(function(){
  'use strict';
  if(window.__retirementPage3Page4BridgeV1) return;
  window.__retirementPage3Page4BridgeV1 = true;

  var PACKET_KEY = 'retirement_page3_page4_balances_v1';
  var PAGE4_KEYS = {
    START_PORTFOLIO: {
      sourceKey: 'retirement_401k_total',
      sourceTimeKey: 'retirement_401k_total_updated_at',
      overrideKey: 'retirement_chart_start_portfolio_override',
      overrideTimeKey: 'retirement_chart_start_portfolio_override_updated_at',
      title: 'Existing 401K from Page 3'
    },
    START_ROTH: {
      sourceKey: 'retirement_roth_total',
      sourceTimeKey: 'retirement_roth_total_updated_at',
      overrideKey: 'retirement_chart_start_roth_override',
      overrideTimeKey: 'retirement_chart_start_roth_override_updated_at',
      title: 'Existing Roth IRA from Page 3'
    }
  };

  function number(v){
    v = Number(String(v == null ? '' : v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(v) ? Math.max(0,v) : 0;
  }
  function money(v){
    return '$' + Math.round(number(v)).toLocaleString('en-US');
  }
  function pageName(){
    return (location.pathname.split('/').pop() || '').split('?')[0].split('#')[0];
  }
  function savePacket(){
    var packet = {
      version: 1,
      source: 'page3',
      updatedAt: Date.now(),
      k401: number(localStorage.getItem('retirement_401k_total')),
      roth: number(localStorage.getItem('retirement_roth_total')),
      k401UpdatedAt: number(localStorage.getItem('retirement_401k_total_updated_at')),
      rothUpdatedAt: number(localStorage.getItem('retirement_roth_total_updated_at'))
    };
    try{ localStorage.setItem(PACKET_KEY, JSON.stringify(packet)); }catch(e){}
    return packet;
  }
  function readPacket(){
    try{
      var p = JSON.parse(localStorage.getItem(PACKET_KEY) || 'null');
      if(p) return p;
    }catch(e){}
    return {
      version:1,
      source:'page3',
      updatedAt:number(localStorage.getItem('retirement_handoff_updated_at')),
      k401:number(localStorage.getItem('retirement_401k_total')),
      roth:number(localStorage.getItem('retirement_roth_total')),
      k401UpdatedAt:number(localStorage.getItem('retirement_401k_total_updated_at')),
      rothUpdatedAt:number(localStorage.getItem('retirement_roth_total_updated_at'))
    };
  }

  if(pageName() === '03_401K_Calculator.html'){
    document.addEventListener('click', function(e){
      var next = e.target && e.target.closest && e.target.closest('.app-nav .next');
      if(next) savePacket();
    }, true);
    window.addEventListener('pagehide', savePacket);
    window.retirementPage3Page4Save = savePacket;
    return;
  }

  if(pageName() !== '04_Retirement_Chart.html') return;

  function card(key){
    return document.querySelector('.ctrl[data-key="'+key+'"]');
  }
  function slider(key){
    try{
      if(window.sliderMap && window.sliderMap[key]) return window.sliderMap[key];
    }catch(e){}
    var el = card(key) && card(key).querySelector('.noUi-target');
    return el && el.noUiSlider ? el.noUiSlider : null;
  }
  function sourceValue(key){
    var p = readPacket();
    return key === 'START_ROTH' ? number(p.roth) : number(p.k401);
  }
  function sourceTime(key){
    var p = readPacket();
    return key === 'START_ROTH'
      ? number(p.rothUpdatedAt || p.updatedAt)
      : number(p.k401UpdatedAt || p.updatedAt);
  }
  function rangeFor(value){
    var step = 1000;
    var width = Math.max(100000, Math.ceil(Math.max(value,1) * 0.8 / step) * step);
    var min = Math.max(0, Math.floor((value - width/2) / step) * step);
    var max = Math.max(min + width, Math.ceil(value / step) * step + step);
    return {min:min,max:max,step:step};
  }
  function unlock(key){
    var c = card(key), a = slider(key);
    if(!c || !a) return false;
    c.classList.remove('page4-slider-is-locked','locked','mode-locked','slider-user-locked','slider-actually-locked');
    var el = c.querySelector('.noUi-target');
    if(el){
      el.classList.remove('locked','mode-locked','slider-user-locked','slider-actually-locked');
      el.style.pointerEvents = 'auto';
      el.style.opacity = '1';
    }
    c.querySelectorAll('input[value="locked"]').forEach(function(r){
      r.checked = false;
      r.disabled = true;
      var label = r.closest('label');
      if(label) label.style.display = 'none';
    });
    try{ if(a.enable) a.enable(); }catch(e){}
    return true;
  }
  function setLabel(key,value){
    var c=card(key);
    if(!c) return;
    var l=c.querySelector('.ctrl-label');
    if(l) l.textContent = PAGE4_KEYS[key].title + ': ' + money(value);
  }
  function apply(key,value,manual){
    var a=slider(key), cfg=PAGE4_KEYS[key];
    if(!a) return false;
    var r=rangeFor(value);
    window.__page3Page4BridgeApplying = true;
    try{
      a.updateOptions({range:{min:r.min,max:r.max},step:r.step},false);
      a.set(value);
    }catch(e){
      window.__page3Page4BridgeApplying = false;
      return false;
    }
    window.__page3Page4BridgeApplying = false;
    setLabel(key,value);
    try{
      localStorage.setItem('slider_'+key,String(value));
      localStorage.setItem('assumption_limit_max_'+key,String(r.max));
      localStorage.setItem(key === 'START_ROTH' ? 'retirement_start_roth' : 'retirement_start_401k', String(value));
      if(manual){
        localStorage.setItem(cfg.overrideKey,String(value));
        localStorage.setItem(cfg.overrideTimeKey,String(Date.now()));
      }else{
        localStorage.removeItem(cfg.overrideKey);
        localStorage.removeItem(cfg.overrideTimeKey);
      }
    }catch(e){}
    try{ if(typeof update === 'function') update(); }catch(e){}
    return true;
  }
  function pull(key){
    savePacket();
    var value=sourceValue(key);
    apply(key,value,false);
    var note=card(key) && card(key).querySelector('.page3-page4-source-note');
    if(note) note.textContent='Pulled '+money(value)+' from Page 3. This slider remains editable.';
  }
  function initialValue(key){
    var cfg=PAGE4_KEYS[key];
    var src=sourceValue(key), srcTime=sourceTime(key);
    var override=null, overrideTime=0;
    try{
      var raw=localStorage.getItem(cfg.overrideKey);
      if(raw !== null && raw !== '') override=number(raw);
      overrideTime=number(localStorage.getItem(cfg.overrideTimeKey));
    }catch(e){}
    return override !== null && overrideTime >= srcTime ? override : src;
  }
  function addPullButton(key){
    var c=card(key);
    if(!c) return false;
    c.querySelectorAll('.page3-page4-pull-btn,.page3-page4-source-note').forEach(function(x){x.remove();});
    var row=c.querySelector('.page4-slider-button-row');
    if(!row) return false;
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='page4-slider-step-btn page3-page4-pull-btn';
    btn.textContent='Pull from Page 3';
    btn.style.background='linear-gradient(180deg,#ffffff,#f0fdf4)';
    btn.style.borderColor='#86efac';
    btn.style.color='#166534';
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      pull(key);
    },true);
    row.appendChild(btn);
    var note=document.createElement('div');
    note.className='page3-page4-source-note';
    note.textContent='Amount comes from Page 3. You may edit it here, or pull the latest Page 3 amount again.';
    note.style.cssText='margin-top:6px;padding:5px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;color:#374151;font:800 10.5px/1.25 Arial,sans-serif;';
    row.insertAdjacentElement('afterend',note);
    return true;
  }
  function wire(key){
    var a=slider(key);
    if(!a || !unlock(key) || !addPullButton(key)) return false;
    if(!a.__page3Page4BridgeWired){
      a.__page3Page4BridgeWired=true;
      a.on('change.page3Page4Bridge',function(vals){
        if(window.__page3Page4BridgeApplying) return;
        var v=number(vals && vals[0]);
        var cfg=PAGE4_KEYS[key];
        setLabel(key,v);
        try{
          localStorage.setItem(cfg.overrideKey,String(v));
          localStorage.setItem(cfg.overrideTimeKey,String(Date.now()));
          localStorage.setItem(key === 'START_ROTH' ? 'retirement_start_roth' : 'retirement_start_401k', String(v));
        }catch(e){}
      });
    }
    apply(key,initialValue(key),false);
    return true;
  }
  function boot(attempt){
    var ok=wire('START_PORTFOLIO') && wire('START_ROTH');
    if(!ok && (attempt||0)<40){
      setTimeout(function(){boot((attempt||0)+1);},100);
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){boot(0);},{once:true});
  }else boot(0);
  window.addEventListener('load',function(){boot(0);},{once:true});

  window.retirementPage3Page4Pull401K=function(){pull('START_PORTFOLIO');};
  window.retirementPage3Page4PullRoth=function(){pull('START_ROTH');};
})();