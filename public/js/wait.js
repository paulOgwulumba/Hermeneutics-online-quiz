//student ID
const _id = window.location.search.replace("?", "")

let nov_24_9_am = new Date(2020, 10, 24, 9).getTime() / 1000      //The date and time of exam commencement
let nov_24_10_35_am = new Date(2020, 10, 24, 10, 35).getTime() / 1000   //the date and time of exam closure


new FlipDown(nov_24_10_35_am, 'flip')
  .start()
  .ifEnded(() => {
    window.location.href = './close.html'
  })

new FlipDown(nov_24_9_am,{theme: "light"})
  .start()
  .ifEnded(() => {
    window.location.href = './exam.html?' + _id
  })

