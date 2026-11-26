var $=function(i){return document.getElementById(i)};
var db=null,uid=null,uapi=null,posts=[],filter="All",names={};
var types=["All","Question","Tip","Resource","Study group"];
function notice(t){var n=$("notice");n.textContent=t;n.hidden=!t}
var fb=$("filters");
types.forEach(function(t){var b=document.createElement("button");b.className="tab";b.textContent=t;b.setAttribute("aria-pressed",t==="All");
 b.onclick=function(){filter=t;[].forEach.call(fb.children,function(x){x.setAttribute("aria-pressed",x===b)});render()};fb.appendChild(b)});
function ago(ts){var m=Math.floor((Date.now()-ts)/60000);if(m<1)return"just now";if(m<60)return m+" min ago";var h=Math.floor(m/60);if(h<24)return h+" h ago";return Math.floor(h/24)+" d ago"}
function render(){
 var box=$("posts");box.textContent="";
 var list=posts.filter(function(p){return filter==="All"||p.type===filter});
 if(!list.length){var e=document.createElement("p");e.className="meta";e.textContent=db?"Nothing here yet. Be the first to post.":"Posts will appear here once the board connects.";box.appendChild(e);return}
 list.forEach(function(p){
  var d=document.createElement("div");d.className="post";
  var tg=document.createElement("span");tg.className="tag";tg.textContent=p.type;
  var tx=document.createElement("p");tx.textContent=p.text;
  var m=document.createElement("div");m.className="row meta";
  var who=document.createElement("span");who.textContent=(names[p.author]||"A classmate")+" · "+ago(p.ts);
  var likes=Array.isArray(p.likes)?p.likes:[];
  var h=document.createElement("button");h.className="mini";h.textContent="Helpful · "+likes.length;
  h.setAttribute("aria-pressed",likes.indexOf(uid)>-1);
  h.onclick=function(){if(!db||!uid)return;var n=likes.indexOf(uid)>-1?likes.filter(function(x){return x!==uid}):likes.concat(uid);
   db.collection("posts").doc(p.id).update({likes:n}).catch(function(){notice("Could not save that. Try again.")})};
  m.appendChild(who);m.appendChild(h);
  if(uid&&p.author===uid){var x=document.createElement("button");x.className="mini";x.textContent="Delete";
   x.onclick=function(){db.collection("posts").doc(p.id).delete().catch(function(){notice("Could not delete that post.")})};m.appendChild(x)}
  d.appendChild(tg);d.appendChild(tx);d.appendChild(m);box.appendChild(d)});
}
function resolveNames(){
 var ids=[];posts.forEach(function(p){if(p.author&&ids.indexOf(p.author)<0&&!names[p.author])ids.push(p.author)});
 if(!ids.length||!uapi)return;
 uapi.profiles(ids).then(function(ps){ids.forEach(function(i){names[i]=(ps[i]&&ps[i].name)||""});render()}).catch(function(){});
}
function offline(){ $("send").disabled=true;$("text").disabled=true;
 notice("The shared board is off in this view. Open the link while signed in to Claude and ask the page owner for access to post.");render()}
async function init(){
 var timer=setTimeout(function(){if(!db)offline()},10000);
 try{
  if(!window.claude){offline();return}
  db=await window.claude.use("db");uapi=await window.claude.use("user");
  clearTimeout(timer);
  if(!db){offline();return}
  try{uid=uapi?await uapi.id():null}catch(e){}
  db.collection("posts").orderBy("ts","desc").limit(60).onSnapshot(function(s){
   posts=s.docs.map(function(d){var o=d.data()||{};o.id=d.id;return o});render();resolveNames()},
   function(){notice("Could not load posts. Check your connection and reopen the page.")});
 }catch(e){offline()}
}
$("form").addEventListener("submit",function(ev){
 ev.preventDefault();var t=$("text").value.trim();if(!t||!db)return;
 $("send").disabled=true;
 db.collection("posts").add({type:$("type").value,text:t,author:uid,ts:Date.now(),likes:[]})
  .then(function(){$("text").value="";$("status").textContent="Posted."})
  .catch(function(){$("status").textContent="Could not post. You may only have view access."})
  .then(function(){$("send").disabled=false;setTimeout(function(){$("status").textContent=""},3000)});
});
render();init();
