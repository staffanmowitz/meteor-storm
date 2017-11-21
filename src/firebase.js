// INITIALIZE FIREBASE
const config = {
  apiKey: 'AIzaSyD3aI7qkxThZe4YvjUaYJwuaIuUXzNWZ7Q',
  authDomain: 'meteor-storm-ccb14.firebaseapp.com',
  databaseURL: 'https://meteor-storm-ccb14.firebaseio.com',
  projectId: 'meteor-storm-ccb14',
  storageBucket: 'meteor-storm-ccb14.appspot.com',
  messagingSenderId: '147457187379'
}
firebase.initializeApp(config)

firebase
  .auth()
  .signInAnonymously()
  .catch(function(error) {
    let errorCode = error.code
    let errorMessage = error.message
    console.log(errorCode)
    console.log(errorMessage)
  })

export const database = firebase.database()

export function saveHighScore(name, score) {
  firebase
    .database()
    .ref('highscores/' + Date.now())
    .set({
      name: name,
      score: score
    })
}

saveHighScore('TESTER', 123456)

export function retrieveHighScores() {
  let highScores = []
  firebase
    .database()
    .ref('highscores/')
    .orderByChild('score')
    .limitToLast(10)
    .on('value', scores => {
      // RETRIEVE SCORES
      scores.forEach(score => {
        highScores.push(score.val())
      })
      // SORT SCORES
      highScores = highScores.sort((a, b) => {
        return a.score > b.score ? -1 : 1
      })
    })

  return highScores
}
