const logoutButton = document.getElementById('log-out')
logoutButton.addEventListener('click', () => {
  fetch('/admin/log-out')
    .then(response => response.json())
    .then(data => {
      if ('status' in data) {
        if (data.status === 'OK') {
          window.location.href = './index.html'
        }
      }
      window.location.href = './index.html'
    })
})
