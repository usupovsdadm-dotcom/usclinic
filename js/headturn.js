(function(){var w=document.getElementById('htw'),cv=document.getElementById('htCv');if(!w||!cv)return;
var N=46,mob=matchMedia('(max-width:760px)').matches,dir=mob?'m':'d',W=mob?720:1080,H=Math.round(W*1660/1244);
cv.width=W;cv.height=H;var cx=cv.getContext('2d'),fr=[],cur=-1,shown=0,base='assets/img/headturn/'+dir+'/f',raf=0,vis=true;
function prog(){var r=w.getBoundingClientRect(),t=r.height-innerHeight;return t>0?Math.min(1,Math.max(0,-r.top/t)):0}
function get(i){while(i>0&&!fr[i])i--;return fr[i]?i:-1}
function paint(){var j=get(Math.round(shown));if(j<0||j===cur)return;cx.clearRect(0,0,W,H);cx.drawImage(fr[j],0,0,W,H);cur=j}
function step(){raf=0;var t=prog()*(N-1),d=t-shown;shown=Math.abs(d)<.3?t:shown+d*.25;paint();if(shown!==t)raf=requestAnimationFrame(step)}
function kick(){if(!raf)raf=requestAnimationFrame(step)}
addEventListener('scroll',kick,{passive:true});addEventListener('resize',function(){kick();lay()},{passive:true});
function load(i){var im=new Image();im.decoding='async';im.src=base+String(i+1).padStart(3,'0')+'.webp?v=1';
 return (im.decode?im.decode():new Promise(function(r){im.onload=r})).then(function(){return window.createImageBitmap?createImageBitmap(im):im}).then(function(b){fr[i]=b;if(Math.abs(i-shown)<1.5||i===0){cur=-1;paint()}}).catch(function(){fr[i]=im})}
load(0).then(function(){var k=1;(function next(){if(k>=N)return;var a=[];for(var n=0;n<4&&k<N;n++,k++)a.push(load(k));Promise.all(a).then(next)})();kick()});
/* rolling dot: composited transform only */
var pt=document.getElementById('htPt'),box=pt&&pt.parentElement,red=matchMedia('(prefers-reduced-motion:reduce)').matches,S=1,OX=0,dr=0,C=Math.cos(10*Math.PI/180),Sn=Math.sin(10*Math.PI/180);
function lay(){if(!box)return;var bw=box.clientWidth,bh=box.clientHeight;S=Math.max(bw/1244,bh/1660);OX=(bw-1244*S)/2}
function place(ts){var a=ts/1000*.5,x=430*Math.cos(a),y=400*Math.sin(a),X=610+x*C-y*Sn,Y=540+x*Sn+y*C;pt.style.transform='translate3d('+(OX+X*S).toFixed(1)+'px,'+(Y*S).toFixed(1)+'px,0)'}
function dot(ts){dr=0;if(!vis||document.hidden)return;place(ts);dr=requestAnimationFrame(dot)}
function run(){if(!pt)return;if(red){place(0);return}if(vis&&!document.hidden&&!dr)dr=requestAnimationFrame(dot)}
lay();run();document.addEventListener('visibilitychange',run);
if('IntersectionObserver'in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;run()}).observe(w);
})();
/* pause decorative CSS animations while off-screen */
(function(){if(!('IntersectionObserver'in window))return;var els=document.querySelectorAll('.gold-text .w>span,.gold-text,.contacts__card,.booking__glow,.svc--cta__ring,.ring--b');
var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('anim-off',!e.isIntersecting)})},{rootMargin:'100px'});
Array.prototype.forEach.call(els,function(el){io.observe(el)});})();
