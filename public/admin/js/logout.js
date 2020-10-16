const logout_button = document.getElementById('log-out')
logout_button.addEventListener("click",() => {
  fetch('/admin/log-out')
    .then(response => response.json())
    .then(data => {
      if('status' in data){
        if(data.status === "OK"){
          window.location.href = "./index.html"
        }
      }
      window.location.href = "./index.html"
    })
})