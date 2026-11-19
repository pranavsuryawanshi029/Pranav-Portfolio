(function(){
  var c=window.PORTFOLIO_CONFIG||{};
  var toggle=document.createElement('button');
  toggle.id='chat-toggle';toggle.setAttribute('aria-label','Open chat');toggle.innerHTML='<i class="fas fa-robot"></i>';
  var box=document.createElement('div');box.className='chat-container';
  box.innerHTML='<div class="chat-header"><span><i class="fas fa-robot"></i> <b>Pranav\u2019s Assistant</b></span><button id="close-chat" aria-label="Close"><i class="fas fa-times"></i></button></div>'
   +'<div class="chat-body" id="chat-messages"><div class="message bot-msg">Hello! I\u2019m Pranav\u2019s virtual assistant. Ask me about projects, skills, education or contact info.</div></div>'
   +'<div class="chat-input-area"><input type="text" id="chat-input" placeholder="Type a message..."><button id="send-chat" aria-label="Send"><i class="fas fa-paper-plane"></i></button></div>';
  document.body.appendChild(toggle);document.body.appendChild(box);
  var msgs=box.querySelector('#chat-messages'),input=box.querySelector('#chat-input');
  toggle.onclick=function(){box.style.display='flex';toggle.style.display='none';input.focus()};
  box.querySelector('#close-chat').onclick=function(){box.style.display='none';toggle.style.display='flex'};
  function add(t,u){var d=document.createElement('div');d.className='message '+(u?'user-msg':'bot-msg');d.textContent=t;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}
  function has(s,words){return words.some(function(w){return new RegExp('\\b'+w,'i').test(s)})}
  function reply(s){
    if(has(s,['hello','hi','hey','namaste']))return 'Hello! How can I help you with Pranav\u2019s portfolio?';
    if(has(s,['project','work','portfolio']))return 'Pranav has built Smart Flat Portal (PHP, MySQL) and Online Book Store (HTML, CSS, JS). See the Projects page for details.';
    if(has(s,['skill','tech','language','java','php']))return 'Pranav knows Java, PHP, MySQL, HTML, CSS, JavaScript, Bootstrap and Git & GitHub.';
    if(has(s,['education','study','college','mca','bca','degree']))return 'Pranav is pursuing MCA at IMED, Bharati Vidyapeeth, Pune, and completed BCA in 2026.';
    if(has(s,['contact','email','phone','call','whatsapp','reach']))return 'Email: '+c.email+'  |  Phone: '+c.phone+'. You can also use the Contact page or WhatsApp button.';
    if(has(s,['job','hire','internship','opportunit']))return 'Pranav is open to internships, collaborations and entry-level software development opportunities. Please use the Contact page!';
    return 'I\u2019m not sure about that. Try asking about projects, skills, education or contact info!';
  }
  function send(){var t=input.value.trim();if(!t)return;add(t,true);input.value='';setTimeout(function(){add(reply(t),false)},500)}
  box.querySelector('#send-chat').onclick=send;
  input.addEventListener('keydown',function(e){if(e.key==='Enter')send()});
})();
