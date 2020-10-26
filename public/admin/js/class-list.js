//checks if session already exists, if not, a redirect to the log in page is triggered
fetch('/admin/session')
  .then(response => response.json())
  .then(data => {
    if(data.status !== "OK"){
      window.location.href = "./index.html"
    }
  })

//variable for saving the class list
var classList = [];

//event listeners for the confirmation prompt box that pops up when the admin wants to delete a student's info
var prevYesListener = () => {}
var prevNoListener = () => {}

//fetches the class list from the server
fetch('/admin/students')
  .then(response => response.json())
  .then(data => {
    classList = data;
    //sorts the classlist in alphabetical order
    classList.sort((a, b) => {
      return sort(a.name, b.name)
    })
    //organises the classlist in a tabular form for display
    generateTable(classList)
  })
  .catch(() => {
    //if the server does not response, an error message is displayed and the table disappears from the screen
    show('error-message')
    hide("table")
  })


//This function takes the data gotten from the server and displays it on the table
function generateTable(data = []) {
  //The variable representing the body of the table
  let tbody = document.getElementById("tbody");

  //removes the former tbody
  tbody.remove()

  //creates a new tbody
  tbody = document.createElement("tbody");
  tbody.id="tbody";

  //a counter used to give each new row a unique id

  for(let row of data) {
    //variable representing the delete button of the new row
    let button = document.createElement("button")
    button.className = "btn btn-outline-danger"
    button.type = "button";
    button.textContent = "Delete"
    button.id = row._id;
    button.addEventListener("click", (event) => {deleteUser(button.id)})

    //variable representing the new row
    let newRow = document.createElement('tr');
    newRow.id = "row" + row._id;

    // variables representing the columns of the new row
    let s_n = document.createElement('td');
    let name = document.createElement('td');
    let student_id = document.createElement('td');
    let email = document.createElement('td');
    let mobile_number = document.createElement('td');
    let buttonTd = document.createElement('td');

    //Passing their values to them
    s_n.textContent = data.indexOf(row) + 1;
    name.textContent = row.name;
    student_id.textContent = row.student_id;
    email.textContent = row.email;
    mobile_number.textContent = row.mobile_number;
    buttonTd.appendChild(button)

    //Appending the columns to the new row
    newRow.appendChild(s_n)
    newRow.appendChild(name)
    newRow.appendChild(student_id)
    newRow.appendChild(email)
    newRow.appendChild(mobile_number)
    newRow.appendChild(buttonTd)

    //triger redirect if student info is clicked on
    s_n.addEventListener('click', (event) => {redirectToExams(button.id)})
    name.addEventListener('click', (event) => {redirectToExams(button.id)})
    student_id.addEventListener('click', (event) => {redirectToExams(button.id)})
    email.addEventListener('click', (event) => {redirectToExams(button.id)})
    mobile_number.addEventListener('click', (event) => {redirectToExams(button.id)})

    //appending the new row to the table body
    tbody.appendChild(newRow)

    document.getElementsByTagName("table")[0].appendChild(tbody)
  }
}

//This function deletes a particular user info
function deleteUser(id = ""){
  //row to be deleted
  let toBeDeleted = document.getElementById("row" + id);
  
  //body of table
  let tbody = document.getElementById("tbody");

  //prompt box that gets confirmation from the admin to delete the user info
  let promptBox = document.getElementById("prompt-box");

  //displays the promptbox
  promptBox.className = promptBox.className.replace('hide', '');

  //buttons on the promptbox
  let yesButton = document.getElementById('button-yes')
  let noButton = document.getElementById('button-no')

  //removes former event listeners of the promptbox
  yesButton.removeEventListener("click", prevYesListener)
  noButton.removeEventListener("click", prevNoListener)

  //creates new eventlisteners for the promptbox
  prevYesListener = (event) => {
    promptBox.className += " hide";
    const opt = {
      method: "DELETE",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({_id: id})
    };

    fetch('/admin/student', opt)
      .then(response => response.json())
      .then(data => {
        if(data.status == "OK"){
          shaveArray(id);
          generateTable(classList);
        }
        else{
          alert("Something went wrong.")
        }
    })
  }

  prevNoListener = (event) => {
    promptBox.className += " hide";
  }
  
  yesButton.addEventListener("click", prevYesListener)
  noButton.addEventListener("click", prevNoListener)
}


//This function takes the id of an element and makes it appear on the screen if it isn't already on display
function show(id = ""){
  let element = document.getElementById(id);
  if(/\shide$/.test(element.className)){
    element.className = element.className.split(" ")[0]
  }
}

//This function takes the id of any element and then makes it disappear from the screen if it is on display already
function hide(id = ""){
  let element = document.getElementById(id);
  if(!/^hide$/.test(element.className)){
    element.className = element.className + " hide"
  }
}

//This function deletes the user info corresponding to the _id of id from the classList array
function shaveArray(id=""){
  let newList = [];
  for(let list of classList){
    if(list._id !== id){
      newList.push(list);
    }
  }
  
  classList = newList;

  //sorts the classlist in alphabetical order
  classList.sort((a, b) => {
    let firstA = a.name.split("")[0]
    let firstB = b.name.split("")[0]

    if(firstA === firstB){
      return 0
    }
    else if(firstA > firstB){
      return 1
    }
    else{
      return -1;
    }
  })
}

function redirectToExams (id = ""){
  
  window.location.href = `./exam.html?${id}`
}

//this compares two strings a and b and returns 1 if a is greater than b in alphabetical order, returns 0 if they are 
//equal and returns -1 if a is less than b
function sort(a="", b=""){
  let arrayA = a.split("")
  let arrayB = b.split("")

  if(arrayA[0] > arrayB[0]){
    return 1
  }
  
  if(arrayA[0] < arrayB[0]){
    return -1
  }

  if(arrayA[0] === arrayB[0]){
    if(a.length > 1 && b.length > 1){
      return sort(a.substring(1), b.substring(1))
    }
    else{
      return 0;
    }
  }
}