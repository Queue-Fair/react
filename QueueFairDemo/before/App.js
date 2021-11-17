/**
 *  Queue-Fair React Native Demo App - Before Integration.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import * as React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { StyleSheet, Text, View, Button } from 'react-native';

const Stack = createNativeStackNavigator();


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
      <Button
        title="Continue with data: MyValue"
        onPress={() => navigation.navigate('Protected', { 'myname': 'MyValue' }) }
      />
    </View>
  );
};

//--------------------------------------------------
// And finally we define the app, inside a NavigationContainer.

const App: () => Node = () => {
  return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Queue-Fair Demo' }}
          />
          <Stack.Screen name="Protected" component={ProtectedScreen} />
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default App;
