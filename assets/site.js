(function(){
  var c=window.PORTFOLIO_CONFIG||{};
  // mobile menu
  var btn=document.getElementById('mobile-menu-btn'),menu=document.getElementById('mobile-menu');
  if(btn&&menu){btn.addEventListener('click',function(){menu.classList.toggle('hidden')});}
  // navbar shadow
  var nav=document.getElementById('navbar');
  window.addEventListener('scroll',function(){if(nav)nav.classList.toggle('shadow-md',window.scrollY>50)});
  // year
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear()});
  // contact details from config
  document.querySelectorAll('[data-email]').forEach(function(e){e.textContent=c.email;e.href='mailto:'+c.email});
  document.querySelectorAll('[data-phone]').forEach(function(e){e.textContent=c.phone;e.href='tel:'+c.phone.replace(/\s/g,'')});
  document.querySelectorAll('[data-mailto]').forEach(function(e){e.href='mailto:'+c.email+'?subject='+encodeURIComponent('Portfolio enquiry')});
  document.querySelectorAll('[data-github]').forEach(function(e){e.href=c.github;e.target='_blank';e.rel='noopener'});
  // social icons
  function social(sel,cls){
    document.querySelectorAll(sel).forEach(function(box){
      var items=[];
      if(c.github)items.push([c.github,'fab fa-github']);
      if(c.linkedin)items.push([c.linkedin,'fab fa-linkedin-in']);
      if(c.email)items.push(['mailto:'+c.email,'fas fa-envelope']);
      box.innerHTML=items.map(function(i){return '<a href="'+i[0]+'" target="_blank" rel="noopener" class="'+cls+'"><i class="'+i[1]+'"></i></a>'}).join('');
    });
  }
  social('[data-social]','hover:text-indigo-400 transition');
  social('[data-social-light]','hover:text-indigo-600 transition');
  social('[data-social-round]','w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-indigo-600 transition');
  // contact form -> WhatsApp
  var form=document.getElementById('contact-form');
  if(form){form.addEventListener('submit',function(e){
    e.preventDefault();
    var n=document.getElementById('name').value.trim(),m=document.getElementById('message').value.trim();
    var text='Hi Pranav, I am '+n+'.\n'+m;
    window.open('https://wa.me/'+c.whatsappNumber+'?text='+encodeURIComponent(text),'_blank');
  });}
})();
