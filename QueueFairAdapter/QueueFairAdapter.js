'use strict';

import DefaultPreference from 'react-native-default-preference';

class QueueFairAdapter {
  config;
  listener;
  timedOut = false;
  finished = false;
  preference = null;
  uid = null;
  d = false;
  readTimeout = 5;
  passedLifetimeMinutes = 60;

  savedTimeout = null;
  res = null;

  static ERROR=1;
  static NOINTERNET=2;
  //Only returns SHOW if config.waitForQueue is false.
  static SHOW=3;
  static PASS=4;
  static ABANDON=5;

  static instance = null;

  //Store the config and listener and set flag for debug logging.
  constructor(config, listener) {
    this.config = config;
    this.listener = listener;
    this.d = config.debug;
    QueueFairAdapter.instance = this;
  }

  //Returns immediately.  One of the listener methods will be called later.
  go() {
    if (this.d) {
      console.log("Adapter starting");
    }

    if(typeof this.config.readTimeout !== "undefined") {
      this.readTimeout = this.config.readTimeout;
    }

    //Must have little time to work.
    if(this.readTimeout <= 0 ) {
      this.readTimeout = 1;
    }

    //Sets a timeout to call onNoInternet() if we don't finish the process in config.readTimeout seconds.
    this.savedTimeout = setTimeout(() => {
      this.onTimeOut();
    }, this.readTimeout * 1000);

    //In case it was set to true by an earlier view.
    this.config.showingQueue = false;

    if(typeof this.config.passedLifetimeMinutes !== "undefined") {
      this.passedLifetimeMinutes = this.config.passedLifetimeMinutes;
    }

    //Start the process.
    this.setUIDFromPreference();
  }

  onTimeOut() {
    if (this.finished) {
        return;
    }
    this.timedOut = true;
    this.finished = true;
    if (this.d) {
      console.log("Timing out");
    }
    this.notify(QueueFairAdapter.NOINTERNET);
    this.listener.onNoInternet();
  }


  // Returns a Promise that will resolve when the adapter process finishes.  The resolution
  // returns SHOW if a Queue Page needs to be shown, and one of ERROR, NOINTERNET or PASS
  // otherwise. A listener event handler will be called immediately after the promise resolves.
  // Must be called from inside an async function to work.
  // Usage: if(await adapter.goWait() == QueueFairAdapter.SHOW) {
  //   //Stop further execution until either onPass, onError or onNoInternet is called.
  //   return;
  // }
  goWait() {
    return new Promise((res, rej) => {
      this.res = res;
      this.go();
    });
  }

  //See if we have a stored UID from an earlier visit.  Will call checkPassed().
  setUIDFromPreference() {
    if (this.d) {
      console.log("Checking UID");
    }
    let key = 'QF-QueueFair-Store-' + this.config.account;
    this.preference = null;
    DefaultPreference.get(key)
      .then(value => {
        if (this.d) {
          console.log("Got value " + value);
        }
        if (value == null) {
          return;
        }
        this.preference = value;
        return DefaultPreference.get(key + ':expires');
      })
      .then(expires => {
        try {
          if (this.preference == null || !this.isValidExpiry(key, expires)) {
            return;
          }
          var i = this.preference.indexOf(':');
          if (i === -1) {
            i = this.preference.indexOf('=');
          }
          if (i === -1) {
            return;
          }
          this.uid = this.preference.substring(i + 1);
          if (this.d) {
            console.log("Got UID " + this.uid);
          }
        } finally {
          if (!this.finished) {
            this.checkPassed();
          }
        }
      });
  }

  //See if we have been passed already (within config.passedLifetimeMinutes).
  //Calls onPass("Repass") if already passed, otherwise consultAdapter().
  checkPassed() {
    if (this.d) {
      console.log("Checking Passed");
    }
    let key = 'QF-QueueFair-Pass-' + this.config.queue;
    this.preference = null;
    DefaultPreference.get(key)
      .then(value => {
        if (this.d) {
          console.log("Got value " + value);
        }
        if (value == null) {
          return;
        }
        this.preference = value;
        return DefaultPreference.get(key + ':expires');
      })
      .then(expires => {
        if (this.preference == null || !this.isValidExpiry(key, expires)) {
          this.consultAdapter();
          return;
        }
        if (this.finished) {
          return;
        }
        this.finished = true;
        this.notify(QueueFairAdapter.PASS);
        this.listener.onPass('Repass');
      });
  }

  // Consult Queue-Fair to see if the visitor should be shown a Queue UI/Page.
  // Will call onError() if something goes wrong, or gotAdapter().
  consultAdapter() {
    var url =
      'https://' +
      this.config.account +
      '.queue-fair.net/adapter/' +
      this.config.queue;

    var sep = '?';
    if (this.uid != null) {
      url += sep + 'uid=' + this.uid;
      sep = '&';
    }

    url +=
      sep +
      'identifier=' +
      encodeURIComponent('QUEUE-FAIR REACT NATIVE ADAPTER');

    if (this.d) {
      console.log("Consulting adapter " + url);
    }
    fetch(url)
      .then(response => response.json())
      .then(json => this.gotAdapter(json))
      .catch(error => {
        if (this.finished) {
          return;
        }
        this.finished = true;
        this.notify(QueueFairAdapter.ERROR);
        this.listener.onError(error);
      });
  }

  notify(what) {
    if(this.savedTimeout !== null) {
      clearTimeout(this.savedTimeout);
      this.savedTimeout=null;
    }
    if(this.res === null)
      return;
    this.res(what);
    this.res = null;
  }

  //We got a response from the Queue-Fair servers.
  gotAdapter(json) {
    try {
      if (json == null) {
        this.finished = true;
        this.notify(QueueFairAdapter.ERROR);
        this.listener.onError('Null result from Adapter');
        return;
      }
      if (this.d) {
        console.log("Adapter result " + JSON.stringify(json));
      }
      if (json.uid != null) {
        if (this.uid !== null && this.uid != json.uid) {
          if (this.d) {
            console.log("Warning UID Mismatch! " + this.uid + " " + json.uid``);
          }
        } else {
          if (this.uid == null) {
            //Store the received UID.
            if (this.d) {
              console.log("Setting UID preference " + "" + json.cookieSeconds);
            }

            DefaultPreference.set(
              'QF-QueueFair-Store-' + this.config.account,
              'u:' + json.uid
            ).then(() =>
              DefaultPreference.set(
                'QF-QueueFair-Store-' + this.config.account + ':expires',
                '' + (Date.now() + Number(json.cookieSeconds) * 1000)
            ));
          }
        }
      }
      let action = json.action;
      if (this.d) {
        console.log("Action is " + action);
      }
      if (action == null) {
        this.notify(QueueFairAdapter.ERROR);
        this.listener.onError('Result from Adapter has no action.');
        return;
      }
      if (action == 'SendToQueue') {
        if (this.d) {
          console.log("Showing queue");
        }
        this.continuePage = false;
        if(this.config.waitForQueue) {
          //Clear the timout but do not notify any waiting thread.
          clearTimeout(this.savedTimeout);
        } else {
          this.notify(QueueFairAdapter.SHOW);
        }
        this.listener.onShow();
        return;
      }

      //The queue is not busy enough to show pages.
      let validation = decodeURIComponent(json.validation);
      if (this.d) {
        console.log("Validation is " + validation);
      }
      DefaultPreference.set(
        'QF-QueueFair-Pass-' + this.config.queue,
        validation
      ).then(() =>
        DefaultPreference.set(
          'QF-QueueFair-Pass-' + this.config.queue + ':expires',
          '' +
            (Date.now() + Number(this.passedLifetimeMinutes) * 60 * 1000)
        ));

      this.notify(QueueFairAdapter.PASS);
      this.listener.onPass(json.action);
    } finally {
      this.finished = true;
    }
  }

  //Check key expiry times.  Clears expired keys.
  isValidExpiry(key, expires) {
    if (this.d) {
      console.log("Expires Value " + expires + " now " + Date.now());
    }

    if (expires == null) {
      //Key never set.
      return false;
    }

    if (this.d) {
      console.log(
        "Expires Date " + Date(Number(expires)) + " now " + new Date()
      );
    }

    if (Number(expires) < Date.now()) {
      DefaultPreference.clear(key).then(() => DefaultPreference.clear(key + ':expires'));
      return false;
    }
    return true;
  }
}

export default QueueFairAdapter;
