const _id = window.location.search.replace("?", "")

const form = document.getElementById("form")

form.addEventListener("submit", (event) => {
  event.preventDefault()

  let obj = {
    student_id: document.getElementById("student_id").value,
    password: document.getElementById("password").value
  }

  const options = {
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(obj),
  }

  fetch('/student/log-in', options)
    .then(response => response.json())
    .then(data => {
      console.log(data)
      if('status' in data){
        if(data.status === "OK"){
          window.location.href = './exam.html?' + data._id
        }
        else{
          document.getElementById("error-message").textContent = "*" + data.status
        }
      }
    })
    .catch(error => {
      document.getElementById("error-message").textContent = "Server under maintenance. Bear with us."
    })
})



if(_id !== "" && _id!== null){
  fetch(`/admin/student/${_id}`)
    .then(response => response.json())
    .then(data => {
      if('name' in data){
        document.getElementById("name").textContent = "Welcome, " +data.name
      }
    })
}