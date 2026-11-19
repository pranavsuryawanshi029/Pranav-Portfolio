(function(){
  var c=window.PORTFOLIO_CONFIG||{};
  if(!c.whatsappNumber)return;
  var a=document.createElement('a');
  a.className='whatsapp-float';a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','Chat on WhatsApp');
  a.href='https://wa.me/'+c.whatsappNumber+'?text='+encodeURIComponent(c.whatsappDefaultText||'');
  a.innerHTML='<i class="fab fa-whatsapp"></i>';
  document.body.appendChild(a);
})();
