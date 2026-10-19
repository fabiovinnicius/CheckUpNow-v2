document.addEventListener('DOMContentLoaded',()=>{
const form=document.getElementById('doctor-login-form');const password=document.getElementById('password');
document.getElementById('toggle-password')?.addEventListener('change',event=>password.type=event.target.checked?'text':'password');
form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Entrando...';try{const response=await fetch('/api/doctor/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('doctor-email').value,password:password.value})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'Não foi possível entrar.');location.href='doctor-dashboard.html'}catch(error){alert(error.message);button.disabled=false;button.textContent='Entrar no Consultório'}})
});
