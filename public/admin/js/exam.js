//  checks if session already exists, if not, a redirect to the log in page is triggered
fetch('/admin/session')
  .then(response => response.json())
  .then(data => {
    if (data.status !== 'OK') {
      window.location.href = './index.html'
    }
  })

const noServerResponse = 'No response from server!'
const invalidId = 'Invalid student ID!'

//  Gets the personal information of the student from the server and displays it
//  on the page
const _id = window.location.search.replace('?', '') //  gets the database id attached to the query
fetch(`/admin/student/${_id}`)
  .then(response => response.json())
  .then(data => {
    //  if no student is found in database matching given id, exam questions are retracted and error message is displayed
    if ('status' in data) {
      show('error-message')
      document.getElementById('error-text').textContent = invalidId
      hide('answer-sheet')
      hide('student-info')
    } else {
      document.getElementById('student_name').textContent = data.name
      document.getElementById('student_id').textContent = data.student_id
      try {
        if (!data.email_status) {
          data.email_status = 'Not sent'
        }
        document.getElementById('email').textContent = data.email_status
      } catch (e) {}
      fetchSessionStatus()
      fetchAnswerSheet()
    }
  })
  .catch(e => {
    show('error-message')
    document.getElementById('error-text').textContent = noServerResponse
    hide('answer-sheet')
    hide('student-info')
  })

//  button that sends email to student
document.getElementById('send-email').addEventListener('click', (event) => {
  event.preventDefault()

  fetch(`/admin/student/send-email/${_id}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'OK') {
        alert('Email sent successfully')
      }
    })
})

//  Button that prints out the student answer sheet as a PDF file
const printBtn = document.getElementById('print')

printBtn.addEventListener('click', event => {
  event.preventDefault()
  window.print()
})

/**
 * Gets the exam session information of student from the server and displays it on the web page.
 */
function fetchSessionStatus () {
  fetch(`/admin/student/session/${_id}`)
    .then(response => response.json())
    .then(data => {
      const examStatus = data.exam_status
      document.getElementById('exam_status').textContent = examStatus
      if (data.exam_status === 'taken' || data.exam_status === 'in session') {
        show('more-info')
        document.getElementById('start').textContent = data.time_stamp.start
        document.getElementById('stop').textContent = data.time_stamp.stop
      } else if (data.exam_status === 'not taken') {
        show('more-info2')
      }
    })
}

/**
 * Gets the exam answer sheet of the student from the server and displays it
 */
function fetchAnswerSheet () {
  fetch(`/admin/student/answer-sheet/${_id}`)
    .then(response => response.json())
    .then(data => {
      if ('status' in data) {
        console.log('')
      } else {
        for (let i = 1; i < 100; i++) {
          document.getElementById(`answer-${i}`).textContent = data.answers[`question-${i}`]
          if (document.getElementById(`answer-${i}`).textContent === 'blank') {
            document.getElementById(`answer-${i}`).className += ' text-muted text-blurry'
          }
        }
      }
    })
}

/**
 * Displays a given html element on the web page if it isn't already on display.
 * @param {*id id of html element to be displayed.
 */
function show (id = '') {
  const element = document.getElementById(id)
  element.className = element.className.replace('hide', '')
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
