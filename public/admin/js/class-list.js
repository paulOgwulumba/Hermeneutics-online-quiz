//  Checks if session already exists, if not, a redirect to the log in page is triggered
fetch('/admin/session')
  .then(response => response.json())
  .then(data => {
    if (data.status !== 'OK') {
      window.location.href = './index.html'
    }
  })

//  Variable for saving the class list
let classList = []

//  Event listeners for the confirmation prompt box that pops up when the admin wants to delete a student's info
let prevYesListener = () => {}
let prevNoListener = () => {}

//  Fetches the class list from the server
fetch('/admin/students')
  .then(response => response.json())
  .then(data => {
    classList = data

    //  Sorts the classlist in alphabetical order
    classList.sort((a, b) => {
      return sort(a.name, b.name)
    })

    //  Organises the classlist in a tabular form for display
    generateTable(classList)
  })
  .catch(() => {
    //  If the server does not response, an error message is displayed and the table disappears from the screen
    show('error-message')
    hide('table')
  })

/**
 * This function takes the data gotten from the server and displays it on a table on the webpage.
 * @param {*data Array holding information to be displayed on table
 */
async function generateTable (data = []) {
  //  The variable representing the body of the table
  let tbody = document.getElementById('tbody')

  //  Removes the former tbody element
  tbody.remove()

  //  Creates a new tbody
  tbody = document.createElement('tbody')
  tbody.id = 'tbody'

  //  A counter used to give each new row a unique id

  for (const row of data) {
    //  variable representing the delete button of the new row
    const button = document.createElement('button')
    button.className = 'btn btn-outline-danger'
    button.type = 'button'
    button.textContent = 'Delete'
    button.id = row._id
    button.addEventListener('click', (event) => { deleteUser(button.id) })

    //  variable representing the new row
    const newRow = document.createElement('tr')
    newRow.id = 'row' + row._id

    // variables representing the columns of the new row
    // eslint-disable-next-line camelcase
    const s_n = document.createElement('td')
    const name = document.createElement('td')
    // eslint-disable-next-line camelcase
    const student_id = document.createElement('td')
    const email = document.createElement('td')
    // eslint-disable-next-line camelcase
    const mobile_number = document.createElement('td')
    const buttonTd = document.createElement('td')

    //  Passing their values to them
    s_n.textContent = data.indexOf(row) + 1
    name.textContent = row.name
    student_id.textContent = row.student_id
    email.textContent = row.email
    mobile_number.textContent = row.mobile_number
    buttonTd.appendChild(button)

    // Changing colour of email address text to blue if email has been sent to student before
    try {
      if (row.email_status === 'sent') {
        email.className += 'text-info'
      }
    } catch (e) {}

    //  fetching student session info from server to apply appropriate color scheme to student name
    //  "not taken" = red, "in session" = orange, "taken" = green
    await fetch(`/admin/student/session/${row._id}`)
      .then(response => response.json())
      .then(data => {
        const status = data.exam_status
        switch (status) {
          case 'not taken':
            name.className = ''
            break
          case 'in session':
            name.className = 'text-warning'
            break
          default:
            name.className = 'text-success'
            break
        }
      })
      .catch(e => {})

    //  Appending the columns to the new row
    newRow.appendChild(s_n)
    newRow.appendChild(name)
    newRow.appendChild(student_id)
    newRow.appendChild(email)
    newRow.appendChild(mobile_number)
    newRow.appendChild(buttonTd)

    //  triger redirect if student info is clicked on
    s_n.addEventListener('click', (event) => { redirectToExams(button.id) })
    name.addEventListener('click', (event) => { redirectToExams(button.id) })
    student_id.addEventListener('click', (event) => { redirectToExams(button.id) })
    email.addEventListener('click', (event) => { redirectToExams(button.id) })
    mobile_number.addEventListener('click', (event) => { redirectToExams(button.id) })

    //  appending the new row to the table body
    tbody.appendChild(newRow)

    document.getElementsByTagName('table')[0].appendChild(tbody)
  }
}

/**
 * Deletes a student's information from the database and regenerates the table with
 * updated information.
 * @param {*id The database id of the student whose information is to be deleted.
 */
function deleteUser (id = '') {
  //  prompt box that gets confirmation from the admin to delete the user info
  const promptBox = document.getElementById('prompt-box')

  //  displays the promptbox
  promptBox.className = promptBox.className.replace('hide', '')

  //  buttons on the promptbox
  const yesButton = document.getElementById('button-yes')
  const noButton = document.getElementById('button-no')

  //  removes former event listeners of the promptbox
  yesButton.removeEventListener('click', prevYesListener)
  noButton.removeEventListener('click', prevNoListener)

  //  creates new eventlisteners for the promptbox
  prevYesListener = (event) => {
    promptBox.className += ' hide'
    const opt = {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ _id: id })
    }

    fetch('/admin/student', opt)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'OK') {
          shaveArray(id)
          generateTable(classList)
        } else {
          alert('Something went wrong.')
        }
      })
  }

  prevNoListener = (event) => {
    promptBox.className += ' hide'
  }

  yesButton.addEventListener('click', prevYesListener)
  noButton.addEventListener('click', prevNoListener)
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
 * Deletes student information corresponding to the given *id* from the classList array.
 * @param {*id The database id of the element of the array to be deleted.
 */
function shaveArray (id = '') {
  const newList = []
  for (const list of classList) {
    if (list._id !== id) {
      newList.push(list)
    }
  }

  classList = newList

  //  sorts the classlist in alphabetical order
  classList.sort((a, b) => {
    const firstA = a.name.split('')[0]
    const firstB = b.name.split('')[0]

    if (firstA === firstB) {
      return 0
    } else if (firstA > firstB) {
      return 1
    } else {
      return -1
    }
  })
}

/**
 * Redirects the user to the examination web page.
 * @param {*id id to append to url of exam web page as a query string.
 */
function redirectToExams (id = '') {
  window.location.href = `./exam.html?${id}`
}

/**
 * This compares two strings a and b to know which is higher in alphabetical order.
 * @param {*a The first string.
 * @param {*b The second string.
 * @returns *1* if a is greater than b in alphabetical order.
 * @returns *-1* if a is less than b in alphabetical order.
 * @returns *0* if a and b are equal.
 */
function sort (a = '', b = '') {
  const arrayA = a.split('')
  const arrayB = b.split('')

  if (arrayA[0] > arrayB[0]) {
    return 1
  }

  if (arrayA[0] < arrayB[0]) {
    return -1
  }

  if (arrayA[0] === arrayB[0]) {
    if (a.length > 1 && b.length > 1) {
      return sort(a.substring(1), b.substring(1))
    } else {
      return 0
    }
  }
}
