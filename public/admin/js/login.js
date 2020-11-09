const form = document.getElementById('form')

form.addEventListener('submit', (event) => {
  event.preventDefault()

  //  clears the error message from the screen if there is any
  hide('form-response')
  hide('form-empty')

  //  packages the username and password entries into an object
  const obj = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  }

  if (obj.username === '' || obj.password === '') { //  makes sure an empty string is not forwarded to the server
    show('form-empty')
  } else {
    //  prepares the information to be forwarded to the server
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(obj)
    }

    //  forwards the information to the server and handles the response appropriately
    fetch('/admin/log-in', options)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'OK') {
          //  redirects to admin page
          window.location.href = 'admin.html'
        } else {
          show('form-response')
        }
      })
  }
})

/**
 * Hides a given html element from display on the web page if it is on display.
 * @param {*id id of html element to be hidden.
 */
function hide (id = '') {
  const element = document.getElementById(id)
  if (!/^hide$/.test(element.className)) {
    element.className = element.className + ' hide'
  }
}

/**
 * Displays a given html element on the web page if it isn't already on display.
 * @param {*id id of html element to be displayed.
 */
function show (id = '') {
  const element = document.getElementById(id)
  if (/\shide$/.test(element.className)) {
    element.className = element.className.split(' ')[0]
  }
}
