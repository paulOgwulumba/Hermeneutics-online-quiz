//student ID
const _id = window.location.search.replace("?", "")

let nov_24_9_am = new Date(2020, 10, 24, 9).getTime() / 1000      //The date and time of exam commencement
let nov_24_10_35_am = new Date(2020, 10, 24, 10, 35).getTime() / 1000   //the date and time of exam site closure

// let today = new Date(2020, 10, 6, 14, 34).getTime() / 1000
// let later = new Date(2020, 10, 6, 15, 40).getTime() / 1000

wait(nov_24_9_am, nov_24_10_35_am);
wait
/**
 * This function starts the countdown timers for the exam date. If the timers' timestamp are exceeded, students either
 * have access to site or site is withdrawn from them.
 * @param {*start Unix timestamp of the exact moment the exam site is to be available to students.
 * @param {*stop Unix timestamp of the exact moment the exam site is to be taken down so students cannot take exams anymore.
 */
async function wait(start= 0, finish = 0){
  await new FlipDown(start, {theme: "light"}).start().ifEnded(() => window.location.href = './exam.html?' + _id)
  await new FlipDown(finish, 'flip').start().ifEnded(() => window.location.href = './close.html')

  return true
}

