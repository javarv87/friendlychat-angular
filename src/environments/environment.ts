// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConf: {
    apiKey: 'AIzaSyC4xICYZj0ZvDlc1SRqs7SFvxdSYMFJqM8',
    authDomain: 'st-angular-labs.firebaseapp.com',
    databaseURL: 'https://st-angular-labs.firebaseio.com',
    projectId: 'st-angular-labs',
    storageBucket: 'st-angular-labs.appspot.com',
    messagingSenderId: '395360416001'
  }
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
