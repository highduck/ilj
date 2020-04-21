!function(){"use strict";var t=function(t){var e="function"==typeof Symbol&&Symbol.iterator,r=e&&t[e],h=0;if(r)return r.call(t);if(t&&"number"==typeof t.length)return{next:function(){return t&&h>=t.length&&(t=void 0),{value:t&&t[h++],done:!t}}};throw new TypeError(e?"Object is not iterable.":"Symbol.iterator is not defined.")};function e(t,e){return t.x<e.x+e.w&&t.x+t.w>e.x&&t.y<e.y+e.h&&t.y+t.h>e.y}function r(t,e){return t.x<=e.x&&t.y<=e.y&&t.x+t.w>=e.x+e.w&&t.y+t.h>=e.y+e.h}function h(t,h){for(var i=t.length,n=0;n<i;++n){var o=t[n];if(e(h,o)){if(r(o,h))return;r(h,o)&&(t.splice(n,1),--i,--n)}}t.push(h)}function i(t,r,i){if(e(i,r)){if(i.x<r.x+r.w&&i.x+i.w>r.x){var n=r.y+r.h;i.y>r.y&&i.y<n&&h(t,{x:r.x,y:r.y,w:r.w,h:i.y-r.y});var o=i.y+i.h;o<n&&h(t,{x:r.x,y:o,w:r.w,h:n-o})}if(i.y<r.y+r.h&&i.y+i.h>r.y){i.x>r.x&&i.x<r.x+r.w&&h(t,{x:r.x,y:r.y,w:i.x-r.x,h:r.h});var a=i.x+i.w,l=r.x+r.w;a<l&&h(t,{x:a,y:r.y,w:l-a,h:r.h})}}else h(t,r)}var n=function(){function e(){this.x=0,this.y=0,this.w=0,this.h=0,this.free=[],this.used=[]}return e.prototype.resize=function(t,e){this.x=0,this.y=0,this.w=t,this.h=e},e.prototype.reset=function(){this.used.length=0,this.free.length=0,this.free.push({x:this.x,y:this.y,w:this.w,h:this.h})},e.prototype.choose=function(e,r,h,i,n){var o,a;e.matched=!1;try{for(var l=t(this.free),f=l.next();!f.done;f=l.next()){var s=f.value;s.w>=r&&s.h>=h&&i(e,s,r,h),n&&s.w>=h&&s.h>=r&&i(e,s,h,r)}}catch(t){o={error:t}}finally{try{f&&!f.done&&(a=l.return)&&a.call(l)}finally{if(o)throw o.error}}},e.prototype.place=function(e){var r,h,n=[];try{for(var o=t(this.free),a=o.next();!a.done;a=o.next()){i(n,a.value,e)}}catch(t){r={error:t}}finally{try{a&&!a.done&&(h=o.return)&&h.call(o)}finally{if(r)throw r.error}}this.free=n,this.used.push(e)},e}();function o(t,e,r,h){var i=h+e.y;(i<t.A||i===t.A&&e.x<t.B)&&(t.x=e.x,t.y=e.y,t.w=r,t.h=h,t.A=i,t.B=e.x,t.matched=!0)}function a(t,e,r,h){var i=e.w-r,n=e.h-h,o=Math.min(i,n),a=Math.max(i,n);(o<t.A||o===t.A&&a<t.B)&&(t.x=e.x,t.y=e.y,t.w=r,t.h=h,t.A=o,t.B=a,t.matched=!0)}function l(t,e,r,h){var i=e.w-r,n=e.h-h,o=Math.min(i,n),a=Math.max(i,n);(a<t.B||a===t.B&&o<t.A)&&(t.x=e.x,t.y=e.y,t.w=r,t.h=h,t.A=o,t.B=a,t.matched=!0)}function f(t,e,r,h){var i=e.w-r,n=e.h-h,o=Math.min(i,n),a=e.w*e.h-r*h;(a<t.B||a===t.B&&o<t.A)&&(t.x=e.x,t.y=e.y,t.w=r,t.h=h,t.A=o,t.B=a,t.matched=!0)}function s(t,e,r,h){return e<r||h<t?0:(e<h?e:h)-(t>r?t:r)}function y(t){return function(e,r,h,i){var n=4294967295,o=r.x,a=r.y;o!==t.x&&o+h!==t.x+t.w||(n-=i),a!==t.y&&a+i!==t.y+t.h||(n-=h);for(var l=e.A,f=0,y=t.used.length;f<y&&n>=l;++f){var c=t.used[f];c.x!==o+h&&c.x+c.w!==o||(n-=s(c.y,c.y+c.h,a,a+i)),c.y!==a+i&&c.y+c.h!==a||(n-=s(c.x,c.x+c.w,o,o+h))}n<l&&(e.x=o,e.y=a,e.w=h,e.h=i,e.A=n,e.matched=!0)}}var c=function(){function t(t,e){void 0===t&&(t=32768),void 0===e&&(e=32768),this.maxWidth=t,this.maxHeight=e,this.maxRects=new n,this.w=0,this.h=0,this.rects=[],this.flags=[],this.userData=[]}return t.prototype.add=function(t,e,r,h){if(t>0&&e>0){var i=Math.max(0,t+r<<1),n=Math.max(0,e+r<<1);if(i<=this.maxWidth&&n<=this.maxHeight)return this.rects.push({x:0,y:0,w:i,h:n}),this.userData.push(h),this.flags.push(0),!0}return!1},Object.defineProperty(t.prototype,"size",{get:function(){return this.rects.length},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"empty",{get:function(){return 0===this.rects.length},enumerable:!0,configurable:!0}),t.prototype.isPacked=function(t){return 0!=(1&this.flags[t])},t.prototype.isRotated=function(t){return 0!=(2&this.flags[t])},t}();function x(t,e,r,h,i){t.reset();for(var n=0;n<r.length;++n)r[n]=0;for(var o,a={x:0,y:0,w:0,h:0,A:0,B:0,matched:!1},l=e.length,f=0;f<l;++f){(o=a).x=o.y=o.w=o.h=0,o.A=o.B=4294967295,o.matched=!1;var s=-1;for(n=0;n<l;++n)if(0==(1&r[n])){var y=e[n];t.choose(a,y.w,y.h,h,i),a.matched&&(s=n)}if(s<0)return!1;t.place({x:a.x,y:a.y,w:a.w,h:a.h});var c=e[s];c.x=a.x,c.y=a.y,r[s]|=c.w!==a.w?3:1}return!0}function u(t){var e=t.w;t.w=t.h<<1,t.h=e}function w(e,r,h){var i,n,s=e.rects,c=e.flags,u=e.maxRects;u.resize(e.w,e.h);var w=[f,y(u),o,l,a];if(r>=1)return x(u,s,c,w[(r-1)%w.length],h);try{for(var d=t(w),m=d.next();!m.done;m=d.next()){if(x(u,s,c,m.value,h))return!0}}catch(t){i={error:t}}finally{try{m&&!m.done&&(n=d.return)&&n.call(d)}finally{if(i)throw i.error}}return!1}function d(e,r,h){for(e.w=e.h=32,function(t,e,r,h){for(;e>t.w*t.h&&(t.h<h||t.w<r);)u(t)}(e,function(e){var r,h,i=0;try{for(var n=t(e),o=n.next();!o.done;o=n.next()){var a=o.value;i+=a.w*a.h}}catch(t){r={error:t}}finally{try{o&&!o.done&&(h=n.return)&&h.call(n)}finally{if(r)throw r.error}}return i}(e.rects),e.maxWidth,e.maxHeight);!w(e,r,h);){if(e.h>=e.maxHeight&&e.w>=e.maxWidth)return!1;u(e)}return!0}for(var m=["any","best area fit","contact point","bottom-left","best long-side fit","best short-side fit"],v={w:0,h:0,bw:0,bh:0,method:0,time:0,flip:!0},p=new c,g=0;g<150;++g)p.add(Math.round(5+.75*g*Math.random()),Math.round(5+.75*g*Math.random()),1,void 0);function b(){var t=performance.now();d(p,v.method,v.flip),v.time=performance.now()-t,v.w=p.w,v.h=p.h,v.bw=0,v.bh=0;for(var e=0;e<p.rects.length;++e){var r=p.rects[e],h=r.x+r.w,i=r.y+r.h;p.isRotated(e)&&(h=r.x+r.h,i=r.y+r.w),h>v.bw&&(v.bw=h),i>v.bh&&(v.bh=i)}}b(),setInterval((function(){++v.method,v.method>=m.length&&(v.method=0,v.flip=!v.flip),b()}),1500);var P=document.getElementById("gameview");P.width=2048,P.height=2048;var A=window.devicePixelRatio;P.style.width=P.width/A+"px",P.style.height=P.height/A+"px";var B=P.getContext("2d",{alpha:!1});!function t(e){!function(){B.clearRect(0,0,P.width,P.height),B.strokeStyle="#000",B.beginPath(),B.rect(0,0,p.w,p.h),B.closePath(),B.fillStyle="#8B8",B.fill(),B.stroke(),B.beginPath(),B.rect(0,0,v.bw,v.bh),B.closePath(),B.fillStyle="#999",B.fill();for(var t=0;t<p.rects.length;++t)if(p.isPacked(t)){var e=p.rects[t];p.isRotated(t)?(B.beginPath(),B.rect(e.x+2,e.y+2,e.h-4,e.w-4),B.closePath(),B.fillStyle="#993",B.fill(),B.stroke(),B.beginPath(),B.moveTo(e.x,e.y+.5*e.w),B.lineTo(e.x+.5*e.h,e.y+.5*e.w),B.closePath(),B.stroke()):(B.beginPath(),B.rect(e.x+2,e.y+2,e.w-4,e.h-4),B.closePath(),B.fillStyle="#393",B.fill(),B.stroke(),B.beginPath(),B.moveTo(e.x+.5*e.w,e.y),B.lineTo(e.x+.5*e.w,e.y+.5*e.h),B.closePath(),B.stroke())}B.font="bold 38px arial",B.fillStyle="#000",B.fillText("Method #"+v.method+": "+m[v.method],10,p.h+40),B.fillText("Allow Flip: "+v.flip,10,p.h+80),B.fillText("Fill: "+100*v.w*v.h/(v.bw*v.bh),10,p.h+120),B.fillText("Time: "+v.time+" ms",10,p.h+160)}(),requestAnimationFrame(t)}()}();//# sourceMappingURL=index.js.map
