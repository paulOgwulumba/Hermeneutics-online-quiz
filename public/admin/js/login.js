const form = document.getElementById('form');

form.addEventListener("submit", (event) => {
  event.preventDefault()

  const obj = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  }

  console.log(obj)

  const options = {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(obj)
  }

  fetch('/admin/log-in', options)
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })
})