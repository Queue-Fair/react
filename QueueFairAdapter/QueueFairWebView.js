'use strict';

import * as React from 'react';
import { WebView } from 'react-native-webview';
import { AppState } from 'react-native';
import DefaultPreference from 'react-native-default-preference';
import QueueFairAdapter from './QueueFairAdapter.js';

class QueueFairWebView extends React.Component {
  //The configuration for Queue-Fair
  config = null;

  //The URL of the Queue Page.
  location = null;

  //An object containing the URL of the Queue Page
  src = null;

  //Callback functions.
  onNoInternet = null;
  onError = null;
  onJoin = null;
  onAbandon = null;
  onPass = null;

  //Used internally.
  d = true; //Debug level logging
  passed = false; //Whether a pass has been received by this WebView.
  unmounted = false; //Whether the component is currently mounted.
  showingBlank = false; //Whether the WebView is currently showing about:blank
  passedLifetimeMinutes = 60; //Default value for Passed Lifetime

  webViewTimeout = 30;
  savedTimeout = null;

  state = {
    //The current app active/background state (also 'inactive' on iOS)
    appState: AppState.currentState,
  };


  constructor(props) {
    super(props);
    //Save the config.
    this.config = props.config;

    //Set debug logging.
    if (this.config.debug) {
      this.d = true;
    }

    if(typeof this.config.passedLifetimeMinutes !== "undefined") {
      this.passedLifetimeMinutes = this.config.passedLifetimeMinutes;
    }

    if(typeof this.config.webViewTimeout !== "undefined") {
      this.webViewTimeout = this.config.webViewTimeout;
    }

    //Base URL
    this.location =
      'https://' +
      this.config.account +
      '.queue-fair.net/' +
      this.config.queue +
      '?';

    if (this.config.variant) {
      this.location += 'qfv=' + this.config.variant + '&';
    }

    if (this.config.extra) {
      this.location += 'qfx=' + this.config.extra + '&';
    }

    //Special treatment for React Native apps.
    this.location += 'qfreact=true&qfnoredirect=true';

    if (this.d) {
      console.log("Constructing QueueFairWebView for " + this.location);
    }

    //Store the passed handlers.
    this.onNoInternet = props.onNoInternet;
    this.onError = props.onError;
    this.onJoin = props.onJoin;
    this.onAbandon = props.onAbandon;
    this.onPass = props.onPass;

    //Store the URL we want.
    this.src = { uri: this.location };

    //Set a timeout in case the Queue Page does not load and run as expected.
    this.savedTimeout = setTimeout(() => this.onTimeOut(),this.webViewTimeout*1000);

  }

  onTimeOut() {
    this.savedTimeout = null;
    this.notify(QueueFairAdapter.ERROR);
    this.onError("Queue page did not run.");
  }

  render() {
    return (
      <WebView
        ref={r => this.webref = r}
        sharedCookiesEnabled={true}
        source={this.src}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (this.d) {
            console.log("Load Error " + nativeEvent);
          }
          this.notify(QueueFairAdapter.NOINTERNET);
          this.onNoInternet();
        }}
        onMessage={(event) => {
          this.handleMessage(event);
        } }
        //    style={{ marginTop: 0 }}
      />
    );
  }

  //Notify any waiting threads.
  notify(what) {
    if(this.savedTimeout !== null) {
      clearTimeout(this.savedTimeout);
      this.savedTimeout = null;
    }
    if(QueueFairAdapter.instance === null) {
      return;
    }
    QueueFairAdapter.instance.notify(what);
  }

  componentWillUnmount() {
    if (this.d) {
      console.log("Unmount detected");
    }
    this.unmounted = true;
    this.appStateSubscription.remove();
    if (!this.passed) {
      this.notify(QueueFairAdapter.ABANDON);
      this.onAbandon('Unmount');
    }
  }

  componentDidMount() {
    this.unmounted = false;
    this.appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (
          this.state.appState.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          if (this.d) {
            console.log("App has come to the foreground! " + this.showingBlank);
          }
          if (this.showingBlank) {
            //will call onJoin or pass.
            this.webref.injectJavaScript(
              "window.location='" + this.location + "'"
            );
          }
        }
        if (
          nextAppState.match(/inactive|background/) &&
          this.state.appState === 'active'
        ) {
          if (this.d) {
            console.log("App has gone to background.");
          }
          //Leave the queue - the place is saved.
          this.showingBlank = true;

          this.webref.injectJavaScript("window.location='about:blank'");
          this.notify(QueueFairAdapter.ABANDON);
          this.onAbandon('Background');
        }
        this.setState({ appState: nextAppState });
      }
    );
  }

  //Persistently store Passed String for Passed Lifetime.
  storeValidation(target, passType, when) {
    if (this.d) {
      console.log("Got pass to target " + target);
    }
    let i = target.lastIndexOf('qfqid');
    if (i === -1) {
      this.listener.onError('Not validated.');
      return false;
    }
    let validation = target.substring(i);
    DefaultPreference.set(
      'QF-QueueFair-Pass-' + this.config.queue,
      validation
    ).then(() => {
      DefaultPreference.set(
        'QF-QueueFair-Pass-' + this.config.queue + ':expires',
        '' +
          (Date.now() + Number(this.config.passedLifetimeMinutes) * 60 * 1000)
      );
    });
    return true;
  }

  //Look out for JOINS and REDIRECTS from the Queue Page.
  handleMessage(event) {
    var message = '' + event.nativeEvent.data;

    if (this.d) {
      console.log("WV: " + message);
    }

    if(this.savedTimeout !== null && message.indexOf("QF Queue Script Starting.") === 0) {
      // Queue page has loaded and we should no longer
      // time out - goWait will resolve with ABANDON, ERROR or PASS.
      clearTimeout(this.savedTimeout);
      this.savedTimeout = null;
    }

    //Otherwise, we only want messages containing JSON
    var i = message.indexOf('{');
    if (i === -1) {
      return;
    }

    //And only REDIRECTS or JOINS.
    if (message.indexOf('REDIRECT') === -1 && message.indexOf('JOIN') === -1) {
      return;
    }

    try {
      var j = message.lastIndexOf('}');
      var jsonStr = message.substring(i, j + 1);
      var json = null;

      //Get the JSON.
      try {
        json = JSON.parse(jsonStr);
      } catch (e) {
        if (this.d) {
          if (this.d) {
            console.log("Exception processing JSON " + jsonStr + ": " + e);
          }
        }
        this.notify(QueueFairAdapter.ERROR);
        this.onError('Queue output could not be parsed.');
        return;
      }
      if (json == null) {
        this.notify(QueueFairAdapter.ERROR);
        this.onError('Bad json.');
        return;
      }

      if (message.indexOf('JOIN') !== -1) {
        var request = json.request;
        DefaultPreference.set('QF-mostRecentRequestNumber', '' + request).then(
          //Don't notify on Joins.
          this.onJoin(request)
        );
        return;
      }

      //It's a REDIRECT
      if (message.indexOf('qfpt') === -1) {
        return;
      }

      //It's a REDIRECT with a Passed String.
      var when = json.when;
      var passType = json.type;
      var target = json.target;

      if (target == null) {
        this.notify(QueueFairAdapter.ERROR);
        this.onError('Invalid target from queue.');
        return;
      }
      if (this.d) {
        console.log("Passing in " + when + "ms");
      }

      //Store the Passed String.
      if (!this.storeValidation(target, passType, when)) {
        return;
      }

      this.passed = true;

      if (this.unmounted) {
        if (this.d) {
          console.log("Pass is stored but not calling listener - unmounted.");
        }
        return;
      }

      if (this.d) {
        console.log("Passed. Calling onPass in " + when + "ms");
      }

      if (when <= 0) {
        this.notify(QueueFairAdapter.PASS);
        this.onPass(passType);
        return;
      }
      setTimeout(() => {
          this.notify(QueueFairAdapter.PASS);
          this.onPass(passType);
        }, when);
    } catch (e) {
      if (this.d) {
        console.log("Exception handing message " + e);
      }
      this.notify(QueueFairAdapter.ERROR);
      this.onError('Error handling queue: ' + e);
      return;
    }
  }
}

export default QueueFairWebView;
