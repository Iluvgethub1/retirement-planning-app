(function(){
  'use strict';
  if(window.__PAGE2_PAGE3_SYNC_V8__) return;
  window.__PAGE2_PAGE3_SYNC_V8__=true;

  var filename=(location.pathname.split('/').pop()||'').toLowerCase();
  var PAGE=filename.indexOf('02_')===0?'page2':filename.indexOf('03_')===0?'page3':'';
  if(!PAGE) return;

  var KEY='retirement_page2_page3_shared_v8';
  var applying=false, navigating=false, toastTimer=0;

  function number(v){
    if(Array.isArray(v)) v=v[0];
    var n=Number(String(v==null?'':v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:null;
  }
  function endpoint(v,fallback){
    if(Array.isArray(v)) v=v[0];
    var n=number(v); return n===null?fallback:n;
  }
  function slider(id){
    var el=document.getElementById(id);
    return el&&el.noUiSlider?el:null;
  }
  function valueOf(id, fallbacks){
    var el=slider(id), n;
    if(el){ try{n=number(el.noUiSlider.get());if(n!==null)return n;}catch(e){} }
    for(var i=0;i<(fallbacks||[]).length;i++){
      var x=document.getElementById(fallbacks[i]);
      if(!x) continue;
      n=number('value' in x?x.value:x.textContent);
      if(n!==null)return n;
    }
    return 0;
  }
  function maxOf(id, value){
    var el=slider(id), max=0;
    if(el){
      try{max=endpoint(el.noUiSlider.options.range.max,0);}catch(e){}
    }
    return Math.max(max,number(value)||0);
  }
  function readPacket(){
    var ids=PAGE==='page2'?{
      income:['monthlyIncomeSlider',['monthlyIncome','monthlyIncomeValue']],
      k401:['monthly401kSlider',['monthly401k','monthly401kValue']],
      roth:['monthlyRothSlider',['monthlyRoth','monthlyRothValue']]
    }:{
      income:['income-slider',['income','income-slider-value']],
      k401:['contrib-slider',['contrib-value']],
      roth:['roth-slider',['roth-value']]
    };
    var income=valueOf(ids.income[0],ids.income[1]);
    var k401=valueOf(ids.k401[0],ids.k401[1]);
    var roth=valueOf(ids.roth[0],ids.roth[1]);
    return {
      version:8, source:PAGE, updatedAt:Date.now(),
      monthlyIncome:income, monthlyIncomeMax:maxOf(ids.income[0],income),
      monthly401k:k401, monthly401kMax:maxOf(ids.k401[0],k401),
      monthlyRoth:roth, monthlyRothMax:maxOf(ids.roth[0],roth)
    };
  }
  function persistContributionState(p,source){
    if(!p)return;
    var stamp=Date.now();
    var k=Math.round((number(p.monthly401k)||0)/25)*25;
    var r=Math.round((number(p.monthlyRoth)||0)/25)*25;
    var kmax=Math.max(Math.round((number(p.monthly401kMax)||0)/25)*25,k,25);
    var rmax=Math.max(Math.round((number(p.monthlyRothMax)||0)/25)*25,r,25);
    var active401='under50', activeRoth='under50', oldAge={};
    try{
      oldAge=JSON.parse(localStorage.getItem('monthly_age_period_state')||'null')||{};
      active401=(oldAge.contrib&&oldAge.contrib.active)||localStorage.getItem('sync_401k_age_period')||'under50';
      activeRoth=(oldAge.roth&&oldAge.roth.active)||localStorage.getItem('sync_roth_age_period')||'under50';
    }catch(e){ console.warn('Unable to read age-period contribution state',e); }
    active401=active401==='age50plus'?'age50plus':'under50';
    activeRoth=activeRoth==='age50plus'?'age50plus':'under50';
    var old401Under=number(oldAge.contrib&&oldAge.contrib.under50);
    var old401Plus=number(oldAge.contrib&&oldAge.contrib.age50plus);
    var oldRothUnder=number(oldAge.roth&&oldAge.roth.under50);
    var oldRothPlus=number(oldAge.roth&&oldAge.roth.age50plus);
    if(old401Under===null) old401Under=number(localStorage.getItem('sync_monthly_401k_under50'))||0;
    if(old401Plus===null) old401Plus=number(localStorage.getItem('sync_monthly_401k_age50plus'))||0;
    if(oldRothUnder===null) oldRothUnder=number(localStorage.getItem('sync_monthly_roth_under50'))||0;
    if(oldRothPlus===null) oldRothPlus=number(localStorage.getItem('sync_monthly_roth_age50plus'))||0;
    var age={
      contrib:{active:active401,under50:active401==='under50'?k:old401Under,age50plus:active401==='age50plus'?k:old401Plus},
      roth:{active:activeRoth,under50:activeRoth==='under50'?r:oldRothUnder,age50plus:activeRoth==='age50plus'?r:oldRothPlus}
    };
    var values={
      sync_monthly_401k:k,k401_prefill_monthly_401k:k,pre_monthly_401k:k,
      sync_monthly_401k_under50:age.contrib.under50,sync_monthly_401k_age50plus:age.contrib.age50plus,k401_monthly_under50:age.contrib.under50,k401_monthly_50plus:age.contrib.age50plus,
      sync_monthly_roth:r,k401_prefill_monthly_roth:r,pre_monthly_roth:r,
      sync_monthly_roth_under50:age.roth.under50,sync_monthly_roth_age50plus:age.roth.age50plus,roth_monthly_under50:age.roth.under50,roth_monthly_50plus:age.roth.age50plus,
      sync_monthly_401k_max:kmax,custom_contrib_slider_max:kmax,monthly401k_max:kmax,custom_monthly401k_slider_max:kmax,
      sync_monthly_roth_max:rmax,custom_roth_slider_max:rmax,monthlyRoth_max:rmax,custom_monthlyRoth_slider_max:rmax,
      sync_401k_age_period:active401,setup_401k_age_period:active401,
      sync_roth_age_period:activeRoth,setup_roth_age_period:activeRoth
    };
    Object.keys(values).forEach(function(key){try{localStorage.setItem(key,String(values[key]));}catch(e){}});
    try{localStorage.setItem('monthly_age_period_state',JSON.stringify(age));}catch(e){}
    try{localStorage.setItem('stable_401k_roth_bucket_state_v2',JSON.stringify({contrib:age.contrib,roth:age.roth,source:source||'page2-page3-sync-v8',stamp:stamp}));}catch(e){}
    try{localStorage.setItem('stable_401k_roth_bucket_state_v2_stamp',String(stamp));}catch(e){}
    try{localStorage.setItem('retirement_monthly_shared_state_v6',JSON.stringify({version:6,updatedAt:stamp,source:source||'page2-page3-sync-v8',k401:{value:k,min:0,max:kmax,locked:false},roth:{value:r,min:0,max:rmax,locked:false}}));}catch(e){}
    /* Page 3 has a separate authoritative Roth consumer. Give it the same fresh value. */
    try{localStorage.setItem('retirement_roth_handoff_v34',JSON.stringify({value:r,active:activeRoth,stamp:stamp,source:source||'page2-page3-sync-v8'}));}catch(e){}
  }

  function savePacket(){
    if(applying)return null;
    var p=readPacket();
    try{
      localStorage.setItem(KEY,JSON.stringify(p));
      localStorage.setItem('sync_monthly_income',String(p.monthlyIncome));
      localStorage.setItem('sync_monthly_401k',String(p.monthly401k));
      localStorage.setItem('sync_monthly_roth',String(p.monthlyRoth));
      localStorage.setItem('sync_monthly_income_max',String(p.monthlyIncomeMax));
      localStorage.setItem('sync_monthly_401k_max',String(p.monthly401kMax));
      localStorage.setItem('sync_monthly_roth_max',String(p.monthlyRothMax));
      localStorage.setItem('custom_contrib_slider_max',String(p.monthly401kMax));
      localStorage.setItem('custom_roth_slider_max',String(p.monthlyRothMax));
      persistContributionState(p,PAGE+'-save-v8');
    }catch(e){}
    return p;
  }
  function packetFromHash(){
    var m=(location.hash||'').match(/(?:^#|[&#])p23sync=([^&]+)/);
    if(!m)return null;
    try{return JSON.parse(decodeURIComponent(m[1]));}catch(e){return null;}
  }
  function storedPacket(){
    try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}
  }
  function persistControllerMax(el,max){
    if(!el)return;
    var id=el.id;
    max=Math.max(number(max)||0,1);
    /* The pages have their own final range controllers. Keep those controllers
       informed so they do not repaint or restore an older maximum. */
    if(id==='roth-slider'||id==='contrib-slider'||id==='existing-roth-slider'){
      el.dataset.cgOwnerMaxV4=String(max);
    }
    if(id==='income-slider'){
      /* Keep both Page 3 income range controllers pointed at the handoff max. */
      el.dataset.cgAuthMaxV2=String(max);
    }
    var keys=[];
    if(id==='roth-slider'||id==='monthlyRothSlider') keys=[
      'sync_monthly_roth_max','custom_roth_slider_max','monthlyRoth_max',
      'custom_monthlyRoth_slider_max','page2_range_max_final_monthlyRoth'
    ];
    else if(id==='contrib-slider'||id==='monthly401kSlider') keys=[
      'sync_monthly_401k_max','custom_contrib_slider_max','monthly401k_max',
      'custom_monthly401k_slider_max','page2_range_max_final_monthly401k'
    ];
    else if(id==='income-slider'||id==='monthlyIncomeSlider') keys=[
      'sync_monthly_income_max','monthlyIncome_max','page2_range_max_final_monthlyIncome',
      /* Page 3's last-installed income controller uses this separate key. */
      'page3_final_range_income_slider_max','cg_auth_income_max_v2','cg_income_range_max'
    ];
    keys.forEach(function(k){try{localStorage.setItem(k,String(max));}catch(e){}});
  }
  function exactRange(el,max,value){
    if(!el||!el.noUiSlider)return false;
    var isIncome=el.id==='income-slider'||el.id==='monthlyIncomeSlider';
    var step=isIncome?100:25;
    value=Math.round((number(value)||0)/step)*step;
    max=Math.max(Math.round((number(max)||0)/step)*step,value,step);
    try{
      persistControllerMax(el,max);
      var opts=el.noUiSlider.options||{};
      var range=opts.range||{};
      var min=endpoint(range.min,0);
      el.noUiSlider.updateOptions({range:{min:min,max:max},step:step,animate:false,animationDuration:0},false);
      el.noUiSlider.set(value);
      try{el.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
      try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
      return true;
    }catch(e){return false;}
  }
  function setPlain(id,value){
    var el=document.getElementById(id);if(!el)return;
    el.value=String(number(value)||0);
  }
  function repaint(el,max){
    if(!el)return;
    var host=el.closest('.slider-card,.slider-block');if(!host)return;
    var text='$'+Math.round(number(max)||0).toLocaleString('en-US');
    host.querySelectorAll('[data-max],[data-range-max],[data-cg-owner-max],[data-cg-max]').forEach(function(n){n.textContent=text;});
    var visual=host.querySelector('.income-range-visual .max');
    if(visual)visual.textContent=text;
    /* Page 3's active controller reads this dataset when it redraws its range. */
    if(el.id==='roth-slider'||el.id==='contrib-slider'||el.id==='existing-roth-slider'){
      el.dataset.cgOwnerMaxV4=String(Math.round(number(max)||0));
    }
  }
  function applyPacket(p){
    if(!p||p.version!==8)return false;
    applying=true;
    try{
      persistContributionState(p,PAGE+'-apply-v8');
      var map=PAGE==='page2'?{
        income:['monthlyIncomeSlider',p.monthlyIncome,p.monthlyIncomeMax],
        k401:['monthly401kSlider',p.monthly401k,p.monthly401kMax],
        roth:['monthlyRothSlider',p.monthlyRoth,p.monthlyRothMax]
      }:{
        income:['income-slider',p.monthlyIncome,p.monthlyIncomeMax],
        k401:['contrib-slider',p.monthly401k,p.monthly401kMax],
        roth:['roth-slider',p.monthlyRoth,p.monthlyRothMax]
      };
      var count=0;
      Object.keys(map).forEach(function(k){
        var cfg=map[k], el=slider(cfg[0]);
        if(exactRange(el,cfg[2],cfg[1])){repaint(el,cfg[2]);count++;}
      });
      if(PAGE==='page2'){
        setPlain('monthlyIncome',p.monthlyIncome);setPlain('monthly401k',p.monthly401k);setPlain('monthlyRoth',p.monthlyRoth);
      }else{
        setPlain('income',p.monthlyIncome);
        setPlain('max-contrib-input',p.monthly401kMax);
        setPlain('max-roth-input',p.monthlyRothMax);
        /* Keep Page 3's hidden age-period model exact too. Otherwise an older
           controller can repaint $1,025 as $1,000 later. */
        try{
          if(window.agePeriodState){
            ['under50','age50plus'].forEach(function(period){
              window.agePeriodState.contrib[period]=Math.round((number(p.monthly401k)||0)/25)*25;
              window.agePeriodState.roth[period]=Math.round((number(p.monthlyRoth)||0)/25)*25;
            });
          }
          localStorage.setItem('monthly_age_period_state',JSON.stringify({
            contrib:{active:(window.agePeriodState&&window.agePeriodState.contrib.active)||'under50',under50:Math.round((number(p.monthly401k)||0)/25)*25,age50plus:Math.round((number(p.monthly401k)||0)/25)*25},
            roth:{active:(window.agePeriodState&&window.agePeriodState.roth.active)||'under50',under50:Math.round((number(p.monthlyRoth)||0)/25)*25,age50plus:Math.round((number(p.monthlyRoth)||0)/25)*25}
          }));
        }catch(e){}
      }
      return count===3;
    }finally{applying=false;}
  }
  function showToast(pageLabel){
    var t=document.getElementById('p23SaveToast');
    if(!t){
      t=document.createElement('div');t.id='p23SaveToast';
      t.innerHTML='<span class="p23-save-check">✓</span><span class="p23-save-copy"><strong></strong><small>Your changes were saved in this browser.</small></span>';
      t.style.cssText='position:fixed;top:62px;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:10px;min-width:260px;max-width:calc(100vw - 24px);background:#f0fdf4;color:#14532d;border:3px solid #15803d;padding:10px 16px;border-radius:999px;font-family:Arial,sans-serif;box-shadow:0 10px 30px rgba(15,23,42,.30);opacity:0;transition:opacity .12s ease;pointer-events:none;box-sizing:border-box';
      var check=t.querySelector('.p23-save-check');
      check.style.cssText='display:inline-flex;align-items:center;justify-content:center;flex:0 0 28px;width:28px;height:28px;border-radius:50%;background:#16a34a;color:#fff;font:900 17px/1 Arial,sans-serif';
      var copy=t.querySelector('.p23-save-copy');copy.style.cssText='display:flex;flex-direction:column;gap:2px';
      copy.querySelector('strong').style.cssText='font:900 16px/1.15 Arial,sans-serif';
      copy.querySelector('small').style.cssText='font:700 11px/1.2 Arial,sans-serif;color:#166534';
      document.body.appendChild(t);
    }
    t.querySelector('strong').textContent=(pageLabel||'Page')+' saved';
    clearTimeout(toastTimer);t.style.opacity='1';toastTimer=setTimeout(function(){t.style.opacity='0';},650);
  }
  function go(target,withPacket){
    if(navigating)return;
    navigating=true;
    try{if(PAGE==='page2'&&typeof window.saveValues==='function')window.saveValues();}catch(e){}
    var p=savePacket();showToast(PAGE==='page2'?'Page 2':'Page 3');
    setTimeout(function(){
      if(withPacket){
        var encoded=encodeURIComponent(JSON.stringify(p));
        location.href=target+'#p23sync='+encoded;
      }else location.href=target;
    },680);
  }
  function capture(e){
    if(navigating||e.defaultPrevented)return;
    var b=e.target&&e.target.closest&&e.target.closest('button,a');if(!b)return;
    if(PAGE==='page2'&&(b.id==='page2BridgeNext'||b.classList.contains('next'))){
      e.preventDefault();e.stopImmediatePropagation();go('03_401K_Calculator.html',true);
    }else if(PAGE==='page2'&&b.classList.contains('back')){
      e.preventDefault();e.stopImmediatePropagation();go('01_Directions.html',false);
    }else if(PAGE==='page3'&&b.classList.contains('back')){
      e.preventDefault();e.stopImmediatePropagation();go('02_Income_ExpenseSetup.html',true);
    }
  }
  window.addEventListener('click',capture,true);
  window.addEventListener('pagehide',function(){savePacket();});
  window.addEventListener('beforeunload',function(){savePacket();});

  var incoming=packetFromHash()||storedPacket();
  var restoreStarted=false;
  var chartHost=null;

  /* On Page 3 several legacy controllers finish their own initialization from
     delayed load callbacks. Hide the chart while that one-time startup settles,
     then apply the handoff once after those callbacks are finished. */
  if(incoming&&PAGE==='page3'){
    chartHost=document.getElementById('chart-container');
    if(chartHost){
      chartHost.style.visibility='hidden';
      chartHost.style.opacity='0';
    }
  }

  function slidersReady(){
    var ids=PAGE==='page2'
      ? ['monthlyIncomeSlider','monthly401kSlider','monthlyRothSlider']
      : ['income-slider','contrib-slider','roth-slider'];
    return ids.every(function(id){
      var el=document.getElementById(id);
      return !!(el&&el.noUiSlider);
    });
  }

  function revealChart(){
    if(!chartHost)return;
    chartHost.style.transition='opacity .12s ease';
    chartHost.style.visibility='visible';
    requestAnimationFrame(function(){chartHost.style.opacity='1';});
  }

  function finishChartOnce(){
    requestAnimationFrame(function(){
      try{
        if(PAGE==='page2'&&typeof window.update==='function')window.update(false);
        else if(PAGE==='page2'&&typeof window.updateBlockChart==='function')window.updateBlockChart();
        else if(PAGE==='page3'&&typeof window.updateChart==='function')window.updateChart();
        var c=window.Chart&&Chart.getChart?Chart.getChart('myChart'):null;
        if(c&&typeof c.update==='function')c.update('none');
      }catch(e){}
      revealChart();
    });
  }

  function performRestore(){
    if(!incoming){revealChart();return;}
    var chartInstance=null, previousAnimation;
    try{
      chartInstance=window.Chart&&Chart.getChart?Chart.getChart('myChart'):null;
      if(chartInstance){
        previousAnimation=chartInstance.options.animation;
        chartInstance.options.animation=false;
      }
    }catch(e){}
    applyPacket(incoming);
    finishChartOnce();
    setTimeout(function(){
      try{if(chartInstance)chartInstance.options.animation=previousAnimation;}catch(e){}
    },0);
    try{
      if(location.hash.indexOf('p23sync=')!==-1){
        history.replaceState(null,'',location.pathname+location.search);
      }
    }catch(e){}
    incoming=null;
  }

  function restoreOnce(){
    if(restoreStarted||!incoming){revealChart();return;}
    restoreStarted=true;
    var attempts=0;
    var timer=setInterval(function(){
      attempts++;
      if(!slidersReady()){
        if(attempts>160){clearInterval(timer);revealChart();}
        return;
      }
      clearInterval(timer);
      /* Page 3 has delayed controller installers at roughly 300 ms and 1000 ms.
         Waiting past them prevents the first handoff from being overwritten. */
      /* Page 3's final income controller is installed again at 1.8s and 2.2s.
         Apply after both passes so its private max key cannot overwrite the handoff. */
      var settleDelay=PAGE==='page3'?2450:180;
      setTimeout(performRestore,settleDelay);
    },50);
  }

  if(document.readyState==='complete')restoreOnce();
  else window.addEventListener('load',restoreOnce,{once:true});
})();

/* Page 3 slider readout + $25 increment compatibility patch. */
(function(){
  'use strict';
  if(window.__P23_PAGE3_25_STEP_READOUT_V1__) return;
  window.__P23_PAGE3_25_STEP_READOUT_V1__=true;

  var filename=(location.pathname.split('/').pop()||'').toLowerCase();
  if(filename.indexOf('03_')!==0) return;

  function n(v){
    if(Array.isArray(v)) v=v[0];
    v=Number(String(v==null?'':v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(v)?v:0;
  }
  function money(v){
    return '$'+Math.round(n(v)).toLocaleString('en-US');
  }
  function setReadout(id,value){
    var out=document.getElementById(id);
    if(out) out.textContent=money(value);
  }
  function bindSlider(sliderId,readoutId){
    var el=document.getElementById(sliderId);
    if(!el||!el.noUiSlider) return false;
    var s=el.noUiSlider;
    try{
      var value=n(s.get());
      var opts=s.options||{};
      var range=opts.range||{min:0,max:Math.max(25,value)};
      var min=n(range.min), max=n(range.max);
      if(max<value) max=value;
      s.updateOptions({range:{min:min,max:max},step:25,animate:false,animationDuration:0},false);
      s.set(Math.round(value/25)*25);
    }catch(e){}
    if(!el.dataset.p23ReadoutBound){
      el.dataset.p23ReadoutBound='1';
      try{s.on('update.p23readout',function(values){setReadout(readoutId,values&&values[0]);});}catch(e){
        try{s.on('update',function(values){setReadout(readoutId,values&&values[0]);});}catch(_e){}
      }
      try{s.on('set.p23readout',function(values){setReadout(readoutId,values&&values[0]);});}catch(e){}
    }
    try{setReadout(readoutId,s.get());}catch(e){}
    return true;
  }
  function apply(){
    /* All money sliders on Page 3 use exact $25 increments. */
    bindSlider('income-slider','income-slider-value');
    bindSlider('existing-slider','existing-value');
    bindSlider('contrib-slider','contrib-value');
    bindSlider('existing-roth-slider','existing-roth-value');
    bindSlider('roth-slider','roth-value');

    try{
      localStorage.setItem('sync_monthly_income_step','25');
      localStorage.setItem('sync_monthly_401k_step','25');
      localStorage.setItem('sync_monthly_roth_step','25');
    }catch(e){}
  }

  document.addEventListener('DOMContentLoaded',apply);
  window.addEventListener('load',apply);
  [0,100,300,700,1200,1800,2600,3500].forEach(function(ms){setTimeout(apply,ms);});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)apply();});
})();
