//checks if session already exists, if not, a redirect to the log in page is triggered
fetch('/admin/session')
  .then(response => response.json())
  .then(data => {
    if(data.status !== "OK"){
      window.location.href = "./index.html"
    }
  })

const noServerResponse = "No response from server!"
const invalidId = "Invalid student ID!"

//gets the personal information of the student from the server and displays it
//on the page
const _id = window.location.search.replace("?", "")   //gets the database id attached to the query
fetch(`/admin/student/${_id}`)
  .then(response => response.json())
  .then(data => {
    //if no student is found in database matching given id, exam questions are retracted and error message is displayed
    if("status" in data){
      show('error-message')
      document.getElementById('error-text').textContent = invalidId
      hide('answer-sheet')
      hide('student-info')
    }
    else{
      document.getElementById("student_name").textContent = data.name 
      document.getElementById("student_id").textContent = data.student_id
      fetchSessionStatus()
      fetchAnswerSheet()
    }
  })
  .catch(e => {
    show('error-message')
    document.getElementById('error-text').textContent = noServerResponse
    hide('answer-sheet')
    hide('student-info')
    console.log(e)
  })


//this function gets the exam session state of the student from the server using the student's database id
function fetchSessionStatus(){
  fetch(`/admin/student/session/${_id}`)
    .then(response => response.json())
    .then(data => {
      let exam_status = data.exam_status
      document.getElementById('exam_status').textContent = exam_status
      if(data.exam_status === "taken"){
        show("more-info")
        document.getElementById('start').textContent = data.time_stamp.start
        document.getElementById('stop').textContent = data.time_stamp.stop
      }
    })
}

//this function gets the exam answer sheet of the student from the server and displays it
function fetchAnswerSheet(){
  fetch(`/admin/student/answer-sheet/${_id}`)
    .then(response => response.json())
    .then(data => {
      console.log(data)
      if('status' in data){}
      else{
        for(let i =1; i<100; i++){
          document.getElementById(`answer-${i}`).textContent = data.answers[`question-${i}`]
          if(document.getElementById(`answer-${i}`).textContent === "blank"){
            //document.getElementById(`answer-${i}`).textContent = "_____"
            document.getElementById(`answer-${i}`).className += " text-muted text-blurry"
          }
        }
      }
    })
}


//This function takes the id of an element and makes it appear on the screen if it isn't already on display
function show(id = ""){
  let element = document.getElementById(id);
  element.className = element.className.replace("hide", "")
}

//This function takes the id of any element and then makes it disappear from the screen if it is on display already
function hide(id = ""){
  let element = document.getElementById(id);
  if(!/^hide$/.test(element.className)){
    element.className = element.className + " hide"
  }
}