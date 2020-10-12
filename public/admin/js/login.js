const form = document.getElementById('form');

form.addEventListener("submit", (event) => {
  event.preventDefault()
  
  // clears the error message from the screen if there is any
  hide('form-response')
  hide('form-empty')

  //packages the username and password entries into an object
  const obj = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  }

  if(obj.username == "" || obj.password == ""){ //makes sure an empty string is not forwarded to the server
    show('form-empty')
  }
  else{
    //prepares the information to be forwarded to the server
    const options = {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(obj)
    }

    //forwards the information to the server and handles the response appropriately
    fetch('/admin/log-in', options)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if(data.status === "OK"){
          //redirects to admin page
          window.location.href = 'admin.html'
        }
        else{
          show('form-response');
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
  console.log(element)
  //console.log("id:" + id)
  if(/\shide$/.test(element.className)){
    element.className = element.className.split(" ")[0]
  }
  else{
    // console.log(id)
    // console.log("Hellos")
  }
}