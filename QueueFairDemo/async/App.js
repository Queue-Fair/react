'use strict';
/**
 *  Queue-Fair React Native Demo App.
 *
 * @format
 * @flow strict-local
 */


import * as React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-notifications';

// To be able to clear Adapter persistent storage.  Not needed in App.js for a production app.
import DefaultPreference from 'react-native-default-preference';

// The Queue-Fair React Native Library
import QueueFairWebView from './QueueFairWebView.js';
import QueueFairAdapter from './QueueFairAdapter.js';

import { StyleSheet, Text, View, Button } from 'react-native';

const Stack = createNativeStackNavigator();

//To be able to clear cookies from the WebView. Not needed in App.js for a production app.
const RCTNetworking = require('react-native/Libraries/Network/RCTNetworking');

//-------------------------------------------------
// Queue-Fair configuration and the Listener.

const QueueFairConfig = {
  // Serializable properties only please (no navigation).
  account: 'ACCOUNT_SYSTEM_NAME_FROM_PORTAL', //Required - Your Account System Name from the Queue-Fair Portal
  queue: 'QUEUE_SYSTEM_NAME_FROM_PORTAL', //Required - The System Name of the queue you wish to use.  variant: 'react', //Optional - variant name for the queue page variant you wish to display.
  extra: null, //Optional - extra data to pass to the queue page.
  passedLifetimeMinutes: 60, //Optional lifetime of Passed status.  Defaults to 60 minutes.
  readTimeout: 5, //Optional how long to wait for responses from the queue server.  Defaults to 5 seconds.
  data: null, //Optional data to be passed with the visitor through the queue to the protected Screen/operation
  showingQueue: false, //Set to true by the Queue-Fair library to indicate when a Queue Web-View is showing

  // For use with async goWait() - if true goWait will not return until the visitor abandons or
  // is passed by the queue if shown.
  // If false goWait() will resolve just before onShow is called if a queue page is to be shown.
  // See onPress below for example usage.
  waitForQueue: true,

  // How long, the QueueFairWebView will wait for a Queue Page to load and start running if shown.
  // before returning from goWait() with QueueFairAdpater.ERROR.
  // Allows your app to continue from goWait() if the Queue Page does not load as expected.
  // You must ensure that the queuescripts.js tag is present on your Hold, PreSale and PostSale pages
  // in the Queue-Fair Portal, as well as your Queue Page.
  // The WebView will also resolve goWait() if an error or abandon occurs - but if the visitor is
  // abandoning with the Back button this might close your app, depending on where you put
  // the the QueueFairWebView in your navigation stack.  Defaults to 30 seconds if absent.
  webViewTimeout: 30,

  debug: true, //Enables debug-level logging.
};

const QueueFairListener = {
  // The place for non-serializable properties.
  navigation: null, //Set this as soon as you have it, as shown below.

  // The QueueFairWebView does not require the listeners to be grouped
  // into an object, but QueueFairAdapter does.
  onNoInternet: function () {
    //Event handler for no internet, or if a read times out.
    toast.show('No Internet');
    launchProtectedScreen();
  },
  onPass: function (passType) {
    // If you have scheduled a notification for this user, cancel it here.

    // Called when a visitor is passed by the queue.  Required.
    // The data parameter is the value of "data" above.
    toast.show('Pass: ' + passType);
    launchProtectedScreen();
  },
  onError: function (message) {
    //Called when a problem occurs.
    toast.show('Error: ' + message);
    launchProtectedScreen();
  },
  onShow: function () {
    // Called when a queue WebView or screen needs to be shown.  Required.
    // You MUST create and show the QueueFairWebView as part of this method call.
    toast.show('Showing Queue-Fair');

    //Remember that we have shown a queue screen
    //so that we can handle the navigation stack apprpriately later.
    QueueFairConfig.showingQueue = true;

    //Launch the screen.  If you are not using screens, then attach a QueueFairWebView to your view here.
    launchQueueScreen();
  },
  onJoin: function (request) {
    // Called by the adapter when a user is assigned a queue position, or someone leaves the app and comes back to
    // the queue.  You can use this with  your notification system to send a Push Notification to a user who has closed your app
    // that they have reached the front of the queue.  See https://firebase.google.com/docs/cloud-messaging
    // and https://firebase.google.com/docs/cloud-messaging/android/first-message for a tutorial on Push Notifications.
    // You may wish to store the request number (queue position) within your own code.  It will also be persistently
    // stored by the Adapter automatically.  You can get the most recently assigned request number (queue position)
    // with DefaultPreference.get("QF-mostRecentRequestNumber").then( (number) => number )
    //
    // You should wait until onAbandon() is called to tell your Push Notification system to send a
    // notification when the visitor reaches the front of the queue.  For now just remember the request number.
    //
    // If you have already requested a Push Notification for this user, cancel it here.
    toast.show('Joined with request ' + request);
  },
  onAbandon: function (cause) {
    // This is where you should tell your Push Notification server that the user needs a notification, using the stored request number.
    console.log("Abandon: "+cause);
    toast.show('Abandon: ' + cause);
  },
};

// --------------------------------------------------
// Functions to launch the child screens

function launchQueueScreen() {
  //Launches the screen containing the QueueFairWebView.
  console.log('Launching Queue Screen');
  QueueFairListener.navigation.navigate('Queue', { config: QueueFairConfig });
}

function launchProtectedScreen() {
  //Launches the Protected Screen.  Replaces the queue if it is showing.

  if (QueueFairConfig.showingQueue) {
    //ProtectedScreen replace the shown QueueScreen in the stack, so the Back button
    //goes to Home not Queue.

    QueueFairConfig.showingQueue = false;
    QueueFairListener.navigation.replace('Protected', QueueFairConfig.data);
  } else {
    //No QueueScreen was shown so the ProtectedScreen goes next on the stack.
    QueueFairListener.navigation.navigate('Protected', QueueFairConfig.data);
  }
}

// --------------------------------------------------
// Functions for the other buttons.  Not used in a production App.
function resetQueueFair() {
  //Note: This will clear ALL cookies across WebViews.
  console.log('Clearing cookies');
  RCTNetworking.clearCookies(() => {});
}

function resetAdapter() {
  //Note: This will clear ALL preferences stored in DefaultPreference.
  console.log('Clearing preferences');
  DefaultPreference.clearAll();
}

// --------------------------------------------------
// Styles for the user interface.

const styles = StyleSheet.create({
  MainContainer: {
    justifyContent: 'center',
    flex: 1,
    margin: 0,
  },

  TextStyle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#000',
    marginBottom: 10,
  },
});

// --------------------------------------------------
// Screens for the user interface.

const QueueScreen = ({ navigation, route }) => {
  return (
    <View style={styles.MainContainer}>
      <Text>
        This is an optional React component displayed above Queue-Fair
      </Text>
      <QueueFairWebView
        config={route.params.config}
        onNoInternet={QueueFairListener.onNoInternet}
        onError={QueueFairListener.onError}
        onJoin={QueueFairListener.onJoin}
        onAbandon={QueueFairListener.onAbandon}
        onPass={QueueFairListener.onPass}
      />
      <Text>
        This is an optional React component displayed below Queue-Fair
      </Text>
    </View>
  );
};

const ProtectedScreen = ({ navigation, route }) => {
  return (
    <View style={styles.MainContainer}>
      <Text style={styles.TextStyle}>
        This is the protected screen with data {route.params.myname}
      </Text>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.MainContainer}>
      <Text style={styles.TextStyle}>This is the initial app screen.</Text>
      <Text style={styles.TextStyle}>
        Tap Continue to go through to the protected screen.
      </Text>
      <Text style={styles.TextStyle}>
        Reset Adapter clears adapter persistent storage.
      </Text>
      <Text style={styles.TextStyle}>
        Reset Queue-Fair clears Queue-Fair cookies.
      </Text>
      <Button
        title="Continue with data: MyValue"
        // Replacing  onPress={() => navigation.navigate('Protected', { 'myname': 'MyValue' }) }
        onPress={async () => {
          QueueFairConfig.data = { myname: 'MyValue' };

          //Store the navigation stack so we can use it later.
          QueueFairListener.navigation = navigation;

          // Adpters are not reusable - create a new one each time you want to launch
          // the protected activity.
          let adapter = new QueueFairAdapter(
            QueueFairConfig,
            QueueFairListener
          );

          // This will wait for the adapter to finish processing.
          // Optionally, you can have it wait for the visitor to be passed
          // by a shown Queue Page - see QueueFairConfig.waitForQueue.
          let result = await adapter.goWait();
          console.log("ADAPTER RESULT "+result);
        }}
      />
      <Text>&nbsp;</Text>
      <Button title="Reset Adapter" onPress={() => resetAdapter()} />
      <Text>&nbsp;</Text>
      <Button title="Reset Queue-Fair" onPress={() => resetQueueFair()} />
    </View>
  );
};

//--------------------------------------------------
// And finally we define the app, inside a NavigationContainer, with Toasts.

const App: () => Node = () => {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Queue-Fair Demo' }}
          />
          <Stack.Screen
            //This defines what appears in the title bar while queueing.
            name="Queue"
            //This defines the layout that appears while queueing.
            component={QueueScreen}
          />
          <Stack.Screen name="Protected" component={ProtectedScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast ref={(ref) => (global.toast = ref)} />
    </>
  );
};

export default App;
