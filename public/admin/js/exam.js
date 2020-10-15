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
    }
  })
  .catch(e => {
    show('error-message')
    document.getElementById('error-text').textContent = noServerResponse
    hide('answer-sheet')
    hide('student-info')
    console.log(e)
  })




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