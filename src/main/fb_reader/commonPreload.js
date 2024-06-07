
document.addEventListener('DOMContentLoaded',async ()=>{

    document.querySelectorAll('.__fb-light-mode').forEach(parent=>{
      parent.classList.remove('__fb-light-mode');
      parent.classList.add('__fb-dark-mode');
    });
  
  
    setTimeout(()=>{
      document.querySelectorAll('.__fb-light-mode').forEach(parent=>{
        parent.classList.remove('__fb-light-mode');
        parent.classList.add('__fb-dark-mode');
      });
    },5000)
  
  });
  