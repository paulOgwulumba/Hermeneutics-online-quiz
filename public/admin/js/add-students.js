const form = document.getElementById("student-info-form");

form.addEventListener('submit', event => {
  event.preventDefault();

  let obj = {
    name: document.getElementById("name").value,
    student_id: document.getElementById("student_id").value,
    mobile_number: document.getElementById("mobile_number").value,
    email: document.getElementById("email").value
  }

  let obj_keys = Object.keys(obj);

  //makes sure all the error messages are hidden
  for(key of obj_keys){
    hide(key + "-error")
  }

  console.log(obj)

  //ensures that no field is left empty
  if(fieldIsNotEmpty(obj)){
    const options = {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(obj)
    }

    fetch('/admin/student', options)
      .then(response => response.json())
      .then(data => {
        if(data.status === "OK"){
          hide("student-info-form")
          show("refresh-button")
          document.getElementsByClassName("display-5")[0].innerHTML = 'Student added successfully! <span class="fa fa-check"></span>'
          document.getElementsByClassName("display-5")[0].className += " text-success"
        }
      })
  }
})

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
    element.className = element.className.split(" ")[0]
  }
  else{
    // console.log(id)
    // console.log("Hellos")
  }
}

//checks if any field is empty in an object
function fieldIsNotEmpty(object = {}){
  let array = Object.keys(object)
  loop: for(key of array){
    if(object[key] === ""){
      show(key + "-error")
      document.getElementById(key).focus()
      return false;
    }
  }
  return true;
}