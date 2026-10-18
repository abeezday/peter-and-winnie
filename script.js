'use strict';
const WEDDING_DATE = new Date('2027-03-21T12:00:00+08:00');
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEJMPXuXG0hGmmnW0P4NS0hZIP3cbhS_-7fBomIpBpGEjzQPyIwtE2PCSb4qrlQbg5/exec';
const MUSIC_START = 27;
const $ = id => document.getElementById(id);
function updateCountdown(){
  const total=Math.max(0,Math.floor((WEDDING_DATE-Date.now())/1000));
  [Math.floor(total/86400),Math.floor(total%86400/3600),Math.floor(total%3600/60),total%60].forEach((v,i)=>{ $('days hours minutes seconds'.split(' ')[i]).textContent=String(v).padStart(2,'0'); });
}
updateCountdown();setInterval(updateCountdown,1000);
const form=$('rsvpForm');let step=1;let submitting=false;
const radio=name=>form.querySelector(`input[name="${name}"]:checked`)?.value||'';
const value=name=>form.elements.namedItem(name).value.trim();
function conditions(){
  const yes=radio('attendance')==='yes';
  $('attendingFields').hidden=!yes;
  $('step3Title').textContent=yes?'出席資訊':'留下祝福';
  $('emailField').hidden=!(yes&&radio('invitation')==='digital');
  $('addressField').hidden=!(yes&&radio('invitation')==='printed');
}
function setStep(next){step=next;document.querySelectorAll('.form-step').forEach(el=>el.classList.toggle('active',+el.dataset.step===step));$('stepLabel').textContent=`Step ${step} of 3`;$('progressBar').style.width=`${step/3*100}%`;$('prevBtn').style.visibility=step===1?'hidden':'visible';$('nextBtn').hidden=step===3;$('submitBtn').hidden=step!==3;$('formError').textContent='';conditions();}
function validate(){
  let error='';
  if(step===1){if(!value('guestName'))error='請填寫您的姓名。';else if(!radio('relationship'))error='請選擇與新人的關係。';}
  if(step===2&&!radio('attendance'))error='請選擇是否出席。';
  if(step===3&&radio('attendance')==='yes'){
    if(+value('adult')<1)error='大人出席人數須包含您自己。';
    else if(+value('vegetarian')>+value('adult')+ +value('child'))error='素食需求人數不能超過總出席人數。';
    else if(!radio('invitation'))error='請選擇是否需要喜帖。';
    else if(radio('invitation')==='digital'&&(!value('email')||!form.elements.email.validity.valid))error='請填寫有效的電子喜帖寄送 Email。';
    else if(radio('invitation')==='printed'&&!value('address'))error='請填寫紙本喜帖寄送地址。';
  }
  $('formError').textContent=error;return !error;
}
function payload(){
  const yes=radio('attendance')==='yes', invitation=yes?radio('invitation'):'none';
  return {name:value('guestName'),relationship:radio('relationship'),attendance:yes?'當然，一定到! Yes, I will be there 😀':'無法參加，但我想留下給你們的祝福 Sorry to miss out 😭',adult:yes?value('adult'):'0',child:yes?value('child'):'0',chair:yes?value('chair'):'0',vegetarian:yes?value('vegetarian'):'0',invitation:({digital:'電子喜帖',printed:'紙本喜帖',none:'不需要喜帖'})[invitation],email:invitation==='digital'?value('email'):'',address:invitation==='printed'?value('address'):'',message:value('message')};
}
form.addEventListener('change',conditions);
$('nextBtn').onclick=()=>{if(validate())setStep(Math.min(step+1,3));};
$('prevBtn').onclick=()=>{if(!submitting)setStep(Math.max(step-1,1));};
form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting||!validate())return;
  if(step<3){setStep(step+1);return;}
  const data=payload();submitting=true;$('submitBtn').disabled=true;$('prevBtn').disabled=true;$('submitBtn').textContent='送出中…';
  try{
    // The existing Apps Script accepts JSON via a simple POST. An opaque response
    // cannot confirm that appendRow succeeded; verify the destination Sheet before launch.
    await fetch(APPS_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
    form.hidden=true;document.querySelector('.step-meta').hidden=true;
    $('responseCopy').textContent='我們期待在\n2027.03.21\n與您相見';
    $('successMessage').hidden=false;
  }catch(error){$('formError').textContent='連線中斷，無法確認是否送達。請先聯絡新人確認，避免重複填寫。';submitting=false;$('submitBtn').disabled=false;$('prevBtn').disabled=false;$('submitBtn').textContent='重新送出';}
});setStep(1);
const music=$('weddingMusic');let musicStarted=false;
function seekStart(){music.currentTime=MUSIC_START;}
async function playMusic(){
  if(!musicStarted){
    if(music.readyState>=1)seekStart();
    else music.addEventListener('loadedmetadata',seekStart,{once:true});
  }
  music.volume=.35;
  try{await music.play();musicStarted=true;$('musicStatus').textContent='';}
  catch(error){$('musicStatus').textContent='音樂暫時無法播放，可稍後按右下角重試。';}
}
function closeWelcome(){$('musicWelcome').hidden=true;$('musicToggle').hidden=false;document.body.style.overflow='';document.querySelector('.hero .primary-btn').focus({preventScroll:true});}
$('playMusicBtn').onclick=()=>{$('playMusicBtn').disabled=true;playMusic();closeWelcome();};
$('skipMusicBtn').onclick=()=>{music.pause();closeWelcome();};
$('musicToggle').onclick=()=>{if(music.paused)playMusic();else music.pause();};
music.addEventListener('play',()=>{$('musicToggle').textContent='暫停音樂';$('musicToggle').setAttribute('aria-pressed','true');});
music.addEventListener('pause',()=>{$('musicToggle').textContent='播放音樂';$('musicToggle').setAttribute('aria-pressed','false');});
music.addEventListener('ended',()=>{seekStart();playMusic();});
document.body.style.overflow='hidden';$('playMusicBtn').focus();
$('musicWelcome').addEventListener('keydown',event=>{if(event.key==='Escape'){$('skipMusicBtn').click();}if(event.key==='Tab'){const target=event.shiftKey?$('playMusicBtn'):$('skipMusicBtn');if(document.activeElement===target){event.preventDefault();(event.shiftKey?$('skipMusicBtn'):$('playMusicBtn')).focus();}}});
