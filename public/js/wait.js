let nov_24_9_am = new Date(2020, 10, 24, 9).getTime() / 1000      //The date and time of the exam
let nov_24_10_35_am = new Date(2020, 10, 24, 10, 35).getTime() / 1000   //the date and time of exam closure

let today = new Date(2020, 10, 3, 14, 50).getTime() / 1000

let today2 = new Date(2020, 10, 3, 14, 40).getTime() / 1000

// new FlipDown(nov_24_9_am,{theme: "light"}).start();

new FlipDown(today,{theme: "light"})
  .start()
  .ifEnded(() => {
    console.log("Timer is ended")
  })

new FlipDown(today2, 'flip')
  .start()
  .ifEnded(() => {
    console.log("Timer just ended!")
  })
