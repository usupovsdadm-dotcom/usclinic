(function(){var w=document.getElementById('htw'),cv=document.getElementById('htCv');if(!w||!cv)return;
var N=46,mob=matchMedia('(max-width:760px)').matches,dir=mob?'m':'d',W=mob?720:1080,H=Math.round(W*1660/1244);
cv.width=W;cv.height=H;var cx=cv.getContext('2d'),imgs=[],cur=-1,shown=0,base='assets/img/headturn/'+dir+'/f';
function prog(){var r=w.getBoundingClientRect(),t=r.height-innerHeight;return t>0?Math.min(1,Math.max(0,-r.top/t)):0}
function ok(i){return imgs[i]&&imgs[i].complete&&imgs[i].naturalWidth}
function draw(){var t=prog()*(N-1);shown+=(t-shown)*.25;if(Math.abs(t-shown)<.3)shown=t;var j=Math.round(shown);
 while(j>0&&!ok(j))j--;if(!ok(j))return;if(j!==cur){cx.clearRect(0,0,W,H);cx.drawImage(imgs[j],0,0,W,H);cur=j}}
function load(i){var im=new Image();im.decoding='async';im.src=base+String(i+1).padStart(3,'0')+'.webp?v=1';imgs[i]=im;return im}
load(0).onload=function(){for(var i=1;i<N;i++)load(i);cur=-1};
var dot=document.getElementById('htDot'),red=matchMedia('(prefers-reduced-motion:reduce)').matches;
(function loop(ts){var a=(ts||0)/1000*.5;if(dot&&!red){dot.setAttribute('cx',(610+430*Math.cos(a)).toFixed(1));dot.setAttribute('cy',(540+400*Math.sin(a)).toFixed(1))}draw();requestAnimationFrame(loop)})();
})();
