/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

function Encadenados() {
  this.checkSetup();

  this.words = [];
  this.players = [];

  this.messageList = document.getElementById('messages');
  this.playerList = document.getElementById('players');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signInTwitterButton = document.getElementById('sign-in-twitter');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  this.messageForm.addEventListener('submit', this.sendWord.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));
  this.signInTwitterButton.addEventListener('click', this.signInTwitter.bind(this));

  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  this.initFirebase();
}

Encadenados.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

Encadenados.prototype.loadPlayers = function() {
  this.playersRef = this.database.ref('players');
  this.playersRef.off();
  this.players = [];
  var setPlayer = function(data) {
    var val = data.val();
    this.displayPlayer(data.key, val.name, val.photoUrl);
    this.players.push(val.uid);
  }.bind(this);
  this.playersRef.limitToLast(12).on('child_added', setPlayer);
  this.playersRef.limitToLast(12).on('child_changed', setPlayer);
};

Encadenados.prototype.registerUserToGame = function() {
  this.playersRef = this.database.ref('players');
  this.playersRef.off();
  var currentUser = this.auth.currentUser;
  this.playersRef.push({
    name: currentUser.displayName,
    uid: currentUser.uid,
    photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
  }).then(function() {
  }.bind(this)).catch(function(error) {
    console.error('Error writing new message to Firebase Database', error);
  });
};

Encadenados.prototype.loadWords = function() {
  this.wordsRef = this.database.ref('words');
  this.wordsRef.off();
  this.words = [];
  var setMessage = function(data) {
    var val = data.val();
    this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl);
    this.words.push({
      who: val.uid,
      what: val.text
    });
  }.bind(this);
  this.wordsRef.limitToLast(12).on('child_added', setMessage);
  this.wordsRef.limitToLast(12).on('child_changed', setMessage);
};

Encadenados.prototype.sendWord = function(e) {
  e.preventDefault();
  if (this.messageInput.value && this.checkSignedInWithMessage() && this.checkTurnOkWithMessage()) {
    var currentUser = this.auth.currentUser;
    this.wordsRef.push({
      uid: currentUser.uid,
      name: currentUser.displayName,
      text: this.messageInput.value,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function() {
      Encadenados.resetMaterialTextfield(this.messageInput);
      console.log(this.players);
      console.log(currentUser.uid);
      if (this.players.indexOf(currentUser.uid) < 0) {
        this.registerUserToGame();
      }
      this.toggleButton();
    }.bind(this)).catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  }
};

Encadenados.prototype.setImageUrl = function(imageUri, imgElement) {
  imgElement.src = imageUri;

  // TODO(DEVELOPER): If image is on Firebase Storage, fetch image URL and set img element's src.
};

Encadenados.prototype.signIn = function(googleUser) {
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

Encadenados.prototype.signInTwitter = function(twitterUser) {
  var provider = new firebase.auth.TwitterAuthProvider();
  this.auth.signInWithPopup(provider);
};

Encadenados.prototype.signOut = function() {
  this.auth.signOut();
};

Encadenados.prototype.onAuthStateChanged = function(user) {
  if (user) {
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;
    var userUID = user.uid;

    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    this.signInButton.setAttribute('hidden', 'true');
    this.signInTwitterButton.setAttribute('hidden', 'true');

    this.loadPlayers();
    this.loadWords();
  } else {
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    this.signInButton.removeAttribute('hidden');
    this.signInTwitterButton.removeAttribute('hidden');
  }
};

Encadenados.prototype.checkSignedInWithMessage = function() {
  if (this.auth.currentUser) {
    return true;
  }

  var data = {
    message: 'Debes hacer login primero',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

Encadenados.prototype.checkTurnOkWithMessage = function() {
  if (this.auth.currentUser.uid != this.words.slice(-1)[0].who) {
    return true;
  }

  var data = {
    message: 'La última palabra ha sido tuya. Debes esperar tu turno!',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

Encadenados.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

Encadenados.MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
    '</div>';

Encadenados.PLAYER_TEMPLATE =
    '<div class="player-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="name"></div>' +
    '</div>';

Encadenados.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

Encadenados.prototype.displayPlayer = function(key, name, picUrl) {
  var div = document.getElementById(key);
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Encadenados.PLAYER_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.playerList.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.playerList.scrollTop = this.messageList.scrollHeight;
};

Encadenados.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
  var div = document.getElementById(key);
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = Encadenados.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');
  if (text) {
    messageElement.textContent = text;
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) {
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();
};

Encadenados.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

Encadenados.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely.' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty.');
  }
};

window.onload = function() {
  window.friendlyChat = new Encadenados();
};
