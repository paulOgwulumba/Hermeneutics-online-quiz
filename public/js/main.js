//Checks if the student is already logged in. If yes, session continues, if not, session is cancelled
//and the student is redirected to the log in page
fetch('/student/session')
  .then(response => response.json())
  .then(data => {
    //LOG STUDENT OUT
    if(data.status === "LOG OUT"){
      window.location.href = './index.html'
    }
    //EXAM ALREADY TAKEN
    else if(data.status === "TAKEN"){
      hide("display-0")
      show(`display-success`)
      document.getElementById("success-text").textContent = "Examination already taken by you."
    }
    //EXAM ALREADY IN SESSION, CONTINUE FROM WHERE STUDENT STOPPED
    else if(data.status === "CONTINUE"){
      //answers and time left to be displayed on screen
      let toBeDisplayed = {}
      toBeDisplayed.secondsLeft = data.session.time_left;
      toBeDisplayed.answers = data.answers
      toBeDisplayed.currentQuestion = data.session.current_question;

      displayAnswers(toBeDisplayed);
    }
    else{}
  })

//The number of question sections to be displayed one after the other
const numberOfSections = 100;

//duration of the exam in seconds
var time = 7200;

//id for the timer handling the exam duration 
var timer;

//object that holds all the buttons attached to each question section
var button = {}

//This attaches event listeners to the previous and next buttons used to toggle between questions
for(let i=1; i<=numberOfSections; i++){
  try {
    button["nextButton" + i] = document.getElementById("next-" + i);
    button["prevButton" + i] = document.getElementById("previous-" + i)

    button["nextButton" + i].addEventListener("click", (event) => {
      event.preventDefault()
      try{
        let num = i+1
        show("display-" + num);
        hide("display-" + i);
        displayDescription(num);
        sendAnswers(num);             //send current answers to database
      }
      catch(error){
        show("display-" + i)
        displayDescription(i)
      }
    })

    button["prevButton" + i].addEventListener("click", (event) => {
      event.preventDefault()
      try{
        let num = i-1
        show("display-" + num)
        hide("display-"+i)
        displayDescription(num)
        sendAnswers(num)            //send current answers to database
      }
      catch(e){
        show("display-" +i)
        displayDescription(i)
      }
    })
  }
  catch(error){
    console.error()
  }
}

//this starts the exam
const startExam = document.getElementById("start-exam")
startExam.addEventListener("click", (event) => {
  isAnotherLoggedIn()
    .then(logOut => {
      //if someone else is already logged in, log current user out
      if(logOut){
        alert('Another student is already currently logged into this account!')
        window.location.href = './index.html'
      }
      event.preventDefault();
      timer = startTimer()
      hide('display-0')
      show('display-1')
      show('timer')
      show('question-type-box')
      displayDescription(1)
      show('submit-exam-box')
      fetch('/student/start-exam')
    })
  
})

//this ends the exam and submits the answers to the server, empty answers are registered
//as 'blank'
const submitExam = document.getElementById("submit-exam")
submitExam.addEventListener("click", event => {
  event.preventDefault()
  submitExam(0);
})

//this function starts the timer and counts down from 7200 seconds to 0
function startTimer(){
  let timer = setInterval(() => {
    setClock(time)
    time--;
  }, 1000)

  return timer
}

//This sets the text on the digital clock
function setClock(seconds = 0){
  if(seconds >= 0){
    let hourElement = document.getElementById("hours");
    let minuteElement = document.getElementById("minutes");
    let secondElement = document.getElementById("seconds");

    let hourNum = Math.round(seconds/3600 - (seconds%3600)/3600);
    let hours = hourNum > 9? hourNum : "0" + hourNum
    hourElement.textContent = hours
    
    let minuteNum = Math.round(((seconds - (hourNum * 3600)) / 60)  - ((seconds - (hourNum * 3600)) % 60)/60);
    let minutes = minuteNum > 9? minuteNum : "0" + minuteNum
    minuteElement.textContent = minutes

    let secondNum = ((seconds % 3600) % 60);
    let second = secondNum > 9? secondNum : "0" + secondNum
    secondElement.textContent = second
  }
  else{
    time = 0;
    submitExam(1);
    clearInterval(timer)
  }
}

//This function displays the appropriate description depending on the current question
function displayDescription(num = 0){
  if(num <= 35 || num >= 54 ){
    document.getElementById('question-type').textContent = "Multi-choice section"
  }
  else{
    document.getElementById('question-type').textContent = "Fill in the blank section"
  }
}

//this function fetches answers from the server as well as the number of seconds left and the current question and displays them on the page
function displayAnswers(object = {secondsLeft: 0, answers: {}, currentQuestion: 0}){
  time = object.secondsLeft
  timer = startTimer()
  show('timer')
  show('question-type-box')
  show('submit-exam-box')

  //loops through all 99 answers
  for(let i=1; i<100; i++){
    if(i === object.currentQuestion){
      show(`display-${i}`)
      displayDescription(i)
    }
    else{
      hide(`display-${i}`)
    }

    //handles the multichoice answers
    if(i<36 || i>95){
      let things = document.getElementsByName(i)
      inner: for(let thing of things){
        if(thing.value === 'true' && object.answers['question-' + i] === "true"){
          thing.checked = true;
          break inner;
        }

        if(thing.value === "false" && object.answers['question-' + i] === "false"){
          thing.checked = true;
          break inner;
        }
      }
    }

    //handles the 'fill in the blank' answers
    if(i>35 && i<96){
      if(object.answers['question-' + i] !== "blank"){
        document.getElementById(i).value = object.answers['question-' + i]
      }
    }
  }
}

//This function takes the id of any element and then makes it disappear from the screen if it is on display already
function hide(id = ""){
  let element = document.getElementById(id);
  if(!/^hide$/.test(element.className)){
    element.className = element.className + " hide"
  }
}

//This function takes the id of an element and makes it appear on the screen if it isn't already on display
function show(id = ""){
  let element = document.getElementById(id);
  //console.log("id:" + id)
  if(/\shide$/.test(element.className)){
    element.className = element.className.replace("hide", "")
  }
  else{
    // console.log(id)
    // console.log("Hellos")
  }
}

//runs routine check to see if another student is logged into this account
async function isAnotherLoggedIn(){
  let toBeReturned;
  await fetch('/student/login-status')
    .then(response => response.json())
    .then(data => {
      //another student is already logged into account
      if(data.status === "FAILED"){
        return true;
      }
      //server database error
      else if(data.status === "LOG OUT"){        
        window.location.href = "./index.html"
      }
      //no other student is logged in
      else{
        return false;
      }
    })
    //no response from server. Terminate exam session
    .catch(e => {
      window.location.href = "./index.html"
    })
    .then(logout => {
       toBeReturned = logout;
    })
  return toBeReturned;
}

//this gets all the answers entered by the student and packages them into one object
function getAnswers(){
  let answers = {}
  for(let i=1; i<=35; i++){
    let elem;
    let things = document.getElementsByName(i)

    for(let thing of things){
      if(thing.checked === true){
        elem = thing;
      }
    }

    if(elem == undefined){
      answers["question-" + i] = "blank";
    }
    else{
      answers["question-" + i] = elem.value;
    }
  }

  for(let i=36; i<=95; i++){
    let elem = document.getElementById(i);
    let answer = elem.value === ""? "blank" : elem.value;
    answers["question-" + i] = answer;
  }

  for(let i=96; i<=99; i++){
    let elem;
    let things = document.getElementsByName(i)

    for(let thing of things){
      if(thing.checked === true){
        elem = thing;
      }
    }

    if(elem == undefined){
      answers["question-" + i] = "blank";
    }
    else{
      answers["question-" + i] = elem.value;
    }
  }
  let secondsLeft = time
  let object = {secondsLeft, answers}

  return object;
}

//this forwards the answers to the server mid-exam
function sendAnswers(current_question = 0){
  //gets all the current answers as well as the time left
  let obj = getAnswers()
  //attahces the current question to object
  obj.current_question = current_question;
  const options = {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(obj),
  }

  fetch('/student/exam', options)
    .then(response => response.json())
    .then(data => {
      if(data.status === "LOG OUT"){
        alert("Someone else logged into this account. Log in again to continue")
        window.location.href = "./index.html"
      }
    })
}

//this submits the exam. state 0 signifies that the student submitted the exam voluntarily.
//state 1 signifies that the student ran out of time and the exam was submitted for them.
function submitExam(state = 0){
  //gets all the current answers as well as the time left
  let obj = getAnswers()

  const options = {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(obj),
  }

  fetch('/student/stop-exam', options)
    .then(response => response.json())
    .then(data => {
      if(data.status === "LOG OUT"){
        alert("Another student is already logged into this account, please log in again.")
        window.location.href = './index.html'
      }
      else{
        for(let i = 1; i<58; i++){
          hide(`display-${i}`)
        }
        show(`display-success`)
        if(state == 0){
          document.getElementById("success-text").textContent = "Examination submitted successfully!"  
        }
        if(state == 1){
          document.getElementById("success-text").textContent = "Time up! Examination submitted successfully!"
        }
      }
    })
}