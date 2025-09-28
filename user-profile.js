
// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBYLJHGw8qRya0Y9fF7dy7pzpYjx15pPw0",
    authDomain: "sneakyfinds-5b308.firebaseapp.com",
    databaseURL: "https://sneakyfinds-5b308-default-rtdb.firebaseio.com",
    projectId: "sneakyfinds-5b308",
    storageBucket: "sneakyfinds-5b308.appspot.com",
    messagingSenderId: "228153574320",
    appId: "1:228153574320:web:0fbc2743ab4287b0634c75",
    measurementId: "G-NZ17V7Q1SQ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            // User is signed in.
            const userRef = db.collection('users').doc(user.uid);
            try {
                const doc = await userRef.get();
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById('displayName').textContent = userData.displayName;
                    document.getElementById('email').textContent = userData.email;
                    document.getElementById('phoneNumber').textContent = userData.phoneNumber;
                    document.getElementById('location').textContent = userData.location;
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.log("Error getting document:", error);
            }
        } else {
            // No user is signed in.
            window.location.href = 'login.html';
        }
    });
});
