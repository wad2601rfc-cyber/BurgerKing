const firebaseConfig = {
    apiKey: "AIzaSyBp1XU1aATkEPClAAqzyqe8fEJSwRPJcsA",
    authDomain: "burger-king-7f70f.firebaseapp.com",
    databaseURL: "https://burger-king-7f70f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "burger-king-7f70f",
    storageBucket: "burger-king-7f70f.firebasestorage.app",
    messagingSenderId: "158377348407",
    appId: "1:158377348407:web:9c44b1dca771c5c4371eb2",
    measurementId: "G-KN0Y2M0T5Y"
};

let db;
try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        console.log("Firebase initialized successfully.");
    }
} catch (error) {
    console.error("Firebase initialization failed.", error);
}
