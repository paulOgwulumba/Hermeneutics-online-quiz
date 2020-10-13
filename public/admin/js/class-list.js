//variable for saving the class list
var classList = [];

//fetches the class list from the server
fetch('/admin/students')
  .then(response => response.json())
  .then(data => {
    classList = data;

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


    //appending the new row to the table body
    tbody.appendChild(newRow)

  }
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