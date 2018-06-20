import { Component, ViewChild, ElementRef } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';

import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/messaging';

import { Observable } from 'rxjs';

const LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

export class Upload {
  $key: string;
  file: File;
  name: string;
  url: string;
  progress: number;
  createdAt: Date = new Date();
  constructor(file: File) {
    this.file = file;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private messagesCollection: AngularFirestoreCollection<any>;
  messages: Observable<any[]>;

  user: Observable<firebase.User>;
  currentUser: firebase.User;
  profilePicStyles: {};

  @ViewChild('messageForm') messageForm: ElementRef;
  @ViewChild('demoList') demoList: ElementRef;

  constructor(
    private afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    private storage: AngularFireStorage
  ) {
    this.user = afAuth.authState;

    this.user.subscribe((user: firebase.User) => {
      this.currentUser = user;

      if (user) {
        this.profilePicStyles = {
          'background-image': `url(${this.currentUser.photoURL})`
        };

        this.messagesCollection = afs.collection('messages', ref => ref.orderBy('createdAt', 'asc'));
        this.messages = this.messagesCollection.valueChanges();

        // We save the Firebase Messaging Device token and enable notifications.
        this.saveMessagingDeviceToken();
      }
    })
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GithubAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }

  sendMessage(message: any) {
    const messageValue = message.value.trim();

    if (this.currentUser && message.value !== '') {
      this.messagesCollection.add({
        name: this.currentUser.displayName,
        text: messageValue,
        photoUrl: this.currentUser.photoURL,
        createdAt: new Date()
      })
        .then(() => {
          this.messageForm.nativeElement.reset();
          const messageList = this.demoList.nativeElement;
          messageList.scrollTop = messageList.scrollHeight;
        });
    }
  }

  saveImageMessage(event: any) {
    event.preventDefault();

    const file = event.target.files[0];

    this.messageForm.nativeElement.reset();

    if (!file.type.match('image.*')) {
      alert('You can only share images');
      return;
    }

    if (this.currentUser) {
      this.messagesCollection.add({
        name: this.currentUser.displayName,
        imageUrl: LOADING_IMAGE_URL,
        photoUrl: this.currentUser.photoURL,
        createdAt: new Date()
      })
        .then((messageData) => {
          const upload = new Upload(file);
          const filePath = `${this.currentUser.uid}/${upload.file.name}`;
          const ref = this.storage.ref(filePath);
          const task = this.storage.upload(filePath, file)
            .then(() => {
              const profileUrl = ref.getDownloadURL();

              profileUrl.subscribe(data => {
                this.afs.doc(`messages/${messageData.id}`).update({
                  imageUrl: data
                });
              });
            });
        })
    }
  }

  // Saves the messaging device token to the datastore.
  saveMessagingDeviceToken() {
    return firebase.messaging().getToken()
      .then((currentToken) => {
        if (currentToken) {
          console.log('Got FCM device token:', currentToken);
          // Save the Device Token to the datastore.
          firebase.database()
            .ref('/fcmTokens')
            .child(currentToken)
            .set(this.currentUser.uid);
        } else {
          // Need to request permissions to show notifications.
          return this.requestNotificationsPermissions();
        }
      }).catch((err) => {
        alert('Unable to get messaging token.');
        console.error(err);
      });
  };

  // Requests permissions to show notifications.
  requestNotificationsPermissions() {
    console.log('Requesting notifications permission...');
    return firebase.messaging().requestPermission()
      // Notification permission granted.
      .then(() => this.saveMessagingDeviceToken())
      .catch((err) => {
        alert('Unable to get permission to notify.');
        console.error(err);
      });
  };
}
