---
## Queue-Fair React Native Adapter README & Installation Guide

Queue-Fair can be added to any React Native app easily in minutes.  This Queue-Fair React Native module is suitable for native React Native apps on iOS, Android, and also can be used within React Native apps for MacOS and Windows - but if your React Native app is a Web App running entirely in a browser, then the Client Side JavaScript Adapter is more suited to that.  You will need a Queue-Fair account - please visit https://queue-fair.com/free-trial if you don't already have one.  You should also have received our Technical Guide.  You can find out all about Queue-Fair at https://queue-fair.com


## About the Adapter
The React Native Adapter has two components, the Adapter code that checks and validates your users with the Queue-Fair service, which is similar to our Java Server-Side Adapter, and a QueueFairWebView that displays Queue, Hold, PreSale and PostSale display to your users when they cannot be Passed immediately by SafeGuard.

You can create app-specific displays for your React Native apps by using the Portal and creating a named Variant for your app.  The QueueFairWebView can take up a whole-page Screen, or it can be combined with other React Native Components to provide a composite view.  For example, you might just want to display the Progress Bar within the Queue-Fair WebView, and use React Native Text Components or other Components for the rest of the display.  You can even have a one-pixel QueueFairWebView if you don't want to display any Queue-Fair UI at all.

You don't have to use a new Screen to show the QueueFairWebView either.

The Adapter manages its own persistent storage to remember that particular users have been Passed by Queue-Fair, in the form of DefaultPreferences, and also persistent Cookies when a QueueFairWebView is launched.   Unlike some of our other Adapters, the React Native Adapter does not download a settings file from the Queue-Fair system - in React Native, you set the account system name, queue system name and Passed Lifetime programmatically.

Typically, you will replace a call to launch a protected activity or start a protected operation with a call to `new QueueFairAdapter(config, listener).go()`, passing a listener object that then launches the protected activity or starts the protected operation when the app user is Passed by the queue.  Your listener must also cause a QueueFairWebView to be shown when its onShow() method is called - please see the QueueFairDemo code within this distribution for a complete example.

If your vistors navigate away from a displayed Queue Page (by using the back button, by opening another app, or their phone going to sleep, for example), they do not lose their place in the queue - it is saved in the same way as places are saved for your web visitors.  You can have your App users participate in the same Queue as your web users for total fairness, or you can put them in a separate queue - it's up to you.

This guide assumes you already have installed Android Studio or XCode with at least one device Emulator, and followed the React Native CLI tutorial and set the necessary environment variables as described at https://reactnative.dev/docs/environment-setup , as well as the Node package manager npm.

On Mac, in addition to the steps required in the above tutorial, we found our version of Node was too old and did not contain npx.  To update Node, we did:

```
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```

We also had to update cocoapods to a more recent version with `sudo gem install cocoapods`.  We also installed Watchman as advised in the tutorial.  

On Windows (for Android) we found we needed to set the ANDROID_SDK_ROOT environment variable, add ANROID_SDK_ROOT/emulator and ANDROID_SDK_ROOT/platform-tools to the PATH and install a Java 1.8 JDK (not JRE) as this contains the necessary tools.jar (not present in later versions of Java), and set the JAVA_HOME environment variable too.  

To get started, we recommend you perform the steps below to build the QueueFairDemo app, before importing the QueueFairAdapter module into your existing React Native app.

## Building the Demo App ##

**1.** Open a command prompt/terminal.  Go to the folder where you wish your App code to reside.

**2.** Create a new React Native app called QueueFairDemo, and cd into it:

```
npx react-native init QueueFairDemo
cd QueueFairDemo
```

If you are building for iOS, you also need to do:

```
cd ios
pod install
```

to install the necessary React packages, or your app won't compile.  We found we needed to do this after each `npm install` in these instructions.

**3.** Open another command/prompt terminal. Use cd to go to the QueueFairDemo folder.  Start Metro with and leave it running in its own window.

```
npx react-native start
```

**4.** Go back to your other window.  Start the out-of-the-box React webapp with 

```
npx react-native run-android
```
or
```
npx react-native run-ios
```

If everything is configured correctly, this will start a new Emulator if one is not already running, and you will see the React Native out-of-the-box webapp appear eventually.  If you find you need to install any additional packages with `npm install`, you will need to restart Metro (CTRL-C to quit) in the other window before trying again, and if you are building for iOS, you'll need to do a `pod install` in the `QueueFairDemo/ios` folder too.

**5.** Using your favourite text editor, open App.js within the app folder you have just created.  Try changing some of the displayed text, and saving.  Metro should pick up your changes and apply them automatically - if not, on Windows you need 

```
npm install --save-dev sane
```

and restart Metro, and run `npx react-native run-android` again.  On Mac, this happened automatically for us with watchman.

**6.** Copy and paste App.js from the QueueFairDemo/before folder of this distribution into the QueueFairDemo folder that you have created.  Errors will be thrown because the Demo app uses Screen navigation to present a series of screens, rather than the single whole-page out-of-the-box display used by the default React Native app that you have created.

**7.** To install the libraries for Screen and Navigation, run

```
npm install react-native-screens react-native-safe-area-context
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-toast-notifications
```

and restart Metro (and on Mac, `pod install`).  The third `npm install` is for cross-platform Toasts, which are not used by the QueueFairDemo/before code, but are used to show when listener methods are called by the Adapter in QueueFairDemo/after, so it's a good idea to install that package now.  Build and run your app again with `npx react-native run-android` or `npx react-native run-ios`.

You should have an app with a title bar showing Queue-Fair Demo, with some text and a button.  Pressing the button causes a new Screen to open.  Some data `MyValue` is passed from the first screen to the second.  It is this second screen that we will protect with Queue-Fair in the next section.  You should take a good look at App.js to ensure you understand it before moving to the next section.  There is also a Back button in the title bar to move you back to the home screen, or you can use the back button on Android.

## Adding Queue-Fair to an existing App ##

**1.** Copy and paste QueueFairAdapter.js and QueueFairWebView.js from the QueueFairAdapter folder in this distribution into your App folder.  They can go anywhere in your own projects, but the QueueFairDemo/after/App.js code requires them to go in the QueueFairDemo folder.

**2.** If you are using the QueueFairDemo app from the previous section, copy and paste QueueFairDemo/after/App.js into your QueueFairDemo folder, overwriting the existing App.js

**3.** The library has a couple of dependencies.  Install them with

```
npm install react-native-webview
npm install react-native-default-preference
```

and restart Metro (and do `pod install` on Mac) and build and run the app as before.

**4.** If you are using the QueueFairDemo app, you will see the following alterations (starting from the bottom of App.js):
- The NavigationContainer has been wrapped in a <>...</> stanza that contains the hook to display Toasts.  This is purely for demonstration purposes and not necessary for a production app.
- A new Screen has been defined, QueueScreen.  This will only be displayed if an app user needs to see a Queue Page.
- The HomeScreen definition has been updated to replace the onPress property with a call to adapter.go(), instead of launching ProtectedScreen directly.  It also contains two new buttons to clear persistent storage to help you test.  To completely clear storage, saved queue places and saved Passed status, both buttons must be pressed.
- The definition of QueueScreen has been added, including a QueueFairWebView with the necessary configuration and listener properties.
- We have added functions to reset Adapter (Preference) and WebView (Cookie) peristent storage.  This is purely to help you test, and would not be present in a production app.
- The launching of the Protected Screen has been moved to a function, and a function to launch the Queue Screen has been created.
- A QueueFairListener object exists, that has a placeholder for the navigation stack and implementations of the various listener methods needed by the Adapter and WebView.  Toasts will be shown every time a Listener method is called, but you wouldn't show them in a production app.  The library files QueueFairWebView.js and QueueFairAdapter.js don't use Toasts.
- A QueueFairConfig object exists, which you need to modify with your account system name and queue system name from the Queue-Fair Portal.
- We have some additional import statements to make the various system components accessible to the app.

**5.** If you are not using the QueueFairDemo app, you will need to make similar changes to those listed in 4. above.  You need to create a new QueueFairAdapter object every time you wish to start/open the protected activity, pass it a Config and a Listener, and call go().  Particularly important is the onShow method of the Listener, which must cause a QueueFairWebView to be shown in some way, and the onPass() method which must launch your protected activity/screen/operation.  The QueueFairDemo app also shows how to pass data from the calling screen to the protected screen even when a Queue Page is shown; we recommend you use the same methodology.  When someone is Passed by the queue, any Queue Screen should be removed from the Navigation Stack as shown.

**6.** Build and run your app.

That's it you're done!

### To test the React Native Adapter

Use a queue that is not in use on other pages/apps, or create a new queue for testing.

#### Testing SafeGuard
Make sure your code uses the correct queue System Name, and that the Queue is set to SafeGuard.

Open the app and hit Continue.  A Toast will appear to indicate that you have been passed by SafeGuard, without seeing a Queue Page, and the protected activity will launch.

Use the back button on your phone/emulator.  Tap Continue again.  The Toast will indicate that you have been Repassed, because the Passed Lifetime for your queue has not expired, and the protected activity will launch again.

Close the app completely, and re-open it, and press the button again.  So long as you do this within the Passed Lifetime, you should be shown "Repass" instead of "SafeGuard", because the app has remembered that you have already been passed.


#### Testing Queue
Go back to the Portal and put the queue in Demo mode on the Queue Settings page.  Hit Make Live.  

In the App tap Reset Adapter to delete your Passed status, stored by the app.

Tap Continue.
 - Verify that you are now sent to queue.
 - When you pass from the front of the quue, verify that a Toast appears containing the word "Pass", and that the protected screen launches.
 - Use the back button and hit Continue again.  Verify that you are shown "Repass", without seeing a Queue Page a second time.

If you wish to fully clear your Passed status, then if you have been shown a Queue Page, you must tap both Reset Adapter and Reset Queue-Fair buttons.  These buttons are present in the QueueFairDemo app to help you test - you would not normally show them in a production app.


### Advanced Topics

Activation Rules and Variant Rules from the portal are not germane to this use case and are ignored.  Instead, specify the queue you wish to use and (optionally) the variant you want to display in QueueFairConfig.  Changing the Passed Lifetime in the Portal also has no affect on your React Native app users.  No queue or account secrets are downloaded or used, for security reasons (as they would be accessible to a very technically skilled user).  Secrets are not necessary for this use case.

Any Target settings for your queue are also not germane to this use case and are also ignored - rather you set the target within your app in the onPass() method that you implement within your app.  Any Queue Pages shown within your app will not go on to request a target page from any site.  The Passed Lifetime setting from the Portal is also not known to this Adapter - rather you set it in code as shown.

QueueFairAdapter objects are not reusable - you should create a new one every time your app is about to start the protected activity/operation.

To customise the display for your app, the easiest way is to can create a variant of your queue for use within your app in the Queue-Fair Portal, and tell your app to use it by passing its name as the variant parameter in QueueFairConfig.  This means that your app users can participate in the same queue as your website visitors, but have a custom display for your app.

To include React Native components in your Queue display, see the QueueFairDemo/after/App.js code for an example of how to do this.

Debug level logging is disabled by default, but you can enable it with `config.debug = true` - but please make sure it is disabled for release versions of your app.

Unlike our Server-Side Adapters, The React Native Adapter always works in SAFE_MODE - SIMPLE_MODE is not suitable for this use case.

In some circumstances, you might want to halt execution of your app while the Adapter is running its process, or even until the visitor is passed from the front of the queue if shown.  This is supported with `await adapter.goWait()` - see the QueueFairDemo/async/App.js code for an example of how to do this.  In that file, QueueFairConfig has two additional properties that configure waiting behaviour.  `goWait()` will resolve with one of QueueFairAdapter.PASS, ERROR, NOINTERNET, SHOW or ABANDON just before the corresponding listener event handler is called.  In the async example code, the onPress button event handler has been replaced with an `async () => {}` function - you must use the async modifier in the function declaration that calls goWait() for your app to wait, otherwise it will return without waiting.

You can also use this library on Windows and MacOS React Native apps - but note that these platforms do not support DefaultPreference, so you will need to use another storage mechanism for persistent storage of Passed status on these platforms.  This will require minor modifications to QueueFairAdapter.js and QueueFairWebService.js wherever DefaultPreference is used.

## Push Notifications
If a user abandons the queue by closing the app or navigating away from it, their place is saved, and they will proceed through the queue when they re-open the app as if they had left it open all along.  If the front of the queue has not yet reached them, they will be closer to it.  If the front of the queue has passed them, they will be passed straight away, depending on the Front of Queue settings that you use for your queue in the Queue-Fair Portal.
	
You may wish to send a Push Notification to a user who has abandoned telling them that they are at the front of the queue.  Your app must have Notification permissions in order to be able to show push notifications - see https://firebase.google.com/docs/cloud-messaging and https://rnfirebase.io for a tutorial on Push Notifications in React Native if you are setting up Push Notifications for the first time.

Once you have a Push Notification system and server up and running, the procedure is as follows:
	
**1.** In the onJoin() method of your listener implementation, store the received Request Number, which is the user's position in the queue.  The Adapter will also automatically store it for you, and you can get the most recently assigned Request Number as shown in the QueueFairDemo/after/App.js code.  Don't ask your Push Notification server to schedule a notification in onJoin() - just remember the request number in case you need it later.  If your app does not already have a persistent storage mechanism, there is example code for storing data persistently with DefaultPreference in QueueFairWebView.js
	
**2.** You only want to send Push Notifications to people who have abandoned.  So, in the onAbandon() method of your QueueFairListener implementation, tell your Push Notification server that this user wants a notification when they reach the front of the queue.  Include the request number from onJoin() in that message to your Push Notification server.  Note that it is possible that the onAbandon() method may be called multiple times due to a single act of abandonment - but you should only ask your Push Notification to send a notification once. Similarly, if the wait is long, users may abandon the queue and return to it several times.  You should therefore set a preference to persistently remember that the app has asked for a notification from your Push Notification server here, and not ask again if it is already set.

**3.** Your Push Notification server will need to store an association between the Request Number and the unique ID that it uses to send notifications to specific users.  It is recommended that associations stored for more than 24 hours are deleted.  Your Push Notification server will also need to consult the Queue-Fair Queue Status API every minute or so to find out what the current Serving number is.  If the current Serving number is greater than or equal to the Request number for a particular user, it is time to send that user the Push Notification.  The Status API may also report that the queue has emptied.  If that happens, don't send notifications to all the users that have requested them at the same time, as if they all come back at the same time, it may be necessary to queue them again - but you can prevent that from happening by sending the notifications no faster than the SafeGuard Rate for your queue when the queue is empty.
	
**4.** If the user returns to the app and opens the Queue again before their turn has been called, or after their turn has been called but before they have received a Push Notification from your Push Notification server, you should tell your Push Notification server not to send the notification after all.  So, in the onPass(), onShow() and onJoin() methods of your QueueFairListener implementation, check to see if the preference you set in Step 2 has been set, and if it has, tell your Push Notification server that a notification is no longer required, and then unset the preference.
	
**5.** The user might abandon and rejoin the queue multiple times if the wait is long.  If they abandon again, go back to Step 2.

If you need help setting up a Push Notification server for your app, please contact support@queue-fair.com and we'll be happy to help.
	
## AND FINALLY

Remember we are here to help you! The integration process shouldn't take you more than an hour or so - so if you are scratching your head, ask us.  Many answers are contained in the Technical Guide too.  We're always happy to help!
